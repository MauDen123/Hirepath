import { recognize } from 'tesseract.js';
import { join } from 'path';
import { fileURLToPath } from 'url';

// Extract text from image buffer using Tesseract
async function extractTextFromImage(imageBuffer: Buffer): Promise<{ text: string; confidence: number }> {
  // Use Tesseract.recognize which returns a Promise<RecognizeResult>
  const result = await recognize(imageBuffer, 'eng');
  return {
    text: result.text,
    confidence: result.confidence / 100 // Tesseract confidence is 0-100, we want 0-1
  };
}

// Extract text from PDF buffer using PDF.js and OCR per page
async function extractTextFromPdf(pdfBuffer: Buffer): Promise<{ text: string; confidence: number }> {
  // Import PDF.js and canvas
  // Note: We dynamically import to avoid issues if not installed, but we have installed canvas and pdfjs-dist
  const { GlobalWorkerOptions, PDFJS } = await import('pdfjs-dist/build/pdf');
  const { createCanvas } = await import('canvas');

  // Set up PDF.js worker for Node.js
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = join(__filename, '..');
  const workerSrc = join(__dirname, 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.js');
  GlobalWorkerOptions.workerSrc = workerSrc;

  // Load the PDF document
  const loadingTask = PDFJS.getDocument({ data: pdfBuffer });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  let fullText = '';
  let totalConfidence = 0;
  let validPageCount = 0;

  // Process each page
  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2.0 }); // Scale 2 for better OCR accuracy

    // Create canvas for rendering
    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d');

    // Render PDF page to canvas context
    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;

    // Convert canvas to buffer (PNG format)
    const imageBuffer = canvas.toBuffer('image/png');

    // Extract text from the image buffer using OCR
    try {
      const { text, confidence } = await extractTextFromImage(imageBuffer);
      fullText += text + '\n';
      totalConfidence += confidence;
      validPageCount++;
    } catch (error) {
      console.error(`Error processing PDF page ${pageNum}:`, error);
      // Continue with other pages
    }
  }

  const averageConfidence = validPageCount > 0 ? totalConfidence / validPageCount : 0;

  return {
    text: fullText.trim(),
    confidence: averageConfidence
  };
}

