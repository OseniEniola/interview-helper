// questionsRouter.ts
import express, { Request, Response } from "express";
import { InterviewQuestion } from "../core/dto/interview.dto";
import multer from "multer";
import { authenticateJWT } from "../middleware/authenticateJWT";
import { PrismaClient } from "@prisma/client";
import pdfParse from "pdf-parse";
import path from "path";
import mammoth from "mammoth";
import fs from "fs";

const prismaClient = new PrismaClient();

const router = express.Router();

/* const upload = multer({ storage: multer.memoryStorage() }); // keeps file in memory
 */

// Route to generate interview questions
router.post("/:sessionId", authenticateJWT, async (req: Request, res: Response) => {
   try {
      const { sessionId } = req.params;

      // Read resume text from uploaded file
      /*   let resumeContent = "No resume provided";
      const file = (req as Request & { file?: Express.Multer.File }).file;
      if (file) {
        const fileBuffer = file.buffer;
        const fileName = file.originalname.toLowerCase();

        if (fileName.endsWith(".pdf")) {
          // Use pdf-parse
          const pdf = await import("pdf-parse");
          const data = await pdf.default(fileBuffer);
          resumeContent = data.text;
        } else if (fileName.endsWith(".docx")) {
          // Use mammoth
          const mammoth = await import("mammoth");
          const result = await mammoth.extractRawText({ buffer: fileBuffer });
          resumeContent = result.value;
        }
      } */

      if (!sessionId) {
         return res.status(400).json({ message: "sessionId is required" });
      }

      // Fetch session details from DB (mocked here)
      const session = await prismaClient.interviewSession.findUnique({
         where: { id: sessionId },
      });

      if (!session) {
         return res.status(404).json({ message: "Interview session not found" });
      }

      const jobRole = session.job_role;
      const experienceLevel = session.experience_level;
      let resumeContent = "";

      if (!session.resumeUrl) {
         resumeContent = "";
      } else if (session.resumeUrl.startsWith("/uploads/")) {
         const filePath = path.join(process.cwd(), session.resumeUrl);
         //const filePath = path.join(__dirname, "..", session.resumeUrl);

         if (filePath.endsWith(".pdf")) {
            const dataBuffer = fs.readFileSync(filePath);
            const pdfData = await pdfParse(dataBuffer);
            resumeContent = pdfData.text;
         } else if (filePath.endsWith(".docx") || filePath.endsWith(".doc")) {
            const { value } = await mammoth.extractRawText({ buffer: fs.readFileSync(filePath) });
            resumeContent = value;
         }
      } else {
         // Pasted text
         resumeContent = session.resumeUrl;
      }
      if (!jobRole || !experienceLevel) {
         return res.status(400).json({ message: "Session missing jobRole or experienceLevel" });
      }

      // Get OpenAI API key
      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey) throw new Error("OpenAI API key not configured");

      console.log(`Generating ${ session.totalQuestions} questions for:`, { jobRole, experienceLevel, resumeContent: resumeContent ? "Provided" : "Not provided", jobDescription: session.jobDescription });
      // Create prompt
const liveCodingPrompt = `
Generate a set of ${session.totalQuestions} live coding DSA questions for a ${jobRole} position with ${experienceLevel} experience level.

Resume context: ${resumeContent || "No resume provided"}

Job Description: ${session.jobDescription || "No description provided"}

Return the output strictly as a JSON array, where each object follows this structure:

[
  {
    "question_text": "Implement a function that reverses a linked list.",
    "question_type": "live_coding",
    "tips": [
      "Sample Input/Output: [1,2,3,4] → [4,3,2,1]",
      "Sample Input/Output: [] → []",
      "Constraints: Must run in O(n) time and O(1) space",
      "Hint: Consider iterative and recursive approaches, and pointer manipulation"
    ],
    "timeLimit": 900,          // in seconds
    "order_index": 1
  }
]

Guidelines for generating questions:
1. Always use 'live_coding' as the question_type.
2. Include at least 2 sample inputs and outputs per question inside the tips array.
3. Include constraints and hints in tips for guidance.
4. Questions should vary in difficulty (easy, medium, hard).
5. Ensure relevance to ${jobRole} and ${experienceLevel} level.
6. Include a mix of problem types: arrays, strings, linked lists, trees, graphs, dynamic programming, etc.
7. Number questions sequentially in order_index, starting at 1.
8. Keep JSON strictly valid, with no extra text outside the array.

Example tips array format:
[
  "Input: [1,2,3,4] → Output: [4,3,2,1]",
  "Input: [] → Output: []",
  "Constraints: O(n) time, O(1) space",
  "Hint: Think about iterative vs recursive pointer manipulation"
]
`;  


const mixedInterviewPrompt = `Generate **exactly ${session.totalQuestions}** interview questions for a ${jobRole} position with ${experienceLevel} experience level.

Distribute them as a mix of technical and behavioral questions (technical should be slightly more than behavioral).

Resume context: ${resumeContent || "No resume provided"}
Job Description: ${session.jobDescription || "No description provided"}


Return a JSON array with this structure:
[
  {
    "question_text": "Your question here",
    "question_type": "technical" or "behavioral",
    "tips": ["Use the STAR method", "Focus on your actions", "Show emotional intelligence"],
    "timeLimit": 120,
    "order_index": 1
  }
]

Make questions relevant to the role and experience level.And ensure each question has at least 2 tips.`;

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
               { role: "user", content: session.isLiveCoding ? liveCodingPrompt : mixedInterviewPrompt },
            ],
            temperature: 0.7,
         }),
      });

      if (!response.ok) throw new Error(`OpenAI API error: ${response.statusText}`);

      const data: any = await response.json();
      const questionsText: string = data.choices[0].message.content;

      // Parse JSON from OpenAI
      let questions: InterviewQuestion[];
      const cleanedText = questionsText
         .replace(/^```json/, "")
         .replace(/^```/, "")
         .replace(/```$/, "")
         .trim();

      try {
         questions = JSON.parse(cleanedText);
      } catch {
         // Fallback if AI doesn't return valid JSON
         questions = [
            { question_text: "Tell me about yourself and your background.", question_type: "behavioral", order_index: 1 },
            { question_text: "What interests you about this role?", question_type: "behavioral", order_index: 2 },
            { question_text: "Describe a challenging project you've worked on.", question_type: "behavioral", order_index: 3 },
            { question_text: "What are your technical strengths?", question_type: "technical", order_index: 4 },
            { question_text: "Where do you see yourself in 5 years?", question_type: "behavioral", order_index: 5 },
         ];
      }

      // Save questions to DB
      for (const q of questions) {
         await prismaClient.interviewQuestion.create({
            data: {
               sessionId: sessionId,
               questionText: q.question_text,
               questionType: q.question_type === "behavioral" ? "BEHAVIORAL" : q.question_type === "technical" ? "TECHNICAL" : undefined,
               timeSpent: q.timeLimit,
               tips: JSON.stringify(q.tips || []),
               createdAt: new Date(),
               updatedAt: new Date(),
            },
         });
      }

      return res.json({ questions, message: "Questions generated successfully" });
   } catch (error: any) {
      console.error("Error generating questions:", error);
      return res.status(500).json({ error: error.message });
   }
});

// Route to get interview questions for a session
router.get("/:sessionId", authenticateJWT, async (req: Request, res: Response) => {
   try {
      const { sessionId } = req.params;

      if (!sessionId) {
         return res.status(400).json({ message: "sessionId is required" });
      }

      const response = await prismaClient.interviewQuestion.findMany({
         where: { sessionId },
      });

      res.json(response);
   } catch (error: any) {
      console.error("Error fetching questions:", error);
      return res.status(500).json({ error: error.message });
   }
});

export default router;
