// Academic Level Calculation Utility
// University of Port Harcourt - Hostel Allocation System

export type Level = 'YEAR_1' | 'YEAR_2' | 'YEAR_3' | 'YEAR_4' | 'YEAR_5';

/**
 * Calculate current academic level based on admission year
 * @param admissionYear - The year the student was admitted (e.g., 2020, 2021, etc.)
 * @param currentDate - Optional current date (defaults to now)
 * @returns The current academic level
 */
export function calculateAcademicLevel(admissionYear: number, currentDate?: Date): Level {
  const now = currentDate || new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
  
  // Academic year progression happens in November
  // Before November, students are still in their previous academic year
  let academicYear = currentYear;
  if (currentMonth < 11) {
    academicYear = currentYear - 1;
  }
  
  // Calculate years since admission
  const yearsSinceAdmission = academicYear - admissionYear;
  
  // Map years since admission to academic levels
  // Newer students (fewer years since admission) are in lower levels
  switch (yearsSinceAdmission) {
    case 0:
      return 'YEAR_1'; // Just admitted this academic year
    case 1:
      return 'YEAR_2'; // One year since admission
    case 2:
      return 'YEAR_3'; // Two years since admission
    case 3:
      return 'YEAR_4'; // Three years since admission
    case 4:
      return 'YEAR_5'; // Four years since admission (final year)
    default:
      // For students with more than 4 years (should have graduated)
      if (yearsSinceAdmission >= 5) {
        return 'YEAR_5'; // Cap at final year for graduates who haven't left system
      }
      // For negative values (future admission years)
      return 'YEAR_1'; // Default to first year
  }
}

/**
 * Get academic level description for display
 */
export function getLevelDescription(level: Level): string {
  switch (level) {
    case 'YEAR_1':
      return '100 Level';
    case 'YEAR_2':
      return '200 Level';
    case 'YEAR_3':
      return '300 Level';
    case 'YEAR_4':
      return '400 Level';
    case 'YEAR_5':
      return '500 Level';
    default:
      return 'Unknown Level';
  }
}

/**
 * Check if a student has graduated (November of their 5th year)
 */
export function hasGraduated(admissionYear: number, currentDate?: Date): boolean {
  const now = currentDate || new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  // Students graduate in November of their 4th year after admission
  const graduationYear = admissionYear + 4;
  
  return (currentYear > graduationYear) || 
         (currentYear === graduationYear && currentMonth >= 11);
}

/**
 * Get admission year from matric number if it follows UNIPORT format
 * Format: UYYYYXXXXXXX or UYYYY/XXXXXX (where YYYY is the admission year)
 */
export function extractAdmissionYearFromMatricNo(matricNo: string): number | null {
  if (!matricNo) {
    return null;
  }
  
  // Handle UNIPORT format: U2021/5570004 or U20215570004
  const cleanMatricNo = matricNo.toUpperCase().trim();
  
  // Try to extract year from different possible formats
  let yearStr: string | null = null;
  
  // Format: U2021/XXXXXX or U2021XXXXXX
  if (cleanMatricNo.startsWith('U') && cleanMatricNo.length >= 5) {
    yearStr = cleanMatricNo.substring(1, 5); // Extract characters 1-4 (skip the 'U')
  }
  // Format: 2021/XXXXXX or 2021XXXXXX (without U prefix)
  else if (cleanMatricNo.match(/^\d{4}/)) {
    yearStr = cleanMatricNo.substring(0, 4);
  }
  
  if (!yearStr || yearStr.length !== 4) {
    return null;
  }
  
  const year = parseInt(yearStr);
  
  // Validate year (should be reasonable range)
  if (year >= 2010 && year <= new Date().getFullYear() + 1) {
    return year;
  }
  
  return null;
}
