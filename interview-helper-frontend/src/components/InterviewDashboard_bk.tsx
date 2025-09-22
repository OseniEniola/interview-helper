import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Play, 
  Pause,
  SkipForward,
  CheckCircle,
  Settings,
  Clock,
  Brain
} from 'lucide-react';
import { FileUpload } from './FileUpload';
import { VideoCall } from './VideoCall';
import { QuestionPanel } from './QuestionPanel';
import { useInterview } from '@/hooks/useInterview';
import { useToast } from '@/components/ui/use-toast';

interface SetupForm {
  title: string;
  jobRole: string;
  experienceLevel: string;
  resumeFile?: File;
  jobDescription?: string;
}

export function InterviewDashboard() {
  const { 
    session, 
    questions,
    currentQuestion, 
    currentQuestionIndex, 
    progress, 
    isLoading,
    createSession,
    submitAnswer,
    nextQuestion,
    startInterview,
    completeInterview 
  } = useInterview();
  
  const { toast } = useToast();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [setupForm, setSetupForm] = useState<SetupForm>({
    title: '',
    jobRole: '',
    experienceLevel: '',
  });

  const handleFileUpload = (type: 'resume' | 'jobDescription', content: string, file?: File) => {
    if (type === 'resume' && file) {
      setSetupForm(prev => ({ ...prev, resumeFile: file }));
    } else if (type === 'jobDescription') {
      setSetupForm(prev => ({ ...prev, jobDescription: content }));
    }
  };

  const handleStartInterview = async () => {
    if (!setupForm.title || !setupForm.jobRole || !setupForm.experienceLevel) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
     const session = await createSession({
        title: setupForm.title,
        job_role: setupForm.jobRole,
        experience_level: setupForm.experienceLevel,
        resume_file: setupForm.resumeFile,
        job_description: setupForm.jobDescription
      });
      await startInterview(session.id);
    } catch (error) {
      console.error('Failed to start interview:', error);
    }
  };

  const canStartInterview = setupForm.title && setupForm.jobRole && setupForm.experienceLevel && 
                           (setupForm.resumeFile || setupForm.jobDescription);

  // Setup Phase
  if (!session || session.status === 'setup') {
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
                  <Input
                    id="title"
                    placeholder="e.g., Frontend Developer Interview"
                    value={setupForm.title}
                    onChange={(e) => setSetupForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="jobRole">Job Role</Label>
                  <Input
                    id="jobRole"
                    placeholder="e.g., Software Engineer"
                    value={setupForm.jobRole}
                    onChange={(e) => setSetupForm(prev => ({ ...prev, jobRole: e.target.value }))}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="experience">Experience Level</Label>
                <Select value={setupForm.experienceLevel} onValueChange={(value) => 
                  setSetupForm(prev => ({ ...prev, experienceLevel: value }))
                }>
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
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Resume Upload
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FileUpload
                  type="resume"
                  onUpload={(content, file) => handleFileUpload('resume', content, file)}
                  isUploaded={!!setupForm.resumeFile}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Job Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FileUpload
                  type="jobDescription"
                  onUpload={(content) => handleFileUpload('jobDescription', content)}
                  isUploaded={!!setupForm.jobDescription}
                />
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button 
              size="lg" 
              disabled={!canStartInterview || isLoading}
              onClick={handleStartInterview}
              className="px-8 py-3 text-lg"
            >
              {isLoading ? (
                'Generating Questions...'
              ) : canStartInterview ? (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Start AI Interview
                </>
              ) : (
                'Complete Setup to Continue'
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Interview Phase
  if (session.status === 'in_progress') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold">AI Interview Session</h1>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Live
              </Badge>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {progress ? Math.ceil(progress/20) : questions.length}
              </div>
              <Progress value={progress} className="w-32" />
            </div>
          </div>
        </div>

        {/* Main Interview Area */}
        <div className="max-w-7xl mx-auto p-6">
          <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
            {/* Video Section */}
            <div className="lg:col-span-2">
              <VideoCall 
                isMuted={isMuted}
                isVideoOn={isVideoOn}
                onToggleMute={() => setIsMuted(!isMuted)}
                onToggleVideo={() => setIsVideoOn(!isVideoOn)}
              />
            </div>

            {/* Question Panel */}
            <div className="lg:col-span-1">
              <QuestionPanel 
                currentQuestion={currentQuestion}
                onNext={nextQuestion}
                currentQuestionIndex={currentQuestionIndex}
                numOfGenQuestions={questions.length}
                onSubmitAnswer={submitAnswer}
                isLast={currentQuestionIndex === questions.length - 1} // Assuming 5 questions
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Feedback phase
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-8">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Interview Complete!
          </h1>
          <p className="text-lg text-gray-600">
            Great job! Here's your AI-powered performance analysis and feedback.
          </p>
        </div>

        <Card>
          <CardContent className="p-8">
            <div className="text-lg text-gray-600">
              Your detailed AI feedback and performance analysis is ready! Each question has been evaluated with personalized suggestions for improvement.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}