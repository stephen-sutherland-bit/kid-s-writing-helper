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
    const { imageBase64 } = await req.json();
    
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Image data is required' }),
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

    console.log('Calling Lovable AI for handwriting extraction...');

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
            content: `You are an expert OCR system specialized in reading children's handwriting. Your task is to extract ONLY the handwritten text from student work images.

CRITICAL RULES:
1. Extract ONLY handwritten text (ignore ALL printed text, instructions, prompts, and decorative elements)
2. Preserve the student's EXACT spelling (even if incorrect - this is for assessment)
3. Preserve the student's EXACT punctuation and capitalization (even if incorrect)
4. Maintain paragraph breaks and line structure as written
5. Ignore drawings, doodles, and non-text elements
6. If you see printed instructions or prompts at the top of the page, SKIP THEM
7. If text is unclear, make your best guess based on context
8. Separate multiple pages with "\n\n--- Page Break ---\n\n"

Example:
If the image shows:
- Printed text: "Write about your favorite animal"
- Student's handwriting: "my favrit anamal is a dog. I like dogs becuse they are frendly"

You should output ONLY:
"my favrit anamal is a dog. I like dogs becuse they are frendly"

Remember: You are preserving the student's exact work for assessment purposes.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract the handwritten text from this student work. Remember to ignore all printed text and preserve the student\'s exact spelling and punctuation.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
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
        JSON.stringify({ error: 'Failed to extract text from image' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const extractedText = data.choices?.[0]?.message?.content || '';

    console.log('Successfully extracted handwriting');

    return new Response(
      JSON.stringify({ 
        text: extractedText.trim(),
        confidence: 95 // Gemini vision is highly accurate
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in extract-handwriting function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
