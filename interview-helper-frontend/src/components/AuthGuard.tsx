import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface AuthGuardProps {
   children: React.ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
   const [user, setUser] = useState<User | null>(null);
   const [session, setSession] = useState<Session | null>(null);
   const [loading, setLoading] = useState(true);
   const navigate = useNavigate();

   useEffect(() => {
     const user = localStorage.getItem('userData');
     setUser(user ? JSON.parse(user) : null);
     setLoading(false);  
    
   }, []);

   const handleSignOut = async () => {
      try {
         await supabase.auth.signOut();
         navigate("/auth");
      } catch (error) {
         console.error("Error signing out:", error);
      }
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

   if (!user) {
      navigate("/auth");
      return (
         <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
               <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
               <p className="mt-4 text-muted-foreground">Redirecting to login...</p>
            </div>
         </div>
      );
   }

   return (
      <div className="min-h-screen">
         <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center justify-between max-md:flex-col max-md:mt-4 max-md:h-auto max-md:pb-5">
               <h1 className="text-lg font-semibold">AI Interview Platform</h1>
               <div className="flex items-center gap-4 max-md:flex-wrap">
                 <a href="/buy-me-coffee"> <Button variant="outline" size="sm">
                   <i className="fa-solid fa-mug-hot  text-amber-800"></i> Buy me a coffee
                  </Button></a>
                  <span className="text-sm text-muted-foreground">{user.email}</span>
                  <Button variant="outline" size="sm" onClick={handleSignOut}>
                     Sign Out
                  </Button>
                  <a>
                      <Button variant="outline" size="sm" onClick={() => navigate('/interview/new')}>
                    Start New Session
                  </Button>
                  </a>
               </div>
            </div>
         </header>
         <main className="container py-6 max-md:py-2 max-md:px-2">{children}</main>
      </div>
   );
};

export default AuthGuard;
