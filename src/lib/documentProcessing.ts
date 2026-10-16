import { createWorker } from 'tesseract.js';
import { join } from 'path';
import { extractTextFromPdfJs } from './pdfTextExtraction';
import { createCanvas, loadImage } from 'canvas';

const LOW_CONFIDENCE = 0;

/**
 * Binarize an image buffer using a threshold.
 * Converts the image to black and white based on a threshold value.
 * @param imageBuffer The input image buffer (PNG, JPEG, etc.)
 * @param threshold The threshold value (0-255), default 170
 * @returns A buffer containing the binarized image (PNG format)
 */
async function binarizeImage(
  imageBuffer: Buffer,
  threshold: number = 170
): Promise<Buffer> {
  // Load the image
  const img = await loadImage(imageBuffer);
  // Create a canvas with the same dimensions
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  // Draw the image onto the canvas
  ctx.drawImage(img, 0, 0);
  // Get the image data
  const imageData = ctx.getImageData(0, 0, img.width, img.height);
  const data = imageData.data;
  // Iterate over each pixel
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Convert to grayscale using average
    const gray = Math.round((r + g + b) / 3);
    // Apply threshold
    const val = gray > threshold ? 255 : 0;
    data[i] = val; // Red
    data[i + 1] = val; // Green
    data[i + 2] = val; // Blue
    // data[i+3] is alpha, we leave it unchanged
  }
  // Put the modified image data back to the canvas
  ctx.putImageData(imageData, 0, 0);
  // Return the canvas as a PNG buffer
  return canvas.toBuffer('image/png');
}

// Extract text from image buffer using OCR with preprocessing for better accuracy
export async function extractTextFromImage(
  imageBuffer: Buffer
): Promise<{ text: string; confidence: number }> {
  // Preprocess image to improve OCR accuracy
  const processedBuffer = await binarizeImage(imageBuffer);

  const worker = await createWorker('eng', 1, {
    logger: (m) => {}, // Disable logger to prevent output
    // langPath: join(process.cwd(), 'node_modules', 'tesseract.js', 'tessdata') // Optional: specify path to language data
  });

  // Recognize text from processed image buffer
  const {
    data: { text, confidence },
  } = await worker.recognize(processedBuffer);

  // Terminate worker to free up resources
  await worker.terminate();

  return {
    text: text,
    confidence: confidence / 100, // Tesseract confidence is 0-100, we want 0-1,
  };
}

// Extract text from PDF buffer using PDF.js text extraction (not OCR)
export async function extractTextFromPdf(
  pdfBuffer: Buffer
): Promise<{ text: string; confidence: number }> {
  // Use PDF.js text extraction which is more reliable and faster for text-based PDFs
  return extractTextFromPdfJs(pdfBuffer);
}

