import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Settings, Clock, Brain } from "lucide-react";
import { FileUpload } from "./FileUpload";
import { useInterview } from "@/hooks/useInterview";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

interface SetupForm {
   title: string;
   jobRole: string;
   experienceLevel: string;
   resumeFile?: File;
   numberQuestions?: number;
   jobDescription?: string;
   isCodingAssesment?: boolean;
}

export function InterviewSetup() {
   const {
      isLoading,
      createSession,

      startInterview,
   } = useInterview();

   const navigate = useNavigate();

   const { toast } = useToast();
   const [setupForm, setSetupForm] = useState<SetupForm>({
      title: "",
      jobRole: "",
      experienceLevel: "",
      numberQuestions: 5,
      isCodingAssesment: false,
   });

   const handleFileUpload = (type: "resume" | "jobDescription", content: string, file?: File) => {
      if (type === "resume" && file) {
         setSetupForm((prev) => ({ ...prev, resumeFile: file }));
      } else if (type === "jobDescription") {
         setSetupForm((prev) => ({ ...prev, jobDescription: content }));
      }
   };

   const handleStartInterview = async () => {
      if (!setupForm.title || !setupForm.jobRole || !setupForm.experienceLevel) {
         toast({
            title: "Missing Information",
            description: "Please fill in all required fields",
            variant: "destructive",
         });
         return;
      }

      try {
         const session = await createSession({
            title: setupForm.title,
            job_role: setupForm.jobRole,
            experience_level: setupForm.experienceLevel,
            resume_file: setupForm.resumeFile,
            job_description: setupForm.jobDescription,
            number_questions: setupForm.numberQuestions,
            isLiveCoding: setupForm.isCodingAssesment,
         });
         await startInterview(session.id).then(() => {
            navigate(`/interview/${session.id}`);
         });
      } catch (error) {
         console.error("Failed to start interview:", error);
      }
   };

   const canStartInterview = setupForm.title && setupForm.jobRole && setupForm.experienceLevel && setupForm.numberQuestions && (setupForm.resumeFile || setupForm.jobDescription);

   return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
         <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
               <div className="flex items-center justify-center gap-2 mb-4">
                  <Brain className="h-8 w-8 text-indigo-600" />
                  <h1 className="text-3xl font-bold text-gray-900">AI Interview Simulator</h1>
               </div>
               <p className="text-lg text-gray-600">Practice with AI-powered interview questions</p>
            </div>

            <Card className="mb-6">
               <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                     <Settings className="h-5 w-5" />
                     Interview Setup
                  </CardTitle>
               </CardHeader>
               <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                     <div>
                        <Label htmlFor="title">Interview Title</Label>
                        <Input id="title" placeholder="e.g., Frontend Developer Interview" value={setupForm.title} onChange={(e) => setSetupForm((prev) => ({ ...prev, title: e.target.value }))} />
                     </div>
                     <div>
                        <Label htmlFor="jobRole">Job Role</Label>
                        <Input id="jobRole" placeholder="e.g., Software Engineer" value={setupForm.jobRole} onChange={(e) => setSetupForm((prev) => ({ ...prev, jobRole: e.target.value }))} />
                     </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                     <div>
                        <Label htmlFor="experience">Experience Level</Label>
                        <Select value={setupForm.experienceLevel} onValueChange={(value) => setSetupForm((prev) => ({ ...prev, experienceLevel: value }))}>
                           <SelectTrigger>
                              <SelectValue placeholder="Select experience level" />
                           </SelectTrigger>
                           <SelectContent>
                              <SelectItem value="entry">Entry Level (0-2 years)</SelectItem>
                              <SelectItem value="mid">Mid Level (3-5 years)</SelectItem>
                              <SelectItem value="senior">Senior Level (6+ years)</SelectItem>
                           </SelectContent>
                        </Select>
                     </div>
                     <div>
                        <Label htmlFor="numberQuestions">Number of Questions</Label>
                        <Input
                           type="number"
                           id="numberQuestions"
                           placeholder="e.g., 5"
                           disabled={setupForm.isCodingAssesment}
                           value={setupForm.numberQuestions}
                           max={6}
                           onChange={(e) => {
                              const value = parseInt(e.target.value, 10);

                              // Only update if it's a number and less than or equal to 6
                              if (!isNaN(value)) {
                                 setSetupForm((prev) => ({
                                    ...prev,
                                    numberQuestions: value > 6 ? 6 : value,
                                 }));
                              } else {
                                 // Handle empty input (if user deletes)
                                 setSetupForm((prev) => ({...prev,numberQuestions: NaN,}));
                              }
                           }}
                        />
                     </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                     <div className="flex items-center gap-2">
                        <Input className="w-3" id="isCodingAssesment" type="checkbox" checked={setupForm.isCodingAssesment} onChange={(e) => setSetupForm((prev) => ({ ...prev, numberQuestions: 1, isCodingAssesment: e.target.checked }))} />
                        <Label htmlFor="numberQuestions">Setup live coding assessment</Label>
                     </div>
                  </div>
               </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
               <Card>
                  <CardHeader>
                     <CardTitle className="text-lg">Resume Upload</CardTitle>
                  </CardHeader>
                  <CardContent>
                     <FileUpload type="resume" onUpload={(content, file) => handleFileUpload("resume", content, file)} isUploaded={!!setupForm.resumeFile} />
                  </CardContent>
               </Card>

               <Card>
                  <CardHeader>
                     <CardTitle className="text-lg">Job Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                     <FileUpload type="jobDescription" onUpload={(content) => handleFileUpload("jobDescription", content)} isUploaded={!!setupForm.jobDescription} />
                  </CardContent>
               </Card>
            </div>

            <div className="text-center">
               <Button size="lg" disabled={!canStartInterview || isLoading} onClick={handleStartInterview} className="px-8 py-3 text-lg">
                  {isLoading ? (
                     "Generating Questions..."
                  ) : canStartInterview ? (
                     <>
                        <Play className="h-5 w-5 mr-2" />
                        Start AI Interview
                     </>
                  ) : (
                     "Complete Setup to Continue"
                  )}
               </Button>
            </div>
         </div>
      </div>
   );
}
