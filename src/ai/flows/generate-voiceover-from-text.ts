'use server';

// The `wav` npm package is needed for encoding raw PCM data into WAV format.
import wav from 'wav';

/**
 * @fileOverview Text-to-Speech AI agent for generating voiceovers from text using offline models.
 *
 * - generateVoiceoverFromText - A function that handles the voiceover generation process.
 * - GenerateVoiceoverFromTextInput - The input type for the generateVoiceoverFromText function.
 * - GenerateVoiceoverFromTextOutput - The return type for the generateVoiceoverFromText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateVoiceoverFromTextInputSchema = z.object({
  text: z.string().describe('The text to convert to speech.'),
});
export type GenerateVoiceoverFromTextInput = z.infer<typeof GenerateVoiceoverFromTextInputSchema>;

const GenerateVoiceoverFromTextOutputSchema = z.object({
  media: z
    .string() /* intentionally not using .describe(...) since this is a data URI */
    .describe('The generated voiceover audio as a data URI (WAV format).'),
});
export type GenerateVoiceoverFromTextOutput = z.infer<typeof GenerateVoiceoverFromTextOutputSchema>;

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
  async text => {
    const {media} = await ai.generate({
      model: 'gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {voiceName: 'Algenib'},
          },
        },
      },
      prompt: text.text,
    });

    if (!media) {
      throw new Error('no media returned');
    }
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );    
    return {
      media: 'data:audio/wav;base64,' + (await toWav(audioBuffer)),
    };
  }
);

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

    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}
