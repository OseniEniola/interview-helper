import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { InterviewService } from "@/services/interviewService";
const Auth = () => {
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   const [loading, setLoading] = useState(false);
   const { toast } = useToast();
   const navigate = useNavigate();

   useEffect(() => {
      // Check if user is already logged in
      const checkAuth = async () => {
         const userData = localStorage.getItem("userData");
         const session = userData ? JSON.parse(userData) : null;
         if (session) {
            navigate("/");
         }
      };

      checkAuth();
   }, [navigate]);

   const handleSignUp = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);

      try {
         const { error } = await InterviewService.signup(email, password);
         if (error) throw error;

         toast({
            title: "Check your email",
            description: "We've sent you a confirmation link.",
         });
      } catch (error: any) {
         toast({
            variant: "destructive",
            title: "Error",
            description: error.message,
         });
      } finally {
         setLoading(false);
      }
   };

   const handleSignIn = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);

      try {
         const { data: user } = await InterviewService.login(email, password);
         localStorage.setItem("userData", JSON.stringify(user.data));
         navigate("/interview/sessions");

         // Navigation will be handled by auth state change listener
      } catch (error: any) {
         toast({
            variant: "destructive",
            title: "Error",
            description: error.message,
         });
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex flex-col gap-5 items-center justify-center p-4">
         <Card className="w-full max-w-md">
            <CardHeader className="text-center">
               <CardTitle>AI Interview Platform</CardTitle>
               <CardDescription>Sign in to access your interview dashboard</CardDescription>
            </CardHeader>
            <CardContent>
               <Tabs defaultValue="signin" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                     <TabsTrigger value="signin">Sign In</TabsTrigger>
                     <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  </TabsList>

                  <TabsContent value="signin">
                     <form onSubmit={handleSignIn} className="space-y-4">
                        <div className="space-y-2">
                           <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                           <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                           {loading ? "Signing In..." : "Sign In"}
                        </Button>
                     </form>
                  </TabsContent>

                  <TabsContent value="signup">
                     <form onSubmit={handleSignUp} className="space-y-4">
                        <div className="space-y-2">
                           <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                           <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                           {loading ? "Creating Account..." : "Sign Up"}
                        </Button>
                     </form>
                  </TabsContent>
               </Tabs>
            </CardContent>
         </Card>
         <a className="underline flex items-center text-sm gap-2" href="/buy-me-coffee">
            <i className="fa-solid fa-mug-hot  text-amber-800"></i>Buy me a coffee
         </a>
      </div>
   );
};

export default Auth;
