'use client';

import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Sparkles, Mic, Video, Loader2, FileCheck, Camera, Speaker, AlertCircle } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VideoRecorder } from '@/components/VideoRecorder';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

type VoiceoverPanelProps = {
  script: string;
  setScript: Dispatch<SetStateAction<string>>;
  voice: string;
  setVoice: Dispatch<SetStateAction<string>>;
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
  voice,
  setVoice,
  onVideoSelect,
  onSuggestScript,
  onGenerateAudio,
  isGeneratingScript,
  isGeneratingAudio,
  audioUrl,
  videoFileName,
}: VoiceoverPanelProps) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);

  useEffect(() => {
    if (typeof window.speechSynthesis === 'undefined') {
      setIsSpeechSupported(false);
      return;
    }

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
        // Set a default voice if none is selected
        if (!voice && availableVoices.length > 0) {
          setVoice(availableVoices[0].voiceURI);
        }
      }
    };
    
    // Voices are loaded asynchronously
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [setVoice, voice]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    onVideoSelect(file || null);
  };

  const handleVoiceChange = (voiceURI: string) => {
    setVoice(voiceURI);
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
        {!isSpeechSupported && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Text-to-Speech Not Supported</AlertTitle>
                <AlertDescription>
                    Your browser does not support the Web Speech API, which is required for voiceover generation. Please try a different browser like Chrome or Firefox.
                </AlertDescription>
            </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="script-input">Voiceover Script</Label>
          <Textarea
            id="script-input"
            placeholder="Type your script here, or provide a subject idea and click 'Suggest Script'."
            value={script}
            onChange={(e) => setScript(e.target.value)}
            className="min-h-[150px]"
            disabled={!isSpeechSupported}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="voice-select">Voice</Label>
          <Select value={voice} onValueChange={handleVoiceChange} disabled={!isSpeechSupported || voices.length === 0}>
            <SelectTrigger id="voice-select" className="w-full">
              <div className="flex items-center gap-2">
                <Speaker />
                <SelectValue placeholder="Select a voice..." />
              </div>
            </SelectTrigger>
            <SelectContent>
              {voices.length > 0 ? voices.map((v) => (
                <SelectItem key={v.voiceURI} value={v.voiceURI}>
                  {`${v.name} (${v.lang})`}
                </SelectItem>
              )) : <SelectItem value="loading" disabled>Loading voices...</SelectItem>}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={onSuggestScript} disabled={isGeneratingScript || !isSpeechSupported} className="w-full">
            {isGeneratingScript ? <Loader2 className="animate-spin" /> : <Sparkles />}
            Suggest Script
          </Button>
          <Button onClick={onGenerateAudio} disabled={isGeneratingAudio || !isSpeechSupported} className="w-full">
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
            <Label>Video Source</Label>
            <Tabs defaultValue="upload">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload"><Video className="mr-2"/>Select Video</TabsTrigger>
                <TabsTrigger value="record"><Camera className="mr-2"/>Record Video</TabsTrigger>
              </TabsList>
              <TabsContent value="upload" className="pt-4">
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
              </TabsContent>
              <TabsContent value="record" className="pt-4">
                <VideoRecorder onRecordingComplete={onVideoSelect} />
              </TabsContent>
            </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}
