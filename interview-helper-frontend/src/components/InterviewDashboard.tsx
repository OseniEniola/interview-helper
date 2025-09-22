import  {  useState } from 'react';

import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

import { VideoCall } from './VideoCall';
import { QuestionPanel } from './QuestionPanel';

import { useInterviewContext } from '@/hooks/useInterviewContext';
import AiFeedBack from './AiFeedback';
import BackIcon from './ui/back-icon';



export function InterviewDashboard() {
  const { 
    questions,
    currentQuestionIndex, 
    progress, 
    nextQuestion, 
  } = useInterviewContext();
  

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);


  // Interview Phase
  if (questions.length > 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a href='/interview/sessions' className={'flex items-center font-semibold justify-center shadow cursor-pointer p-2 rounded-sm gap-2 text-sm'}><BackIcon width={16} height={16}/> <span>View sessions</span></a>
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
              <VideoCall 
                isMuted={isMuted}
                isVideoOn={isVideoOn}
                onToggleMute={() => setIsMuted(!isMuted)}
                onToggleVideo={() => setIsVideoOn(!isVideoOn)}
              />

              <div className='mt-6'>
                <AiFeedBack />
              </div>
            </div>

            {/* Question Panel */}
            <div className="lg:col-span-1">
              <QuestionPanel 
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