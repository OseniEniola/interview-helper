import React, { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { AudioRecorder as AudioRecorderUtil } from "@/utils/audioRecorder";
import { useInterviewContext } from "@/hooks/useInterviewContext";

export default function AudioRecorder({ startTimer, resetTimer, hasSubmitted }) {
   const { saveRecordedAnswer, saveFollowupRecordedAnswer, generateFollowupQuestion, setFeedback, evaluateResponse, session, currentQuestion } = useInterviewContext();

   const [isConnected, setIsConnected] = useState(false);
   const recordRef = useRef<AudioRecorderUtil | null>(null);
   const [isRecording, setIsRecording] = useState(false);
   const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
   const [audioUrl, setAudioUrl] = useState<string | null>(null);
   const [isFollowupGenerated, setIsFollowupGenerated] = useState<boolean>(false);

   // Initialize recorder
   useEffect(() => {
      recordRef.current = new AudioRecorderUtil(
         (blob) => {
            setAudioBlob(blob);
            setAudioUrl(URL.createObjectURL(blob));
         },
         (err) => {
            console.error("Recording error:", err);
            setIsRecording(false);
         }
      );
   }, []);

   useEffect(() => {
      if (!audioBlob) return;

      if (!isFollowupGenerated) {
         saveAnswerResponse();
      } else {
         saveFollowupResponseAndAnalyze();
      }
   }, [audioBlob]);

   useEffect(() => {
      if(!currentQuestion) return;
      currentQuestion.followup_question ? 
      setIsFollowupGenerated(true) : setIsFollowupGenerated(false);
   }, [currentQuestion]);

   const startRecording = async () => {
      try {
         await recordRef.current?.startRecording();
         setIsConnected(true);
         setIsRecording(true);
         startTimer(true);
      } catch (err) {
         console.error("Failed to start recording:", err);
      }
   };

   const endRecordingAndAnalyze = useCallback(async () => {
      recordRef.current?.stopRecording();
      setIsRecording(false);
      setIsConnected(false);
      startTimer(false);
   }, []);

   const saveAnswerResponse = async () => {
      const formdata = new FormData();
      formdata.append("question_id", currentQuestion.id);
      formdata.append("session_id", session.id);
      formdata.append("answer", audioBlob, "recording.webm");

      const savedFollowupReponseResponse = await saveRecordedAnswer(formdata);
      //console.log("Saved response:", savedResponse);

      const followupQuestion = await generateFollowupQuestion(session.id, currentQuestion.id);
      // console.log("Generated follow-up:", followupQuestion);

      setIsFollowupGenerated(true);
      resetTimer();
   };

   const saveFollowupResponseAndAnalyze = async () => {
      const formdata = new FormData();
      formdata.append("question_id", currentQuestion.id);
      formdata.append("session_id", session.id);
      formdata.append("answer", audioBlob, "recording.webm");

      const savedFollowupReponseResponse = await saveFollowupRecordedAnswer(formdata);

      const evaluatedResponse = await evaluateResponse(session.id, currentQuestion.id);

      //console.log(evaluatedResponse)
      setFeedback(evaluatedResponse);
      hasSubmitted(true);
   };
   return (
      <Card className="w-full">
         <CardContent className="p-6">
            <div className="space-y-4">
               <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">Record Your Interview Answer</h3>
                  <p className="text-sm text-muted-foreground">Practice responding to interview questions with real-time feedback on your content, tone, clarity, and confidence.</p>
               </div>

               <div className="flex justify-center items-center gap-4">
                  {!isConnected ? (
                     <Button onClick={startRecording} className="bg-primary hover:bg-primary/90 text-white gap-2">
                        <Mic className="w-4 h-4" />
                        Start Recording
                     </Button>
                  ) : (
                     <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                           <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-gray-300"}`} />
                           <span className="text-sm font-medium">{isConnected ? "Start Recording" : "Recording..."}</span>
                           {isConnected && <Volume2 className="w-4 h-4 text-primary animate-pulse" />}
                        </div>

                        <Button onClick={endRecordingAndAnalyze} variant="outline" size="sm" className="gap-2">
                           <MicOff className="w-4 h-4" />
                           End Recording
                        </Button>
                     </div>
                  )}
               </div>

               {/*  {feedback && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                     <h4 className="font-medium mb-2">Live Feedback:</h4>
                     <p className="text-sm">{feedback}</p>
                  </div>
               )} */}

               {isConnected && (
                  <div className="text-center text-sm text-muted-foreground">
                     <p>Speak naturally to answer the question.</p>
                     <p>The AI is evaluating your response in real-time.</p>
                  </div>
               )}
            </div>
         </CardContent>
      </Card>
   );
}
