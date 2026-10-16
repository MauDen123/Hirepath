/**
 * Result of QS matching computation
 */
export interface QSMatchResult {
  overall: number; // 0-100
  breakdown: {
    education: { met: boolean; score: number };
    experience: { met: boolean; score: number };
    training: { met: boolean; score: number };
    eligibility: { met: boolean; score: number };
  };
}

/**
 * QSTemplate type from Prisma (selecting only the fields we need)
 */
interface QSTemplateSelect {
  education: string;
  experience: string;
  training: string;
  eligibility: string;
}

/**
 * Compute QS match score between parsed document data and qualification standard template
 *
 * @param parsedData - Structured data extracted from applicant's documents
 * @param qsTemplate - Qualification standard template for the position
 * @returns QSMatchResult with overall score and dimension breakdown
 */
export function computeQSMatch(
  parsedData: Record<string, any> | null,
  qsTemplate: QSTemplateSelect
): QSMatchResult {
  // If no parsed data, return zero scores
  if (!parsedData) {
    return {
      overall: 0,
      breakdown: {
        education: { met: false, score: 0 },
        experience: { met: false, score: 0 },
        training: { met: false, score: 0 },
        eligibility: { met: false, score: 0 },
      },
    };
  }

  // Compute each dimension score
  const educationScore = computeEducationMatch(
    parsedData,
    qsTemplate.education
  );
  const experienceScore = computeExperienceMatch(
    parsedData,
    qsTemplate.experience
  );
  const trainingScore = computeTrainingMatch(parsedData, qsTemplate.training);
  const eligibilityScore = computeEligibilityMatch(
    parsedData,
    qsTemplate.eligibility
  );

  // Calculate weighted overall score
  // As recommended in qs-matching-engine.md:
  // education 0.3 + experience 0.3 + training 0.2 + eligibility 0.2
  const overallScore =
    educationScore * 0.3 +
    experienceScore * 0.3 +
    trainingScore * 0.2 +
    eligibilityScore * 0.2;

  return {
    overall: Math.round(overallScore * 100) / 100, // Keep 2 decimal places
    breakdown: {
      education: {
        met: educationScore >= 80, // Consider met if score >= 80%
        score: Math.round(educationScore * 100) / 100,
      },
      experience: {
        met: experienceScore >= 80,
        score: Math.round(experienceScore * 100) / 100,
      },
      training: {
        met: trainingScore >= 80,
        score: Math.round(trainingScore * 100) / 100,
      },
      eligibility: {
        met: eligibilityScore >= 80, // For eligibility, typically need exact match so 100% or 0%
        score: Math.round(eligibilityScore * 100) / 100,
      },
    },
  };
}

/**
 * Compute education match using fuzzy/semantic matching
 *
 * @param parsedData - Parsed document data
 * @param qsEducation - Education requirement from QSTemplate
 * @returns Score 0-100
 */
export function computeEducationMatch(
  parsedData: Record<string, any>,
  qsEducation: string
): number {
  if (!qsEducation || qsEducation.trim() === '') {
    return 100; // No requirement means fully met
  }

  // Extract education information from parsedData
  // Education info could come from:
  // 1. transcript_of_records document (rawText)
  // 2. PDS might have some education info but current parsing doesn't extract it
  // 3. Other documents

  let educationText = '';

  // Check if we have transcript of records
  if (parsedData.rawText && typeof parsedData.rawText === 'string') {
    // This could be from transcript_of_records, certification, etc.
    // For now, we'll use any rawText as education source
    educationText = parsedData.rawText;
  }

  // Also check for specific education fields if they exist in parsedData
  // (though current PDS parsing doesn't extract education fields)
  const possibleEducationFields = [
    'education',
    'educationalAttainment',
    'degree',
    'course',
    'major',
    'fieldOfStudy',
    'school',
    'university',
    'college',
  ];

  for (const field of possibleEducationFields) {
    if (parsedData[field] && typeof parsedData[field] === 'string') {
      educationText += ' ' + parsedData[field];
    }
  }

  // If still no education text, return 0
  if (!educationText || educationText.trim() === '') {
    return 0;
  }

  // Normalize both strings for comparison
  const normalizedQS = normalizeEducationText(qsEducation);
  const normalizedEducation = normalizeEducationText(educationText);

  // Calculate keyword overlap score
  return calculateKeywordOverlap(normalizedQS, normalizedEducation);
}

