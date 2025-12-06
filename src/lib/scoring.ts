// Scoring engine for e-asTTle writing assessment with AI support
import { Rubric, storage, DEFAULT_SCORING_CHART } from './storage';

interface TextAnalysis {
  sentenceCount: number;
  paragraphCount: number;
  wordCount: number;
  uniqueWords: number;
  averageWordLength: number;
  averageSentenceLength: number;
  transitionWords: number;
  complexSentences: number;
  spellingErrors: number;
  punctuationScore: number;
  vocabularyRichness: number;
}

// Common transition words
const TRANSITION_WORDS = [
  'however', 'therefore', 'furthermore', 'moreover', 'additionally',
  'consequently', 'meanwhile', 'nevertheless', 'although', 'because',
  'since', 'while', 'whereas', 'firstly', 'secondly', 'finally',
  'also', 'then', 'next', 'after', 'before', 'during'
];

// Simple word list for spell checking (common words)
const COMMON_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
  'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'must', 'can', 'i', 'you', 'he',
  'she', 'it', 'we', 'they', 'this', 'that', 'these', 'those', 'what',
  'which', 'who', 'when', 'where', 'why', 'how', 'not', 'no', 'yes'
]);

export function analyzeText(text: string): TextAnalysis {
  // Clean and normalize text
  const cleanText = text.trim().toLowerCase();
  
  // Count sentences
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceCount = sentences.length;
  
  // Count paragraphs (by line breaks)
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const paragraphCount = Math.max(1, paragraphs.length);
  
  // Count words
  const words = cleanText.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  
  // Unique words
  const uniqueWords = new Set(words).size;
  
  // Average word length
  const averageWordLength = words.reduce((sum, word) => sum + word.length, 0) / wordCount;
  
  // Average sentence length
  const averageSentenceLength = wordCount / sentenceCount;
  
  // Count transition words
  const transitionWords = words.filter(word => 
    TRANSITION_WORDS.includes(word.replace(/[^a-z]/g, ''))
  ).length;
  
  // Detect complex sentences (rough heuristic: sentences with commas or semicolons)
  const complexSentences = sentences.filter(s => 
    s.includes(',') || s.includes(';') || s.includes(':')
  ).length;
  
  // Spelling errors (very basic - just check against common words)
  const spellingErrors = words.filter(word => {
    const cleanWord = word.replace(/[^a-z]/g, '');
    return cleanWord.length > 2 && !COMMON_WORDS.has(cleanWord);
  }).length;
  
  // Punctuation score (check for proper use)
  let punctuationScore = 100;
  if (!text.includes('.')) punctuationScore -= 30;
  if (sentenceCount > 3 && !text.includes(',')) punctuationScore -= 20;
  if (text.match(/[A-Z][^.!?]*[a-z]/g)?.some(s => !s.trim().endsWith('.'))) {
    punctuationScore -= 20;
  }
  punctuationScore = Math.max(0, punctuationScore);
  
  // Vocabulary richness (unique words / total words)
  const vocabularyRichness = (uniqueWords / wordCount) * 100;
  
  return {
    sentenceCount,
    paragraphCount,
    wordCount,
    uniqueWords,
    averageWordLength,
    averageSentenceLength,
    transitionWords,
    complexSentences,
    spellingErrors,
    punctuationScore,
    vocabularyRichness
  };
}

export function scoreWriting(text: string): Record<string, number> {
  const analysis = analyzeText(text);
  
  // Score each category (0-8 scale for e-asTTle)
  const scores: Record<string, number> = {};
  
  // Ideas - based on word count and unique words
  scores.Ideas = Math.min(8, Math.floor(
    (analysis.wordCount / 50) + (analysis.uniqueWords / 30)
  ));
  
  // Structure - based on paragraphs and sentence variety
  scores.Structure = Math.min(8, Math.floor(
    (analysis.paragraphCount * 2) + (analysis.complexSentences / analysis.sentenceCount * 4)
  ));
  
  // Organisation - based on paragraphs and transitions
  scores.Organisation = Math.min(8, Math.floor(
    (analysis.paragraphCount * 1.5) + (analysis.transitionWords / 2)
  ));
  
  // Vocabulary - based on richness and word length
  scores.Vocabulary = Math.min(8, Math.floor(
    (analysis.vocabularyRichness / 15) + (analysis.averageWordLength - 3)
  ));
  
  // Sentence Style - based on variety and complexity
  scores["Sentence Style"] = Math.min(8, Math.floor(
    (analysis.averageSentenceLength / 5) + (analysis.complexSentences / analysis.sentenceCount * 4)
  ));
  
  // Punctuation - based on punctuation score
  scores.Punctuation = Math.min(8, Math.floor(analysis.punctuationScore / 12.5));
  
  // Spelling - inverse of errors
  scores.Spelling = Math.min(8, Math.max(0, 8 - Math.floor(analysis.spellingErrors / 5)));
  
  return scores;
}

