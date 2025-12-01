'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { VoiceoverPanel } from '@/components/VoiceoverPanel';
import { PreviewPanel } from '@/components/PreviewPanel';
import { useToast } from '@/hooks/use-toast';
import { suggestVoiceoverScript } from '@/lib/actions';
import { mergeAudioAndVideo } from '@/lib/video-utils';
import { textToSpeech } from '@/lib/tts-utils';

export default function Home() {
  const [script, setScript] = useState('');
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { toast } = useToast();

  const handleVideoSelect = (file: File | null) => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
      setVideoUrl(null);
    }
    setVideoFile(file);
    if (file) {
      setVideoUrl(URL.createObjectURL(file));
    }
  };
  
  const handleSuggestScript = async () => {
    if (!script.trim()) {
      toast({
        title: 'Idea Required',
        description: 'Please provide a subject idea for the script.',
        variant: 'destructive',
      });
      return;
    }
    setIsGeneratingScript(true);
    const result = await suggestVoiceoverScript({ subjectIdea: script });
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      setScript(result.script || '');
    }
    setIsGeneratingScript(false);
  };
  
  const handleGenerateAudio = async () => {
    if (!script.trim()) {
      toast({
        title: 'Script Required',
        description: 'Please enter a script to generate a voiceover.',
        variant: 'destructive',
      });
      return;
    }
    if (!voice) {
        toast({
            title: 'Voice Required',
            description: 'Please select a voice from the dropdown.',
            variant: 'destructive',
        });
        return;
    }

    setIsGeneratingAudio(true);
    try {
      const audioBlob = await textToSpeech(script, voice);
      const newAudioUrl = URL.createObjectURL(audioBlob);
      setAudioUrl(newAudioUrl);
      toast({ title: 'Success', description: 'Voiceover generated!' });
    } catch (error: any) {
      console.error(error);
      toast({ title: 'Error', description: error.message || 'Failed to generate voiceover.', variant: 'destructive' });
    } finally {
        setIsGeneratingAudio(false);
    }
  };

  const handleExport = async () => {
    if (!videoFile || !audioUrl) {
      toast({ title: 'Missing files', description: 'Please select a video and generate a voiceover first.', variant: 'destructive' });
      return;
    }
    setIsExporting(true);
    try {
      const blob = await mergeAudioAndVideo(videoFile, audioUrl);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voiceover-studio-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: 'Export Complete', description: 'Your video has been downloaded.' });
    } catch (error: any) {
      console.error(error);
      toast({ title: 'Export Failed', description: error.message || 'An unknown error occurred.', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <VoiceoverPanel
            script={script}
            setScript={setScript}
            voice={voice}
            setVoice={setVoice}
            onVideoSelect={handleVideoSelect}
            onSuggestScript={handleSuggestScript}
            onGenerateAudio={handleGenerateAudio}
            isGeneratingScript={isGeneratingScript}
            isGeneratingAudio={isGeneratingAudio}
            audioUrl={audioUrl}
            videoFileName={videoFile?.name}
          />
          <PreviewPanel
            videoUrl={videoUrl}
            audioUrl={audioUrl}
            isExporting={isExporting}
            onExport={handleExport}
          />
        </div>
      </main>
    </div>
  );
}
