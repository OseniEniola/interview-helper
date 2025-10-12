import { InterviewService, InterviewSession } from "@/services/interviewService";
import { formatDate } from "date-fns";
import { useEffect, useState } from "react";

export const UserSessions = () => {
   const [userData, setUserData] = useState<any>(null);
   const [userSessions, setUserSessions] = useState<InterviewSession[]>([]);

   useEffect(() => {
      const user = localStorage.getItem("userData");
      setUserData(user ? JSON.parse(user) : null);
      //console.log(user);
   }, []);

    useEffect(() => {   
        const fetchSessions = async () => {
            if (userData) {
                try {
                    const sessions = await InterviewService.getSessions();
                    setUserSessions(sessions);
                } catch (error) {
                    console.error("Error fetching sessions:", error);
                }
            }
        };

        fetchSessions();
    }, [userData]);

   if (!userData) {
      return <div>Loading...</div>;
   }

   return (
      <div className="h-[85vh] min-h-full bg-gradient-to-br from-blue-50 to-indigo-100 p-6 flex flex-col items-center">
         <h1 className="text-2xl font-bold mb-4">Your Interview Sessions</h1>
         <a href="/interview/new" className="text-white px-3 py-1.5 mb-5 rounded-md bg-blue-600 hover:underline mt-2 inline-block">
                     Start New Session</a>
         {userSessions.length === 0 ? (
            <p>No sessions found. Create a new session to get started!</p>
         ) : (
            <ul className=" w-[80%] flex flex-wrap gap-4 justify-between overflow-y-auto max-md:w-full">
               {userSessions.map((session) => (
                  <li key={session.id} className="p-4 border w-[48.5%] bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow max-md:w-full">
                     <h2 className="text-xl font-semibold">{session.title}</h2>
                     <p className="text-gray-600 font-bold">Role: {session.job_role}</p>
                     <p className="text-gray-600">Experience Level: {session.experience_level}</p>
                    {session.startedAt &&  <p className="text-gray-600 text-xs">Created At: {formatDate(session.startedAt,'dd EEE MMM, yyyy')}</p>}
                     <a href={`/interview/${session.id}`} className="text-white px-3 py-1.5 rounded-md bg-blue-600 hover:underline mt-2 inline-block">
                        Continue Session{" "}
                     </a>
                  </li>
               ))}
            </ul>
         )}
      </div>
   );
};