export function getLevelFromScore(score: number): string {
  // Map 0-8 scores to e-asTTle levels
  const levels = ["1B", "1P", "1A", "2B", "2P", "2A", "3B", "3P", "3A"];
  return levels[Math.min(score, 8)];
}

/**
 * Calculate total raw score from all category scores
 * Each category is scored 0-8, so with 7 categories max is 56
 */
export function calculateTotalScore(categoryScores: Record<string, number>): number {
  return Object.values(categoryScores).reduce((sum, score) => sum + score, 0);
}

export interface ScoreConversion {
  totalScore: number;
  scaleScore: number;
  errorMargin: number;
  curriculumLevel: string;
}

/**
 * Look up the scale score and curriculum level from the scoring chart
 * Uses the stored chart or default chart
 */
export function lookupScaleScore(
  totalScore: number, 
  chart?: { entries: Array<{ totalScore: number; scaleScore: number; errorMargin: number; curriculumLevel: string }> }
): ScoreConversion | null {
  const scoringChart = chart || storage.getScoringChart() || DEFAULT_SCORING_CHART;
  
  // Find exact match or closest lower entry
  let closestEntry = scoringChart.entries[0];
  
  for (const entry of scoringChart.entries) {
    if (entry.totalScore === totalScore) {
      return entry;
    }
    if (entry.totalScore <= totalScore) {
      closestEntry = entry;
    }
  }
  
  // If total score is below minimum (7), return minimum
  if (totalScore < scoringChart.entries[0].totalScore) {
    return {
      ...scoringChart.entries[0],
      totalScore: totalScore
    };
  }
  
  // If total score is above maximum, return maximum
  if (totalScore > scoringChart.entries[scoringChart.entries.length - 1].totalScore) {
    return {
      ...scoringChart.entries[scoringChart.entries.length - 1],
      totalScore: totalScore
    };
  }
  
  return closestEntry;
}

export interface AIScoringResult {
  scores: Record<string, number>;
  justifications: Record<string, string>;
}

export interface NextStepsResult {
  teacherNextSteps: string[];
  studentBookFeedback: string;
}

export interface UnifiedAssessmentResult {
  extractedText: string;
  scores: Record<string, number>;
  justifications: Record<string, string>;
  feedback: {
    student: { simple: string; standard: string; comprehensive: string };
    teacher: { simple: string; standard: string; comprehensive: string };
    parent: { simple: string; standard: string; comprehensive: string };
  };
  nextSteps?: NextStepsResult;
}

/**
 * Unified assessment using OpenAI GPT-4o
 * Handles text extraction, scoring, and feedback generation in one call
 */
export async function assessWritingWithOpenAI(
  images: string[], // base64 data URLs
  rubric: Rubric,
  yearLevel?: number
): Promise<UnifiedAssessmentResult> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/assess-writing`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ images, rubric, yearLevel }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      }
      
      if (response.status === 401 || response.status === 402) {
        throw new Error('Invalid or expired OpenAI API key. Please check your API key settings.');
      }
      
      throw new Error(error.error || 'Failed to assess writing');
    }

    const result = await response.json();
    
    return {
      extractedText: result.extractedText,
      scores: result.scores,
      justifications: result.justifications,
      feedback: result.feedback,
      nextSteps: result.nextSteps
    };
  } catch (error) {
    console.error('OpenAI Assessment Error:', error);
    throw error; // Re-throw to be handled by the UI
  }
}

/**
 * Legacy function - kept for backward compatibility
 * Score writing using AI against the actual rubric
 * This replaces rule-based heuristics with rubric-aware AI assessment
 */
export async function scoreWritingWithAI(
  text: string,
  rubric: Rubric
): Promise<AIScoringResult> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/score-writing`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text, rubric }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      }
      
      if (response.status === 402) {
        throw new Error('AI credits depleted. Please add credits to continue.');
      }
      
      throw new Error(error.error || 'Failed to score writing');
    }

    const result = await response.json();
    
    return {
      scores: result.scores,
      justifications: result.justifications
    };
  } catch (error) {
    console.error('AI Scoring Error:', error);
    
    // Fallback to rule-based scoring if AI fails
    if (error instanceof Error) {
      console.warn('Falling back to rule-based scoring:', error.message);
    }
    
    const fallbackScores = scoreWriting(text);
    return {
      scores: fallbackScores,
      justifications: Object.keys(fallbackScores).reduce((acc, key) => {
        acc[key] = 'Assessed using automated heuristics';
        return acc;
      }, {} as Record<string, string>)
    };
  }
}