// Extract structured data from text based on document type
export function extractStructuredData(
  text: string,
  docType: string
): { data: Record<string, any>; confidence: number } {
  // Clean up text - remove extra whitespace and normalize
  const cleanText = text.replace(/\s+/g, ' ').trim();

  // Initialize extracted data object based on document type
  let extractedData: Record<string, any>;

  // Extract structured data based on document type
  if (docType === 'pds') {
    // Personal Data Sheet (PDS) extraction rules
    // Initialize all expected fields to null
    extractedData = {
      surname: null,
      firstName: null,
      middleName: null,
      dateOfBirth: null,
      placeOfBirth: null,
      sex: null,
      civilStatus: null,
      citizenship: null,
      residentialAddress: null,
      telephoneNo: null,
      mobileNo: null,
      emailAddress: null,
    };

    // Name extraction - handle the grid format in the PDS
    // Look for the specific pattern:
    // SURNAME FIRST NAME MIDDLE NAME
    // DELA CRUZ JUANA SANTOS
    // Since text is normalized (whitespace collapsed to single spaces), we look for:
    // "SURNAME FIRST NAME MIDDLE NAME" followed by the values until next header or newline
    const nameGridMatch = cleanText.match(
      /SURNAME\s*[:.\s]*FIRST\s*NAME\s*[:.\s]*MIDDLE\s*NAME\s*[:.\s]*(.+?)(?=\s*(?:\d+\.\s*)?(?:DATE\s*OF\s*BIRTH|PLACE\s*OF\s*BIRTH|SEX)\s*|$)/i
    );
    if (nameGridMatch) {
      const nameValues = nameGridMatch[1].trim().split(/\s+/).filter(Boolean);
      // We need at least 3 values: [surname_part, first_name, middle_name] or more for multi-word surname
      if (nameValues.length >= 3) {
        // Assume the last two values are firstName and middleName, everything before is surname
        extractedData.firstName = nameValues[nameValues.length - 2];
        extractedData.middleName = nameValues[nameValues.length - 1];
        extractedData.surname = nameValues.slice(0, -2).join(' ');
      }
    }

    // Alternative: look for labels with values on same or next line
    if (
      !extractedData.firstName ||
      !extractedData.middleName ||
      !extractedData.surname
    ) {
      const firstNameMatch = cleanText.match(
        /(?:FIRST\s*NAME|GIVEN\s*NAME)[^\w]*(\S+)/i
      );
      const middleNameMatch = cleanText.match(/(?:MIDDLE\s*NAME)[^\w]*(\S+)/i);
      const lastNameMatch = cleanText.match(
        /(?:LAST\s*NAME|SURNAME|FAMILY\s*NAME)[^\w]*([^\s]+(?:\s+[^\s]+)*?)(?=\s*(?:FIRST\s*NAME|MIDDLE\s*NAME|DATE\s*OF\s*BIRTH|PLACE\s*OF\s*BIRTH|SEX|[A-Z][A-Z\s]*NO\.?|[A-Z][A-Z\s]*ADDRESS|[A-Z][A-Z\s]*ID\.?|[A-Z][A-Z\s]*ELIGIBILITY|$))/i
      ); // Allow multiple words for surname, but stop at next field label

      if (firstNameMatch || middleNameMatch || lastNameMatch) {
        const first = firstNameMatch ? firstNameMatch[1].trim() : '';
        const middle = middleNameMatch ? middleNameMatch[1].trim() : '';
        const last = lastNameMatch ? lastNameMatch[1].trim() : '';
        if (!extractedData.firstName) extractedData.firstName = first;
        if (!extractedData.middleName) extractedData.middleName = middle;
        if (!extractedData.surname) extractedData.surname = last;
      }
    }

    // Date of Birth - look for the pattern in the grid
    const dobGridMatch = cleanText.match(
      /DATE\s+OF\s+BIRTH\s*\([^)]*\)[\s\S]*?(\d{1,2}[\s\/\-]\w+[\s\/\-]\d{1,2}[\s\/\-]\d{2,4}|\w+\s+\d{1,2},?\s+\d{2,4})/i
    );
    if (dobGridMatch) {
      extractedData.dateOfBirth = dobGridMatch[1];
    } else {
      // Fallback to standard pattern
      const dobMatch = cleanText.match(
        /(?:DATE\s*OF\s*BIRTH|BIRTH\s*DATE)[:\s]+(\d{1,2}[\s\/\-]\w+[\s\/\-]\d{1,2}[\s\/\-]\d{2,4}|\w+\s+\d{1,2},?\s+\d{2,4})/i
      );
      if (dobMatch) {
        extractedData.dateOfBirth = dobMatch[1];
      }
    }

    // Place of Birth - look for the pattern after DATE OF BIRTH
    // Fixed: Use word boundaries to ensure we match the complete sex indicator, not just a substring
    const pobAfterDobMatch = cleanText.match(
      /DATE\s+OF\s+BIRTH\s*\([^)]*\)[\s\S]*?(\d{1,2}[\s\/\-]\d{1,2}[\s\/\-]\d{2,4})\s+([A-Za-z\s,\.]+?)\s+\b(Female|Male|M|F)\b/i
    );
    // DEBUG: Log the match result
    console.log('DEBUG Place of Birth:');
    console.log(
      '  Clean text snippet:',
      cleanText.substring(
        Math.max(0, cleanText.indexOf('DATE OF BIRTH') - 20),
        Math.min(cleanText.length, cleanText.indexOf('DATE OF BIRTH') + 100)
      )
    );
    console.log('  Match result:', pobAfterDobMatch);
    if (pobAfterDobMatch) {
      console.log('  Date of Birth (group 1):', `"${pobAfterDobMatch[1]}"`);
      console.log('  Place of Birth (group 2):', `"${pobAfterDobMatch[2]}"`);
      console.log('  Sex (group 3):', `"${pobAfterDobMatch[3]}"`);
      extractedData.placeOfBirth = pobAfterDobMatch[2].trim();
      // Also store the sex from the place of birth match
      extractedData.sex = pobAfterDobMatch[3].toUpperCase();
    } else {
      console.log('  No match found with primary regex');
      // Fallback: look for the pattern in the grid (handles multi-line format)
      const pobGridMatch = cleanText.match(
        /PLACE\s+OF\s+BIRTH[\s\S]*?(?:\r?\n[\s\S]*?)?([^\r\n]+?)(?=\s*(?:\d+\.\s*)?(?:SEX|\d{1,2}[\s\/\-]\d{1,2}[\s\/\-]\d{2,4}|$))/i
      );
      if (pobGridMatch) {
        extractedData.placeOfBirth = pobGridMatch[1].trim();
        console.log('  Used grid match:', `"${extractedData.placeOfBirth}"`);
      } else {
        // Fallback to standard pattern (handles multi-line format)
        const pobMatch = cleanText.match(
          /(?:PLACE\s*OF\s*BIRTH)[\s\S]*?(?=\s*(?:\d+\.\s*)?(?:SEX|$))/i
        );
        if (pobMatch) {
          extractedData.placeOfBirth = pobMatch[1].trim();
          console.log(
            '  Used standard match:',
            `"${extractedData.placeOfBirth}"`
          );
        }
      }
    }

    // Sex - look for the pattern in the grid
    const sexGridMatch = cleanText.match(
      /\bSEX[\s\S]*?[:\s]*(Male|Female|M|F)\b/i
    );
    if (sexGridMatch) {
      extractedData.sex = sexGridMatch[1].toUpperCase();
    } else {
      // Fallback to standard pattern
      const sexMatch = cleanText.match(
        /(?:SEX|GENDER)[:\s]+(male|female|M|F)/i
      );
      if (sexMatch) {
        extractedData.sex = sexMatch[1].toUpperCase();
      }
    }

    // Civil Status
    const civilStatusMatch = cleanText.match(
      /(?:CIVIL\s*STATUS)[:\s]+(?:HEIGHT\s*\(m\)\s*WEIGHT\s*\(kg\)\s*BLOOD\s*TYPE\s+)?(.+?)(?=\s*(?:\d{3}\s*)?(?:GSIS|PAG-IBIG|PHILHEALTH|TIN|SSS|BIR|CITIZENSHIP)|$)/i
    );
    if (civilStatusMatch) {
      // Extract just the marital status (Single, Married, etc.) from the captured text
      const maritalMatch = civilStatusMatch[1].match(
        /\b(Single|Married|Widowed|Divorced|Separated)\b/i
      );
      extractedData.civilStatus = maritalMatch
        ? maritalMatch[1]
        : civilStatusMatch[1].trim().split(/\s+/)[0]; // Take first word as fallback
    }

    // Citizenship
    const citizenshipMatch = cleanText.match(
      /(?:CITIZENSHIP)[:\s]+(.+?)(?=\s*(?:\d+\.\s*)?(?:RESIDENTIAL\s*ADDRESS|PRESENT\s*ADDRESS|ADDRESS)|$)/i
    );
    if (citizenshipMatch) {
      // Extract the full citizenship value
      extractedData.citizenship = citizenshipMatch[1].trim();
    }

    // Address (residential address)
    const addressMatch = cleanText.match(
      /(?:RESIDENTIAL\s*ADDRESS|PRESENT\s*ADDRESS|ADDRESS)[:\s]+(.+?)(?=\s*(?:\d+\.\s*)?(?:TELEPHONE\s*NO\.?|MOBILE\s*NO\.?|E-MAIL\s*ADDRESS|EMAIL)|$)/i
    );
    if (addressMatch) {
      extractedData.residentialAddress = addressMatch[1].trim();
    }

    // Handle PDS format with numbered factors (e.g., "19. TELEPHONE NO. (02) 8941-2049")
    // Look for each factor individually by its label
    // We'll extract the value after the label and before the next label or end of string

    // Telephone number - look for pattern like "19. TELEPHONE NO. (02) 8941-2049"
    const telephoneMatch = cleanText.match(
      /(?:\d+\.\s*)?TELEPHONE\s*NO\s*\.\s*[:\s]*\+?([\d\s\-\(\)]+?)(?=\s*[A-Za-z]|$|[\r\n])/i
    );
    // DEBUG LOGGING
    console.log(
      `[DEBUG] Telephone match:`,
      telephoneMatch ? telephoneMatch[0] : 'null'
    );
    if (telephoneMatch) {
      // Extract just the phone number part (group 1)
      const phoneValue = telephoneMatch[1].trim();
      console.log(`[DEBUG] Telephone value extracted: "${phoneValue}"`);
      if (phoneValue && phoneValue !== 'N/A' && phoneValue.length > 0) {
        extractedData.telephoneNo = phoneValue;
        console.log(`[DEBUG] Telephone set to: "${extractedData.telephoneNo}"`);
      } else {
        console.log(`[DEBUG] Telephone value rejected: "${phoneValue}"`);
      }
    }

    // Mobile number - look for pattern like "20. MOBILE NO. 0918-924-1182"
    const mobileMatch = cleanText.match(
      /(?:\d+\.\s*)?MOBILE\s*NO\s*\.?\s*[:\s]*\+?([\d\s\-\(\)]+?)(?=\s*[A-Za-z]|$|[\r\n])/i
    );
    // DEBUG LOGGING
    console.log(`[DEBUG] Mobile match:`, mobileMatch ? mobileMatch[0] : 'null');
    if (mobileMatch) {
      // Extract just the mobile number part (group 1)
      const mobileValue = mobileMatch[1].trim();
      console.log(`[DEBUG] Mobile value extracted: "${mobileValue}"`);
      if (mobileValue && mobileValue !== 'N/A' && mobileValue.length > 0) {
        extractedData.mobileNo = mobileValue;
        console.log(`[DEBUG] Mobile set to: "${extractedData.mobileNo}"`);
      } else {
        console.log(`[DEBUG] Mobile value rejected: "${mobileValue}"`);
      }
    }

    // Email address - look for pattern like "21. E-MAIL ADDRESS mark.bautista88@gov.ph"
    const emailMatch = cleanText.match(
      /(?:\d+\.\s*)?E-MAIL\s*ADDRESS\s*[:\s]+([^\s\r\n]+@[^\s\r\n]+\.[^\s\r\n]+)(?=\s*(?:\d+\.\s*|[A-Z]+\.\s*)|$|[\r\n])/i
    );
    // DEBUG LOGGING
    console.log(`[DEBUG] Email match:`, emailMatch ? emailMatch[0] : 'null');
    if (emailMatch) {
      // Extract just the email part (group 1)
      const emailValue = emailMatch[1].trim();
      console.log(`[DEBUG] Email value extracted: "${emailValue}"`);
      // Basic email validation
      if (
        emailValue &&
        emailValue.includes('@') &&
        emailValue.includes('.') &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)
      ) {
        extractedData.emailAddress = emailValue;
        console.log(`[DEBUG] Email set to: "${extractedData.emailAddress}"`);
      } else {
        console.log(`[DEBUG] Email value rejected: "${emailValue}"`);
      }
    }
    // Set confidence based on how many of the expected fields we extracted
    const nonEmptyFields = Object.values(extractedData).filter(
      (val) => val !== undefined && val !== null && val !== ''
    ).length;
    const confidence = Math.min(0.9, 0.3 + nonEmptyFields * 0.05); // Base 0.3 + 0.05 per field, max 0.9

    return { data: extractedData, confidence };
  } else if (docType === 'work_experience_sheet') {
    // Work Experience Sheet (WES) extraction rules
    // Initialize all expected fields to null
    extractedData = {
      employerName: null,
      positionTitle: null,
      inclusiveDates: null,
      salaryGrade: null,
      monthlySalary: null,
      appointmentStatus: null,
      governmentService: null,
    };

    // Find the start of the actual data (after instructions)
    // Look for the first occurrence of "Position Applied For:" after the instructions
    const instructionsEndMatch = cleanText.match(/Position Applied For:/i);
    if (!instructionsEndMatch) {
      // Fallback to original logic if we can't find the marker
      return { data: extractedData, confidence: 0.1 };
    }

    const dataStartPos = instructionsEndMatch.index;

    // Find the end of the first job entry (before "List of Accomplishments")
    const accomplishmentsMatch = cleanText.match(
      /List of Accomplishments and Contributions/i
    );
    let dataEndPos = cleanText.length;
    if (accomplishmentsMatch) {
      dataEndPos = accomplishmentsMatch.index;
    }

    // Extract just the first job entry data
    const firstJobText = cleanText.substring(dataStartPos, dataEndPos).trim();

    // Use regex to extract each field with precise boundaries

    // Position Applied For: [value] Duration:
    const posAppliedMatch = firstJobText.match(
      /Position Applied For:\s*([^\\s][^]*?)\s*Duration:/i
    );
    if (posAppliedMatch) {
      extractedData.positionTitle = posAppliedMatch[1].trim();
    }

    // Duration: [value] Position:
    const durationMatch = firstJobText.match(
      /Duration:\s*([^\\s][^]*?)\s*Position:/i
    );
    if (durationMatch) {
      extractedData.inclusiveDates = durationMatch[1].trim();
    }

    // Position: [value] Name of Office/Unit:
    const positionMatch = firstJobText.match(
      /Position:\s*([^\\s][^]*?)\s*Name of Office\/Unit:/i
    );
    if (positionMatch) {
      // This Position field is the actual position title (not "Position Applied For")
      extractedData.positionTitle = positionMatch[1].trim();
    }

    // Name of Agency/Organization and Location: [value] (end of section or next major section)
    const agencyMatch = firstJobText.match(
      /Name of Agency\/Organization and Location:\s*(.*)/i
    );
    if (agencyMatch) {
      extractedData.employerName = agencyMatch[1].trim();
    }

    // Salary Grade: [value] (look for SG or Salary Grade patterns)
    const salaryGradeMatch = firstJobText.match(
      /(?:SALARY\s*GRADE|SG)[:\s]+(\d+)/i
    );
    if (salaryGradeMatch) {
      extractedData.salaryGrade = parseInt(salaryGradeMatch[1], 10);
    }

    // Monthly Salary: [value] (look for Monthly Salary or Salary patterns)
    // Handle currency symbols and commas
    const monthlySalaryMatch = firstJobText.match(
      /(?:MONTHLY\s*SALARY|SALARY)[:\s]*(?:[₱\$£€]?\s*)?([\d,]+(?:\.\d{2})?)/i
    );
    if (monthlySalaryMatch) {
      extractedData.monthlySalary = parseFloat(
        monthlySalaryMatch[1].replace(/[₱\$£€,]/g, '')
      );
    }

    // Status of Appointment: [value]
    const statusMatch = firstJobText.match(
      /(?:STATUS\s*OF\s*APPOINTMENT|APPOINTMENT)[:\s]+([^,\n]+)/i
    );
    if (statusMatch) {
      extractedData.appointmentStatus = statusMatch[1].trim();
    }

    // Government Service: [value]
    const govtServiceMatch = firstJobText.match(
      /(?:GOVERNMENT\s*SERVICE)[:\s]+([^,\n]+)/i
    );
    if (govtServiceMatch) {
      extractedData.governmentService = govtServiceMatch[1].trim();
    }

    // Set confidence based on how many fields we extracted
    const nonEmptyFields = Object.values(extractedData).filter(
      (val) => val !== undefined && val !== null && val !== ''
    ).length;
    const confidence = Math.min(0.9, 0.3 + nonEmptyFields * 0.2); // Base 0.3 + 0.2 per field, max 0.9

    return { data: extractedData, confidence };
  } else if (docType === 'tor' || docType === 'transcript_of_records') {
    // Transcript of Records (TOR) extraction rules - focused on grades and GWA only
    extractedData = {
      grades: [], // Array of { courseCode, description, units, grade }
      gwa: null,
      totalUnits: null,
    };

    // Extract General Weighted Average (GWA)
    // Look for patterns like "GWA: 1.85" or "General Weighted Average: 1.85"
    // Also handle variations like "General Weighted Average is", "GWA =", etc.
    const gwaMatch = cleanText.match(
      /(?:GENERAL\s*WEIGHTED\s*AVERAGE|GWA)[^\d]*(\d+(?:\.\d+)?)/i
    );
    if (gwaMatch) {
      extractedData.gwa = parseFloat(gwaMatch[1]);
    }

    // Extract course grades from a table-like structure
    // Pattern for a course row: Course Code, Description, Grade, Units
    // Based on actual TOR format: "THY 1 Christian Vision of the Human Person 1.50 3.0"
    const courseRegex =
      /([A-Z]{2,}\s*\d{1,}[A-Z]*)\s+(.+?)\s+(\d+(?:\.\d{1,2})?)\s+(\d+(?:\.\d{1,2})?)/g;
    let match;
    const grades = [];
    let totalUnits = 0;

    while ((match = courseRegex.exec(cleanText)) !== null) {
      const [, courseCode, description, gradeStr, unitsStr] = match;
      const units = parseFloat(unitsStr);
      const grade = parseFloat(gradeStr);

      // Basic validation:
      // - Course code should have at least 2 letters
      // - Grade should be in valid range (0.0 - 5.0 for Philippine grading system)
      // - Units should be positive
      // - Description should not be empty
      if (
        /[A-Z]{2,}/.test(courseCode) && // Has at least 2 consecutive letters
        grade >= 0.0 &&
        grade <= 5.0 &&
        units > 0 &&
        description.trim().length > 0
      ) {
        grades.push({
          courseCode: courseCode.trim(),
          description: description.trim(),
          units: units,
          grade: grade,
        });
        totalUnits += units;
      }
    }

    if (grades.length > 0) {
      extractedData.grades = grades;
      extractedData.totalUnits = totalUnits;
    }

    // Calculate confidence based on extracted data
    // We have up to 3 pieces: gwa, grades array (if not empty), totalUnits (if we have grades)
    let nonEmptyFields = 0;
    if (extractedData.gwa !== null) nonEmptyFields++;
    if (extractedData.grades.length > 0) nonEmptyFields++; // for grades array
    if (extractedData.totalUnits !== null) nonEmptyFields++; // for totalUnits

    // Base confidence 0.3, plus 0.2 per field found, max 0.9
    const confidence = Math.min(0.9, 0.3 + nonEmptyFields * 0.2);

    return { data: extractedData, confidence };
  }

  // If document type is not recognized, return empty data with low confidence
  return { data: extractedData, confidence: 0.1 };
}

