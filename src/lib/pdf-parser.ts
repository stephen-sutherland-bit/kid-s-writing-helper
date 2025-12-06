// PDF parsing utilities for e-asTTle rubrics using pdf.js
import * as pdfjsLib from 'pdfjs-dist';
import { Rubric, RubricCategory } from './storage';

// Lazy-load PDF.js worker configuration to prevent app crashes
let pdfWorkerConfigured = false;

function ensurePdfWorkerConfigured() {
  if (!pdfWorkerConfigured) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 
      'https://unpkg.com/pdfjs-dist@5.4.449/build/pdf.worker.min.mjs';
    pdfWorkerConfigured = true;
  }
}

export interface ParsedRubric {
  rubric: Rubric;
  rawText: string;
}

/**
 * Parse a PDF file and extract rubric structure
 */
export async function parsePdfRubric(file: File): Promise<ParsedRubric> {
  try {
    ensurePdfWorkerConfigured();
    console.log('Starting PDF parse, file size:', file.size);
    const arrayBuffer = await file.arrayBuffer();
    console.log('ArrayBuffer created, loading PDF...');
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    console.log('PDF loaded, pages:', pdf.numPages);
    
    let fullText = '';
    
    // Extract text from all pages
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n\n';
    }
    
    // Parse the rubric structure from the text
    const categories = parseCategories(fullText);
    
    const rubric: Rubric = {
      categories: categories.length > 0 ? categories : getDefaultCategories(),
      lastUpdated: new Date().toISOString(),
    };
    
    return {
      rubric,
      rawText: fullText
    };
  } catch (error) {
    console.error('Error parsing PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to parse PDF: ${errorMessage}. Please ensure it's a valid PDF file.`);
  }
}

/**
 * Parse categories from rubric text
 * This is a simplified parser - production would need more sophisticated text parsing
 */
function parseCategories(text: string): RubricCategory[] {
  const categories: RubricCategory[] = [];
  const categoryNames = ['Ideas', 'Structure', 'Organisation', 'Vocabulary', 'Sentence Style', 'Punctuation', 'Spelling'];
  
  // Try to find each category in the text
  for (const name of categoryNames) {
    const categoryRegex = new RegExp(`${name}[:\\s]+(.*?)(?=${categoryNames.join('|')}|$)`, 'is');
    const match = text.match(categoryRegex);
    
    if (match) {
      // Extract level descriptors if possible
      const descriptions = extractDescriptions(match[1]);
      
      categories.push({
        name,
        levels: ['1B', '1P', '1A', '2B', '2P', '2A', '3B', '3P', '3A'],
        descriptions: descriptions.length > 0 ? descriptions : getDefaultDescriptions()
      });
    }
  }
  
  return categories;
}

/**
 * Extract level descriptions from category text
 */
function extractDescriptions(text: string): string[] {
  // Look for level patterns like "1B:", "1P:", etc.
  const descriptions: string[] = [];
  const levelRegex = /[123][BPA][\s:]+([^123]+?)(?=[123][BPA]|$)/gi;
  let match;
  
  while ((match = levelRegex.exec(text)) !== null) {
    descriptions.push(match[1].trim());
  }
  
  // If we couldn't extract proper descriptions, return empty
  if (descriptions.length < 7) {
    return [];
  }
  
  return descriptions;
}

/**
 * Get default category list for fallback
 */
function getDefaultCategories(): RubricCategory[] {
  return [
    {
      name: "Ideas",
      levels: ["1B", "1P", "1A", "2B", "2P", "2A", "3B", "3P", "3A"],
      descriptions: getDefaultDescriptions()
    },
    {
      name: "Structure",
      levels: ["1B", "1P", "1A", "2B", "2P", "2A", "3B", "3P", "3A"],
      descriptions: getDefaultDescriptions()
    },
    {
      name: "Organisation",
      levels: ["1B", "1P", "1A", "2B", "2P", "2A", "3B", "3P", "3A"],
      descriptions: getDefaultDescriptions()
    },
    {
      name: "Vocabulary",
      levels: ["1B", "1P", "1A", "2B", "2P", "2A", "3B", "3P", "3A"],
      descriptions: getDefaultDescriptions()
    },
    {
      name: "Sentence Style",
      levels: ["1B", "1P", "1A", "2B", "2P", "2A", "3B", "3P", "3A"],
      descriptions: getDefaultDescriptions()
    },
    {
      name: "Punctuation",
      levels: ["1B", "1P", "1A", "2B", "2P", "2A", "3B", "3P", "3A"],
      descriptions: getDefaultDescriptions()
    },
    {
      name: "Spelling",
      levels: ["1B", "1P", "1A", "2B", "2P", "2A", "3B", "3P", "3A"],
      descriptions: getDefaultDescriptions()
    }
  ];
}

/**
 * Default generic descriptions for fallback
 */
function getDefaultDescriptions(): string[] {
  return [
    "Emerging skill",
    "Basic skill",
    "Developing skill",
    "Progressing skill",
    "Competent skill",
    "Strong skill",
    "Advanced skill",
    "Sophisticated skill",
    "Expert skill"
  ];
}
