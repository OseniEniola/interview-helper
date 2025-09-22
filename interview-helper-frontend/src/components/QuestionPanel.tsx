import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MessageCircle, Clock, SkipForward, AlertCircle, CheckCircle, Brain, Users, Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import AudioRecorder from "./AudioRecorder";
import { useInterviewContext } from "@/hooks/useInterviewContext";
import { Skeleton } from "./ui/skeleton";
import Spinner from "./ui/spinner";

interface QuestionPanelProps {
   numOfGenQuestions?: number;
   onNext: () => void;
   isLast: boolean;
   editorContent?: string;
}

const sampleQuestions = [
   {
      id: 1,
      type: "behavioral",
      question: "Tell me about a time when you had to work with a difficult team member. How did you handle the situation?",
      tips: ["Use the STAR method", "Focus on your actions", "Show emotional intelligence"],
      timeLimit: 120,
   },
   {
      id: 2,
      type: "technical",
      question: "Explain the difference between let, const, and var in JavaScript. When would you use each one?",
      tips: ["Mention scope differences", "Discuss hoisting", "Give practical examples"],
      timeLimit: 90,
   },
   {
      id: 3,
      type: "behavioral",
      question: "Describe a project where you had to learn a new technology quickly. What was your approach?",
      tips: ["Show learning agility", "Mention specific resources", "Highlight results"],
      timeLimit: 120,
   },
   {
      id: 4,
      type: "technical",
      question: "How would you optimize a React application that's rendering slowly?",
      tips: ["Mention React.memo", "Discuss virtual DOM", "Talk about profiling tools"],
      timeLimit: 150,
   },
   {
      id: 5,
      type: "behavioral",
      question: "Tell me about a time when you made a mistake at work. How did you handle it?",
      tips: ["Show accountability", "Focus on lessons learned", "Demonstrate growth"],
      timeLimit: 120,
   },
   {
      id: 6,
      type: "technical",
      question: "What are the key principles of RESTful API design?",
      tips: ["Mention HTTP methods", "Discuss status codes", "Talk about resource naming"],
      timeLimit: 100,
   },
   {
      id: 7,
      type: "behavioral",
      question: "Describe a situation where you had to meet a tight deadline. How did you prioritize your tasks?",
      tips: ["Show time management", "Mention prioritization methods", "Highlight results"],
      timeLimit: 120,
   },
   {
      id: 8,
      type: "technical",
      question: "Explain the concept of closures in JavaScript and provide an example.",
      tips: ["Define clearly", "Show practical use case", "Mention common pitfalls"],
      timeLimit: 120,
   },
];

