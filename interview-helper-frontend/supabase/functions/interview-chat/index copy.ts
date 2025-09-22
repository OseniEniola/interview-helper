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

    const { sessionId, questionId, userAnswer, action } = await req.json();

    // Get OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    if (action === 'evaluate_answer') {
      // Get the question details
      const { data: question, error: questionError } = await supabaseClient
        .from('interview_questions')
        .select('*')
        .eq('id', questionId)
        .single();

      if (questionError) throw questionError;

      // Get session context
      const { data: session, error: sessionError } = await supabaseClient
        .from('interview_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      // Create evaluation prompt
      const evaluationPrompt = `Evaluate this interview answer, Evaluate both content and delivery and provide constructive feedback.

Question: ${question.question_text}
Question Type: ${question.question_type}
Job Role: ${session.job_role}
Experience Level: ${session.experience_level}

Candidate's Answer: ${userAnswer}

Evaluation criteria:
1. CONTENT QUALITY (40%): Relevance, depth, technical accuracy, examples
2. VOICE TONE & CONFIDENCE (20%): Professional tone, confidence level, enthusiasm
3. SPEAKING CLARITY (20%): Pace, articulation, filler words, pauses
4. THOUGHT ORGANIZATION (20%): Logical flow, structure, coherence

Ask follow-up questions to dive deeper into their experience. Focus on both what they say and how they say it. Give  feedback on their communication style.

Provide:
1. A score from 1-10
2. Specific feedback on what was good
3. Areas for improvement
4. Suggestions for a better answer

Return as JSON:
{
  "score": 8,
  "feedback": "Your detailed feedback here"
}`;

      // Call OpenAI for evaluation
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { 
              role: 'system', 
              content: 'You are an expert interview evaluator. Provide constructive, specific feedback to help candidates improve. Be encouraging but honest.' 
            },
            { role: 'user', content: evaluationPrompt }
          ],
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const evaluationText = data.choices[0].message.content;
      
      let evaluation;
      try {
        evaluation = JSON.parse(evaluationText);
      } catch (e) {
        // Fallback evaluation
        evaluation = {
          score: 7,
          feedback: "Thank you for your answer. Consider providing more specific examples to strengthen your response."
        };
      }

      // Update the question with answer and feedback
      const { error: updateError } = await supabaseClient
        .from('interview_questions')
        .update({
          user_answer: userAnswer,
          ai_feedback: evaluation.feedback,
          score: evaluation.score
        })
        .eq('id', questionId);

      if (updateError) throw updateError;

      console.log(`Evaluated answer for question ${questionId}, score: ${evaluation.score}`);

      return new Response(
        JSON.stringify({ 
          feedback: evaluation.feedback, 
          score: evaluation.score,
          message: 'Answer evaluated successfully' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'generate_followup') {
      // Generate follow-up question based on user's answer
      const followupPrompt = `Based on the candidate's answer, generate a relevant follow-up question to dive deeper.

Original Answer: ${userAnswer}

Generate a thoughtful follow-up question that:
- Explores more detail
- Tests deeper understanding
- Is conversational and natural

Return just the question text, no JSON.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { 
              role: 'system', 
              content: 'You are an experienced interviewer. Generate natural, insightful follow-up questions.' 
            },
            { role: 'user', content: followupPrompt }
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const followupQuestion = data.choices[0].message.content.trim();

      console.log(`Generated follow-up question for session ${sessionId}`);

      return new Response(
        JSON.stringify({ 
          followup_question: followupQuestion,
          message: 'Follow-up question generated' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action specified');

  } catch (error) {
    console.error('Error in interview chat:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});