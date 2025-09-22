import { useInterviewContext } from "@/hooks/useInterviewContext";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Brain } from "lucide-react";
import { Badge } from "./ui/badge";
import DOMPurify from "dompurify";
import { Skeleton } from "./ui/skeleton";
import Spinner from "./ui/spinner";

const AiFeedBack = () => {
   const { feedback, isGeneratingFeedback } = useInterviewContext();

   if (feedback === null && !isGeneratingFeedback) {
      return null; // Don't render anything if there's no feedback
   }

   if (isGeneratingFeedback) {
      return (
         <Skeleton className="h-[6rem] w-full flex items-center justify-center">
            <Spinner />
         </Skeleton>
      );
   }
   return (
      <Card className="border-0 shadow-elegant">
         <CardHeader className="pb-3">
            <CardTitle className="text-base">AI Feedback</CardTitle>
            <p className="text-sm text-muted-foreground">Record your voice or type your answer below</p>
         </CardHeader>
         <CardContent className="space-y-4">
            {/* Feedback Display */}
            {feedback && (
               <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                     <Brain className="h-4 w-4 text-primary" />
                     <span className="font-medium">AI Feedback</span>
                     <Badge variant="secondary">Score: {feedback.score}/10</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(feedback.feedback) }}></p>{" "}
               </div>
            )}
         </CardContent>
      </Card>
   );
};

export  default AiFeedBack;