// Extract structured data from text based on document type
function extractStructuredData(text: string, docType: string): { data: Record<string, any>; confidence: number } {
  // Initialize extracted data object
  const extractedData: Record<string, any> = {};

  // Clean up text - remove extra whitespace and normalize
  const cleanText = text.replace(/\s+/g, ' ').trim();

  // Extract structured data based on document type
  if (docType === 'pds') {
    // Personal Data Sheet (PDS) extraction rules

    // Name extraction (look for patterns like "NAME:" or "FIRST NAME", "MIDDLE NAME", "LAST NAME")
    const nameMatch = cleanText.match(/(?:NAME|FULL\s*NAME)[:\s]+([^,\n]+)/i);
    if (nameMatch) {
      extractedData.fullName = nameMatch[1].trim();
    }

    // Alternative: look for FIRST, MIDDLE, LAST name separately
    const firstNameMatch = cleanText.match(/(?:FIRST\s*NAME|GIVEN\s*NAME)[:\s]+([^,\n]+)/i);
    const middleNameMatch = cleanText.match(/(?:MIDDLE\s*NAME)[:\s]+([^,\n]+)/i);
    const lastNameMatch = cleanText.match(/(?:LAST\s*NAME|FAMILY\s*NAME|SURNAME)[:\s]+([^,\n]+)/i);

    if (firstNameMatch || middleNameMatch || lastNameMatch) {
      const first = firstNameMatch ? firstNameMatch[1].trim() : '';
      const middle = middleNameMatch ? middleNameMatch[1].trim() : '';
      const last = lastNameMatch ? lastNameMatch[1].trim() : '';
      extractedData.fullName = [first, middle, last].filter(Boolean).join(' ').trim();
      extractedData.firstName = first;
      extractedData.middleName = middle;
      extractedData.lastName = last;
    }

    // Date of Birth
    const dobMatch = cleanText.match(/(?:DATE\s*OF\s*BIRTH|BIRTH\s*DATE)[:\s]+(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})/i);
    if (dobMatch) {
      extractedData.dateOfBirth = dobMatch[1];
    }

    // Place of Birth
    const pobMatch = cleanText.match(/(?:PLACE\s*OF\s*BIRTH)[:\s]+([^,\n]+)/i);
    if (pobMatch) {
      extractedData.placeOfBirth = pobMatch[1].trim();
    }

    // Sex
    const sexMatch = cleanText.match(/(?:SEX|GENDER)[:\s]+(male|female|M|F)/i);
    if (sexMatch) {
      extractedData.sex = sexMatch[1].toUpperCase();
    }

    // Civil Status
    const civilStatusMatch = cleanText.match(/(?:CIVIL\s*STATUS)[:\s]+([^,\n]+)/i);
    if (civilStatusMatch) {
      extractedData.civilStatus = civilStatusMatch[1].trim();
    }

    // Height
    const heightMatch = cleanText.match(/(?:HEIGHT)[:\s]+(\d+(?:\.\d+)?)\s*(?:m|meters?)/i);
    if (heightMatch) {
      extractedData.height = parseFloat(heightMatch[1]);
    }

    // Weight
    const weightMatch = cleanText.match(/(?:WEIGHT)[:\s]+(\d+(?:\.\d+)?)\s*(?:kg|kilograms?)/i);
    if (weightMatch) {
      extractedData.weight = parseFloat(weightMatch[1]);
    }

    // Address
    const addressMatch = cleanText.match(/(?:RESIDENTIAL\s*ADDRESS|PRESENT\s*ADDRESS|ADDRESS)[:\s]+([^,\n]+)/i);
    if (addressMatch) {
      extractedData.address = addressMatch[1].trim();
    }

    // Contact Information
    const phoneMatch = cleanText.match(/(?:CONTACT\s*NO|TELEPHONE|PHONE)[:\s]+([\d\s\-\(\)]+)/i);
    if (phoneMatch) {
      extractedData.contactNumber = phoneMatch[1].trim();
    }

    const emailMatch = cleanText.match(/(?:EMAIL\s*ADDRESS|EMAIL)[:\s]+([^\s,\n]+@[^\s,\n]+\.[^\s,\n]+)/i);
    if (emailMatch) {
      extractedData.emailAddress = emailMatch[1];
    }

    // Education (simplified - look for common education patterns)
    const educationMatch = cleanText.match(/(?:EDUCATIONAL\s*ATTainment|EDUCATION)[:\s]+([^,\n]+)/i);
    if (educationMatch) {
      extractedData.education = educationMatch[1].trim();
    }

    // Civil Service Eligibility
    const eligibilityMatch = cleanText.match(/(?:CIVIL\s*SERVICE\s*ELIGIBILITY|ELIGIBILITY)[:\s]+([^,\n]+)/i);
    if (eligibilityMatch) {
      extractedData.civilServiceEligibility = eligibilityMatch[1].trim();
    }

    // Set confidence based on how many fields we extracted
    const nonEmptyFields = Object.values(extractedData).filter(val => val !== undefined && val !== null && val !== '').length;
    const confidence = Math.min(0.9, 0.3 + (nonEmptyFields * 0.1)); // Base 0.3 + 0.1 per field, max 0.9

    return { data: extractedData, confidence };
  }
  else if (docType === 'work_experience_sheet') {
    // Work Experience Sheet (WES) extraction rules

    // Employer Name
    const employerMatch = cleanText.match(/(?:EMPLOYER|COMPANY|AGENCY)[:\s]+([^,\n]+)/i);
    if (employerMatch) {
      extractedData.employerName = employerMatch[1].trim();
    }

    // Position Title
    const positionMatch = cleanText.match(/(?:POSITION\s*TITLE|TITLE)[:\s]+([^,\n]+)/i);
    if (positionMatch) {
      extractedData.positionTitle = positionMatch[1].trim();
    }

    // Inclusive Dates
    const dateMatch = cleanText.match(/(?:INCLUSIVE\s*DATES|DATE\s*IN|FROM\s*-?\s*TO)[:\s]+([^,\n]+)/i);
    if (dateMatch) {
      extractedData.inclusiveDates = dateMatch[1].trim();
    }

    // Salary Grade
    const salaryGradeMatch = cleanText.match(/(?:SALARY\s*GRADE|SG)[:\s]+(\d+)/i);
    if (salaryGradeMatch) {
      extractedData.salaryGrade = parseInt(salaryGradeMatch[1], 10);
    }

    // Monthly Salary
    const monthlySalaryMatch = cleanText.match(/(?:MONTHLY\s*SALARY|SALARY)[:\s]+([\d,]+(?:\.\d{2})?)/i);
    if (monthlySalaryMatch) {
      extractedData.monthlySalary = parseFloat(monthlySalaryMatch[1].replace(/,/g, ''));
    }

    // Status of Appointment
    const statusMatch = cleanText.match(/(?:STATUS\s*OF\s*APPOINTMENT|APPOINTMENT)[:\s]+([^,\n]+)/i);
    if (statusMatch) {
      extractedData.appointmentStatus = statusMatch[1].trim();
    }

    // Government Service
    const govtServiceMatch = cleanText.match(/(?:GOVERNMENT\s*SERVICE)[:\s]+([^,\n]+)/i);
    if (govtServiceMatch) {
      extractedData.governmentService = govtServiceMatch[1].trim();
    }

    // Set confidence based on how many fields we extracted
    const nonEmptyFields = Object.values(extractedData).filter(val => val !== undefined && val !== null && val !== '').length;
    const confidence = Math.min(0.9, 0.3 + (nonEmptyFields * 0.15)); // Base 0.3 + 0.15 per field, max 0.9

    return { data: extractedData, confidence };
  }
  else {
    // For other document types, return raw text with moderate confidence
    const extractedData = {
      rawText: cleanText
    };

    const confidence = cleanText.length > 0 ? 0.6 : 0.1;

    return { data: extractedData, confidence };
  }
}

