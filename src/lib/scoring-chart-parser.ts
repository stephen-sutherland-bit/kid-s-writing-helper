// PDF parser for e-asTTle scoring charts
import * as pdfjsLib from 'pdfjs-dist';
import { ScoringChart, ScoringChartEntry, DEFAULT_SCORING_CHART } from './storage';

// Configure PDF.js worker - using unpkg for better reliability
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

export interface ParsedScoringChart {
  chart: ScoringChart;
  rawText: string;
}

/**
 * Parse a PDF file to extract scoring chart data
 */
export async function parsePdfScoringChart(file: File): Promise<ParsedScoringChart> {
  console.log('Starting scoring chart PDF parsing...');
  
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  
  // Extract text from all pages
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n';
  }
  
  console.log('Extracted text from scoring chart PDF:', fullText.substring(0, 500));
  
  // Try to parse the scoring chart entries from the text
  const entries = parseChartEntries(fullText);
  
  if (entries.length === 0) {
    console.warn('Could not parse entries from PDF, using default chart');
    return {
      chart: {
        ...DEFAULT_SCORING_CHART,
        lastUpdated: new Date().toISOString(),
        isCustom: true
      },
      rawText: fullText
    };
  }
  
  return {
    chart: {
      entries,
      lastUpdated: new Date().toISOString(),
      isCustom: true
    },
    rawText: fullText
  };
}

/**
 * Parse chart entries from extracted text
 * Looking for patterns like: 7 745 134 1B
 */
function parseChartEntries(text: string): ScoringChartEntry[] {
  const entries: ScoringChartEntry[] = [];
  
  // Pattern to match rows: totalScore scaleScore errorMargin level
  // e.g., "7 745 134 1B" or "10 1085 106 1P"
  const rowPattern = /(\d+)\s+(\d+)\s+(\d+)\s+([>]?\d[BPA])/gi;
  
  let match;
  while ((match = rowPattern.exec(text)) !== null) {
    const entry: ScoringChartEntry = {
      totalScore: parseInt(match[1], 10),
      scaleScore: parseInt(match[2], 10),
      errorMargin: parseInt(match[3], 10),
      curriculumLevel: match[4].toUpperCase()
    };
    
    // Validate entry makes sense (total score between 7-56, scale score reasonable)
    if (entry.totalScore >= 7 && entry.totalScore <= 56 && 
        entry.scaleScore >= 700 && entry.scaleScore <= 2500) {
      entries.push(entry);
    }
  }
  
  // Sort by total score
  entries.sort((a, b) => a.totalScore - b.totalScore);
  
  // Remove duplicates
  const uniqueEntries = entries.filter((entry, index, self) =>
    index === self.findIndex(e => e.totalScore === entry.totalScore)
  );
  
  console.log(`Parsed ${uniqueEntries.length} scoring chart entries`);
  
  return uniqueEntries;
}