/**
 * Normalize education text for better matching
 * - Lowercase
 * - Remove extra whitespace
 * - Remove common words that don't add meaning
 */
function normalizeEducationText(text: string): string {
  if (!text) return '';

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(
      /\b(?:and|or|the|of|in|for|with|a|an|to|is|are|de|la|del|y|en|un|una)\b/g,
      ' '
    ) // Remove common words
    .replace(/\s+/g, ' ') // Normalize whitespace again
    .trim();
}

/**
 * Calculate keyword overlap between two text strings
 * Simple approach: percentage of QS keywords found in education text
 */
function calculateKeywordOverlap(
  qsText: string,
  educationText: string
): number {
  if (!qsText || !educationText) return 0;

  const qsKeywords = qsText.split(' ').filter((word) => word.length > 2); // Ignore very short words
  if (qsKeywords.length === 0) return 100; // No keywords means fully met

  let matches = 0;
  for (const keyword of qsKeywords) {
    if (educationText.includes(keyword)) {
      matches++;
    }
  }

  return Math.round((matches / qsKeywords.length) * 100);
}

/**
 * Compute experience match using numerical years comparison
 *
 * @param parsedData - Parsed document data
 * @param qsExperience - Experience requirement from QSTemplate (e.g., "1 year of relevant experience")
 * @returns Score 0-100
 */
export function computeExperienceMatch(
  parsedData: Record<string, any>,
  qsExperience: string
): number {
  if (!qsExperience || qsExperience.trim() === '') {
    return 100; // No requirement means fully met
  }

  // Parse required years from QSTemplate
  const requiredYears = parseYearsFromExperienceString(qsExperience);
  if (requiredYears === null) {
    // If we can't parse, treat as unmet
    return 0;
  }

  // "None required" or similar should always pass
  const lowerExp = qsExperience.toLowerCase();
  if (
    lowerExp.includes('none') ||
    lowerExp.includes('not required') ||
    lowerExp.includes('no experience')
  ) {
    return 100;
  }

  // Calculate total relevant experience from parsed work experience sheets
  const totalYears = calculateTotalRelevantExperience(parsedData);

  if (totalYears === null) {
    // No work experience data found
    return 0;
  }

  // Calculate score based on how much experience we have vs required
  // If we have equal or more experience, score is 100
  // Otherwise, score is (actual / required) * 100, capped at 100
  if (totalYears >= requiredYears) {
    return 100;
  } else {
    return Math.round((totalYears / requiredYears) * 100);
  }
}

/**
 * Parse years from experience string
 * Examples:
 *   "1 year of relevant experience" -> 1
 *   "2 years experience" -> 2
 *   "Minimum 3 years" -> 3
 *   "None required" -> null (handled separately)
 */
function parseYearsFromExperienceString(expString: string): number | null {
  if (!expString) return null;

  // Look for numbers at the beginning or after common phrases
  const match =
    expString.match(/^(\d+)/) ||
    expString.match(/(\d+)\s*year/i) ||
    expString.match(/minimum\s*(\d+)/i) ||
    expString.match(/at\s*least\s*(\d+)/i);

  if (match) {
    const years = parseInt(match[1], 10);
    return isNaN(years) ? null : years;
  }

  return null;
}

/**
 * Calculate total relevant experience in years from work experience sheet data
 *
 * @param parsedData - Parsed document data
 * @returns Total years of experience or null if none found
 */
