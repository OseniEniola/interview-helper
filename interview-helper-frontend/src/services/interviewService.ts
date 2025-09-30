import createAxiosClient, { baseUrl } from "@/utils/axiosClient";
import { supabase } from "@/integrations/supabase/client";

const axiosClient = createAxiosClient();

const generated_questions = [
   {
      question_text: "Can you describe your experience with modern JavaScript frameworks, specifically React or Vue? What are some key architectural decisions you've made in past projects?",
      question_type: "technical",
      order_index: 1,
   },
   {
      question_text: "Tell me about a time when you faced a significant challenge in a project. How did you approach the problem and what was the outcome?",
      question_type: "behavioral",
      order_index: 2,
   },
   {
      question_text: "How do you ensure code quality and maintainability in your frontend codebases? Can you discuss any tools or processes you use?",
      question_type: "technical",
      order_index: 3,
   },
   {
      question_text: "Describe a situation where you had to collaborate with backend engineers or other teams. How did you ensure effective communication and project alignment?",
      question_type: "behavioral",
      order_index: 4,
   },
   {
      question_text: "What strategies do you use to optimize performance in frontend applications? Can you provide an example from your past work?",
      question_type: "technical",
      order_index: 5,
   },
];

export interface InterviewSession {
   id: string;
   title: string;
   job_role: string;
   experience_level: string;
   status: "setup" | "in_progress" | "completed";
   resume_file_path?: string;
   startedAt: string;
}

export interface InterviewQuestion {
   id: string;
   session_id: string;
   question_text: string;
   tips?: string[];
   time_limit?: number; // in seconds
   question_type: "technical" | "behavioral";
   order_index: number;
   user_answer?: string;
   ai_feedback?: string;
   score?: number;
}

export class InterviewService {
   //Login user
   static async login(email: string, password: string): Promise<any> {
      try {
         const { data } = await axiosClient.post(`${baseUrl}/auth/login`, { email, password });
         localStorage.setItem("userData", JSON.stringify(data));
         return { data };
      } catch (error: any) {
         throw new Error(error.response?.data?.message || "Login failed");
      }
   }

   //Logout user
   static async logout(): Promise<void> {
      try {
         await axiosClient.post(`${baseUrl}/auth/logout`);
         localStorage.removeItem("userData");
      } catch (error: any) {
         throw new Error(error.response?.data?.message || "Logout failed");
      }
   }

   //Signup user
   static async signup(email: string, password: string): Promise<any> {
      try {
         const data = await axiosClient.post(`${baseUrl}/auth/register`, { email, password });
         localStorage.setItem("userData", JSON.stringify(data));
         return data;
      } catch (error: any) {
         throw new Error(error.response?.data?.message || "Signup failed");
      }
   }

   // Create a new interview session
   static async createSession(data: { interview_title: string; job_role: string; experience_level: string; resume?: File; number_questions: number; jobDescription: string, isLiveCoding:boolean }): Promise<InterviewSession> {
      try {
         const formData = new FormData();

         // Append text fields
         formData.append("interview_title", data.interview_title);
         formData.append("job_role", data.job_role);
         formData.append("experience_level", data.experience_level);
         formData.append("number_questions", data.number_questions.toString());
         formData.append("jobDescription", data.jobDescription);
         formData.append("isLiveCoding", data.isLiveCoding ? "true" : "false");

         // Append file correctly
         if (data.resume) {
            formData.append("resume", data.resume); // <-- File object, do NOT toString
         }
         const response = await axiosClient.post(`${baseUrl}/interview-sessions`, formData, {
            headers: {
               "Content-Type": "multipart/form-data",
               Accept: "application/json",
            },
         });
         return response.data;
      } catch (error: any) {
         throw new Error(error.response?.data?.message || "Create session failed");
      }
   }

   // Get all sessions for the logged-in user
   static async getSessions(): Promise<InterviewSession[]> {
      try {
         const response = await axiosClient.get(`${baseUrl}/interview-sessions`);
         return response.data;
      } catch (error: any) {
         throw new Error(error.response?.data?.message || "Fetch sessions failed");
      }
   }

   // Get a specific session by ID
   static async getSession(sessionId: string): Promise<InterviewSession> {
      try {
         const response = await axiosClient.get(`${baseUrl}/interview-sessions/${sessionId}`);
         //console.log(response)
         return response.data;
      } catch (error: any) {
         throw new Error(error.response?.data?.message || "Fetch sessions failed");
      }
   }

