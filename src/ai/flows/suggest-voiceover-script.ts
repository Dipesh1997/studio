'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting voiceover scripts based on a subject idea.
 *
 * It exports:
 * - `suggestVoiceoverScript`: The main function to generate voiceover scripts.
 * - `SuggestVoiceoverScriptInput`: The input type for the `suggestVoiceoverScript` function.
 * - `SuggestVoiceoverScriptOutput`: The output type for the `suggestVoiceoverScript` function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const SuggestVoiceoverScriptInputSchema = z.object({
  subjectIdea: z.string().describe('The subject idea for the video.'),
  apiKey: z.string().optional().describe('The Gemini API key.'),
});
export type SuggestVoiceoverScriptInput = z.infer<typeof SuggestVoiceoverScriptInputSchema>;

const SuggestVoiceoverScriptOutputSchema = z.object({
  script: z.string().describe('The suggested voiceover script.'),
});
export type SuggestVoiceoverScriptOutput = z.infer<typeof SuggestVoiceoverScriptOutputSchema>;

export async function suggestVoiceoverScript(input: SuggestVoiceoverScriptInput): Promise<SuggestVoiceoverScriptOutput> {
  return suggestVoiceoverScriptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestVoiceoverScriptPrompt',
  input: { schema: z.object({ subjectIdea: SuggestVoiceoverScriptInputSchema.shape.subjectIdea }) },
  output: { schema: SuggestVoiceoverScriptOutputSchema },
  prompt: `You are an AI assistant specialized in generating voiceover scripts for videos.
  Based on the subject idea provided, create a concise and engaging script suitable for a voiceover.

  Subject Idea: {{{subjectIdea}}}

  Voiceover Script:`,
});

const suggestVoiceoverScriptFlow = ai.defineFlow(
  {
    name: 'suggestVoiceoverScriptFlow',
    inputSchema: SuggestVoiceoverScriptInputSchema,
    outputSchema: SuggestVoiceoverScriptOutputSchema,
  },
  async ({ subjectIdea, apiKey }) => {
    if (!apiKey) {
      throw new Error('Gemini API key is required.');
    }
    
    // Dynamically create a googleAI instance with the provided key
    const dynamicGoogleAI = googleAI({ apiKey });

    const { output } = await ai.run(
      {
        plugins: [dynamicGoogleAI],
      },
      async () => {
        return await prompt({ subjectIdea });
      }
    );
    
    return output!;
  }
);
