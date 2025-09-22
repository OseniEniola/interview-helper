import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
   if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
   }

   try {
      const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", { global: { headers: { Authorization: req.headers.get("Authorization")! } } });

      const { sessionId, jobRole, experienceLevel, resumeContent } = await req.json();

      // Get OpenAI API key
      const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
      if (!openaiApiKey) {
         throw new Error("OpenAI API key not configured");
      }

      // Create prompt for question generation
      const prompt = `Generate 5 technical and behavioral interview questions each for a ${jobRole} position with ${experienceLevel} experience level. 

Resume context: ${resumeContent || "No resume provided"}

Return a JSON array with this structure:
[
  {
    "question_text": "Your question here",
    "question_type": "technical" or "behavioral",
    "tips": ["Use the STAR method", "Focus on your actions", "Show emotional intelligence"],
    "timeLimit": 120
    "order_index": 1
  }
]

Make questions relevant to the role and experience level. Mix technical and behavioral questions appropriately.`;

      // Call OpenAI API
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
         method: "POST",
         headers: {
            Authorization: `Bearer ${openaiApiKey}`,
            "Content-Type": "application/json",
         },
         body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
               {
                  role: "system",
                  content: "You are an expert interviewer. Generate professional, relevant interview questions based on job requirements and candidate background. Always return *raw JSON*. Do NOT wrap your response in markdown or code blocks.",
               },
               { role: "user", content: prompt },
            ],
            temperature: 0.7,
         }),
      });

      if (!response.ok) {
         throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      console.log("OpenAI response status:", response);

      const data = await response.json();
      const questionsText = data.choices[0].message.content;

      // Parse the generated questions
      let questions;
      // Remove markdown formatting if present
      const cleanedText = questionsText
         .replace(/^```json/, "")
         .replace(/^```/, "")
         .replace(/```$/, "")
         .trim();

      try {
         questions = JSON.parse(cleanedText);
      } catch (e) {
         console.log("Failed to parse OpenAI response:", e);
         // Fallback if AI doesn't return valid JSON
         questions = [
            {
               question_text: "Tell me about yourself and your background.",
               question_type: "behavioral",
               order_index: 1,
            },
            {
               question_text: "What interests you about this role?",
               question_type: "behavioral",
               order_index: 2,
            },
            {
               question_text: "Describe a challenging project you've worked on.",
               question_type: "behavioral",
               order_index: 3,
            },
            {
               question_text: "What are your technical strengths?",
               question_type: "technical",
               order_index: 4,
            },
            {
               question_text: "Where do you see yourself in 5 years?",
               question_type: "behavioral",
               order_index: 5,
            },
         ];
      }

      console.log("Generated questions:", questions);
      // Insert questions into database
      const questionInserts = questions.map((q: any) => ({
         session_id: sessionId,
         question_text: q.question_text,
         question_type: q.question_type,
         tips: JSON.stringify(q.tips || []),
         time_limit: q.timeLimit || 120,
         order_index: q.order_index,
      }));

      const { error: insertError } = await supabaseClient.from("interview_questions").insert(questionInserts);

      if (insertError) {
         throw insertError;
      }

      console.log(`Generated ${questions.length} questions for session ${sessionId}`);

      return new Response(JSON.stringify({ questions, message: "Questions generated successfully" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
   } catch (error) {
      console.error("Error generating questions:", error);
      return new Response(JSON.stringify({ error: error.message }), {
         status: 500,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
   }
});
