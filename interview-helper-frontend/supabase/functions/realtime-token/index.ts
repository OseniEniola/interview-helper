import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    const { questionText, jobRole, experienceLevel } = await req.json();

    // Create interview-specific instructions
    const instructions = `You are an AI interview evaluator conducting a real-time voice assessment. 

Your role: Evaluate both content and delivery for a ${jobRole} position at ${experienceLevel} level.

Current question: "${questionText}"

Evaluation criteria:
1. CONTENT QUALITY (40%): Relevance, depth, technical accuracy, examples
2. VOICE TONE & CONFIDENCE (20%): Professional tone, confidence level, enthusiasm
3. SPEAKING CLARITY (20%): Pace, articulation, filler words, pauses
4. THOUGHT ORGANIZATION (20%): Logical flow, structure, coherence

Provide real-time feedback and ask follow-up questions to dive deeper into their experience. Focus on both what they say and how they say it. Give specific feedback on their communication style.

Be encouraging but thorough in your evaluation.`;

    // Request an ephemeral token from OpenAI
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "alloy",
        instructions: instructions
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const data = await response.json();
    console.log("Session created:", data);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});