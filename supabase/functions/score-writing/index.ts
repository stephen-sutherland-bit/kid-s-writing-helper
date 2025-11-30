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
    const { text, rubric } = await req.json();
    
    if (!text || !rubric) {
      return new Response(
        JSON.stringify({ error: 'Text and rubric are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build rubric context
    const rubricContext = rubric.categories.map((cat: any) => {
      return `${cat.name}:\n${cat.levels.map((level: string, idx: number) => 
        `  Level ${level}: ${cat.descriptions[idx]}`
      ).join('\n')}`;
    }).join('\n\n');

    console.log('Calling Lovable AI for writing assessment...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert e-asTTle writing assessor. Assess student writing against the provided rubric.

CRITICAL ASSESSMENT RULES:
1. Score each category on a 0-8 scale (mapping to levels 1B through 3A)
2. Consider the ACTUAL STUDENT'S SPELLING AND PUNCTUATION as written (don't ignore errors)
3. Assess STRUCTURE carefully - messy handwriting and poor organization should be reflected in Structure and Organisation scores
4. Consider the student's grade level context
5. Be fair but accurate - don't inflate scores
6. Provide specific evidence-based justifications

RUBRIC:
${rubricContext}

OUTPUT FORMAT (JSON):
{
  "scores": {
    "Ideas": <0-8>,
    "Structure": <0-8>,
    "Organisation": <0-8>,
    "Vocabulary": <0-8>,
    "Sentence Style": <0-8>,
    "Punctuation": <0-8>,
    "Spelling": <0-8>
  },
  "justifications": {
    "Ideas": "<specific evidence from text>",
    "Structure": "<specific evidence>",
    "Organisation": "<specific evidence>",
    "Vocabulary": "<specific evidence>",
    "Sentence Style": "<specific evidence>",
    "Punctuation": "<specific evidence>",
    "Spelling": "<specific evidence>"
  }
}`
          },
          {
            role: 'user',
            content: `Assess this student's writing:\n\n${text}`
          }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please wait a moment and try again.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to score writing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const resultText = data.choices?.[0]?.message?.content || '{}';
    
    let result;
    try {
      result = JSON.parse(resultText);
    } catch (e) {
      console.error('Failed to parse AI response:', resultText);
      return new Response(
        JSON.stringify({ error: 'Failed to parse scoring results' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully scored writing');

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in score-writing function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
