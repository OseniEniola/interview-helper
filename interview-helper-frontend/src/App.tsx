import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthGuard from "@/components/AuthGuard";
import Auth from "@/pages/Auth";
import InterviewCreation from "./pages/Index";
import NotFound from "./pages/NotFound";
import ActiveInterview from "./pages/ActiveInterview";
import { InterviewProvider } from "./hooks/useInterviewContext";
import { UserSessions } from "./pages/UserSessions";
import BuyMeCoffee from "./pages/BuyMeCoffee";

const queryClient = new QueryClient();

const App = () => (
   <QueryClientProvider client={queryClient}>
      <InterviewProvider>
         <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
               <Routes>
                  <Route path="/" element={<Auth />} />
                   <Route path="/buy-me-coffee" element={<BuyMeCoffee />} />
                  <Route
                     path="/interview/new"
                     element={
                        <AuthGuard>
                           <InterviewCreation />
                        </AuthGuard>
                     }
                  />
                  <Route
                     path="/interview/:sessionId"
                     element={
                        <AuthGuard>
                           <ActiveInterview />
                        </AuthGuard>
                     }
                  />
                  <Route
                     path="/interview/sessions"
                     element={
                        <AuthGuard>
                           <UserSessions />
                        </AuthGuard>
                     }
                  />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
               </Routes>
            </BrowserRouter>
         </TooltipProvider>
      </InterviewProvider>
   </QueryClientProvider>
);

export default App;
