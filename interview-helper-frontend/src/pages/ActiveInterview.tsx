import { InterviewDashboard } from "@/components/InterviewDashboard";
import { LiveCodingDashboard } from "@/components/LiveCodingDashboard";
import { Skeleton } from "@/components/ui/skeleton";
import Spinner from "@/components/ui/spinner";
import { useInterviewContext } from "@/hooks/useInterviewContext";
import { InterviewService } from "@/services/interviewService";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const ActiveInterview = () => {
   const params = useParams<{ sessionId: string }>();
   const sessionId = params.sessionId;

   const { session, questions, setQuestions, setSessionData } = useInterviewContext();
   const [loading, setLoading] = useState(true);

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


   if (!session) {
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
      return (
         <Skeleton className="h-[6rem] w-full flex items-center justify-center">
            <Spinner />
         </Skeleton>
      );
   }

   return session.isLiveCoding ? <LiveCodingDashboard /> : <InterviewDashboard />;
};

export default ActiveInterview;
