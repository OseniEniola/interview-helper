import { useState, useEffect } from "react";
import { InterviewService, InterviewSession, InterviewQuestion } from "@/services/interviewService";
import { useToast } from "@/components/ui/use-toast";

const questions = [
   {
      question_text: "Can you explain the differences between functional and class components in React, and when you would choose one over the other?",
      question_type: "technical",
      order_index: 1,
   },
   {
      question_text: "Describe a challenging project you worked on. What was your role, and how did you overcome obstacles during that project?",
      question_type: "behavioral",
      order_index: 2,
   },
   {
      question_text: "How do you ensure that your frontend applications are performant and optimized for speed? Can you provide specific strategies or tools you've used?",
      question_type: "technical",
      order_index: 3,
   },
   {
      question_text: "Tell me about a time when you had to collaborate with backend engineers to deliver a project. How did you handle any communication challenges?",
      question_type: "behavioral",
      order_index: 4,
   },
   {
      question_text: "What are some common accessibility considerations you keep in mind when developing web applications? Can you give examples?",
      question_type: "technical",
      order_index: 5,
   },
];

export const useInterview = () => {
   const [session, setSession] = useState<InterviewSession | null>(null);
   const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
   const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
   const [isLoading, setIsLoading] = useState(false);
   const [followupQuestion, setFollowupQuestion] = useState<string | null>(null);
   const [feedback, setFeedback] = useState<{ feedback: string; score: number } | null>(null);
   const [isGeneratingFollowup, setIsGeneratingFollowup] = useState(false);
   const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);

   const { toast } = useToast();

   const createSession = async (data: { title: string; job_role: string; experience_level: string; resume_file?: File; job_description?: string, number_questions:number,isLiveCoding:boolean }) => {
      setIsLoading(true);
      try {
         // Upload resume if provided
        /*  let resumeFilePath;
         let resumeContent;

         if (data.resume_file) {
            resumeFilePath = await InterviewService.uploadResume(data.resume_file);
            resumeContent = await InterviewService.getResumeContent(resumeFilePath);
         }

         
 */

         // Create session
         const newSession = await InterviewService.createSession({
            interview_title: data.title,
            job_role: data.job_role,
            number_questions: data.number_questions,
            jobDescription: data.job_description,
            experience_level: data.experience_level,
            resume: data.resume_file,
            isLiveCoding: data.isLiveCoding
         });

         //newSession.id = newSession.id || '0bb0b47c-1773-4c3a-ae6d-08658a47cb68'; // Fallback for testing

         setSession(newSession);

         // Generate AI questions
         await InterviewService.generateQuestions(newSession.id, data.job_role, data.experience_level);

         // Load questions 0bb0b47c-1773-4c3a-ae6d-08658a47cb68 // newSession.id
         const generatedQuestions = await InterviewService.getQuestions(newSession.id);

        // console.log("Generated Questions:", generatedQuestions);
         setQuestions(generatedQuestions);

         toast({
            title: "Interview Session Created",
            description: `Generated ${generatedQuestions.length} AI-powered questions`,
         });

         return newSession;
      } catch (error) {
         console.error("Error creating session:", error);
         toast({
            title: "Error",
            description: "Failed to create interview session",
            variant: "destructive",
         });
         throw error;
      } finally {
         setIsLoading(false);
      }
   };

   const setSessionData = async (sessionId) => {
      const sessionData = await InterviewService.getSessionData(sessionId);
      setSession(sessionData);
   };

   const submitCodingAnswer = async (codeSnippet: string) => {
      if (!session) return;

      setIsLoading(true);
      setIsGeneratingFeedback(true);
      try {
         let body = {
            session_id: session.id,
            question_id: questions[currentQuestionIndex].id,
            code_snippet: codeSnippet
         }
         const result = await InterviewService.submitCodingAnswer(body);
         setIsGeneratingFeedback(false);
         // Update the question with feedback
         setFeedback(result);

         toast({
            title: "Code Submitted",
            description: `Score: ${result.score}/10`,
         });

         return result;
      } catch (error) {
         console.error("Error submitting code:", error);
         setIsGeneratingFeedback(false);
         setIsLoading(false)
         toast({
            title: "Error",
            description: "Failed to submit code",
            variant: "destructive",
         });
         throw error;
      } finally {
         setIsLoading(false);
      }
   };

   const submitAnswer = async (answer: string) => {
      if (!session || !questions[currentQuestionIndex]) return;

      setIsLoading(true);
      try {
         const question = questions[currentQuestionIndex];
         const result = await InterviewService.submitAnswer(session.id, question.id, answer);

         // Update the question with feedback
         setQuestions((prev) => prev.map((q) => (q.id === question.id ? { ...q, user_answer: answer, ai_feedback: result.feedback, score: result.score } : q)));

         toast({
            title: "Answer Submitted",
            description: `Score: ${result.score}/10`,
         });

         return result;
      } catch (error) {
         console.error("Error submitting answer:", error);
         toast({
            title: "Error",
            description: "Failed to submit answer",
            variant: "destructive",
         });
         throw error;
      } finally {
         setIsLoading(false);
      }
   };

   const nextQuestion = () => {
      if (currentQuestionIndex < questions.length - 1) {
         setCurrentQuestionIndex((prev) => prev + 1);
      }
   };

   const previousQuestion = () => {
      if (currentQuestionIndex > 0) {
         setCurrentQuestionIndex((prev) => prev - 1);
      }
   };

   const startInterview = async (id?: string) => {
      const sessionId = id || session?.id;
      if (!sessionId) return;
      // await InterviewService.updateSessionStatus(sessionId, "in_progress");
      setSession((prev) => (prev ? { ...prev, status: "in_progress" } : null));
      console.log("Interview status updated to in_progress");
   };

   const completeInterview = async () => {
      if (!session) return;
      await InterviewService.updateSessionStatus(session.id, "completed");
      setSession((prev) => (prev ? { ...prev, status: "completed" } : null));
   };

   const saveRecordedAnswer = async (body):Promise<any> => {
      if (!session) return;
      const response =await InterviewService.saveFirstResponse(body)
      return response
   }

    const saveFollowupRecordedAnswer = async (body):Promise<any> => {
      if (!session) return;
      const response =await InterviewService.saveFollowupResponse(body)
      return response
   }

    const evaluateResponse = async (session_id,question_id):Promise<any> => {
      if (!session) return;
      setIsGeneratingFeedback(true);
      const response =await InterviewService.evaluateAnswers(session_id,question_id).then (res=>{
         setIsGeneratingFeedback(false);
         return res
      }).catch(err=>{
         setIsGeneratingFeedback(false);
         console.error("Error evaluating response:", err);
         toast({
            title: "Error",
            description: "Failed to evaluate response",
            variant: "destructive",
         });
      })
      return response
   }

   const generateFollowupQuestion = async (sessionId, questionId) => {
      if (!sessionId || !questionId) return;
      setIsGeneratingFollowup(true);
      const followupRes = await InterviewService.generateFollowUp(sessionId, questionId).then(res => {
         setIsGeneratingFollowup(false);
         return res;
      }).catch(err => {
         setIsGeneratingFollowup(false);
         console.error("Error generating follow-up question:", err);
         toast({
            title: "Error",
            description: "Failed to generate follow-up question",
            variant: "destructive",
         });
      });
      if (followupRes && followupRes.followup_question)

      setFollowupQuestion(followupRes.followup_question);
      return followupRes;
   };

   const currentQuestion = questions[currentQuestionIndex];
   const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

   return {
      session,
      setSession,
      questions,
      setQuestions,
      currentQuestion,
      currentQuestionIndex,
      progress,
      isLoading,
      createSession,
      submitAnswer,
      nextQuestion,
      previousQuestion,
      startInterview,
      completeInterview,
      generateFollowupQuestion,
      setSessionData,
      followupQuestion,
      setFollowupQuestion,
      saveRecordedAnswer,
      saveFollowupRecordedAnswer,
      evaluateResponse,
      feedback,
      setFeedback,
      isGeneratingFollowup,
      isGeneratingFeedback,
      submitCodingAnswer
   };
};
