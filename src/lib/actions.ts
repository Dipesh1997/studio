'use server';

import {
  suggestVoiceoverScript as suggestVoiceoverScriptFlow,
  SuggestVoiceoverScriptInput,
} from '@/ai/flows/suggest-voiceover-script';

// This file is being kept for the "Suggest Script" functionality.
// The text-to-speech action has been moved to the client-side.

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
