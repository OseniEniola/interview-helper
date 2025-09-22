// Define request body type
export interface GenerateQuestionsRequest {
  jobRole: string;
  experienceLevel: string;
  resumeContent?: string;
}

// Define question type
export interface InterviewQuestion {
  question_text: string;
  question_type: "technical" | "behavioral";
  tips?: string[];
  timeLimit?: number;
  order_index: number;
}

// Request body types
export interface InterviewRequest {
  sessionId: string;
  questionId: string;
  userAnswer?: string;
  followupAnswer?: string;
  action: "generate_followup" | "evaluate_answer";
}

// Types
export interface InterviewRequest {
  userAnswer?: string;
  followupAnswer?: string;
  action: "generate_followup" | "evaluate_answer";
  questionText?: string;
  followupQuestionText?: string;
  jobRole?: string;
  experienceLevel?: string;
}

export interface EvaluationResult {
  score: number;
  feedback: string;
}


export interface RealtimeRequest {
  questionText: string;
  jobRole: string;
  experienceLevel: string;
}

export interface TranscriptionRequest {
  audio: string;
}