/**
 * Process a document by extracting text and then structured data
 * @param documentBuffer The document buffer
 * @param fileExtension The file extension (e.g., 'pdf', 'jpg')
 * @param documentType The document type (e.g., 'pds', 'wes', 'tor')
 * @returns An object containing the parsed data and parsing confidence
 */
export async function processDocument(
  documentBuffer: Buffer,
  fileExtension: string,
  documentType: string
): Promise<{
  parsedData: Record<string, any> | null;
  parsingConfidence: number;
}> {
  // Guard clause for invalid buffer
  if (!documentBuffer || documentBuffer.length === 0) {
    return { parsedData: null, parsingConfidence: LOW_CONFIDENCE };
  }
  try {
    // Determine if image or PDF based on file extension
    const lowerExt = fileExtension.toLowerCase();
    let extractedText: { text: string; confidence: number };

    if (lowerExt === 'pdf') {
      // For PDFs, try direct text extraction first (faster and more reliable for text-based PDFs)
      extractedText = await extractTextFromPdf(documentBuffer);

      // If confidence is low, it might be a scanned PDF - fall back to OCR
      // Convert PDF pages to images and use OCR
      if (extractedText.confidence < 0.5) {
        // TODO: Implement PDF to image conversion for OCR fallback
        // For now, we'll keep the PDF.js result but note that confidence is low
        console.log(
          'PDF text extraction had low confidence, considering OCR fallback'
        );
      }
    } else if (['jpg', 'jpeg', 'png'].includes(lowerExt)) {
      // For images, use OCR with preprocessing for better accuracy
      extractedText = await extractTextFromImage(documentBuffer);
    } else {
      // For unsupported file types, return null data with low confidence
      return { parsedData: null, parsingConfidence: LOW_CONFIDENCE };
    }

    // Extract structured data from the extracted text
    const { data, confidence } = extractStructuredData(
      extractedText.text,
      documentType
    );

    return { parsedData: data, parsingConfidence: confidence };
  } catch (error) {
    console.error('Error processing document:', error);
    // Return null data with low confidence on error
    return { parsedData: null, parsingConfidence: LOW_CONFIDENCE };
  }
}
