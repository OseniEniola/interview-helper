// interviewRouter.ts
import express, { Request, Response } from "express";
import { EvaluationResult, InterviewRequest } from "../core/dto/interview.dto";
import { authenticateJWT } from "../middleware/authenticateJWT";
import { PrismaClient } from "@prisma/client";
import { createUploadMiddleware, dynamicResumeUpload } from "../utilities/filestorage";
import fs, { readFileSync } from "fs";
import path from "path";
import { transcribeAudioToText } from "./voice-to-text";

const prismaClient = new PrismaClient();
const router = express.Router();

/**
 * @openapi
 * /generate-followup:
 *   post:
 *     summary: Generate a follow-up question
 *     description: Generates a natural follow-up interview question based on the candidate's initial recorded answer.
 *     tags:
 *       - Interview
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               session_id:
 *                 type: string
 *                 description: Interview session identifier
 *               questionId:
 *                 type: string
 *                 description: The question ID
 *     responses:
 *       200:
 *         description: Follow-up question generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 followup_question:
 *                   type: string
 *                   description: The generated follow-up question
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
// Route
router.post("/generate-followup", async (req: Request, res: Response) => {
   try {
      const { session_id, question_id } = req.body;

      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey) throw new Error("OpenAI API key not configured");

      // ----------------------------
      // STEP 1: Generate Follow-up
      // ----------------------------

      const interviewQuestion = await prismaClient.interviewQuestion.findFirst({
         where: {
            sessionId: session_id,
            id: question_id,
         },
      });

      let userAnswer;
      if (interviewQuestion?.userAnswer) {
         const filePath = path.join(__dirname, "..", interviewQuestion.userAnswer);
         userAnswer = await transcribeAudioToText(filePath);
      }

      console.log(userAnswer)
      if (!userAnswer) throw Error("User answer is required");
      const followupPrompt = `You are a professional interviewer.
Based on the following audio recorded answer to the question "${interviewQuestion?.questionText}", generate a natural follow-up question to probe deeper.
Answer: ${userAnswer}
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

      const followupData: any = await followupRes.json();
      //console.log("Follow data", JSON.stringify(followupData));
      const followupQuestion = followupData.choices[0].message.content.trim();

      if (interviewQuestion?.id) {
         await prismaClient.interviewQuestion.update({
            where: { id: interviewQuestion.id },
            data: {
               followup_question: followupQuestion,
            },
         });
      }
      return res.json({ followup_question: followupQuestion, message: "Follow-up question generated" });
   } catch (error: any) {
      console.error("Error:", error);
      return res.status(500).json({ error: error.message });
   }
});

/**
 * @openapi
 * /evaluate-answer:
 *   post:
 *     summary: Evaluate interview answers
 *     description: Evaluates the candidate's initial and follow-up recorded answers against defined interview criteria.
 *     tags:
 *       - Interview
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               session_id:
 *                 type: string
 *                 description: Interview session identifier
 *               question_id:
 *                 type: string
 *                 description: The question ID
 *     responses:
 *       200:
 *         description: Evaluation completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 feedback:
 *                   type: string
 *                   description: Feedback on the candidate's answers
 *                 score:
 *                   type: number
 *                   description: Numeric evaluation score
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post("/evaluate-answer", authenticateJWT, async (req, res) => {
   const { question_id, session_id } = req.body;

   // ----------------------------
   // STEP 2: Evaluate Answer
   // ----------------------------

   const interviewQuestion = await prismaClient.interviewQuestion.findFirst({
      where: {
         id: question_id,
         sessionId: session_id,
      },
      include: {
         session: true,
      },
   });

   let userAnswer;
   if (interviewQuestion?.userAnswer) {
      const filePath = path.join(__dirname, "..", interviewQuestion?.userAnswer);
      //let audio = fs.readFileSync(filePath);
      userAnswer = await transcribeAudioToText(filePath);
   }

   if (!userAnswer) throw Error("User answer is required");

   let followupAnswer;
   if (interviewQuestion?.followup_answer) {
      const filePath = path.join(__dirname, "..", interviewQuestion?.followup_answer);
      // followupAnswer = fs.readFileSync(filePath);
      //let audio = fs.readFileSync(filePath);
      followupAnswer = await transcribeAudioToText(filePath);
   }

   if (!userAnswer) throw Error("User answer is required");
   const questionText = interviewQuestion?.questionText;
   const followupQuestionText = interviewQuestion?.followup_question;
   const jobRole = interviewQuestion?.session.job_role;
   const experienceLevel = interviewQuestion?.session.experience_level;

   // Get OpenAI API key
   const openaiApiKey = process.env.OPENAI_API_KEY;
   if (!openaiApiKey) throw new Error("OpenAI API key not configured");

   const evaluationPrompt = `Evaluate the following interview exchange based on the original and follow-up answers(the answers are recorded audio response).
Question: ${questionText}
Follow-up Question: ${followupQuestionText}
Candidate's First Answer: ${userAnswer}
Candidate's Follow-up Answer: ${followupAnswer}
Job Role: ${jobRole}
Experience Level: ${experienceLevel}
Evaluation criteria:
1. CONTENT QUALITY (40%)
2. VOICE TONE & CONFIDENCE (20%)
3. SPEAKING CLARITY (20%)
4. THOUGHT ORGANIZATION (20%)
Return JSON:
{ "score": 8, "feedback": "Your detailed feedback here" }. NB: For the feedback property let it me a string in html format. After giving the feedback for the places of improvement also provide example response to clarify your recommendations`;

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
   const evalData: any = await evalRes.json();

   let evaluation: EvaluationResult;
   try {
      evaluation = JSON.parse(evalData.choices[0].message.content);
      await prismaClient.interviewQuestion.update({
         where:{
            id:question_id,
            sessionId: session_id
         },
         data:{
            score: evaluation.score,
            aiFeedback: evaluation.feedback
         }
      })
   } catch {
      evaluation = {
         score: 6,
         feedback: "Thanks for your answers. Try to include specific examples and communicate more clearly next time.",
      };
   }

   return res.json({ feedback: evaluation.feedback, score: evaluation.score, message: "Evaluation complete" });
});

router.post("/submit-coding-answer", authenticateJWT, async (req, res) => {
   const { question_id, session_id, code_snippet } = req.body;

   // ----------------------------
   // STEP 2: Evaluate Answer
   // ----------------------------

   const interviewQuestion = await prismaClient.interviewQuestion.findFirst({
      where: {
         id: question_id,
         sessionId: session_id,
      },include:{
         session:true
      }

   });

   if(!interviewQuestion) throw Error("Interview question not found");

   const updatedQuestion = await prismaClient.interviewQuestion.update({
      where:{sessionId: session_id, id: question_id},
      data:{userAnswer:code_snippet}
   })

   const questionText = interviewQuestion?.questionText;
   const jobRole = interviewQuestion?.session.job_role;
   const experienceLevel = interviewQuestion?.session.experience_level;

   // Get OpenAI API key
   const openaiApiKey = process.env.OPENAI_API_KEY;
   if (!openaiApiKey) throw new Error("OpenAI API key not configured");

   const evaluationPrompt = `You are an expert interviewer. Evaluate the following candidate's solution to a Data Structures & Algorithms (DSA) coding question.

Question: ${questionText}
Candidate's Code Answer: ${updatedQuestion.userAnswer}

Job Role: ${jobRole}
Experience Level: ${experienceLevel}

Evaluation criteria (weight in parentheses):
1. CORRECTNESS (40%) – Does the code solve the problem as stated? Does it handle edge cases? Are results accurate?
2. EFFICIENCY (20%) – Time and space complexity. Does the candidate choose an optimal or near-optimal approach?
3. CODE QUALITY (20%) – Readability, structure, naming, modularity, maintainability, use of language idioms.
4. PROBLEM-SOLVING EXPLANATION (20%) – Clarity of reasoning behind the approach (if inferred from code), evidence of systematic thinking.

Return JSON:
{
  "score": 0-10 (integer),
  "feedback": "<html> 
    <h3>Evaluation</h3>
    <ul>
      <li>Correctness: .../40%</li>
      <li>Efficiency: .../20%</li>
      <li>Code Quality: .../20%</li>
      <li>Problem-Solving Explanation: .../20%</li>
    </ul>
    <h3>Improvements</h3>
    <p>List specific improvements the candidate could make.</p>
    <h3>Example Test Cases</h3>
    <ul>
      <li>Input: ... → Output: ...</li>
      <li>Input: ... → Output: ...</li>
    </ul>
    <h3>Model Solution</h3>
    <pre><code>// Provide an improved or correct version of the code here</code></pre>
  </html>"
}

Guidelines:
- Score must be an integer 0–10 based on the weighted criteria.
- Feedback must be in HTML format (structured, copy-paste friendly).
- Always include at least 2 test cases in the feedback.
- Provide a corrected/optimized model solution (same language as candidate code if possible).`;

   const evalRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
         Authorization: `Bearer ${openaiApiKey}`,
         "Content-Type": "application/json",
      },
      body: JSON.stringify({
         model: "gpt-4o-mini",
         response_format: { type: "json_object" },
         messages: [
            { role: "system", content: "You are an expert interview evaluator. Return JSON only, no text outside the JSON." },
            { role: "user", content: evaluationPrompt },
         ],
         temperature: 0.3,
      }),
   });

   if (!evalRes.ok) throw new Error("Evaluation failed");
   const evalData: any = await evalRes.json();

   let evaluation: EvaluationResult;
   try {
      evaluation = JSON.parse(evalData.choices[0].message.content);

      await prismaClient.interviewQuestion.update({
         where:{
            id:question_id,
            sessionId: session_id
         },
         data:{
            score: evaluation.score,
            aiFeedback: evaluation.feedback
         }
      })
      console.log("Eval data", evaluation)
      console.log("Evaluation score", evaluation.score)
      console.log("Eval feedback", evaluation.feedback)
   } catch (err){
      console.error(err)
      evaluation = {
         score: 6,
         feedback: "Thanks for your answers. Try to include specific examples and communicate more clearly next time.",
      };
   }

   return res.json({ feedback: evaluation.feedback, score: evaluation.score, message: "Evaluation complete" });
});


/**
 * @openapi
 * /save-followup-answer:
 *   post:
 *     summary: Save a follow-up answer for an interview question
 *     description: Upload and save the candidate's follow-up recorded answer.
 *     tags:
 *       - Interview
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               session_id:
 *                 type: string
 *                 description: Interview session identifier
 *               question_id:
 *                 type: string
 *                 description: The question ID
 *               followup_answer:
 *                 type: string
 *                 format: binary
 *                 description: The audio/video follow-up answer file
 *     responses:
 *       200:
 *         description: Follow-up answer saved successfully
 *       400:
 *         description: Bad request (upload or validation failed)
 *       500:
 *         description: Internal server error
 */