function calculateTotalRelevantExperience(
  parsedData: Record<string, any>
): number | null {
  // Work experience data would be in work_experience_sheet parsedData
  // Looking at the extractStructuredData function, work_experience_sheet returns:
  // employerName, positionTitle, inclusiveDates, salaryGrade, monthlySalary, appointmentStatus, governmentService

  let totalDays = 0;
  let foundExperience = false;

  // Check if we have work experience sheet data directly in parsedData
  // (this would be the case if the work_experience_sheet was the most recently processed document)
  if (
    parsedData.inclusiveDates &&
    typeof parsedData.inclusiveDates === 'string'
  ) {
    const years = calculateYearsFromDateRange(parsedData.inclusiveDates);
    if (years !== null) {
      totalDays += years * 365; // Approximate
      foundExperience = true;
    }
  }

  // Check if parsedData contains work experience entries in other formats
  const experienceFields = [
    'workExperience',
    'employmentHistory',
    'experience',
  ];
  for (const field of experienceFields) {
    if (parsedData[field]) {
      // Handle if it's an array
      if (Array.isArray(parsedData[field])) {
        for (const exp of parsedData[field]) {
          if (
            exp &&
            exp.inclusiveDates &&
            typeof exp.inclusiveDates === 'string'
          ) {
            const years = calculateYearsFromDateRange(exp.inclusiveDates);
            if (years !== null) {
              totalDays += years * 365;
              foundExperience = true;
            }
          }
        }
      }
      // Handle if it's an object
      else if (
        typeof parsedData[field] === 'object' &&
        parsedData[field] !== null
      ) {
        const exp = parsedData[field];
        if (exp.inclusiveDates && typeof exp.inclusiveDates === 'string') {
          const years = calculateYearsFromDateRange(exp.inclusiveDates);
          if (years !== null) {
            totalDays += years * 365;
            foundExperience = true;
          }
        }
      }
    }
  }

  if (!foundExperience) {
    return null;
  }

  // Convert days to years
  return totalDays / 365;
}

/**
 * Examples:
 *   "Jan 2020 - Dec 2022" -> 3
 *   "2020-2022" -> 3
 *   "01/2020 - 12/2022" -> 3
 *   "Present" or "Current" treated as today
 */
function calculateYearsFromDateRange(dateRange: string): number | null {
  if (!dateRange || typeof dateRange !== 'string') return null;

  // Normalize the string
  const normalized = dateRange.toLowerCase().replace(/\s+/g, ' ').trim();

  // Split by common separators
  const parts = normalized.split(/\s*[-–—]\s*/); // hyphen, en-dash, em-dash
  if (parts.length !== 2) return null;

  const startStr = parts[0].trim();
  const endStr = parts[1].trim();

  const startDate = parseDateString(startStr);
  const endDate =
    endStr === 'present' || endStr === 'current'
      ? new Date()
      : parseDateString(endStr);

  if (!startDate || !endDate) return null;

  // Calculate difference in years
  const timeDiff = Math.abs(endDate.getTime() - startDate.getTime());
  const years = timeDiff / (1000 * 3600 * 24 * 365.25); // Account for leap years

  return Math.max(0, years); // Don't return negative
}

/**
 * Parse a date string into a Date object
 * Handles various formats: "Jan 2020", "01/2020", "2020", etc.
 */
