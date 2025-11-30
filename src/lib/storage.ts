// localStorage management for rubric and assessment data

export interface RubricCategory {
  name: string;
  levels: string[];
  descriptions: string[];
}

export interface Rubric {
  categories: RubricCategory[];
  lastUpdated: string;
  rawText?: string; // Full text from PDF for AI reference
}

export interface Assessment {
  id: string;
  text: string;
  scores: Record<string, number>;
  feedback: {
    simple: string;
    report: string;
    advanced: string;
  };
  timestamp: string;
}

const RUBRIC_KEY = 'easttleRubric';
const LAST_OCR_KEY = 'lastOcrText';
const ASSESSMENTS_KEY = 'assessments';

export const storage = {
  // Rubric management
  saveRubric: (rubric: Rubric) => {
    localStorage.setItem(RUBRIC_KEY, JSON.stringify(rubric));
  },

  getRubric: (): Rubric | null => {
    const data = localStorage.getItem(RUBRIC_KEY);
    return data ? JSON.parse(data) : null;
  },

  hasRubric: (): boolean => {
    return localStorage.getItem(RUBRIC_KEY) !== null;
  },

  // OCR text
  saveLastOcrText: (text: string) => {
    localStorage.setItem(LAST_OCR_KEY, text);
  },

  getLastOcrText: (): string | null => {
    return localStorage.getItem(LAST_OCR_KEY);
  },

  // Assessments
  saveAssessment: (assessment: Assessment) => {
    const assessments = storage.getAssessments();
    assessments.unshift(assessment);
    // Keep only last 10 assessments
    if (assessments.length > 10) {
      assessments.pop();
    }
    localStorage.setItem(ASSESSMENTS_KEY, JSON.stringify(assessments));
  },

  getAssessments: (): Assessment[] => {
    const data = localStorage.getItem(ASSESSMENTS_KEY);
    return data ? JSON.parse(data) : [];
  },

  getAssessment: (id: string): Assessment | null => {
    const assessments = storage.getAssessments();
    return assessments.find(a => a.id === id) || null;
  },

  clearAll: () => {
    localStorage.removeItem(RUBRIC_KEY);
    localStorage.removeItem(LAST_OCR_KEY);
    localStorage.removeItem(ASSESSMENTS_KEY);
  },
};

// Default e-asTTle rubric structure (simplified)
export const DEFAULT_RUBRIC: Rubric = {
  categories: [
    {
      name: "Ideas",
      levels: ["1B", "1P", "1A", "2B", "2P", "2A", "3B", "3P", "3A"],
      descriptions: [
        "Simple, minimal ideas",
        "Some development of ideas",
        "Clear ideas with some detail",
        "Ideas are developed",
        "Ideas show good understanding",
        "Ideas are well developed",
        "Complex ideas presented",
        "Sophisticated ideas",
        "Highly sophisticated ideas"
      ]
    },
    {
      name: "Structure",
      levels: ["1B", "1P", "1A", "2B", "2P", "2A", "3B", "3P", "3A"],
      descriptions: [
        "Little structure",
        "Basic structure emerging",
        "Simple structure present",
        "Clear structure",
        "Good organization",
        "Well-organized",
        "Complex structure",
        "Sophisticated structure",
        "Highly sophisticated structure"
      ]
    },
    {
      name: "Organisation",
      levels: ["1B", "1P", "1A", "2B", "2P", "2A", "3B", "3P", "3A"],
      descriptions: [
        "Minimal organization",
        "Some sentence connection",
        "Basic paragraphing",
        "Clear paragraphs",
        "Good flow between ideas",
        "Well-connected ideas",
        "Complex connections",
        "Sophisticated transitions",
        "Highly sophisticated flow"
      ]
    },
    {
      name: "Vocabulary",
      levels: ["1B", "1P", "1A", "2B", "2P", "2A", "3B", "3P", "3A"],
      descriptions: [
        "Simple words",
        "Basic vocabulary",
        "Some variety",
        "Good word choice",
        "Varied vocabulary",
        "Precise words",
        "Rich vocabulary",
        "Sophisticated words",
        "Highly sophisticated vocabulary"
      ]
    },
    {
      name: "Sentence Style",
      levels: ["1B", "1P", "1A", "2B", "2P", "2A", "3B", "3P", "3A"],
      descriptions: [
        "Simple sentences",
        "Basic sentences",
        "Some variety",
        "Good variety",
        "Varied structures",
        "Complex sentences",
        "Sophisticated structures",
        "Highly varied",
        "Expertly crafted"
      ]
    },
    {
      name: "Punctuation",
      levels: ["1B", "1P", "1A", "2B", "2P", "2A", "3B", "3P", "3A"],
      descriptions: [
        "Minimal punctuation",
        "Basic punctuation",
        "Simple punctuation correct",
        "Most punctuation correct",
        "Good punctuation use",
        "Accurate punctuation",
        "Complex punctuation",
        "Sophisticated punctuation",
        "Expert punctuation"
      ]
    },
    {
      name: "Spelling",
      levels: ["1B", "1P", "1A", "2B", "2P", "2A", "3B", "3P", "3A"],
      descriptions: [
        "Many errors",
        "Frequent errors",
        "Some errors",
        "Mostly correct",
        "Few errors",
        "Accurate",
        "Very accurate",
        "Consistently accurate",
        "Expert spelling"
      ]
    }
  ],
  lastUpdated: new Date().toISOString()
};
