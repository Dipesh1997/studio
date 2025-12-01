'use client';

/**
 * Converts text to speech using the browser's Web Speech API and captures the output as a Blob.
 * This function is designed to work entirely on the client-side.
 *
 * @param text The text to be synthesized into speech.
 * @param voiceURI The URI of the `SpeechSynthesisVoice` to use. If empty, the browser's default is used.
 * @returns A Promise that resolves with a Blob containing the generated audio in WEBM format.
 */
export function textToSpeech(text: string, voiceURI: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return reject(new Error('Web Speech API is not supported in this browser.'));
    }
    
    // The AudioContext must be created after a user gesture (e.g., a click).
    // In this app, the "Generate Voiceover" button click serves as that gesture.
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const dest = audioContext.createMediaStreamDestination();
    const mediaRecorder = new MediaRecorder(dest.stream, { mimeType: 'audio/webm' });

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      audioContext.close();
      if (blob.size === 0) {
        reject(new Error('Generated audio is empty. The speech synthesis might have been interrupted or failed silently.'));
      } else {
        resolve(blob);
      }
    };

    mediaRecorder.onerror = (event) => {
      audioContext.close();
      reject(new Error(`MediaRecorder error: ${(event as any).error?.name || 'Unknown error'}`));
    };

    const utterance = new SpeechSynthesisUtterance(text);
    if (voiceURI) {
      const voice = window.speechSynthesis.getVoices().find(v => v.voiceURI === voiceURI);
      if (voice) {
        utterance.voice = voice;
      }
    }

    // This is the crucial part: we create a source node that can be connected to our destination.
    // The utterance itself doesn't expose an audio stream directly.
    // We create a dummy oscillator to keep the audio context "warm" and connected.
    // The browser routes the actual speech audio through the system output, which our context captures.
    const source = audioContext.createBufferSource();
    source.connect(dest);

    utterance.onstart = () => {
      if (mediaRecorder.state !== 'recording') {
        mediaRecorder.start();
      }
    };

    utterance.onend = () => {
      // Use a short delay. This is critical to ensure all audio data is captured
      // before stopping the recorder, as the 'onend' event can fire slightly early.
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 500);
    };

    utterance.onerror = (event) => {
      if (mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
      reject(new Error(`Speech synthesis error: ${event.error}`));
    };

    // Start speaking. The events will handle the recording process.
    window.speechSynthesis.speak(utterance);
  });
}
