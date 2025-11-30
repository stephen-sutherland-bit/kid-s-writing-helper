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

    // Build comprehensive system prompt with guardrails
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

SCORING GUARDRAILS:
- Use ONLY the rubric categories and descriptors provided
- Score on 0-8 scale where: 0-2 = Below, 3-4 = At, 5-6 = Above, 7-8 = Well Above
- Base scores ONLY on evidence in the text - no assumptions
- Each score MUST have a specific justification citing evidence from the text
- Be consistent: similar quality = similar score across categories
- Consider the student's year level when interpreting expectations
- Do NOT inflate scores - be honest and fair

FEEDBACK GENERATION GUARDRAILS:
- All feedback must be evidence-based (cite specific examples)
- Use encouraging, growth-oriented language
- Start with strengths before areas for improvement
- Be specific and actionable (not vague like "good job")
- Match language complexity to audience:
  * Student: Simple, encouraging, age-appropriate
  * Teacher: Professional, actionable, pedagogically informed
  * Parent: Clear, jargon-free, reassuring
  * Formal: Academic, comprehensive, technically precise

OUTPUT FORMAT:
Return a JSON object with this exact structure:
{
  "extractedText": "the complete handwritten text",
  "scores": {
    "Ideas": 5,
    "Structure": 4,
    "Organisation": 4,
    "Vocabulary": 5,
    "Sentence Style": 4,
    "Punctuation": 3,
    "Spelling": 4
  },
  "justifications": {
    "Ideas": "specific evidence and reasoning for the score",
    "Structure": "specific evidence and reasoning for the score",
    ... (all categories)
  },
  "feedback": {
    "student": "2-3 sentences, encouraging, age-appropriate language",
    "teacher": "Professional summary with actionable next steps for instruction",
    "parent": "Clear, jargon-free summary that helps parents understand progress",
    "formal": "Comprehensive academic report with technical terminology"
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
