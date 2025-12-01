'use client';

export function mergeAudioAndVideo(videoFile: File, audioDataUri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const videoUrl = URL.createObjectURL(videoFile);
    const videoEl = document.createElement('video');
    const audioEl = document.createElement('audio');

    videoEl.src = videoUrl;
    videoEl.muted = true;
    audioEl.src = audioDataUri;

    let videoReady = false;
    let audioReady = false;
    let recorder: MediaRecorder | null = null;
    
    const timeoutId = setTimeout(() => {
      reject(new Error("Media loading timed out after 20 seconds. Please try a smaller file."));
    }, 20000);

    const tryStart = () => {
      if (videoReady && audioReady) {
        clearTimeout(timeoutId);

        const videoStream = (videoEl as any).captureStream() || (videoEl as any).mozCaptureStream();
        const audioStream = (audioEl as any).captureStream() || (audioEl as any).mozCaptureStream();

        if (!videoStream || !audioStream) {
            return reject(new Error('Could not capture media streams. Your browser might not be supported.'));
        }

        const combinedStream = new MediaStream([
          ...videoStream.getTracks(),
          ...audioStream.getTracks(),
        ]);
        
        const mimeType = 'video/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          return reject(new Error(`${mimeType} is not supported on your browser.`));
        }

        recorder = new MediaRecorder(combinedStream, { mimeType });
        const chunks: BlobPart[] = [];

        recorder.ondataavailable = e => {
            if (e.data.size > 0) {
                chunks.push(e.data);
            }
        };
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          URL.revokeObjectURL(videoUrl);
          resolve(blob);
        };
        recorder.onerror = e => {
          URL.revokeObjectURL(videoUrl);
          reject((e as any).error || new Error('MediaRecorder encountered an error.'));
        };

        videoEl.play().catch(e => reject(e));
        audioEl.play().catch(e => reject(e));
        recorder.start();
      }
    };

    videoEl.oncanplaythrough = () => {
      videoReady = true;
      tryStart();
    };

    audioEl.oncanplaythrough = () => {
      audioReady = true;
      tryStart();
    };

    videoEl.onended = () => {
      if (recorder?.state === 'recording') {
        recorder.stop();
      }
      audioEl.pause();
    };
    
    videoEl.onerror = () => {
        clearTimeout(timeoutId);
        reject(new Error('Failed to load video file. It may be corrupt or in an unsupported format.'));
    }
    audioEl.onerror = () => {
        clearTimeout(timeoutId);
        reject(new Error('Failed to load generated audio data.'));
    }
    
    videoEl.load();
    audioEl.load();
  });
}
