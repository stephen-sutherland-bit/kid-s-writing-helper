// NZC English Phase 1 (Years 0-3) Curriculum Progression
// Used for generating curriculum-aligned "next steps" feedback

export interface CurriculumExpectation {
  current: string;
  nextSteps: string[];
}

export interface YearLevelCurriculum {
  yearLevel: number;
  label: string;
  ideas: CurriculumExpectation;
  structure: CurriculumExpectation;
  language: CurriculumExpectation;
  sentences: CurriculumExpectation;
  spelling: CurriculumExpectation;
  punctuation: CurriculumExpectation;
}

export const NZC_PHASE1_CURRICULUM: YearLevelCurriculum[] = [
  {
    yearLevel: 0,
    label: 'Year 0',
    ideas: {
      current: 'Draws pictures and uses some letters/words to record ideas',
      nextSteps: [
        'Write a simple sentence about their picture',
        'Add more detail to ideas through talking before writing',
        'Use personal experiences as topics for writing'
      ]
    },
    structure: {
      current: 'Creates simple texts (labels, captions, lists)',
      nextSteps: [
        'Write simple recounts with a beginning',
        'Include 2-3 related ideas in sequence',
        'Use "I" statements to tell about themselves'
      ]
    },
    language: {
      current: 'Uses familiar oral vocabulary in writing',
      nextSteps: [
        'Stretch vocabulary beyond everyday words',
        'Use describing words (adjectives) like colors and sizes',
        'Include action words (verbs) in sentences'
      ]
    },
    sentences: {
      current: 'Attempts simple sentences with support',
      nextSteps: [
        'Write complete sentences with subject and verb',
        'Start sentences with "I", "The", "My"',
        'Use "and" to join two ideas'
      ]
    },
    spelling: {
      current: 'Uses beginning sounds and some sight words',
      nextSteps: [
        'Spell high-frequency words correctly (I, a, the, is, to, and)',
        'Use initial and final sounds in unknown words',
        'Write CVC words phonetically (cat, dog, run)'
      ]
    },
    punctuation: {
      current: 'Beginning to understand spaces between words',
      nextSteps: [
        'Use finger spaces between words',
        'Start sentences with a capital letter',
        'Put a full stop at the end of a sentence'
      ]
    }
  },
  {
    yearLevel: 1,
    label: 'Year 1',
    ideas: {
      current: 'Writes about personal experiences with some detail',
      nextSteps: [
        'Add more specific details (who, what, where)',
        'Include feelings or reactions in writing',
        'Develop one main idea with supporting details'
      ]
    },
    structure: {
      current: 'Creates simple texts with a beginning and end',
      nextSteps: [
        'Write texts with a clear beginning, middle, and end',
        'Use time connectives (first, then, next, finally)',
        'Keep ideas in logical order'
      ]
    },
    language: {
      current: 'Uses simple describing words and verbs',
      nextSteps: [
        'Use more specific nouns (golden retriever vs dog)',
        'Add adverbs to describe actions (ran quickly)',
        'Include dialogue in stories'
      ]
    },
    sentences: {
      current: 'Writes simple and compound sentences using "and"',
      nextSteps: [
        'Vary sentence beginnings (not always "I" or "The")',
        'Use "but" and "so" to join sentences',
        'Write sentences of different lengths'
      ]
    },
    spelling: {
      current: 'Spells common words correctly, uses phonetic spelling for others',
      nextSteps: [
        'Spell Essential List 1 words correctly',
        'Use common spelling patterns (-ing, -ed, -er)',
        'Check and fix spelling using word cards'
      ]
    },
    punctuation: {
      current: 'Uses capital letters and full stops with some consistency',
      nextSteps: [
        'Use capital letters for names and "I"',
        'Use question marks for questions',
        'Use commas in lists (red, blue and green)'
      ]
    }
  },
  {
    yearLevel: 2,
    label: 'Year 2',
    ideas: {
      current: 'Develops ideas with relevant details and some elaboration',
      nextSteps: [
        'Show not tell (describe feelings through actions)',
        'Add sensory details (what they saw, heard, felt)',
        'Include interesting or surprising details'
      ]
    },
    structure: {
      current: 'Writes texts with clear beginning, middle, and end',
      nextSteps: [
        'Create an engaging opening that hooks the reader',
        'Build tension or interest in the middle',
        'Write satisfying endings that connect to the beginning'
      ]
    },
    language: {
      current: 'Uses varied vocabulary including adjectives and adverbs',
      nextSteps: [
        'Choose precise words for effect',
        'Use similes (as fast as lightning)',
        'Include technical vocabulary for the topic'
      ]
    },
    sentences: {
      current: 'Writes compound sentences with connectives',
      nextSteps: [
        'Use complex sentences with "because", "when", "if"',
        'Start sentences in different ways for effect',
        'Use short sentences for impact'
      ]
    },
    spelling: {
      current: 'Spells most common words correctly',
      nextSteps: [
        'Spell Essential List 2 words correctly',
        'Use spelling strategies (look-cover-write-check)',
        'Apply common spelling rules (-tion, doubling consonants)'
      ]
    },
    punctuation: {
      current: 'Uses basic punctuation consistently',
      nextSteps: [
        'Use speech marks for dialogue correctly',
        'Use apostrophes for contractions (don\'t, can\'t)',
        'Use exclamation marks for effect'
      ]
    }
  },
  {
    yearLevel: 3,
    label: 'Year 3',
    ideas: {
      current: 'Develops and elaborates ideas with relevant details',
      nextSteps: [
        'Develop character through actions, dialogue, and thoughts',
        'Create atmosphere through descriptive detail',
        'Use examples and evidence to support main ideas'
      ]
    },
    structure: {
      current: 'Organizes texts with paragraphs or sections',
      nextSteps: [
        'Use topic sentences to introduce paragraphs',
        'Link paragraphs with transition words',
        'Plan and organize ideas before writing'
      ]
    },
    language: {
      current: 'Uses precise vocabulary and some figurative language',
      nextSteps: [
        'Use metaphors for effect',
        'Choose vocabulary to create mood',
        'Use personification and onomatopoeia'
      ]
    },
    sentences: {
      current: 'Uses a variety of sentence structures',
      nextSteps: [
        'Use sentence variety deliberately for effect',
        'Start sentences with adverbs or phrases',
        'Use relative clauses (who, which, that)'
      ]
    },
    spelling: {
      current: 'Spells most words correctly including some complex words',
      nextSteps: [
        'Spell Essential List 3 words correctly',
        'Proofread and edit for spelling errors',
        'Use dictionary and spell-check tools'
      ]
    },
    punctuation: {
      current: 'Uses a range of punctuation correctly',
      nextSteps: [
        'Use commas in complex sentences',
        'Punctuate dialogue with new lines',
        'Use apostrophes for possession (the dog\'s tail)'
      ]
    }
  }
];

