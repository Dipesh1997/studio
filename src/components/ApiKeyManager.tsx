'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Save } from 'lucide-react';

type ApiKeyManagerProps = {
  initialApiKey: string;
  onApiKeySave: (key: string) => void;
};

export function ApiKeyManager({ initialApiKey, onApiKeySave }: ApiKeyManagerProps) {
  const [apiKey, setApiKey] = useState(initialApiKey);
  const { toast } = useToast();

  const handleSave = () => {
    localStorage.setItem('gemini_api_key', apiKey);
    onApiKeySave(apiKey);
    toast({
      title: 'API Key Saved',
      description: 'Your Gemini API key has been saved locally in your browser.',
    });
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="text-primary" />
          API Key Management
        </CardTitle>
        <CardDescription>
          Enter your Gemini API key below. It will be stored locally in your browser and is required to generate scripts and voiceovers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="api-key-input">Gemini API Key</Label>
          <div className="flex gap-2">
            <Input
              id="api-key-input"
              type="password"
              placeholder="Enter your Gemini API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <Button onClick={handleSave}>
              <Save className="mr-2" />
              Save Key
            </Button>
          </div>
           <p className="text-xs text-muted-foreground">
            Get your free API key from {' '}
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
              Google AI Studio
            </a>.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
