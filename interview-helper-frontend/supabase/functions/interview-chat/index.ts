import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { sessionId, questionId, userAnswer, followupAnswer, action } = await req.json();

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) throw new Error('OpenAI API key not configured');


    // ----------------------------
    // STEP 1: Generate Follow-up
    // ----------------------------
    if (action === 'generate_followup') {
      const { data: question, error: questionError } = await supabaseClient
        .from('interview_questions')
        .select('*')
        .eq('id', questionId)
        .single();
      if (questionError) throw questionError;

      

      const followupPrompt = `You are a professional interviewer.

Based on the following answer, generate a natural follow-up question to probe deeper.

Answer: ${userAnswer}

NB: The answer passed in this prompt is a link to a supabase audio recording, analyse the recording to get the recorded answer

Return only the follow-up question.`;

      const followupRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are an expert interviewer." },
            { role: "user", content: followupPrompt },
          ],
          temperature: 0.7,
        }),
      });

      if (!followupRes.ok) throw new Error("Failed to generate follow-up question");
      const followupData = await followupRes.json();
      const followupQuestion = followupData.choices[0].message.content.trim();

      // Store follow-up question
      await supabaseClient
        .from('interview_questions')
        .update({ followup_question: followupQuestion })
        .eq('id', questionId);

      return new Response(
        JSON.stringify({
          followup_question: followupQuestion,
          message: "Follow-up question generated"
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ----------------------------
    // STEP 3: Evaluate Final Answer
    // ----------------------------
    if (action === 'evaluate_answer') {
      const { data: question, error: questionError } = await supabaseClient
        .from('interview_questions')
        .select('*')
        .eq('id', questionId)
        .single();
      if (questionError) throw questionError;

      const { data: session, error: sessionError } = await supabaseClient
        .from('interview_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      if (sessionError) throw sessionError;

      const evaluationPrompt = `Evaluate the following interview exchange based on the original and follow-up answers.

Question: ${question.question_text}
Follow-up Question: ${question.followup_question}

Candidate's First Answer: ${userAnswer}
Candidate's Follow-up Answer: ${followupAnswer}

Job Role: ${session.job_role}
Experience Level: ${session.experience_level}

Evaluation criteria:
1. CONTENT QUALITY (40%)
2. VOICE TONE & CONFIDENCE (20%)
3. SPEAKING CLARITY (20%)
4. THOUGHT ORGANIZATION (20%)

Return JSON:
{
  "score": 8,
  "feedback": "Your detailed feedback here"
}`;

      const evalRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are an expert interview evaluator." },
            { role: "user", content: evaluationPrompt },
          ],
          temperature: 0.3,
        }),
      });

      if (!evalRes.ok) throw new Error("Evaluation failed");
      const evalData = await evalRes.json();

      let evaluation;
      try {
        evaluation = JSON.parse(evalData.choices[0].message.content);
      } catch {
        evaluation = {
          score: 6,
          feedback: "Thanks for your answers. Try to include specific examples and communicate more clearly next time.",
        };
      }

      // Save follow-up answer + feedback
      const { error: updateError } = await supabaseClient
        .from('interview_questions')
        .update({
          followup_answer: followupAnswer,
          ai_feedback: evaluation.feedback,
          score: evaluation.score,
        })
        .eq('id', questionId);
      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({
          feedback: evaluation.feedback,
          score: evaluation.score,
          message: "Evaluation complete"
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error("Invalid action specified");
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
