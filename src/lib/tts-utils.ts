'use client';

/**
 * Converts text to speech using the browser's Web Speech API.
 * @param text The text to synthesize.
 * @param voice The SpeechSynthesisVoice to use.
 * @returns A Promise that resolves with a Blob of the audio data.
 */
export function textToSpeech(text: string, voice: SpeechSynthesisVoice): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return reject(new Error('Text-to-speech is not supported in this browser.'));
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.pitch = 1;
    utterance.rate = 1;
    utterance.volume = 1;

    let settled = false;

    // The Web Audio API capture part is tricky and can be unreliable.
    // Let's create a more robust version.

    // We need an AudioContext to capture the stream.
    // It's best practice to create it on demand.
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // This is the destination node that will receive the audio stream.
    const destination = audioContext.createMediaStreamDestination();
    const mediaRecorder = new MediaRecorder(destination.stream);
    const chunks: Blob[] = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      if (settled) return;
      settled = true;
      const audioBlob = new Blob(chunks, { type: mediaRecorder.mimeType });
      
      // Clean up the audio context
      audioContext.close().catch(console.error);

      if (audioBlob.size === 0) {
        reject(new Error("Audio generation resulted in an empty file. The selected voice may be incompatible or the browser may have prevented audio capture."));
      } else {
        resolve(audioBlob);
      }
    };

    mediaRecorder.onerror = (event) => {
      if (settled) return;
      settled = true;
      audioContext.close().catch(console.error);
      reject((event as any).error || new Error('MediaRecorder encountered an error during recording.'));
    };

    utterance.onend = () => {
      // The 'end' event can fire before all audio is processed.
      // A timeout ensures the MediaRecorder captures everything.
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 500); // 500ms grace period
    };

    utterance.onerror = (event) => {
      if (settled) return;
      settled = true;
      if (mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
      audioContext.close().catch(console.error);
      reject(new Error(`Speech synthesis failed: ${event.error}`));
    };

    // The magic part: route the speechSynthesis output to our AudioContext.
    // To do this, we create a dummy oscillator node. When the AudioContext is active,
    // some browsers route the `speechSynthesis` output to it.
    const oscillator = audioContext.createOscillator();
    // We don't want to hear the oscillator, so we don't connect it to the main context destination.
    // We only need it to kick the audio context into an "active" state.
    oscillator.connect(destination);
    
    // Start the recorder, start the dummy oscillator, then speak.
    try {
        mediaRecorder.start();
        oscillator.start(0);
        window.speechSynthesis.speak(utterance);
    } catch (e: any) {
        if (!settled) {
            settled = true;
            reject(new Error(`Failed to start audio processing: ${e.message}`));
        }
    }
  });
}
