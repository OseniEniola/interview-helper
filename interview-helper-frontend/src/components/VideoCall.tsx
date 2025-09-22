import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  Settings,
  Maximize2,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoCallProps {
  isMuted: boolean;
  isVideoOn: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
}

export function VideoCall({ isMuted, isVideoOn, onToggleMute, onToggleVideo }: VideoCallProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (isVideoOn && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.log('Error accessing camera:', err);
        });
    }
  }, [isVideoOn]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className="space-y-4">
      {/* Main Video Area */}
      <Card className="border-0 shadow-video overflow-hidden">
        <CardContent className="p-0">
          <div className="relative bg-gradient-to-br from-secondary/20 to-accent/20 aspect-video">
            {/* AI Interviewer Section */}
            <div className="absolute top-4 left-4 right-4 bg-card/90 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">AI Interviewer</h3>
                  <p className="text-sm text-muted-foreground">
                    Hello! I'm ready to conduct your interview. Take your time with each answer.
                  </p>
                </div>
                <Badge variant="secondary" className="ml-auto bg-success/10 text-success">
                  Active
                </Badge>
              </div>
            </div>

            {/* User Video Preview */}
            <div className="absolute bottom-4 right-4 w-48 h-36 bg-card border-2 border-border rounded-lg overflow-hidden shadow-lg">
              {isVideoOn ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              
              {/* Video Controls Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm p-2">
                <p className="text-white text-xs text-center">You</p>
              </div>
            </div>

            {/* Fullscreen Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Video Controls */}
      <Card className="border-0 shadow-elegant">
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-4">
            <Button
              variant={isMuted ? "destructive" : "outline"}
              size="lg"
              onClick={onToggleMute}
              className={cn(
                "w-12 h-12 rounded-full p-0",
                isMuted && "bg-destructive hover:bg-destructive/90"
              )}
            >
              {isMuted ? (
                <MicOff className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </Button>

            <Button
              variant={isVideoOn ? "outline" : "destructive"}
              size="lg"
              onClick={onToggleVideo}
              className={cn(
                "w-12 h-12 rounded-full p-0",
                !isVideoOn && "bg-destructive hover:bg-destructive/90"
              )}
            >
              {isVideoOn ? (
                <Video className="h-5 w-5" />
              ) : (
                <VideoOff className="h-5 w-5" />
              )}
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="w-12 h-12 rounded-full p-0"
            >
              <Settings className="h-5 w-5" />
            </Button>

            <div className="w-px h-8 bg-border mx-2" />

            <Button
              variant="destructive"
              size="lg"
              className="w-12 h-12 rounded-full p-0"
            >
              <Phone className="h-5 w-5" />
            </Button>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center justify-center gap-4 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-success rounded-full" />
              Connection: Excellent
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-warning rounded-full" />
              Audio: {isMuted ? 'Muted' : 'Active'}
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-primary rounded-full" />
              Video: {isVideoOn ? 'On' : 'Off'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}