// Route to save follow-up answer
router.post("/save-followup-answer", authenticateJWT, createUploadMiddleware("followup"), async (req, res) => {
   const { question_id } = req.body;
   const filePath = req.file?.path;

   // Example: save to DB
   const interview = await prismaClient.interviewQuestion.update({
      where: { id: question_id },
      data: { followup_answer: filePath },
   });

   res.json({ success: true, interview });
});

/**
 * @openapi
 * /save-first-answer:
 *   post:
 *     summary: Save the first answer for an interview question
 *     description: Upload and save the candidate's first recorded answer for a question.
 *     tags:
 *       - Interview
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               session_id:
 *                 type: string
 *                 description: Interview session identifier
 *               question_id:
 *                 type: string
 *                 description: The question ID
 *               answer:
 *                 type: string
 *                 format: binary
 *                 description: The audio/video answer file
 *     responses:
 *       200:
 *         description: Answer saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request (upload or validation failed)
 *       500:
 *         description: Internal server error
 */
// Route to save first answer
router.post("/save-first-answer", authenticateJWT, createUploadMiddleware("main_question_ans"), async (req, res) => {
   const { question_id, session_id } = req.body;
   const filePath = req.file?.path;

   // Example: save to DB
   const interview = await prismaClient.interviewQuestion.update({
      where: { id: question_id, sessionId: session_id },
      data: { userAnswer: filePath },
   });

   res.json({ success: true, interview });
});
export default router;
