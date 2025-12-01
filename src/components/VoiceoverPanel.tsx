'use client';

import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Sparkles, Mic, Video, Loader2, FileCheck, Camera, Speaker } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VideoRecorder } from '@/components/VideoRecorder';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// High-quality voices from Google's Text-to-Speech API
const VOICES = [
    { name: 'Algenib (Male, US English)', value: 'Algenib' },
    { name: 'Sirius (Male, US English)', value: 'Sirius' },
    { name: 'Enif (Female, US English)', value: 'Enif' },
    { name: 'Procyon (Female, US English)', value: 'Procyon' },
    { name: 'King (Male, British English)', value: 'King' },
    { name: 'Queen (Female, British English)', value: 'Queen' },
    { name: 'Prince (Male, Indian English)', value: 'Prince' },
    { name: 'Princess (Female, Indian English)', value: 'Princess' },
];


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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    onVideoSelect(file || null);
  };

  const handleVoiceChange = (voiceValue: string) => {
    setVoice(voiceValue);
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

        <div className="space-y-2">
          <Label htmlFor="voice-select">Voice</Label>
          <Select value={voice} onValueChange={handleVoiceChange}>
            <SelectTrigger id="voice-select" className="w-full">
              <div className="flex items-center gap-2">
                <Speaker />
                <SelectValue placeholder="Select a voice..." />
              </div>
            </SelectTrigger>
            <SelectContent>
              {VOICES.map((v) => (
                <SelectItem key={v.value} value={v.value}>
                  {v.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