export function QuestionPanel({ onNext,editorContent, numOfGenQuestions, isLast }: QuestionPanelProps) {
   const [timeLeft, setTimeLeft] = useState(0);
   const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

   const [showTips, setShowTips] = useState(false);
   const [answer, setAnswer] = useState("");

   const [isSubmitting, setIsSubmitting] = useState(false);
   const [hasSubmitted, setHasSubmitted] = useState(false);

   const {currentQuestion,currentQuestionIndex ,feedback,setFeedback,submitCodingAnswer,submitAnswer, followupQuestion, setFollowupQuestion, isGeneratingFollowup, session } = useInterviewContext();


   const question = currentQuestion || sampleQuestions[currentQuestionIndex || 0];


   try {
      if (typeof question.tips === "string") {
         question.tips = JSON.parse(question.tips);
      } else if (!Array.isArray(question.tips)) {
         question.tips = [];
      }
   } catch (e) {
      question.tips = [];
   }

   useEffect   (() => {
      setTimeout(()=> {
         if(!isTimerRunning){
            handleStart()
         }
      },5000)
   }, []);

   // Optional: Set initial time when question changes (but don’t start timer yet)
   useEffect(() => {
      //console.log(question);
      if (question) {
         setTimeLeft(question.timeSpent || 120);
         setIsTimerRunning(false); // Reset on new question

         if (question.followup_question) {
            setFollowupQuestion(question.followup_question);
         }
         if (question.aiFeedback) {
            setFeedback({ score: question.score, feedback: question.aiFeedback });
            setHasSubmitted(true);
         }
      }
   }, [currentQuestion, question]);


   //Reset Timer
   const resetTimer = () => {
      if (question) {
         setTimeLeft(question.time_limit || 120);
         setIsTimerRunning(false); // Reset on new question
      }
   };
   // Timer logic runs only when isTimerRunning is true
   useEffect(() => {
      if (!isTimerRunning || timeLeft <= 0) return;

      const interval = setInterval(() => {
         setTimeLeft((prev) => {
            if (prev <= 1) {
               clearInterval(interval);
               setIsTimerRunning(false);
               return 0;
            }
            return prev - 1;
         });
      }, 1000);

      return () => clearInterval(interval);
   }, [isTimerRunning, timeLeft]);

   // Start timer manually on button click
   const handleStart = () => {
      if (timeLeft > 0) {
         setIsTimerRunning(true);
      }
   };

   const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, "0")}`;
   };

   const handleNext = () => {
      setAnswer("");
      setFeedback(null);
      setHasSubmitted(false);
      onNext();
   };

   const handleSubmitAnswer = async () => {
      if (!answer.trim() || !submitAnswer) return;

      setIsSubmitting(true);
      try {
         const result = await submitAnswer(answer);
         setFeedback(result);
         setHasSubmitted(true);
      } catch (error) {
         console.error("Error submitting answer:", error);
      } finally {
         setIsSubmitting(false);
      }
   };

   const handleSubmitCodingAnswer = async () => {
      setIsSubmitting(true);
      try {
         
         const result = await submitCodingAnswer(editorContent);
         setFeedback(result);
         setHasSubmitted(true);
      } catch (error) {
         console.error("Error submitting coding answer:", error);
      } finally {
         setIsSubmitting(false);
      }
   };

   if (!question) return null;

   const isTimeWarning = timeLeft <= 30 && timeLeft > 10;
   const isTimeCritical = timeLeft <= 10;
   const progressValue = ((question.time_limit - timeLeft) / question.time_limit) * 100;

   return (
      <div className="space-y-4 h-full flex flex-col">
         {/* Question Header */}
         <Card className="border-0 shadow-elegant">
            <CardHeader className="pb-3">
               <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Question {currentQuestionIndex + 1}</CardTitle>
                  <Badge variant={question.question_type === "technical" ? "default" : "secondary"} className={cn(question.question_type === "technical" ? "bg-accent text-accent-foreground" : "bg-primary/10 text-primary")}>
                     {question.question_type === "technical" ? <Brain className="h-3 w-3 mr-1" /> : <Users className="h-3 w-3 mr-1" />}
                     {question.question_type === "technical" ? "Technical" : "Behavioral"}
                  </Badge>
               </div>
            </CardHeader>
            <CardContent>
               <p className="text-foreground leading-relaxed">{question.questionText}</p>
            </CardContent>
         </Card>

         {isGeneratingFollowup && (
            <Skeleton className="h-[6rem] w-full flex items-center justify-center">
               <Spinner />
            </Skeleton>
         )}
         {followupQuestion && (
            <Card className="border-0 shadow-elegant opacity-0 animate-fade-in">
               <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                     <CardTitle className="text-lg">Follow up question</CardTitle>
                  </div>
               </CardHeader>
               <CardContent>
                  <p className="text-foreground leading-relaxed">{followupQuestion}</p>
               </CardContent>
            </Card>
         )}

         {/* Timer and Controls */}
         <Card className="border-0 shadow-elegant">
            <CardContent className="p-4">
               <div className="space-y-4">
                  {/* Timer Display */}
                  <div className="text-center">
                     <div className={cn("text-3xl font-bold mb-2", isTimeCritical ? "text-destructive" : isTimeWarning ? "text-warning" : "text-foreground")}>{formatTime(timeLeft)}</div>
                     <Progress value={progressValue} className={cn("h-2", isTimeCritical && "[&>div]:bg-destructive", isTimeWarning && "[&>div]:bg-warning")} />
                  </div>

                  {/* Voice Analysis */}
                  {/*  <VoiceAnalysis
                     questionText={question.question_text}
                     jobRole="Frontend Developer" // This should come from session data
                     experienceLevel="Senior" // This should come from session data
                     onAnalysisComplete={(feedback, score) => {
                        setFeedback({ feedback, score });
                        setAnswer(feedback); // Set the feedback as the answer text
                        setHasSubmitted(true);
                     }}
                  /> */}

                  {/* Record Answer */}
                  {!session.isLiveCoding && <AudioRecorder resetTimer={resetTimer} hasSubmitted={setHasSubmitted} startTimer={setIsTimerRunning} />}

                  {session.isLiveCoding ? (
                     <div className="flex flex-col md:flex-row gap-2">
                        <Button  variant="outline" size="sm" onClick={handleStart} className="w-full mt-4">
                           Start
                        </Button>{" "}
                        <Button variant="outline" size="sm" onClick={handleSubmitCodingAnswer} className="w-full mt-4">
                           Submit
                        </Button>
                     </div>
                  ) : (
                     <Button variant="outline" size="sm" onClick={handleNext} className="w-full mt-4" disabled={!hasSubmitted}>
                        <SkipForward className="h-4 w-4 mr-2" />
                        {isLast ? "Finish" : "Next"}
                     </Button>
                  )}
               </div>
            </CardContent>
         </Card>

         {/* Answer Submission */}
         {false && (
            <Card className="border-0 shadow-elegant">
               <CardHeader className="pb-3">
                  <CardTitle className="text-base">Your Answer</CardTitle>
                  <p className="text-sm text-muted-foreground">Record your voice or type your answer below</p>
               </CardHeader>
               <CardContent className="space-y-4">
                  <Textarea placeholder="AI voice analysis feedback will appear here..." value={answer} onChange={(e) => setAnswer(e.target.value)} rows={4} disabled={hasSubmitted} />

                  <div className="flex gap-2">
                     <Button onClick={handleSubmitAnswer} disabled={!answer.trim() || isSubmitting || hasSubmitted} className="flex-1">
                        {isSubmitting ? (
                           <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                              Submitting...
                           </>
                        ) : hasSubmitted ? (
                           <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Submitted
                           </>
                        ) : (
                           <>
                              <Send className="h-4 w-4 mr-2" />
                              Submit Answer
                           </>
                        )}
                     </Button>
                  </div>

                  {/* Feedback Display */}
                  {feedback && (
                     <div className="mt-4 p-4 bg-muted rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                           <Brain className="h-4 w-4 text-primary" />
                           <span className="font-medium">AI Feedback</span>
                           <Badge variant="secondary">Score: {feedback.score}/10</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{feedback.feedback}</p>
                     </div>
                  )}
               </CardContent>
            </Card>
         )}

         {/* Tips Section */}
         {question.tips && question.tips.length > 0 && (
            <Card className="border-0 shadow-elegant">
               <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                     <CardTitle className="text-base flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-primary" />
                        Answer Tips
                     </CardTitle>
                     <Button variant="ghost" size="sm" onClick={() => setShowTips(!showTips)}>
                        {showTips ? "Hide" : "Show"}
                     </Button>
                  </div>
               </CardHeader>
               {showTips && (
                  <CardContent>
                     <ul className="space-y-2">
                        {question.tips &&
                           question.tips.map((tip, index) => (
                              <li key={index} className="flex items-start gap-2 text-sm">
                                 <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                                 <span className="text-muted-foreground">{tip}</span>
                              </li>
                           ))}
                     </ul>
                  </CardContent>
               )}
            </Card>
         )}

         {/* Question Progress */}
         <Card className="border-0 shadow-elegant">
            <CardContent className="p-4">
               <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageCircle className="h-4 w-4" />
                  <span>
                     Progress: {currentQuestionIndex + 1} of {numOfGenQuestions} questions
                  </span>
               </div>
            </CardContent>
         </Card>
      </div>
   );
}
