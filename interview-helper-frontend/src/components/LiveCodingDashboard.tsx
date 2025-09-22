import React, { useEffect, useState } from "react";

import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

import { QuestionPanel } from "./QuestionPanel";
import { useParams } from "react-router-dom";
import { InterviewService } from "@/services/interviewService";
import Editor from "@monaco-editor/react";
import { useInterviewContext } from "@/hooks/useInterviewContext";
import AiFeedBack from "./AiFeedback";
import BackIcon from "./ui/back-icon";
import { set } from "date-fns";

const languages = ["javascript", "typescript", "python", "java", "c", "cpp", "csharp", "php", "go", "ruby", "json", "html", "css", "markdown", "sql", "yaml", "rust", "kotlin", "swift", "r"];

export function LiveCodingDashboard() {
   const { session, questions, currentQuestionIndex, progress, setQuestions, nextQuestion, setSessionData } = useInterviewContext();

   const [language, setLanguage] = useState("javascript");
   const [editorContent, setEditorContent] = useState("");

   const params = useParams<{ sessionId: string }>();
   const sessionId = params.sessionId;

   const [loading, setLoading] = useState(true);
   const [isMuted, setIsMuted] = useState(false);
   const [isVideoOn, setIsVideoOn] = useState(true);

   useEffect(() => {
      const fetchQuestions = async () => {
         if (questions.length === 0) {
            try {
               if (!session) {
                  setSessionData(sessionId);
               }
               const fetchedQuestions = await InterviewService.getQuestions(sessionId);

               setQuestions(fetchedQuestions);
            } catch (error) {
               console.error("Error fetching questions:", error);
            }
         }
         setLoading(false);
      };
      fetchQuestions();
   }, []);

   useEffect(() => {
      setEditorContent(questions[0]?.userAnswer || "");
   }, [session, questions]);

   const handleEditorChange = (value, event) => {
     // console.log("here is the current model value:", value);
      setEditorContent(value || "");
   };

   if (loading) {
      return (
         <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
               <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
               <p className="mt-4 text-muted-foreground">Loading...</p>
            </div>
         </div>
      );
   }

   // Interview Phase
   if (questions.length > 0) {
      return (
         <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4">
               <div className="max-w-7xl mx-auto flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <a href="/interview/sessions" className={"flex items-center font-semibold justify-center shadow cursor-pointer p-2 rounded-sm gap-2 text-sm"}>
                        <BackIcon width={16} height={16} /> <span>View sessions</span>
                     </a>
                     <h1 className="text-xl font-semibold">AI Interview Session</h1>
                     <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Live
                     </Badge>
                  </div>

                  <div className="flex items-center gap-4">
                     <div className="text-sm text-gray-600">
                        Question {currentQuestionIndex + 1} of {questions.length}
                     </div>
                     <Progress value={progress} className="w-32" />
                  </div>
               </div>
            </div>

            {/* Main Interview Area */}
            <div className="max-w-7xl mx-auto p-6">
               <div className="grid lg:grid-cols-3 gap-6">
                  {/* Video Section */}
                  <div className="lg:col-span-2">
                     <div style={{ height: "auto", display: "flex", flexDirection: "column" }}>
                        {/* Language Selector */}
                        <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{ marginBottom: "10px", padding: "5px" }}>
                           {languages.map((lang) => (
                              <option key={lang} value={lang}>
                                 {lang.toUpperCase()}
                              </option>
                           ))}
                        </select>

                        {/* Monaco Editor */}
                        <Editor height="70vh" language={language} theme="vs-dark" value={editorContent} defaultValue={`// Write your ${language} code here`} onChange={handleEditorChange} />
                     </div>{" "}
                     <div className="mt-6">
                        <AiFeedBack />
                     </div>
                  </div>

                  {/* Question Panel */}
                  <div className="lg:col-span-1">
                     <QuestionPanel
                        editorContent={editorContent}
                        onNext={nextQuestion}
                        numOfGenQuestions={questions.length}
                        isLast={currentQuestionIndex === questions.length - 1} // Assuming 5 questions
                     />
                  </div>
               </div>
            </div>
         </div>
      );
   }
}
