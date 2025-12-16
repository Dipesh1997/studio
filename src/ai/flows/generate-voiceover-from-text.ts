'use server';
/**
 * @fileOverview Text-to-Speech AI agent for generating voiceovers from text.
 *
 * - generateVoiceoverFromText - A function that handles the text-to-speech process.
 * - GenerateVoiceoverFromTextInput - The input type for the generateVoiceoverFromText function.
 * - GenerateVoiceoverFromTextOutput - The return type for the generateVoiceoverFromText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';
import { googleAI } from '@genkit-ai/google-genai';

const GenerateVoiceoverFromTextInputSchema = z.object({
  text: z.string().describe('The text to convert to speech.'),
  voice: z.string().optional().describe('The voice to use for the speech.'),
  apiKey: z.string().optional().describe('The Gemini API key.'),
});
export type GenerateVoiceoverFromTextInput = z.infer<
  typeof GenerateVoiceoverFromTextInputSchema
>;

const GenerateVoiceoverFromTextOutputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "The generated audio as a data URI. Expected format: 'data:audio/wav;base64,<encoded_data>'."
    ),
});
export type GenerateVoiceoverFromTextOutput = z.infer<
  typeof GenerateVoiceoverFromTextOutputSchema
>;

export async function generateVoiceoverFromText(
  input: GenerateVoiceoverFromTextInput
): Promise<GenerateVoiceoverFromTextOutput> {
  return generateVoiceoverFromTextFlow(input);
}

const generateVoiceoverFromTextFlow = ai.defineFlow(
  {
    name: 'generateVoiceoverFromTextFlow',
    inputSchema: GenerateVoiceoverFromTextInputSchema,
    outputSchema: GenerateVoiceoverFromTextOutputSchema,
  },
  async ({text, voice, apiKey}) => {
     if (!apiKey) {
      throw new Error('Gemini API key is required.');
    }
    
    // Dynamically create a googleAI instance with the provided key
    const dynamicGoogleAI = googleAI({ apiKey });

    const {media} = await ai.run({
        plugins: [dynamicGoogleAI],
    }, async () => {
        return await ai.generate({
          model: dynamicGoogleAI.model('gemini-2.5-flash-preview-tts'),
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: voice || 'Algenib', // Default to Algenib if no voice is provided
                },
              },
            },
          },
          prompt: text,
        });
    });
    

    if (!media?.url) {
      throw new Error('No media returned from the text-to-speech model.');
    }

    const pcmData = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    const wavData = await toWav(pcmData);
    const audioDataUri = `data:audio/wav;base64,${wavData}`;

    return {audioDataUri};
  }
);

// Converts raw PCM audio data to WAV format.
async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', (d) => {
      bufs.push(d);
    });
    writer.on('end', () => {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}
