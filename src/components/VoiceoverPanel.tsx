import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Sparkles, Mic, Video, Loader2, FileCheck } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';

type VoiceoverPanelProps = {
  script: string;
  setScript: Dispatch<SetStateAction<string>>;
  onVideoSelect: (file: File | null) => void;
  onSuggestScript: () => void;
  onGenerateAudio: () => void;
  isGeneratingScript: boolean;
  isGeneratingAudio: boolean;
  audioUrl: string | null;
  videoFileName: string | undefined;
};

export function VoiceoverPanel({
  script,
  setScript,
  onVideoSelect,
  onSuggestScript,
  onGenerateAudio,
  isGeneratingScript,
  isGeneratingAudio,
  audioUrl,
  videoFileName,
}: VoiceoverPanelProps) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    onVideoSelect(file || null);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="text-primary" />
          Create Voiceover
        </CardTitle>
        <CardDescription>
          Generate a script, convert it to speech, and select a video to apply it to.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="script-input">Voiceover Script</Label>
          <Textarea
            id="script-input"
            placeholder="Type your script here, or provide a subject idea and click 'Suggest Script'."
            value={script}
            onChange={(e) => setScript(e.target.value)}
            className="min-h-[150px]"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={onSuggestScript} disabled={isGeneratingScript} className="w-full">
            {isGeneratingScript ? <Loader2 className="animate-spin" /> : <Sparkles />}
            Suggest Script
          </Button>
          <Button onClick={onGenerateAudio} disabled={isGeneratingAudio} className="w-full">
            {isGeneratingAudio ? <Loader2 className="animate-spin" /> : <Mic />}
            Generate Voiceover
          </Button>
        </div>
        
        {audioUrl && (
          <div className="space-y-2">
            <Label>Generated Audio</Label>
            <audio controls src={audioUrl} className="w-full" />
          </div>
        )}

        <div className="space-y-2">
            <Label htmlFor="video-upload">Select Video</Label>
            <div className="flex items-center gap-4">
                <Button asChild variant="outline" className="flex-shrink-0">
                    <label htmlFor="video-upload" className="cursor-pointer flex items-center gap-2">
                        <Video />
                        <span>Choose Video</span>
                    </label>
                </Button>
                {videoFileName && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground truncate">
                        <FileCheck className="text-green-500 h-5 w-5" />
                        <span className="truncate" title={videoFileName}>{videoFileName}</span>
                    </div>
                )}
            </div>
            <Input
              id="video-upload"
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="hidden"
            />
        </div>
      </CardContent>
    </Card>
  );
}
