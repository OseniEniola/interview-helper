import express, { Request, Response } from "express";
import { InterviewSession, PrismaClient } from "@prisma/client";
import { authenticateJWT } from "../middleware/authenticateJWT";
import { dynamicResumeUpload } from "../utilities/filestorage";
import multer from "multer";

const router = express.Router();

const prismaClient = new PrismaClient();

// Configure multer (in-memory for now, you can switch to diskStorage if needed)
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @openapi
 * /interview-sessions:
 *   post:
 *     summary: Create a new interview session
 *     tags:
 *       - InterviewSession
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               interview_title:
 *                type: string
 *                example: "My Interview Session"
 *               job_role:
 *                type: string
 *                example: "Backend Developer"
 *               number_questions:
 *                 type: integer
 *                 example: 10
 *               jobDescription:
 *                 type: string
 *                 example: "Backend Developer Role"
 *               experienceLevel:
 *                 type: string
 *                 example: "Senior"
 *               resume:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Interview session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "12345"
 *                 userId:
 *                   type: string
 *                   example: "67890"
 *                 jobDescription:
 *                   type: string
 *                   example: "Backend Developer Role"
 *                 resumeUrl:
 *                   type: string
 *                   example: "uploads/resumes/67890/resume.pdf"
 *                 status:
 *                   type: string
 *                   example: "SETUP"
 *       400:
 *         description: Bad request (missing fields)
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
// Route to create a new interview session
router.post("/", authenticateJWT, async (req: any, res: Response) => {
  if (!req.user?.id) return res.status(401).json({ message: "Unauthorized" });

  const userId = req.user.id;
  const uploadPath = `uploads/resumes/${userId}`;

  try {
    // Run multer and wait for it
    await new Promise<void>((resolve, reject) => {
      dynamicResumeUpload(uploadPath)
        .single("resume")(req, res, (err: any) => {
          if (err) reject(err);
          else resolve();
        });
    });
   

    const file = req.file;
    if (!file) return res.status(400).json({ message: "Resume file is required" });

    const { interview_title, job_role, jobDescription, number_questions, experience_level,isLiveCoding } = req.body;

    if (!jobDescription || !experience_level) {
      return res.status(400).json({ message: "jobDescription and experienceLevel are required" });
    }

    console.log(isLiveCoding,typeof isLiveCoding)
    const session: InterviewSession = {
      interview_title,
      job_role,
      userId,
      jobDescription,
      experience_level,
      resumeUrl: file.path,  // multer saved file path
      currentQuestion: 1,
      isLiveCoding:  isLiveCoding.toLowerCase() === 'true' || isLiveCoding.toLowerCase() === true ? true : false,
      totalQuestions: parseInt(number_questions) || 5,
      createdAt: new Date(),
      updatedAt: new Date(),
      startedAt: new Date(),
      status: "SETUP",
    } as InterviewSession;

    const newSession = await prismaClient.interviewSession.create({ data: session });
    res.status(201).json(newSession);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});


/** * @openapi
 * /interview-sessions:
 *   get:
 *     summary: Get all interview sessions for the authenticated user
 *     tags:
 *       - InterviewSession
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of interview sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "12345"
 *                   userId:
 *                     type: string
 *                     example: "67890"
 *                   jobDescription:
 *                     type: string
 *                     example: "Backend Developer Role"
 *                   resumeUrl:
 *                     type: string
 *                     example: "uploads/resumes/67890/resume.pdf"
 *                   status:
 *                     type: string
 *                     example: "SETUP"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
//Get all sessions for a user
router.get("/", authenticateJWT, async (req: Request, res: Response) => {
   if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
   }

   console.log("Authenticated user:", req.user);
   const userId = req.user.id;

   try {
      const sessions = await prismaClient.interviewSession.findMany({
         where: { userId },
         orderBy: { createdAt: "desc" },
      });
      res.json(sessions);
   } catch (error) {
      console.error("Error fetching interview sessions:", error);
      res.status(500).json({ message: "Internal server error" });
   }
});

/**
 * @openapi
 * /interview-sessions/{id}:
 *   get:
 *     summary: Get a specific interview session by ID
 *     tags:
 *       - InterviewSession
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The interview session ID
 *     responses:
 *       200:
 */
//Get a specific session by ID
router.get("/:id", authenticateJWT, async (req: Request, res: Response) => {
   if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
   }

   const userId = req.user.id;
   const sessionId = req.params.id.trim();

   try {
      const session = await prismaClient.interviewSession.findUnique({
         where: { id: sessionId, userId },
      });

      if (!session) {
         return res.status(404).json({ message: "Interview session not found" });
      }

      res.json(session);
   } catch (error) {
      console.error("Error fetching interview session:", error);
      res.status(500).json({ message: "Internal server error" });
   }
});

/** * @openapi
 * /interview-sessions/{sessionId}/resume:
 *   get:
 *     summary: Download the resume file for a specific interview session
 *     tags:
 *       - InterviewSession
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The interview session ID
 *     responses:
 *       200:
 *         description: Resume file downloaded successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Interview session or resume not found
 *       500:
 *         description: Internal server error
 */
//Download resume file
router.get("/:sessionId/resume", authenticateJWT, async (req: Request, res: Response) => {
   if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
   }

   const userId = req.user.id;
   const sessionId = req.params.sessionId.trim();

   try {
      const session = await prismaClient.interviewSession.findUnique({
         where: { id: sessionId, userId },
      });


      if (!session) {
         return res.status(404).json({ message: "Interview session not found" });
      }

      if (!session.resumeUrl) {
         return res.status(404).json({ message: "Resume not found for this session" });
      }

      res.download(session.resumeUrl, (err) => {
         if (err) {
            console.error("Error sending resume file:", err);
            res.status(500).json({ message: "Error downloading resume file" });
         }
      });
   } catch (error) {
      console.error("Error fetching interview session:", error);
      res.status(500).json({ message: "Internal server error" });
   }
});

export default router;