export async function processDocument(
  fileBuffer: Buffer,
  fileExtension: string,
  docType: string
): Promise<{ parsedData: Record<string, any> | null; parsingConfidence: number | null }> {
  try {
    // Handle different file types
    const ext = fileExtension.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'bmp', 'tiff'].includes(ext)) {
      // For images, use the buffer directly
      const { text, confidence: ocrConfidence } = await extractTextFromImage(fileBuffer);

      // Extract structured data from text
      const { data, confidence: extractionConfidence } = extractStructuredData(text, docType);

      // Overall confidence is a combination of OCR and extraction confidence
      const overallConfidence = (ocrConfidence + extractionConfidence) / 2;

      return {
        parsedData: data,
        parsingConfidence: overallConfidence
      };
    } else if (ext === 'pdf') {
      // For PDF files, extract text from each page using OCR
      const { text, confidence: ocrConfidence } = await extractTextFromPdf(fileBuffer);

      // Extract structured data from text
      const { data, confidence: extractionConfidence } = extractStructuredData(text, docType);

      // Overall confidence is a combination of OCR and extraction confidence
      const overallConfidence = (ocrConfidence + extractionConfidence) / 2;

      return {
        parsedData: data,
        parsingConfidence: overallConfidence
      };
    } else {
      // For unsupported file types (DOC, etc.), we cannot process with OCR yet
      // Log a warning and return null for parsedData and confidence
      console.warn(`OCR processing not implemented for file type: ${ext}`);
      return {
        parsedData: null,
        parsingConfidence: null
      };
    }
  } catch (error) {
    console.error('Error processing document:', error);
    return {
      parsedData: null,
      parsingConfidence: null
    };
  }
}