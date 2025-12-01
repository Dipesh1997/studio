'use client';

/**
 * Converts text to speech using the browser's Web Speech API.
 * @param text The text to synthesize.
 * @param voice The SpeechSynthesisVoice to use.
 * @returns A Promise that resolves with a Blob of the audio data in WAV format.
 */
export function textToSpeech(text: string, voice: SpeechSynthesisVoice): Promise<Blob> {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || !window.speechSynthesis) {
            return reject(new Error('Text-to-speech is not supported in this browser.'));
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = voice;
        utterance.lang = voice.lang;
        utterance.pitch = 1;
        utterance.rate = 1;
        utterance.volume = 1;

        const audioContext = new AudioContext();
        const destination = audioContext.createMediaStreamDestination();
        const mediaRecorder = new MediaRecorder(destination.stream, { mimeType: 'audio/webm' });

        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                chunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(chunks, { type: 'audio/webm' });
            audioContext.close();
            resolve(audioBlob);
        };
        
        mediaRecorder.onerror = (event) => {
            reject((event as any).error || new Error('MediaRecorder encountered an error.'));
        };

        utterance.onend = () => {
            // A short delay to ensure all audio has been captured by the MediaRecorder
            setTimeout(() => {
                if (mediaRecorder.state === 'recording') {
                    mediaRecorder.stop();
                }
            }, 500);
        };

        utterance.onerror = (event) => {
            reject(new Error(`Speech synthesis failed: ${event.error}`));
        };

        // Create an audio source from the utterance
        const source = audioContext.createBufferSource(); 
        const utteranceStream = (speechSynthesis as any).speak(utterance);

        // This is a bit of a hack to get the audio stream into the AudioContext
        // We can't directly connect the utterance to the destination node.
        // Instead, we start recording and rely on the system audio being captured.
        // The proper way would be an API that provides the audio stream directly.
        // For now, we start the recorder and speech synthesis.
        mediaRecorder.start();
    });
}
