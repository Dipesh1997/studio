'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Camera, Video, Mic, MicOff, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

type VideoRecorderProps = {
  onRecordingComplete: (file: File) => void;
};

export function VideoRecorder({ onRecordingComplete }: VideoRecorderProps) {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const { toast } = useToast();

  useEffect(() => {
    const getCameraPermission = async () => {
      if (typeof navigator.mediaDevices?.getUserMedia !== 'function') {
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Media Devices not supported',
          description: 'Your browser does not support camera access.',
        });
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        streamRef.current = stream;
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
      }
    };

    getCameraPermission();

    return () => {
      streamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, []);

  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isAudioEnabled;
      });
    }
  }, [isAudioEnabled]);

  const startRecording = () => {
    if (streamRef.current && videoRef.current) {
      recordedChunksRef.current = [];
      const mimeType = 'video/webm';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        toast({
          variant: 'destructive',
          title: 'Unsupported format',
          description: 'WEBM video format is not supported on your browser.',
        });
        return;
      }
      mediaRecorderRef.current = new MediaRecorder(streamRef.current, { mimeType });
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const fileName = `recording-${new Date().toISOString()}.webm`;
        const file = new File([blob], fileName, { type: mimeType });
        onRecordingComplete(file);
        setIsRecording(false);
        toast({
          title: 'Recording Complete',
          description: 'Your video has been saved.',
        });
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="space-y-4">
      <div className="w-full aspect-video rounded-md bg-secondary flex items-center justify-center overflow-hidden">
        <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
      </div>
      
      {hasCameraPermission === false && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Camera Access Required</AlertTitle>
          <AlertDescription>
            Please grant camera and microphone permissions in your browser settings to record video.
          </AlertDescription>
        </Alert>
      )}

      {hasCameraPermission === null && (
         <div className="flex items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <p>Accessing camera...</p>
        </div>
      )}

      {hasCameraPermission && (
        <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={toggleRecording} className="w-full" variant={isRecording ? "destructive" : "default"}>
              {isRecording ? <Video className="mr-2" /> : <Camera className="mr-2" />}
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </Button>
            <Button onClick={() => setIsAudioEnabled(!isAudioEnabled)} variant="outline" size="icon" title={isAudioEnabled ? "Mute Microphone" : "Unmute Microphone"} disabled={isRecording}>
              {isAudioEnabled ? <Mic /> : <MicOff />}
            </Button>
        </div>
      )}
    </div>
  );
}
