// Rule-based scoring engine for e-asTTle writing assessment

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
