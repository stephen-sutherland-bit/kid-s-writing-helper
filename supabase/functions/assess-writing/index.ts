import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { images, rubric } = await req.json();
    
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
    console.info(`Processing ${images.length} image(s)`);

    // Build comprehensive system prompt with calibrated scoring
    const systemPrompt = `You are an expert teacher's assistant specializing in assessing student writing using the New Zealand e-asTTle writing rubric.

YOUR TASK:
1. Extract ONLY the child's handwritten text from the images (ignore printed text, drawings, instructions)
2. Score the writing against each rubric category (0-8 scale)
3. Generate feedback in four different modes for different audiences

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
  }
}`;

    // Build user prompt with rubric and image content
    const rubricText = formatRubricForPrompt(rubric);
    
    const userContent: any[] = [
      {
        type: "text",
        text: `Here is the e-asTTle writing rubric to use for assessment:\n\n${rubricText}\n\nPlease assess the student's handwriting in the following image(s).`
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
        max_tokens: 2000,
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