export function getCurriculumForYearLevel(yearLevel: number): YearLevelCurriculum | null {
  return NZC_PHASE1_CURRICULUM.find(c => c.yearLevel === yearLevel) || null;
}

export function formatCurriculumForPrompt(yearLevel: number): string {
  const curriculum = getCurriculumForYearLevel(yearLevel);
  if (!curriculum) return '';

  return `
NZC ENGLISH PHASE 1 - ${curriculum.label} EXPECTATIONS:

IDEAS:
- Current expectation: ${curriculum.ideas.current}
- Next steps: ${curriculum.ideas.nextSteps.join('; ')}

STRUCTURE:
- Current expectation: ${curriculum.structure.current}
- Next steps: ${curriculum.structure.nextSteps.join('; ')}

LANGUAGE:
- Current expectation: ${curriculum.language.current}
- Next steps: ${curriculum.language.nextSteps.join('; ')}

SENTENCES:
- Current expectation: ${curriculum.sentences.current}
- Next steps: ${curriculum.sentences.nextSteps.join('; ')}

SPELLING:
- Current expectation: ${curriculum.spelling.current}
- Next steps: ${curriculum.spelling.nextSteps.join('; ')}

PUNCTUATION:
- Current expectation: ${curriculum.punctuation.current}
- Next steps: ${curriculum.punctuation.nextSteps.join('; ')}
  `.trim();
}
