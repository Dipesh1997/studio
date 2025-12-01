'use server';

/**
 * @fileOverview Text-to-Speech AI agent for generating voiceovers from text.
 *
 * This file defines a Genkit flow for generating high-quality voiceovers from a given text script.
 * It leverages Google's Text-to-Speech models to create natural-sounding audio.
 *
 * It exports:
 * - `generateVoiceoverFromText`: The main function to trigger the voiceover generation.
 * - `GenerateVoiceoverFromTextInput`: The input type, specifying the text and desired voice.
 * - `GenerateVoiceoverFromTextOutput`: The output type, containing the generated audio as a data URI.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';

const GenerateVoiceoverFromTextInputSchema = z.object({
  text: z.string().describe('The script to be converted to speech.'),
  voice: z.string().describe('The name of the prebuilt voice to use (e.g., "Algenib").'),
});
export type GenerateVoiceoverFromTextInput = z.infer<typeof GenerateVoiceoverFromTextInputSchema>;

const GenerateVoiceoverFromTextOutputSchema = z.object({
  audioDataUri: z.string().describe("The generated audio file as a data URI (e.g., 'data:audio/wav;base64,...')."),
});
export type GenerateVoiceoverFromTextOutput = z.infer<typeof GenerateVoiceoverFromTextOutputSchema>;

export async function generateVoiceoverFromText(
  input: GenerateVoiceoverFromTextInput
): Promise<GenerateVoiceoverFromTextOutput> {
  return generateVoiceoverFlow(input);
}

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

    const bufs: Buffer[] = [];
    writer.on('error', reject);
    writer.on('data', (d) => bufs.push(d));
    writer.on('end', () => resolve(Buffer.concat(bufs).toString('base64')));

    writer.write(pcmData);
    writer.end();
  });
}

const generateVoiceoverFlow = ai.defineFlow(
  {
    name: 'generateVoiceoverFlow',
    inputSchema: GenerateVoiceoverFromTextInputSchema,
    outputSchema: GenerateVoiceoverFromTextOutputSchema,
  },
  async (input) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: input.voice },
          },
        },
      },
      prompt: input.text,
    });

    if (!media?.url) {
      throw new Error('No audio media was returned from the AI model.');
    }

    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    
    const wavBase64 = await toWav(audioBuffer);

    return {
      audioDataUri: 'data:audio/wav;base64,' + wavBase64,
    };
  }
);
