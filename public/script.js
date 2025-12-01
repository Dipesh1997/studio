document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT ---
    let state = {
        apiKey: localStorage.getItem('gemini_api_key') || '',
        script: '',
        voice: 'Algenib',
        videoFile: null,
        videoUrl: null,
        audioUrl: null,
        isGeneratingScript: false,
        isGeneratingAudio: false,
        isExporting: false,
    };

    // --- DOM ELEMENT REFERENCES ---
    const apiKeyInput = document.getElementById('api-key-input');
    const scriptInput = document.getElementById('script-input');
    const voiceSelect = document.getElementById('voice-select');
    const suggestScriptBtn = document.getElementById('suggest-script-btn');
    const generateAudioBtn = document.getElementById('generate-audio-btn');
    const videoUpload = document.getElementById('video-upload');
    const videoFileNameEl = document.getElementById('video-file-name');
    const audioPlayerContainer = document.getElementById('audio-player-container');
    const audioPlayer = document.getElementById('audio-player');
    const videoPreview = document.getElementById('video-preview');
    const videoPlaceholder = document.getElementById('video-placeholder');
    const exportBtn = document.getElementById('export-btn');
    
    const toast = document.getElementById('toast');
    const toastTitle = document.getElementById('toast-title');
    const toastDescription = document.getElementById('toast-description');
    const toastClose = document.getElementById('toast-close');

    // --- HELPER FUNCTIONS ---
    const showToast = (description, title = 'Error', isSuccess = false) => {
        toastTitle.textContent = title;
        toastDescription.textContent = description;
        toast.classList.remove('hidden', 'bg-red-500', 'bg-green-500');
        toast.classList.add(isSuccess ? 'bg-green-500' : 'bg-red-500');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 5000);
    };

    const toggleButtonLoading = (btn, isLoading) => {
        const textEl = btn.querySelector('.button-text');
        const iconEl = btn.querySelector('.button-icon');
        btn.disabled = isLoading;

        if (isLoading) {
            textEl.style.display = 'none';
            if(iconEl) iconEl.style.display = 'none';
            if (!btn.querySelector('.loader')) {
                const loader = document.createElement('div');
                loader.className = 'loader';
                btn.prepend(loader);
            }
        } else {
            textEl.style.display = 'inline';
            if(iconEl) iconEl.style.display = 'inline-block';
            const loader = btn.querySelector('.loader');
            if (loader) loader.remove();
        }
    };
    
    const updateUI = () => {
        apiKeyInput.value = state.apiKey;
        scriptInput.value = state.script;
        voiceSelect.value = state.voice;

        // Video file name
        if (state.videoFile) {
            videoFileNameEl.classList.remove('hidden');
            videoFileNameEl.classList.add('flex');
            videoFileNameEl.querySelector('span').textContent = state.videoFile.name;
        } else {
            videoFileNameEl.classList.add('hidden');
        }
        
        // Audio player
        if (state.audioUrl) {
            audioPlayerContainer.classList.remove('hidden');
            audioPlayer.src = state.audioUrl;
        } else {
            audioPlayerContainer.classList.add('hidden');
        }

        // Video Preview
        if (state.videoUrl) {
            videoPreview.classList.remove('hidden');
            videoPlaceholder.classList.add('hidden');
            videoPreview.src = state.videoUrl;
        } else {
            videoPreview.classList.add('hidden');
            videoPlaceholder.classList.remove('hidden');
        }
        
        // Buttons
        toggleButtonLoading(suggestScriptBtn, state.isGeneratingScript);
        toggleButtonLoading(generateAudioBtn, state.isGeneratingAudio);
        toggleButtonLoading(exportBtn, state.isExporting);
        exportBtn.disabled = !(state.videoFile && state.audioUrl) || state.isExporting;
    };
    

    // --- EVENT LISTENERS ---
    apiKeyInput.addEventListener('change', (e) => {
        state.apiKey = e.target.value;
        localStorage.setItem('gemini_api_key', state.apiKey);
    });

    scriptInput.addEventListener('input', (e) => {
        state.script = e.target.value;
    });

    voiceSelect.addEventListener('change', (e) => {
        state.voice = e.target.value;
    });

    videoUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (state.videoUrl) {
            URL.revokeObjectURL(state.videoUrl);
        }
        state.videoFile = file || null;
        state.videoUrl = file ? URL.createObjectURL(file) : null;
        updateUI();
    });

    toastClose.addEventListener('click', () => {
        toast.classList.add('hidden');
    });

    suggestScriptBtn.addEventListener('click', async () => {
        if (!state.apiKey) {
            showToast('Please enter your Gemini API Key first.');
            return;
        }
        if (!state.script.trim()) {
            showToast('Please provide a subject idea for the script.');
            return;
        }

        state.isGeneratingScript = true;
        updateUI();

        try {
            const result = await callGemini(state.script, "You are an AI assistant specialized in generating voiceover scripts. Create a concise script based on the subject: {{{subjectIdea}}}");
            state.script = result;
            updateUI();
        } catch (error) {
            showToast(error.message);
        } finally {
            state.isGeneratingScript = false;
            updateUI();
        }
    });

    generateAudioBtn.addEventListener('click', async () => {
        if (!state.apiKey) {
            showToast('Please enter your Gemini API Key first.');
            return;
        }
        if (!state.script.trim()) {
            showToast('Please enter a script to generate a voiceover.');
            return;
        }

        state.isGeneratingAudio = true;
        updateUI();

        try {
            const wavData = await generateVoiceover(state.script, state.voice, state.apiKey);
            state.audioUrl = `data:audio/wav;base64,${wavData}`;
            showToast('Voiceover generated!', 'Success', true);
        } catch (error) {
            showToast(error.message);
        } finally {
            state.isGeneratingAudio = false;
            updateUI();
        }
    });

    exportBtn.addEventListener('click', async () => {
        if (!state.videoFile || !state.audioUrl) {
            showToast('Please select a video and generate a voiceover first.');
            return;
        }
        state.isExporting = true;
        updateUI();

        try {
            const blob = await mergeAudioAndVideo(state.videoFile, state.audioUrl);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `voiceover-studio-${Date.now()}.webm`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('Export Complete. Your video has been downloaded.', 'Success', true);
        } catch (error) {
            showToast(error.message);
        } finally {
            state.isExporting = false;
            updateUI();
        }
    });

    // --- CORE LOGIC ---

    async function callGemini(prompt, systemInstruction) {
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${state.apiKey}`;

        const requestBody = {
            "contents": [{
                "parts": [{ "text": systemInstruction.replace('{{{subjectIdea}}}', prompt) }]
            }],
             "generationConfig": {
                "response_mime_type": "application/json"
            }
        };

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error.message || 'Failed to communicate with Gemini API.');
        }

        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;
        // The response is a JSON string, so we need to parse it.
        const parsed = JSON.parse(text);
        return parsed.script;
    }

    async function generateVoiceover(text, voice, apiKey) {
        const TTS_URL = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
        const requestBody = {
            input: { text: text },
            voice: { languageCode: 'en-US', name: `en-US-Standard-${voice}` },
            audioConfig: { audioEncoding: 'LINEAR16', sampleRateHertz: 24000 }
        };
        
        // This mapping is an assumption based on common patterns.
        // It might not match exactly and could be a source of errors if voices changed.
        const voiceMap = {
            'Algenib': 'en-US-Standard-C',
            'Sirius': 'en-US-Standard-D',
            'Enif': 'en-US-Standard-E',
            'Procyon': 'en-US-Standard-F',
            'King': 'en-GB-Standard-B',
            'Queen': 'en-GB-Standard-A',
            'Prince': 'en-IN-Standard-B',
            'Princess': 'en-IN-Standard-A',
        };
        
        requestBody.voice.name = voiceMap[voice] || 'en-US-Standard-C';
        if(voice.includes('GB') || voice.includes('IN')){
             requestBody.voice.languageCode = voice.startsWith('King') || voice.startsWith('Queen') ? 'en-GB' : 'en-IN';
        }


        const response = await fetch(TTS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error.message || 'Failed to generate voiceover.');
        }

        const data = await response.json();
        return data.audioContent; // This is already a base64 string
    }

    function mergeAudioAndVideo(videoFile, audioDataUri) {
        return new Promise(async (resolve, reject) => {
            try {
                const videoEl = document.createElement('video');
                const audioEl = document.createElement('audio');

                const videoUrl = URL.createObjectURL(videoFile);
                videoEl.src = videoUrl;
                videoEl.muted = true;
                audioEl.src = audioDataUri;

                await Promise.all([
                    new Promise((res, rej) => (videoEl.onloadedmetadata = res, videoEl.onerror = rej)),
                    new Promise((res, rej) => (audioEl.onloadedmetadata = res, audioEl.onerror = rej)),
                ]);

                videoEl.currentTime = 0;
                audioEl.currentTime = 0;

                const videoStream = videoEl.captureStream ? videoEl.captureStream() : videoEl.mozCaptureStream();
                const audioStream = audioEl.captureStream ? audioEl.captureStream() : audioEl.mozCaptureStream();
                
                if (!videoStream || !audioStream) {
                    return reject(new Error('Stream capture is not supported in this browser.'));
                }

                const combinedStream = new MediaStream([
                    ...videoStream.getVideoTracks(),
                    ...audioStream.getAudioTracks(),
                ]);

                const recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm' });
                const chunks = [];

                recorder.ondataavailable = (event) => {
                    if (event.data.size > 0) chunks.push(event.data);
                };

                recorder.onstop = () => {
                    const blob = new Blob(chunks, { type: 'video/webm' });
                    URL.revokeObjectURL(videoUrl);
                    resolve(blob);
                };

                recorder.onerror = (event) => reject(event.error || new Error('MediaRecorder error.'));

                recorder.start();
                await videoEl.play();
                await audioEl.play();

                videoEl.onended = () => {
                    if (recorder.state === 'recording') recorder.stop();
                };

            } catch (error) {
                reject(error);
            }
        });
    }

    // --- INITIALIZATION ---
    updateUI();
    lucide.createIcons();
});
