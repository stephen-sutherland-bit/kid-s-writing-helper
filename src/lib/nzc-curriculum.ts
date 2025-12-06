// NZC English Curriculum Progression (Years 0-8)
// Phase 1: Years 0-3, Phase 2: Years 4-6, Phase 3: Years 7-8

export interface CurriculumExpectation {
  current: string;
  nextSteps: string[];
}

export interface YearLevelCurriculum {
  yearLevel: number;
  label: string;
  phase: number;
  ideas: CurriculumExpectation;
  structure: CurriculumExpectation;
  language: CurriculumExpectation;
  sentences: CurriculumExpectation;
  spelling: CurriculumExpectation;
  punctuation: CurriculumExpectation;
}

export const NZC_CURRICULUM: YearLevelCurriculum[] = [
  // ============ PHASE 1: Years 0-3 ============
  {
    yearLevel: 0,
    label: 'Year 0',
    phase: 1,
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
    phase: 1,
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
    phase: 1,
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
    phase: 1,
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
  },

  // ============ PHASE 2: Years 4-6 ============
  {
    yearLevel: 4,
    label: 'Year 4',
    phase: 2,
    ideas: {
      current: 'Develops ideas with supporting detail and some elaboration across the text',
      nextSteps: [
        'Develop ideas with increasing depth and insight',
        'Use specific examples and evidence to support arguments',
        'Create well-developed characters with motivations'
      ]
    },
    structure: {
      current: 'Organizes ideas into paragraphs with clear topic sentences',
      nextSteps: [
        'Use a range of text structures for different purposes',
        'Create effective introductions that set context',
        'Write conclusions that summarize or reflect'
      ]
    },
    language: {
      current: 'Uses a range of vocabulary including subject-specific words',
      nextSteps: [
        'Use vocabulary deliberately to influence the reader',
        'Include technical and academic vocabulary',
        'Use figurative language with intention'
      ]
    },
    sentences: {
      current: 'Writes complex sentences with subordinate clauses',
      nextSteps: [
        'Vary sentence structure for rhythm and emphasis',
        'Use passive voice when appropriate',
        'Control sentence length for effect'
      ]
    },
    spelling: {
      current: 'Spells most words correctly including subject-specific vocabulary',
      nextSteps: [
        'Spell Essential List 4 words correctly',
        'Apply spelling rules for prefixes and suffixes',
        'Use etymology to help with spelling'
      ]
    },
    punctuation: {
      current: 'Uses a range of punctuation including speech marks and apostrophes',
      nextSteps: [
        'Use colons to introduce lists or explanations',
        'Use semicolons to join related ideas',
        'Use dashes and brackets for parenthesis'
      ]
    }
  },
  {
    yearLevel: 5,
    label: 'Year 5',
    phase: 2,
    ideas: {
      current: 'Develops and sustains ideas with depth and insight',
      nextSteps: [
        'Integrate multiple perspectives or viewpoints',
        'Use abstract ideas alongside concrete examples',
        'Develop themes consistently across the text'
      ]
    },
    structure: {
      current: 'Controls structure across a range of text types',
      nextSteps: [
        'Manipulate structure for deliberate effect',
        'Use flashback, flash-forward, or non-linear structures',
        'Balance narrative and descriptive elements'
      ]
    },
    language: {
      current: 'Selects vocabulary for precision and effect',
      nextSteps: [
        'Use connotation and nuance in word choice',
        'Develop a personal voice and style',
        'Adapt register for different audiences'
      ]
    },
    sentences: {
      current: 'Controls a variety of sentence structures',
      nextSteps: [
        'Use rhetorical devices (repetition, tripling)',
        'Vary syntax for emphasis and rhythm',
        'Use fragments and minor sentences intentionally'
      ]
    },
    spelling: {
      current: 'Spells accurately including complex and technical words',
      nextSteps: [
        'Spell Essential List 5 words correctly',
        'Use morphology to spell unfamiliar words',
        'Proofread systematically for errors'
      ]
    },
    punctuation: {
      current: 'Uses punctuation accurately for clarity and effect',
      nextSteps: [
        'Use punctuation to control pace and emphasis',
        'Use ellipsis for effect',
        'Punctuate complex dialogue exchanges'
      ]
    }
  },
  {
    yearLevel: 6,
    label: 'Year 6',
    phase: 2,
    ideas: {
      current: 'Develops sophisticated ideas with complexity and nuance',
      nextSteps: [
        'Explore ambiguity and multiple interpretations',
        'Use symbolism and extended metaphor',
        'Develop original and creative perspectives'
      ]
    },
    structure: {
      current: 'Uses structure confidently across text types',
      nextSteps: [
        'Subvert or experiment with genre conventions',
        'Control pacing and tension effectively',
        'Use structural devices for thematic effect'
      ]
    },
    language: {
      current: 'Uses sophisticated vocabulary with precision',
      nextSteps: [
        'Develop distinctive authorial voice',
        'Use language to challenge or provoke',
        'Master formal and informal registers'
      ]
    },
    sentences: {
      current: 'Uses sophisticated sentence structures with control',
      nextSteps: [
        'Use syntax to mirror meaning',
        'Master complex multi-clause sentences',
        'Use sentence patterns for stylistic effect'
      ]
    },
    spelling: {
      current: 'Spells accurately across all word types',
      nextSteps: [
        'Spell Essential List 6 words correctly',
        'Maintain accuracy under pressure',
        'Use a range of strategies independently'
      ]
    },
    punctuation: {
      current: 'Uses the full range of punctuation confidently',
      nextSteps: [
        'Use punctuation for subtle effects',
        'Master all apostrophe uses',
        'Punctuate for voice and rhythm'
      ]
    }
  },

  // ============ PHASE 3: Years 7-8 ============
  {
    yearLevel: 7,
    label: 'Year 7',
    phase: 3,
    ideas: {
      current: 'Develops complex ideas with insight and originality',
      nextSteps: [
        'Synthesize ideas from multiple sources',
        'Develop sustained and cohesive arguments',
        'Explore sophisticated themes with maturity'
      ]
    },
    structure: {
      current: 'Controls structure with sophistication across genres',
      nextSteps: [
        'Integrate multiple text types within a single piece',
        'Use structure to convey meaning and theme',
        'Master transitions between sections and ideas'
      ]
    },
    language: {
      current: 'Uses language with sophistication and flair',
      nextSteps: [
        'Develop a mature and distinctive voice',
        'Use language to create layers of meaning',
        'Adapt style for different purposes and contexts'
      ]
    },
    sentences: {
      current: 'Uses varied and sophisticated syntax',
      nextSteps: [
        'Use syntax to create rhythm and flow',
        'Master embedding and layering of clauses',
        'Use grammatical choices for stylistic effect'
      ]
    },
    spelling: {
      current: 'Spells accurately including specialized vocabulary',
      nextSteps: [
        'Spell Essential List 7 words correctly',
        'Master subject-specific terminology',
        'Edit for accuracy in final drafts'
      ]
    },
    punctuation: {
      current: 'Uses punctuation with sophistication',
      nextSteps: [
        'Use punctuation to enhance meaning and voice',
        'Master all advanced punctuation conventions',
        'Use punctuation creatively within conventions'
      ]
    }
  },
  {
    yearLevel: 8,
    label: 'Year 8',
    phase: 3,
    ideas: {
      current: 'Develops ideas with maturity, depth, and intellectual rigour',
      nextSteps: [
        'Engage critically with complex concepts',
        'Develop original and thought-provoking perspectives',
        'Sustain sophisticated ideas across extended texts'
      ]
    },
    structure: {
      current: 'Masters structure across all text types',
      nextSteps: [
        'Experiment with innovative structural approaches',
        'Use structure to enhance thematic complexity',
        'Control extended and multi-part texts'
      ]
    },
    language: {
      current: 'Uses language with precision, power, and originality',
      nextSteps: [
        'Develop a compelling and authentic voice',
        'Use language to challenge and engage readers',
        'Master the nuances of formal academic writing'
      ]
    },
    sentences: {
      current: 'Masters sentence variety and control',
      nextSteps: [
        'Use syntax with conscious artistry',
        'Control complex grammatical structures',
        'Adapt sentence style for genre and purpose'
      ]
    },
    spelling: {
      current: 'Spells accurately across all contexts',
      nextSteps: [
        'Spell Essential List 8 words correctly',
        'Maintain accuracy in extended writing',
        'Use spelling knowledge to learn new words'
      ]
    },
    punctuation: {
      current: 'Masters all punctuation conventions',
      nextSteps: [
        'Use punctuation as a tool for expression',
        'Maintain consistency and accuracy throughout',
        'Apply conventions to new and complex situations'
      ]
    }
  }
];

export function getCurriculumForYearLevel(yearLevel: number): YearLevelCurriculum | null {
  return NZC_CURRICULUM.find(c => c.yearLevel === yearLevel) || null;
}

export function formatCurriculumForPrompt(yearLevel: number): string {
  const curriculum = getCurriculumForYearLevel(yearLevel);
  if (!curriculum) return '';

  return `
NZC ENGLISH PHASE ${curriculum.phase} - ${curriculum.label} EXPECTATIONS:

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
