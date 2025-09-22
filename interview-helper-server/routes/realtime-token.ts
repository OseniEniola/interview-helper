// realtimeRouter.ts
import express, { Request, Response } from "express";

const router = express.Router();



router.post("/", async (req: Request, res: Response) => {
  try {
    const { questionText, jobRole, experienceLevel } = req.body;

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not set");

    // Create instructions
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

    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "alloy",
        instructions: instructions,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const data = await response.json();
    return res.json(data);
  } catch (error: any) {
    console.error("Error:", error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