function parseDateString(dateStr: string): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;

  const cleaned = dateStr.trim();

  // Try parsing as month year
  const monthYearMatch = cleaned.match(/^(\w+)\s+(\d{4})$/);
  if (monthYearMatch) {
    const monthName = monthYearMatch[1];
    const year = parseInt(monthYearMatch[2], 10);
    const monthIndex = getMonthIndex(monthName);
    if (monthIndex !== null && !isNaN(year)) {
      return new Date(year, monthIndex, 1);
    }
  }

  // Try parsing as MM/YYYY
  const mmYyyyMatch = cleaned.match(/^(\d{1,2})\/(\d{4})$/);
  if (mmYyyyMatch) {
    const month = parseInt(mmYyyyMatch[1], 10) - 1; // 0-indexed
    const year = parseInt(mmYyyyMatch[2], 10);
    if (month >= 0 && month <= 11 && !isNaN(year)) {
      return new Date(year, month, 1);
    }
  }

  // Try parsing as just YYYY
  const yyyyMatch = cleaned.match(/^(\d{4})$/);
  if (yyyyMatch) {
    const year = parseInt(yyyyMatch[1], 10);
    if (!isNaN(year)) {
      return new Date(year, 0, 1); // January 1st
    }
  }

  return null;
}

/**
 * Get month index (0-11) from month name
 */
function getMonthIndex(monthName: string): number | null {
  const months = [
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december',
    'jan',
    'feb',
    'mar',
    'apr',
    'may',
    'jun',
    'jul',
    'aug',
    'sep',
    'oct',
    'nov',
    'dec',
  ];

  const lowerName = monthName.toLowerCase();
  const index = months.indexOf(lowerName);
  return index >= 0 ? index % 12 : null; // Handle both full and abbreviated names
}

/**
 * Compute training match using numerical hours comparison
 * Similar to experience but for training hours
 *
 * @param parsedData - Parsed document data
 * @param qsTraining - Training requirement from QSTemplate (e.g., "4 hours of relevant training")
 * @returns Score 0-100
 */
export function computeTrainingMatch(
  parsedData: Record<string, any>,
  qsTraining: string
): number {
  if (!qsTraining || qsTraining.trim() === '') {
    return 100; // No requirement means fully met
  }

  // Parse required hours from QSTemplate
  const requiredHours = parseHoursFromTrainingString(qsTraining);
  if (requiredHours === null) {
    // If we can't parse, treat as unmet
    return 0;
  }

  // "None required" or similar should always pass
  const lowerTrain = qsTraining.toLowerCase();
  if (
    lowerTrain.includes('none') ||
    lowerTrain.includes('not required') ||
    lowerTrain.includes('no training')
  ) {
    return 100;
  }

  // Calculate total training hours from parsed certification data
  const totalHours = calculateTotalTrainingHours(parsedData);

  if (totalHours === null) {
    // No training data found
    return 0;
  }

  // Calculate score based on how much training we have vs required
  if (totalHours >= requiredHours) {
    return 100;
  } else {
    return Math.round((totalHours / requiredHours) * 100);
  }
}

/**
 * Parse hours from training string
 * Examples:
 *   "4 hours of relevant training" -> 4
 *   "8 hours training" -> 8
 *   "Minimum 16 hours" -> 16
 */
function parseHoursFromTrainingString(trainString: string): number | null {
  if (!trainString) return null;

  // Look for numbers at the beginning or after common phrases
  const match =
    trainString.match(/^(\d+)/) ||
    trainString.match(/(\d+)\s*hour/i) ||
    trainString.match(/minimum\s*(\d+)/i) ||
    trainString.match(/at\s*least\s*(\d+)/i);

  if (match) {
    const hours = parseInt(match[1], 10);
    return isNaN(hours) ? null : hours;
  }

  return null;
}

/**
 * Calculate total training hours from certification data
 *
 * @param parsedData - Parsed document data
 * @returns Total hours of training or null if none found
 */
