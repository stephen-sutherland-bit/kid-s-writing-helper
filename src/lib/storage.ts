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

export type FeedbackDepth = 'simple' | 'standard' | 'comprehensive';
export type FeedbackAudience = 'student' | 'teacher' | 'parent';

export interface FeedbackGrid {
  student: { simple: string; standard: string; comprehensive: string };
  teacher: { simple: string; standard: string; comprehensive: string };
  parent: { simple: string; standard: string; comprehensive: string };
}

export interface NextSteps {
  teacherNextSteps: string[];
  studentBookFeedback: string;
}

export interface Assessment {
  id: string;
  studentName?: string; // Optional student name
  yearLevel?: number; // Year 0-3 for NZC Phase 1
  text: string;
  scores: Record<string, number>;
  feedback: FeedbackGrid | {
    student: string;
    teacher: string;
    parent: string;
    formal: string;
  } | {
    simple: string;
    report: string;
    advanced: string;
  }; // Support new grid format and old formats for backward compatibility
  timestamp: string;
  justifications?: Record<string, string>; // AI justifications for each score
  nextSteps?: NextSteps; // Curriculum-aligned next steps
}

// Scoring chart interface for e-asTTle score conversion
export interface ScoringChartEntry {
  totalScore: number;
  scaleScore: number;
  errorMargin: number;
  curriculumLevel: string;
}

export interface ScoringChart {
  entries: ScoringChartEntry[];
  lastUpdated: string;
  isCustom: boolean;
}

const RUBRIC_KEY = 'easttleRubric';
const LAST_OCR_KEY = 'lastOcrText';
const ASSESSMENTS_KEY = 'assessments';
const SCORING_CHART_KEY = 'scoringChart';

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
    localStorage.removeItem(SCORING_CHART_KEY);
  },

  // Scoring Chart management
  saveScoringChart: (chart: ScoringChart) => {
    localStorage.setItem(SCORING_CHART_KEY, JSON.stringify(chart));
  },

  getScoringChart: (): ScoringChart | null => {
    const data = localStorage.getItem(SCORING_CHART_KEY);
    return data ? JSON.parse(data) : null;
  },

  hasScoringChart: (): boolean => {
    return localStorage.getItem(SCORING_CHART_KEY) !== null;
  },

  clearScoringChart: () => {
    localStorage.removeItem(SCORING_CHART_KEY);
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

// Default e-asTTle scoring chart (from official conversion table)
export const DEFAULT_SCORING_CHART: ScoringChart = {
  entries: [
    { totalScore: 7, scaleScore: 745, errorMargin: 134, curriculumLevel: '1B' },
    { totalScore: 8, scaleScore: 907, errorMargin: 121, curriculumLevel: '1B' },
    { totalScore: 9, scaleScore: 1009, errorMargin: 113, curriculumLevel: '1B' },
    { totalScore: 10, scaleScore: 1085, errorMargin: 106, curriculumLevel: '1P' },
    { totalScore: 11, scaleScore: 1146, errorMargin: 101, curriculumLevel: '1P' },
    { totalScore: 12, scaleScore: 1198, errorMargin: 96, curriculumLevel: '1P' },
    { totalScore: 13, scaleScore: 1243, errorMargin: 92, curriculumLevel: '1A' },
    { totalScore: 14, scaleScore: 1284, errorMargin: 88, curriculumLevel: '1A' },
    { totalScore: 15, scaleScore: 1321, errorMargin: 85, curriculumLevel: '2B' },
    { totalScore: 16, scaleScore: 1355, errorMargin: 82, curriculumLevel: '2B' },
    { totalScore: 17, scaleScore: 1386, errorMargin: 79, curriculumLevel: '2P' },
    { totalScore: 18, scaleScore: 1415, errorMargin: 76, curriculumLevel: '2P' },
    { totalScore: 19, scaleScore: 1443, errorMargin: 73, curriculumLevel: '2A' },
    { totalScore: 20, scaleScore: 1469, errorMargin: 71, curriculumLevel: '2A' },
    { totalScore: 21, scaleScore: 1494, errorMargin: 68, curriculumLevel: '3B' },
    { totalScore: 22, scaleScore: 1518, errorMargin: 66, curriculumLevel: '3B' },
    { totalScore: 23, scaleScore: 1541, errorMargin: 64, curriculumLevel: '3P' },
    { totalScore: 24, scaleScore: 1563, errorMargin: 62, curriculumLevel: '3P' },
    { totalScore: 25, scaleScore: 1585, errorMargin: 60, curriculumLevel: '3A' },
    { totalScore: 26, scaleScore: 1605, errorMargin: 58, curriculumLevel: '3A' },
    { totalScore: 27, scaleScore: 1625, errorMargin: 57, curriculumLevel: '4B' },
    { totalScore: 28, scaleScore: 1645, errorMargin: 56, curriculumLevel: '4B' },
    { totalScore: 29, scaleScore: 1664, errorMargin: 55, curriculumLevel: '4P' },
    { totalScore: 30, scaleScore: 1682, errorMargin: 54, curriculumLevel: '4P' },
    { totalScore: 31, scaleScore: 1700, errorMargin: 53, curriculumLevel: '4A' },
    { totalScore: 32, scaleScore: 1718, errorMargin: 53, curriculumLevel: '4A' },
    { totalScore: 33, scaleScore: 1736, errorMargin: 53, curriculumLevel: '5B' },
    { totalScore: 34, scaleScore: 1753, errorMargin: 53, curriculumLevel: '5B' },
    { totalScore: 35, scaleScore: 1770, errorMargin: 54, curriculumLevel: '5P' },
    { totalScore: 36, scaleScore: 1788, errorMargin: 55, curriculumLevel: '5P' },
    { totalScore: 37, scaleScore: 1805, errorMargin: 57, curriculumLevel: '5A' },
    { totalScore: 38, scaleScore: 1823, errorMargin: 59, curriculumLevel: '5A' },
    { totalScore: 39, scaleScore: 1842, errorMargin: 61, curriculumLevel: '6B' },
    { totalScore: 40, scaleScore: 1861, errorMargin: 65, curriculumLevel: '6B' },
    { totalScore: 41, scaleScore: 1882, errorMargin: 69, curriculumLevel: '6P' },
    { totalScore: 42, scaleScore: 1905, errorMargin: 76, curriculumLevel: '6A' },
    { totalScore: 43, scaleScore: 1933, errorMargin: 86, curriculumLevel: '6A' },
    { totalScore: 44, scaleScore: 1986, errorMargin: 119, curriculumLevel: '>6B' },
  ],
  lastUpdated: new Date().toISOString(),
  isCustom: false
};
