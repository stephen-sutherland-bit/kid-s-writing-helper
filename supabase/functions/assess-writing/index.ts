import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// NZC Curriculum data embedded for the AI prompt (Years 0-8)
const NZC_CURRICULUM: Record<number, string> = {
  // Phase 1: Years 0-3
  0: `
NZC ENGLISH PHASE 1 - YEAR 0 EXPECTATIONS:
IDEAS: Current - Draws pictures and uses some letters/words to record ideas. Next steps: Write a simple sentence about their picture; Add more detail to ideas through talking before writing; Use personal experiences as topics for writing.
STRUCTURE: Current - Creates simple texts (labels, captions, lists). Next steps: Write simple recounts with a beginning; Include 2-3 related ideas in sequence; Use "I" statements to tell about themselves.
LANGUAGE: Current - Uses familiar oral vocabulary in writing. Next steps: Stretch vocabulary beyond everyday words; Use describing words (adjectives) like colors and sizes; Include action words (verbs) in sentences.
SENTENCES: Current - Attempts simple sentences with support. Next steps: Write complete sentences with subject and verb; Start sentences with "I", "The", "My"; Use "and" to join two ideas.
SPELLING: Current - Uses beginning sounds and some sight words. Next steps: Spell high-frequency words correctly (I, a, the, is, to, and); Use initial and final sounds in unknown words; Write CVC words phonetically.
PUNCTUATION: Current - Beginning to understand spaces between words. Next steps: Use finger spaces between words; Start sentences with a capital letter; Put a full stop at the end of a sentence.
`,
  1: `
NZC ENGLISH PHASE 1 - YEAR 1 EXPECTATIONS:
IDEAS: Current - Writes about personal experiences with some detail. Next steps: Add more specific details (who, what, where); Include feelings or reactions in writing; Develop one main idea with supporting details.
STRUCTURE: Current - Creates simple texts with a beginning and end. Next steps: Write texts with a clear beginning, middle, and end; Use time connectives (first, then, next, finally); Keep ideas in logical order.
LANGUAGE: Current - Uses simple describing words and verbs. Next steps: Use more specific nouns (golden retriever vs dog); Add adverbs to describe actions (ran quickly); Include dialogue in stories.
SENTENCES: Current - Writes simple and compound sentences using "and". Next steps: Vary sentence beginnings (not always "I" or "The"); Use "but" and "so" to join sentences; Write sentences of different lengths.
SPELLING: Current - Spells common words correctly, uses phonetic spelling for others. Next steps: Spell Essential List 1 words correctly; Use common spelling patterns (-ing, -ed, -er); Check and fix spelling using word cards.
PUNCTUATION: Current - Uses capital letters and full stops with some consistency. Next steps: Use capital letters for names and "I"; Use question marks for questions; Use commas in lists.
`,
  2: `
NZC ENGLISH PHASE 1 - YEAR 2 EXPECTATIONS:
IDEAS: Current - Develops ideas with relevant details and some elaboration. Next steps: Show not tell (describe feelings through actions); Add sensory details (what they saw, heard, felt); Include interesting or surprising details.
STRUCTURE: Current - Writes texts with clear beginning, middle, and end. Next steps: Create an engaging opening that hooks the reader; Build tension or interest in the middle; Write satisfying endings that connect to the beginning.
LANGUAGE: Current - Uses varied vocabulary including adjectives and adverbs. Next steps: Choose precise words for effect; Use similes (as fast as lightning); Include technical vocabulary for the topic.
SENTENCES: Current - Writes compound sentences with connectives. Next steps: Use complex sentences with "because", "when", "if"; Start sentences in different ways for effect; Use short sentences for impact.
SPELLING: Current - Spells most common words correctly. Next steps: Spell Essential List 2 words correctly; Use spelling strategies (look-cover-write-check); Apply common spelling rules.
PUNCTUATION: Current - Uses basic punctuation consistently. Next steps: Use speech marks for dialogue correctly; Use apostrophes for contractions (don't, can't); Use exclamation marks for effect.
`,
  3: `
NZC ENGLISH PHASE 1 - YEAR 3 EXPECTATIONS:
IDEAS: Current - Develops and elaborates ideas with relevant details. Next steps: Develop character through actions, dialogue, and thoughts; Create atmosphere through descriptive detail; Use examples and evidence to support main ideas.
STRUCTURE: Current - Organizes texts with paragraphs or sections. Next steps: Use topic sentences to introduce paragraphs; Link paragraphs with transition words; Plan and organize ideas before writing.
LANGUAGE: Current - Uses precise vocabulary and some figurative language. Next steps: Use metaphors for effect; Choose vocabulary to create mood; Use personification and onomatopoeia.
SENTENCES: Current - Uses a variety of sentence structures. Next steps: Use sentence variety deliberately for effect; Start sentences with adverbs or phrases; Use relative clauses (who, which, that).
SPELLING: Current - Spells most words correctly including some complex words. Next steps: Spell Essential List 3 words correctly; Proofread and edit for spelling errors; Use dictionary and spell-check tools.
PUNCTUATION: Current - Uses a range of punctuation correctly. Next steps: Use commas in complex sentences; Punctuate dialogue with new lines; Use apostrophes for possession.
`,
  // Phase 2: Years 4-6
  4: `
NZC ENGLISH PHASE 2 - YEAR 4 EXPECTATIONS:
IDEAS: Current - Develops ideas with supporting detail and some elaboration across the text. Next steps: Develop ideas with increasing depth and insight; Use specific examples and evidence to support arguments; Create well-developed characters with motivations.
STRUCTURE: Current - Organizes ideas into paragraphs with clear topic sentences. Next steps: Use a range of text structures for different purposes; Create effective introductions that set context; Write conclusions that summarize or reflect.
LANGUAGE: Current - Uses a range of vocabulary including subject-specific words. Next steps: Use vocabulary deliberately to influence the reader; Include technical and academic vocabulary; Use figurative language with intention.
SENTENCES: Current - Writes complex sentences with subordinate clauses. Next steps: Vary sentence structure for rhythm and emphasis; Use passive voice when appropriate; Control sentence length for effect.
SPELLING: Current - Spells most words correctly including subject-specific vocabulary. Next steps: Spell Essential List 4 words correctly; Apply spelling rules for prefixes and suffixes; Use etymology to help with spelling.
PUNCTUATION: Current - Uses a range of punctuation including speech marks and apostrophes. Next steps: Use colons to introduce lists or explanations; Use semicolons to join related ideas; Use dashes and brackets for parenthesis.
`,
  5: `
NZC ENGLISH PHASE 2 - YEAR 5 EXPECTATIONS:
IDEAS: Current - Develops and sustains ideas with depth and insight. Next steps: Integrate multiple perspectives or viewpoints; Use abstract ideas alongside concrete examples; Develop themes consistently across the text.
STRUCTURE: Current - Controls structure across a range of text types. Next steps: Manipulate structure for deliberate effect; Use flashback, flash-forward, or non-linear structures; Balance narrative and descriptive elements.
LANGUAGE: Current - Selects vocabulary for precision and effect. Next steps: Use connotation and nuance in word choice; Develop a personal voice and style; Adapt register for different audiences.
SENTENCES: Current - Controls a variety of sentence structures. Next steps: Use rhetorical devices (repetition, tripling); Vary syntax for emphasis and rhythm; Use fragments and minor sentences intentionally.
SPELLING: Current - Spells accurately including complex and technical words. Next steps: Spell Essential List 5 words correctly; Use morphology to spell unfamiliar words; Proofread systematically for errors.
PUNCTUATION: Current - Uses punctuation accurately for clarity and effect. Next steps: Use punctuation to control pace and emphasis; Use ellipsis for effect; Punctuate complex dialogue exchanges.
`,
  6: `
NZC ENGLISH PHASE 2 - YEAR 6 EXPECTATIONS:
IDEAS: Current - Develops sophisticated ideas with complexity and nuance. Next steps: Explore ambiguity and multiple interpretations; Use symbolism and extended metaphor; Develop original and creative perspectives.
STRUCTURE: Current - Uses structure confidently across text types. Next steps: Subvert or experiment with genre conventions; Control pacing and tension effectively; Use structural devices for thematic effect.
LANGUAGE: Current - Uses sophisticated vocabulary with precision. Next steps: Develop distinctive authorial voice; Use language to challenge or provoke; Master formal and informal registers.
SENTENCES: Current - Uses sophisticated sentence structures with control. Next steps: Use syntax to mirror meaning; Master complex multi-clause sentences; Use sentence patterns for stylistic effect.
SPELLING: Current - Spells accurately across all word types. Next steps: Spell Essential List 6 words correctly; Maintain accuracy under pressure; Use a range of strategies independently.
PUNCTUATION: Current - Uses the full range of punctuation confidently. Next steps: Use punctuation for subtle effects; Master all apostrophe uses; Punctuate for voice and rhythm.
`,
  // Phase 3: Years 7-8
  7: `
NZC ENGLISH PHASE 3 - YEAR 7 EXPECTATIONS:
IDEAS: Current - Develops complex ideas with insight and originality. Next steps: Synthesize ideas from multiple sources; Develop sustained and cohesive arguments; Explore sophisticated themes with maturity.
STRUCTURE: Current - Controls structure with sophistication across genres. Next steps: Integrate multiple text types within a single piece; Use structure to convey meaning and theme; Master transitions between sections and ideas.
LANGUAGE: Current - Uses language with sophistication and flair. Next steps: Develop a mature and distinctive voice; Use language to create layers of meaning; Adapt style for different purposes and contexts.
SENTENCES: Current - Uses varied and sophisticated syntax. Next steps: Use syntax to create rhythm and flow; Master embedding and layering of clauses; Use grammatical choices for stylistic effect.
SPELLING: Current - Spells accurately including specialized vocabulary. Next steps: Spell Essential List 7 words correctly; Master subject-specific terminology; Edit for accuracy in final drafts.
PUNCTUATION: Current - Uses punctuation with sophistication. Next steps: Use punctuation to enhance meaning and voice; Master all advanced punctuation conventions; Use punctuation creatively within conventions.
`,
  8: `
NZC ENGLISH PHASE 3 - YEAR 8 EXPECTATIONS:
IDEAS: Current - Develops ideas with maturity, depth, and intellectual rigour. Next steps: Engage critically with complex concepts; Develop original and thought-provoking perspectives; Sustain sophisticated ideas across extended texts.
STRUCTURE: Current - Masters structure across all text types. Next steps: Experiment with innovative structural approaches; Use structure to enhance thematic complexity; Control extended and multi-part texts.
LANGUAGE: Current - Uses language with precision, power, and originality. Next steps: Develop a compelling and authentic voice; Use language to challenge and engage readers; Master the nuances of formal academic writing.
SENTENCES: Current - Masters sentence variety and control. Next steps: Use syntax with conscious artistry; Control complex grammatical structures; Adapt sentence style for genre and purpose.
SPELLING: Current - Spells accurately across all contexts. Next steps: Spell Essential List 8 words correctly; Maintain accuracy in extended writing; Use spelling knowledge to learn new words.
PUNCTUATION: Current - Masters all punctuation conventions. Next steps: Use punctuation as a tool for expression; Maintain consistency and accuracy throughout; Apply conventions to new and complex situations.
`
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { images, rubric, yearLevel } = await req.json();
    
    if (!images || images.length === 0) {
      throw new Error('No images provided');
    }
    
    if (!rubric) {
      throw new Error('No rubric provided');
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    console.info('Starting unified assessment with OpenAI GPT-4o...');
    console.info(`Processing ${images.length} image(s), yearLevel: ${yearLevel ?? 'not specified'}`);

    // Build curriculum context if year level is provided
    const curriculumContext = yearLevel !== undefined && NZC_CURRICULUM[yearLevel] 
      ? `\n\nCURRICULUM CONTEXT FOR NEXT STEPS:\n${NZC_CURRICULUM[yearLevel]}\n\nBased on the above curriculum expectations for Year ${yearLevel}, you must also generate curriculum-aligned next steps.`
      : '';

    const nextStepsInstructions = yearLevel !== undefined 
      ? `\n\nNEXT STEPS GENERATION (REQUIRED when yearLevel is provided):
Generate two types of curriculum-aligned next steps:

1. teacherNextSteps: An array of 3-5 specific, actionable teaching points for lesson planning. Each should:
   - Be directly linked to the NZC curriculum progression for Year ${yearLevel}
   - Focus on the most impactful areas for improvement based on the student's current performance
   - Be specific enough for lesson planning (not vague like "improve writing")
   - Reference specific skills from the curriculum (e.g., "Focus on teaching compound sentences with 'and', 'but', 'so'")

2. studentBookFeedback: A single, simple statement for the student's writing book that:
   - Uses child-friendly language appropriate for Year ${yearLevel}
   - Follows the pattern: "Great job [specific praise]! Now you need to [one clear next step]."
   - Is encouraging but specific
   - Can be copied directly into a writing book

Example output:
"nextSteps": {
  "teacherNextSteps": [
    "Focus on teaching compound sentences using 'and', 'but', 'so'",
    "Introduce time connectives for sequencing (first, then, next, finally)",
    "Practice adding sensory details - what did they see, hear, feel?"
  ],
  "studentBookFeedback": "Great job telling us about your weekend! You used good describing words. Now you need to add what happened at the end of your story."
}`
      : '';

    // Build comprehensive system prompt with calibrated scoring
    const systemPrompt = `You are an expert teacher's assistant specializing in assessing student writing using the New Zealand e-asTTle writing rubric.

YOUR TASK:
1. Extract ONLY the child's handwritten text from the images (ignore printed text, drawings, instructions)
2. Score the writing against each rubric category (0-8 scale)
3. Generate feedback in THREE depth levels for THREE audiences (creating a 3x3 feedback grid)${yearLevel !== undefined ? '\n4. Generate curriculum-aligned next steps for teaching and student writing book' : ''}

CRITICAL GUARDRAILS FOR TEXT EXTRACTION:
- ONLY extract the student's handwritten text
- IGNORE all printed text, typed instructions, teacher notes, and worksheet content
- IGNORE drawings, diagrams, and non-text content
- Preserve the original spelling and punctuation exactly as written
- If text spans multiple pages, combine it in reading order
- If a word is unclear, make your best interpretation but stay conservative
- If no handwritten text is found, return an error

CRITICAL: CONSERVATIVE SCORING MANDATE
You MUST be CONSERVATIVE with scoring. This is not negotiable.
- When uncertain between two scores, ALWAYS choose the LOWER score
- Most children's writing samples will legitimately score between 0-3 (1B to 2B levels)
- A score of 4+ requires EXCEPTIONAL evidence of skill significantly above year-level expectations
- DO NOT be generous or encouraging with scores - be HONEST and ACCURATE
- The rubric is a diagnostic tool, not a reward system

EXPLICIT LEVEL ANCHORS (0-8 Scale):

Score 0 - Level 1B (Beginning):
- Single words, short phrases, or random letters
- No sentence structure or organization
- Heavy inventive spelling throughout
- No punctuation or capitalization

Score 1 - Level 1P (Progressing):
- 1-3 very simple sentences (e.g., "I like cats. Cats are soft.")
- Basic "I like..." or "I see..." patterns
- Mostly sight words, some inventive spelling
- Minimal or inconsistent punctuation

Score 2 - Level 1A (Achieved):
- Several related sentences forming a basic text
- Simple connectives like "and" or "then"
- Capital letters starting most sentences
- Basic full stops, mostly correct sight word spelling

Score 3 - Level 2B (Beginning):
- Attempts at beginning/middle/end structure
- Some descriptive language beyond basic nouns
- More varied sentence starts beyond "I" or "The"
- Consistent punctuation, improving spelling

Score 4 - Level 2P (Progressing):
- Clear sequence with developed events
- Uses commas in lists correctly
- Vocabulary shows variety and precision
- Complex sentence attempts (because, when, if)

Score 5 - Level 2A (Achieved):
- Paragraphing attempts or clear sections
- Uses dialogue with speech marks
- Consistent complex sentences
- Strong vocabulary for age level

Score 6 - Level 3B (Beginning):
- Multiple well-structured paragraphs
- Varied sentence structures for effect
- Clear authorial voice and style
- Sophisticated punctuation (semicolons, dashes)

Score 7 - Level 3P (Progressing):
- Publication-quality structure and organization
- Advanced vocabulary with precise word choice
- Complex punctuation used correctly
- Engaging, polished writing

Score 8 - Level 3A (Achieved):
- Exceptional quality, well beyond year level
- Near-perfect technical accuracy
- Sophisticated literary devices
- Professional-level writing

RED FLAGS - DO NOT AWARD HIGHER SCORES FOR:
- Quantity of text (length ≠ quality)
- Effort, enthusiasm, or "trying hard"
- Creative or imaginative content (unless technical execution matches)
- Legible handwriting (we score WRITING SKILL, not penmanship)
- A 5-sentence story with errors is still 1B-1P level, regardless of content

CATEGORY-SPECIFIC ANCHORS:

IDEAS (Most Year 1-2 students score 0-2):
- Score 0: Random ideas, no clear topic, disconnected thoughts
- Score 1: One simple idea with minimal development (e.g., "I like my cat")
- Score 2: Related ideas with basic detail (e.g., "I like my cat. She is orange. She sleeps on my bed.")
- Score 3+: Requires developed ideas with elaboration, details, and depth

STRUCTURE (Most Year 1-2 students score 0-2):
- Score 0: No discernible structure, random sentences
- Score 1: List-like or very basic sequence
- Score 2: Simple beginning-middle-end attempt
- Score 3+: Requires clear multi-part structure with transitions

ORGANISATION (Most Year 1-2 students score 0-2):
- Score 0: No logical order, ideas jumbled
- Score 1: Basic chronological order (first, then, next)
- Score 2: Consistent sequence with simple connectives
- Score 3+: Requires paragraphing, topic sentences, coherent flow

VOCABULARY (Most Year 1-2 students score 0-2):
- Score 0: Very limited words, mostly nouns ("cat", "house")
- Score 1: Basic high-frequency words, simple descriptors (big, nice, good)
- Score 2: Some specific nouns and adjectives beyond basics
- Score 3+: Requires varied, precise vocabulary showing word choice

SENTENCE STYLE (Most Year 1-2 students score 0-2):
- Score 0: Not complete sentences, fragments
- Score 1: Very simple sentences (I like X. X is Y.)
- Score 2: Some variety in sentence starts and lengths
- Score 3+: Requires deliberate sentence variety for effect

PUNCTUATION (Most Year 1-2 students score 0-2):
- Score 0: No punctuation or random marks
- Score 1: Some full stops, inconsistent capitals
- Score 2: Full stops and capitals mostly correct, attempts commas
- Score 3+: Requires consistent punctuation including commas, speech marks

SPELLING (Most Year 1-2 students score 0-2):
- Score 0: Heavy inventive spelling, even sight words incorrect
- Score 1: Sight words mostly correct, logical phonetic attempts
- Score 2: Common words correct, reasonable phonetic spelling for complex words
- Score 3+: Requires mostly correct spelling including complex words

SCORING PROCESS:
1. Extract the handwritten text exactly as written
2. For EACH category, identify specific evidence in the text
3. Match that evidence to the level anchors above
4. When in doubt between scores, choose the LOWER score
5. Write justification citing specific examples from the text
6. Be HONEST - most early-years writing will score 0-3

FEEDBACK GENERATION GUARDRAILS:
- All feedback must be evidence-based (cite specific examples)
- Use encouraging, growth-oriented language in all modes
- Start with genuine strengths before areas for improvement
- Be specific and actionable (not vague like "good job")
- Generate feedback at THREE depth levels for each audience:
  * simple: 1-2 sentences, quick takeaway
  * standard: One paragraph with key points
  * comprehensive: Detailed multi-paragraph analysis with specific examples

AUDIENCE GUIDELINES:
- student: Simple, encouraging, age-appropriate language for young learners
- teacher: Professional, actionable, pedagogically informed with teaching recommendations
- parent: Clear, jargon-free, reassuring with practical home support suggestions
${curriculumContext}${nextStepsInstructions}

OUTPUT FORMAT:
Return a JSON object with this exact structure:
{
  "extractedText": "the complete handwritten text exactly as written",
  "scores": {
    "Ideas": 1,
    "Structure": 1,
    "Organisation": 2,
    "Vocabulary": 1,
    "Sentence Style": 1,
    "Punctuation": 2,
    "Spelling": 2
  },
  "justifications": {
    "Ideas": "specific evidence citing text and explaining why this score",
    "Structure": "specific evidence citing text and explaining why this score",
    ... (all categories)
  },
  "feedback": {
    "student": {
      "simple": "One encouraging sentence for the child",
      "standard": "A paragraph with what they did well and one growth area",
      "comprehensive": "Detailed feedback with specific examples and celebration of progress"
    },
    "teacher": {
      "simple": "Quick summary of overall performance",
      "standard": "Key strengths, priority teaching points, suggested next steps",
      "comprehensive": "Full professional analysis with detailed teaching recommendations and curriculum links"
    },
    "parent": {
      "simple": "Brief positive update about their child's writing",
      "standard": "Clear explanation of progress with one way to support at home",
      "comprehensive": "Detailed progress report with multiple home support strategies and context"
    }
  }${yearLevel !== undefined ? `,
  "nextSteps": {
    "teacherNextSteps": ["Teaching point 1", "Teaching point 2", "Teaching point 3"],
    "studentBookFeedback": "Great job [praise]! Now you need to [next step]."
  }` : ''}
}`;

    // Build user prompt with rubric and image content
    const rubricText = formatRubricForPrompt(rubric);
    
    const userContent: any[] = [
      {
        type: "text",
        text: `Here is the e-asTTle writing rubric to use for assessment:\n\n${rubricText}\n\n${yearLevel !== undefined ? `Student is in Year ${yearLevel}. Please include curriculum-aligned next steps in your response.\n\n` : ''}Please assess the student's handwriting in the following image(s).`
      }
    ];

    // Add all images to the prompt
    for (let i = 0; i < images.length; i++) {
      userContent.push({
        type: "image_url",
        image_url: {
          url: images[i], // base64 data URL
          detail: "high"
        }
      });
    }

    console.info('Calling OpenAI GPT-4o with vision...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        max_tokens: 3000,
        temperature: 0.3, // Lower temperature for more consistent scoring
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', response.status, errorData);
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      }
      
      if (response.status === 402 || response.status === 401) {
        throw new Error('Invalid or expired API key. Please check your OpenAI API key.');
      }
      
      throw new Error(errorData.error?.message || 'Failed to assess writing');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.info('Successfully received assessment from OpenAI');
    
    // Parse the JSON response
    let result;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content);
      throw new Error('Invalid response format from AI');
    }

    // Validate the response structure
    if (!result.extractedText || !result.scores || !result.justifications || !result.feedback) {
      console.error('Invalid response structure:', result);
      throw new Error('Incomplete assessment from AI');
    }

    console.info('Assessment completed successfully');
    if (result.nextSteps) {
      console.info('Next steps generated:', JSON.stringify(result.nextSteps));
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in assess-writing function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function formatRubricForPrompt(rubric: any): string {
  let formatted = `Rubric Name: ${rubric.name}\n`;
  formatted += `Last Updated: ${new Date(rubric.lastUpdated).toLocaleDateString()}\n\n`;
  
  rubric.categories.forEach((category: any) => {
    formatted += `\n=== ${category.name} ===\n`;
    formatted += `Description: ${category.description}\n`;
    formatted += `Levels:\n`;
    
    category.levels.forEach((level: any) => {
      formatted += `  Level ${level.score}: ${level.description}\n`;
    });
  });
  
  return formatted;
}