function calculateTotalTrainingHours(
  parsedData: Record<string, any>
): number | null {
  // Training data would likely be in certification documents
  // For now, we'll look for common patterns in rawText or specific fields

  let totalHours = 0;
  let foundTraining = false;

  // Check if we have rawText that might contain training info
  if (parsedData.rawText && typeof parsedData.rawText === 'string') {
    // Look for patterns like "X hours", "X hrs", etc.
    const hourMatches = parsedData.rawText.match(/(\d+)\s*(?:hours?|hrs?)/gi);
    if (hourMatches) {
      for (const match of hourMatches) {
        const hours = parseInt(match.replace(/[^\d]/g, ''), 10);
        if (!isNaN(hours)) {
          totalHours += hours;
          foundTraining = true;
        }
      }
    }
  }

  // Also check for specific training fields
  const trainingFields = ['training', 'trainings', 'hours', 'trainingHours'];
  for (const field of trainingFields) {
    if (parsedData[field]) {
      // Handle if it's a number
      if (typeof parsedData[field] === 'number') {
        totalHours += parsedData[field];
        foundTraining = true;
      }
      // Handle if it's a string that can be parsed as number
      else if (typeof parsedData[field] === 'string') {
        const hours = parseInt(parsedData[field], 10);
        if (!isNaN(hours)) {
          totalHours += hours;
          foundTraining = true;
        }
      }
      // Handle if it's an array
      else if (Array.isArray(parsedData[field])) {
        for (const item of parsedData[field]) {
          if (typeof item === 'number') {
            totalHours += item;
            foundTraining = true;
          } else if (typeof item === 'string') {
            const hours = parseInt(item, 10);
            if (!isNaN(hours)) {
              totalHours += hours;
              foundTraining = true;
            }
          }
        }
      }
    }
  }

  if (!foundTraining) {
    return null;
  }

  return totalHours;
}

/**
 * Compute eligibility match using exact/categorical matching
 *
 * @param parsedData - Parsed document data
 * @param qsEligibility - Eligibility requirement from QSTemplate
 * @returns Score 0-100 (100 for exact match, 0 for no match or partial match)
 */
export function computeEligibilityMatch(
  parsedData: Record<string, any>,
  qsEligibility: string
): number {
  if (!qsEligibility || qsEligibility.trim() === '') {
    return 100; // No requirement means fully met
  }

  // Extract eligibility information from parsedData
  // Eligibility info would come from eligibility document
  let eligibilityText = '';

  if (parsedData.rawText && typeof parsedData.rawText === 'string') {
    eligibilityText = parsedData.rawText.trim();
  }

  // Also check for specific eligibility fields
  const eligibilityFields = [
    'eligibility',
    'civilServiceEligibility',
    'license',
    'rating',
    'prc',
  ];
  for (const field of eligibilityFields) {
    if (parsedData[field] && typeof parsedData[field] === 'string') {
      eligibilityText = parsedData[field].trim();
      break; // Use the first one we find
    }
  }

  // If no eligibility text found, return 0
  if (!eligibilityText || eligibilityText.trim() === '') {
    return 0;
  }

  // For eligibility, we want exact/categorical matching
  // As per qs-matching-engine.md: "eligibility is a binary legal requirement, not a 'close enough' criterion"

  // Normalize both strings for comparison
  const normalizedQS = normalizeEligibilityText(qsEligibility);
  const normalizedEligibility = normalizeEligibilityText(eligibilityText);

  // Check for exact match
  if (normalizedQS === normalizedEligibility) {
    return 100;
  }

  // Check if QS requirement is fully contained in eligibility text (but not vice versa)
  // This handles cases where eligibility text has more details but includes the requirement
  if (normalizedEligibility.includes(normalizedQS)) {
    // Still consider this as met for eligibility since having extra eligibility is good
    return 100;
  }

  // For eligibility, partial matches are not acceptable - it's binary
  return 0;
}

/**
 * Normalize eligibility text for exact matching
 * - Lowercase
 * - Remove extra whitespace
 * - Remove common punctuation that doesn't affect meaning
 */
function normalizeEligibilityText(text: string): string {
  if (!text) return '';

  return text
    .toLowerCase()
    .replace(/[^\w\s\/]/g, ' ') // Keep slashes for things like "RA 1080/" but remove other punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\b(?:and|or|the|of|in|for|with|a|an|to|is|are)\b/g, ' ') // Remove some common words
    .replace(/\s+/g, ' ') // Normalize whitespace again
    .trim();
}