   static async getSessionData(sessionId: string): Promise<InterviewSession> {
      try {
         const response = await axiosClient.get(`${baseUrl}/interview-sessions/${sessionId}`);
         return response.data;
      } catch (error: any) {
         throw new Error(error.response?.data?.message || "Fetch sessions failed");
      }
   }
   // Generate AI questions for a session
   static async generateQuestions(sessionId: string, jobRole: string, experienceLevel: string, resumeContent?: string): Promise<void> {
      try {
         const response = await axiosClient.post(`${baseUrl}/generate-questions/${sessionId}`, {});
         return response.data;
      } catch (err) {
         console.error(err);
      }
   }

   static async saveFirstResponse(body): Promise<any> {
      try {
         const response = await axiosClient.post(`${baseUrl}/interview-chat/save-first-answer`, body, {
            headers: {
               "Content-Type": "multipart/form-data",
            },
         });
         return response.data;
      } catch (err) {
         console.error("Error saving answer");
      }
   }

   static async saveFollowupResponse(body): Promise<any> {
      try {
         const response = await axiosClient.post(`${baseUrl}/interview-chat/save-followup-answer`, body, {
            headers: {
               "Content-Type": "multipart/form-data",
            },
         });
         return response.data;
      } catch (err) {
         console.error("Error saving answer");
      }
   }

   // Get questions for a session
   static async getQuestions(sessionId: string): Promise<InterviewQuestion[]> {
      try {
         const response = await axiosClient.get(`${baseUrl}/generate-questions/${sessionId}`);
         return response.data;
      } catch (err) {
         console.error(err);
      }
   }

   static async submitCodingAnswer(body): Promise<{ feedback: string; score: number }> {
       try {
         const response = await axiosClient.post(`${baseUrl}/interview-chat/submit-coding-answer`,  body);
         return response.data;
      } catch (err) {
         console.error(err);
      }
   }  
   

   // Submit answer and get AI feedback
   static async submitAnswer(sessionId: string, questionId: string, userAnswer: string): Promise<{ feedback: string; score: number }> {
      const { data, error } = await supabase.functions.invoke("interview-chat", {
         body: {
            sessionId,
            questionId,
            userAnswer,
            action: "evaluate_answer",
         },
      });

      if (error) throw error;
      return data;
   }

   // Generate follow-up question
   static async generateFollowUp(session_id: string, question_id: string): Promise<{ followup_question: string }> {
      try {
         let body = { session_id, question_id };
         const response = await axiosClient.post(`${baseUrl}/interview-chat/generate-followup`, body);
         return response.data;
      } catch (err) {
         console.error(err);
      }
   }

   static async evaluateAnswers(session_id: string, question_id: string): Promise<any> {
      try {
         let body = { session_id, question_id };
         const response = await axiosClient.post(`${baseUrl}/interview-chat/evaluate-answer`, body);
         return response.data;
      } catch (err) {
         console.error(err);
      }
   }

   static async getSignedRecordingUrl(filePath: string): Promise<string> {
      const { data, error } = await supabase.storage.from("audioRecording").createSignedUrl(filePath, 60 * 60); // 1 hour

      if (error) throw error;
      return data.signedUrl;
   }
   // Update session status
   static async updateSessionStatus(sessionId: string, status: "setup" | "in_progress" | "completed"): Promise<void> {
      const { error } = await supabase.from("interview_sessions").update({ status }).eq("id", sessionId);

      if (error) throw error;
   }

   // Upload resume file to storage
   static async uploadResume(file: File): Promise<string> {
      const fileName = `${Date.now()}-${file.name}`;
      const { data: user } = await supabase.auth.getUser();

      if (!user.user) throw new Error("User not authenticated");

      const filePath = `${user.user.id}/${fileName}`;

      const { error } = await supabase.storage.from("resumes").upload(filePath, file);

      if (error) throw error;
      return filePath;
   }

   // Get resume content (for processing)
   static async getResumeContent(filePath: string): Promise<string> {
      const { data, error } = await supabase.storage.from("resumes").download(filePath);

      if (error) throw error;

      // Convert blob to text (for PDF/text files you'd need proper parsing)
      return await data.text();
   }

   static async uploadAudioRecording(file: File, questionId): Promise<string> {
      const fileName = `${Date.now()}`;
      const { data: user } = await supabase.auth.getUser();

      if (!user.user) throw new Error("User not authenticated");

      const filePath = `${user.user.id}/${questionId}/${fileName}`;

      const { error } = await supabase.storage.from("audiorecording").upload(filePath, file);

      if (error) throw error;
      return filePath;
   }

   // Get resume content (for processing)
   static async getRecordingUrl(filePath: string): Promise<string> {
      const { data, error } = await supabase.storage.from("audioRecording").download(filePath);

      if (error) throw error;

      // Convert blob to text (for PDF/text files you'd need proper parsing)
      console.log(await data);
      return await data.text();
   }
}
