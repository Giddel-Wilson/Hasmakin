import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { extractAdmissionYearFromMatricNo, calculateAcademicLevel, getLevelDescription, type Level } from '$lib/academic-levels';

export const GET: RequestHandler = async () => {
  const testMatricNo = 'U2021/5570004';
  
  console.log('=== Level Calculation Test ===');
  console.log('Testing matric number:', testMatricNo);
  
  const extractedYear = extractAdmissionYearFromMatricNo(testMatricNo);
  console.log('Extracted admission year:', extractedYear);
  
  let level: Level | string = 'Unknown';
  let description = 'Unknown';
  
  if (extractedYear) {
    try {
      level = calculateAcademicLevel(extractedYear);
      description = getLevelDescription(level);
      console.log('Calculated level:', level);
      console.log('Level description:', description);
    } catch (error) {
      console.error('Error calculating level:', error);
    }
  }
  
  return json({
    matricNo: testMatricNo,
    extractedYear,
    currentLevel: level,
    levelDescription: description,
    currentDate: new Date().toISOString()
  });
};
