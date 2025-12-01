'use client';

export function mergeAudioAndVideo(videoFile: File, audioDataUri: string): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    try {
      // 1. Create media elements
      const videoEl = document.createElement('video');
      const audioEl = document.createElement('audio');

      const videoUrl = URL.createObjectURL(videoFile);
      videoEl.src = videoUrl;
      videoEl.muted = true;
      audioEl.src = audioDataUri;

      // 2. Wait for media to be ready
      await Promise.all([
        new Promise((res, rej) => (videoEl.onloadedmetadata = res, videoEl.onerror = rej)),
        new Promise((res, rej) => (audioEl.onloadedmetadata = res, audioEl.onerror = rej)),
      ]);

      const videoDuration = videoEl.duration;
      audioEl.currentTime = 0; // Ensure audio starts from the beginning

      // 3. Set up media streams
      const videoStream = (videoEl as any).captureStream() || (videoEl as any).mozCaptureStream();
      const audioStream = (audioEl as any).captureStream() || (audioEl as any).mozCaptureStream();

      if (!videoStream || !audioStream) {
        return reject(new Error('Stream capture is not supported in this browser.'));
      }

      const audioTracks = audioStream.getAudioTracks();
      if (audioTracks.length === 0) {
        return reject(new Error('The provided audio source has no audio tracks.'));
      }

      // 4. Set up MediaRecorder
      const combinedStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...audioTracks,
      ]);

      const mimeType = 'video/webm';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        return reject(new Error(`${mimeType} is not supported on your browser.`));
      }

      const recorder = new MediaRecorder(combinedStream, { mimeType });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        URL.revokeObjectURL(videoUrl); // Clean up the object URL
        resolve(blob);
      };

      recorder.onerror = (event) => {
        reject((event as any).error || new Error('MediaRecorder encountered an error.'));
      };
      
      // 5. Start playback and recording
      recorder.start();
      await videoEl.play();
      await audioEl.play();

      // 6. Stop recording when the video ends
      // Use a timeout as a reliable way to stop the recorder
      setTimeout(() => {
        if (recorder.state === 'recording') {
            recorder.stop();
        }
      }, videoDuration * 1000);

    } catch (error) {
      reject(error);
    }
  });
}
