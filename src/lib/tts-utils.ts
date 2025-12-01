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
            // Use a flag to ensure we only resolve or reject once
            let settled = false;
            
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            destination = audioContext.createMediaStreamDestination();
            
            // Create a GainNode to route the audio
            const gainNode = audioContext.createGain();
            gainNode.connect(destination);
            
            // This is the magic part: We need an audio source to get SpeechSynthesis to output to the Web Audio API
            // We can't directly get the stream, so we use a dummy oscillator node.
            // The browser will then route the speechSynthesis output to this context.
            const oscillator = audioContext.createOscillator();
            oscillator.connect(gainNode);

            mediaRecorder = new MediaRecorder(destination.stream);
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                if (settled) return;
                settled = true;
                const audioBlob = new Blob(chunks, { type: mediaRecorder.mimeType });
                audioContext.close().catch(console.error);
                if (audioBlob.size === 0) {
                    reject(new Error("Audio generation resulted in an empty file. The selected voice may be incompatible."));
                } else {
                    resolve(audioBlob);
                }
            };
            
            mediaRecorder.onerror = (event) => {
                if (settled) return;
                settled = true;
                audioContext.close().catch(console.error);
                reject((event as any).error || new Error('MediaRecorder encountered an error.'));
            };

            utterance.onend = () => {
                // A short delay to ensure all audio has been captured by the MediaRecorder
                setTimeout(() => {
                    if (mediaRecorder.state === 'recording') {
                        mediaRecorder.stop();
                    }
                }, 500); // Increased delay slightly for safety
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
            
            // Start the recorder and then the speech synthesis
            mediaRecorder.start();
            window.speechSynthesis.speak(utterance);

        } catch (e: any) {
            reject(new Error(`Could not create audio context. Your browser might not be supported. Error: ${e.message}`));
        }
    });
}
