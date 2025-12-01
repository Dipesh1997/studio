'use server';

import {
  suggestVoiceoverScript as suggestVoiceoverScriptFlow,
  SuggestVoiceoverScriptInput,
} from '@/ai/flows/suggest-voiceover-script';
import {
  generateVoiceoverFromText as generateVoiceoverFromTextFlow,
  GenerateVoiceoverFromTextInput,
} from '@/ai/flows/generate-voiceover-from-text';

export async function suggestVoiceoverScript(
  input: SuggestVoiceoverScriptInput
) {
  try {
    const result = await suggestVoiceoverScriptFlow(input);
    return { script: result.script };
  } catch (error: any) {
    console.error('[suggestVoiceoverScript Error]', error);
    const errorMessage = error.cause?.message || error.message || 'Failed to suggest script. Please try again.';
    return { error: errorMessage };
  }
}

export async function generateVoiceoverFromText(
  input: GenerateVoiceoverFromTextInput
) {
  try {
    const result = await generateVoiceoverFromTextFlow(input);
    return { media: result.media };
  } catch (error: any) {
    console.error('[generateVoiceoverFromText Error]', error);
    const errorMessage = error.cause?.message || error.message || 'Failed to generate voiceover. Please try again.';
    return { error: errorMessage };
  }
}
