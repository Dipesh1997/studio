import { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Download, Video, Loader2 } from 'lucide-react';

type PreviewPanelProps = {
  videoUrl: string | null;
  audioUrl: string | null;
  isExporting: boolean;
  onExport: () => void;
};

export function PreviewPanel({ videoUrl, audioUrl, isExporting, onExport }: PreviewPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video || !audio) return;

    const playAudio = () => {
      if (Math.abs(video.currentTime - audio.currentTime) > 0.2) {
        audio.currentTime = video.currentTime;
      }
      audio.play();
    };
    const pauseAudio = () => audio.pause();
    const seekAudio = () => audio.currentTime = video.currentTime;

    video.addEventListener('play', playAudio);
    video.addEventListener('pause', pauseAudio);
    video.addEventListener('ended', pauseAudio);
    video.addEventListener('seeking', seekAudio);
    
    // Initial sync
    seekAudio();

    return () => {
      video.removeEventListener('play', playAudio);
      video.removeEventListener('pause', pauseAudio);
      video.removeEventListener('ended', pauseAudio);
      video.removeEventListener('seeking', seekAudio);
    };
  }, [videoUrl, audioUrl]);

  const isReadyForPreview = videoUrl && audioUrl;

  return (
    <Card className="shadow-lg sticky top-24">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="text-primary" />
          Preview & Export
        </CardTitle>
        <CardDescription>
          Use the video controls to preview. The original audio is muted.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="aspect-video w-full bg-secondary rounded-lg flex items-center justify-center overflow-hidden">
          {isReadyForPreview ? (
            <video
              ref={videoRef}
              src={videoUrl!}
              muted
              controls
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-center text-muted-foreground p-4">
              <Video className="mx-auto h-12 w-12 mb-2" />
              <p>Generate a voiceover and select a video to see the preview here.</p>
            </div>
          )}
          {audioUrl && <audio ref={audioRef} src={audioUrl} className="hidden" />}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={onExport} disabled={!isReadyForPreview || isExporting} className="w-full">
            {isExporting ? <Loader2 className="animate-spin" /> : <Download />}
            Export Video
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center">Note: Exported video will be in .webm format.</p>
      </CardContent>
    </Card>
  );
}
