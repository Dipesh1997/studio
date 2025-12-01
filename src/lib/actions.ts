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
  } catch (error) {
    console.error(error);
    return { error: 'Failed to suggest script. Please try again.' };
  }
}

export async function generateVoiceoverFromText(
  input: GenerateVoiceoverFromTextInput
) {
  try {
    const result = await generateVoiceoverFromTextFlow(input);
    return { media: result.media };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to generate voiceover. Please try again.' };
  }
}
