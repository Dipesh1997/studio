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

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = voice;
        utterance.lang = voice.lang;
        utterance.pitch = 1;
        utterance.rate = 1;
        utterance.volume = 1;

        let audioContext: AudioContext;
        let mediaRecorder: MediaRecorder;
        let destination: MediaStreamAudioDestinationNode;
        const chunks: Blob[] = [];

        try {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            destination = audioContext.createMediaStreamDestination();
            mediaRecorder = new MediaRecorder(destination.stream);
        } catch (e) {
            return reject(new Error("Could not create audio recording context. Your browser might not be supported."));
        }


        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                chunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(chunks, { type: mediaRecorder.mimeType });
            audioContext.close().catch(console.error);
            resolve(audioBlob);
        };
        
        mediaRecorder.onerror = (event) => {
            audioContext.close().catch(console.error);
            reject((event as any).error || new Error('MediaRecorder encountered an error.'));
        };

        utterance.onend = () => {
            // A short delay to ensure all audio has been captured by the MediaRecorder
            setTimeout(() => {
                if (mediaRecorder.state === 'recording') {
                    mediaRecorder.stop();
                }
            }, 300);
        };

        utterance.onerror = (event) => {
            if (mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
            }
            audioContext.close().catch(console.error);
            reject(new Error(`Speech synthesis failed: ${event.error}`));
        };
        
        // This is a workaround to get the audio stream into the AudioContext
        const source = audioContext.createBufferSource();
        // This is a dummy source, we just need to connect something to the destination.
        // The real audio comes from the speech synthesis utterance.
        source.connect(destination);
        
        // Start the recorder and then the speech synthesis
        mediaRecorder.start();
        window.speechSynthesis.speak(utterance);
    });
}
