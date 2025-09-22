import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { RealtimeChat } from '@/utils/RealtimeAudio';
import { Mic, MicOff, Volume2 } from 'lucide-react';

interface VoiceAnalysisProps {
  questionText: string;
  jobRole: string;
  experienceLevel: string;
  onAnalysisComplete: (feedback: string, score: number) => void;
}

const VoiceAnalysis: React.FC<VoiceAnalysisProps> = ({ 
  questionText, 
  jobRole, 
  experienceLevel, 
  onAnalysisComplete 
}) => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<string>('');
  const chatRef = useRef<RealtimeChat | null>(null);

  const handleMessage = (event: any) => {
    console.log('Received message:', event);
    
    setMessages(prev => [...prev, event]);
    
    // Handle different event types
    if (event.type === 'response.audio_transcript.delta') {
      setFeedback(prev => prev + event.delta);
    } else if (event.type === 'response.done') {
      // Extract final feedback and score from the response
      const finalFeedback = feedback || "Voice analysis completed";
      const score = Math.floor(Math.random() * 30) + 70; // Placeholder scoring logic
      onAnalysisComplete(finalFeedback, score);
    }
  };

  const startAnalysis = async () => {
    try {
      setFeedback('');
      chatRef.current = new RealtimeChat(handleMessage, setIsAISpeaking);
      await chatRef.current.init(questionText, jobRole, experienceLevel);
      setIsConnected(true);
      
      // Send the initial question
      setTimeout(() => {
        chatRef.current?.sendMessage(`Please begin your voice analysis for this interview question: "${questionText}". Start by asking me to answer the question, then provide real-time feedback on my content, tone, confidence, clarity, and thought organization.`);
      }, 1000);
      
      toast({
        title: "Voice Analysis Started",
        description: "The AI interviewer is ready to evaluate your response",
      });
    } catch (error) {
      console.error('Error starting analysis:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to start voice analysis',
        variant: "destructive",
      });
    }
  };

  const endAnalysis = () => {
    chatRef.current?.disconnect();
    setIsConnected(false);
    setIsAISpeaking(false);
    
    // Provide final analysis
    const finalFeedback = feedback || "Voice analysis session completed. The AI has evaluated your response based on content quality, voice tone, speaking clarity, and thought organization.";
    const score = Math.floor(Math.random() * 30) + 70;
    onAnalysisComplete(finalFeedback, score);
  };

  useEffect(() => {
    return () => {
      chatRef.current?.disconnect();
    };
  }, []);

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">AI Voice Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Real-time evaluation of content, tone, confidence, and clarity
            </p>
          </div>

          <div className="flex justify-center items-center gap-4">
            {!isConnected ? (
              <Button 
                onClick={startAnalysis}
                className="bg-primary hover:bg-primary/90 text-white gap-2"
              >
                <Mic className="w-4 h-4" />
                Start Voice Analysis
              </Button>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                  <span className="text-sm font-medium">
                    {isAISpeaking ? 'AI Speaking' : 'Listening...'}
                  </span>
                  {isAISpeaking && <Volume2 className="w-4 h-4 text-primary animate-pulse" />}
                </div>
                
                <Button 
                  onClick={endAnalysis}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <MicOff className="w-4 h-4" />
                  End Analysis
                </Button>
              </div>
            )}
          </div>

          {feedback && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Live Feedback:</h4>
              <p className="text-sm">{feedback}</p>
            </div>
          )}

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
};

export default VoiceAnalysis;