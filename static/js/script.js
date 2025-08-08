document.addEventListener('DOMContentLoaded', function() {
    const songInput = document.getElementById('songInput');
    const userFileInput = document.getElementById('userFileInput');
    const recordBtn = document.getElementById('recordBtn');
    const userAudio = document.getElementById('userAudio');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const resultContainer = document.getElementById('resultContainer');
    const songFileInfo = document.getElementById('songFileInfo');
    const userFileInfo = document.getElementById('userFileInfo');
    
    let mediaRecorder;
    let audioChunks = [];
    let userBlob = null;
    
    // Update file info display
    songInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            songFileInfo.textContent = this.files[0].name;
            checkFilesReady();
        } else {
            songFileInfo.textContent = 'No file selected';
        }
    });
    
    userFileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            userFileInfo.textContent = this.files[0].name;
            userBlob = this.files[0];
            checkFilesReady();
        } else {
            userFileInfo.textContent = 'No file selected';
        }
    });
    
    // Recording functionality
    recordBtn.addEventListener('click', async function() {
        if (!mediaRecorder || mediaRecorder.state === 'inactive') {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];
                
                mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
                mediaRecorder.onstop = () => {
                    userBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    const audioUrl = URL.createObjectURL(userBlob);
                    userAudio.src = audioUrl;
                    userFileInfo.textContent = 'Recording.wav';
                    checkFilesReady();
                };
                
                mediaRecorder.start();
                recordBtn.classList.add('recording');
                recordBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Recording';
                userFileInput.disabled = true;
            } catch (err) {
                alert('Error accessing microphone: ' + err.message);
            }
        } else {
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
            recordBtn.classList.remove('recording');
            recordBtn.innerHTML = '<i class="fas fa-microphone"></i> Start Recording';
            userFileInput.disabled = false;
        }
    });
    
    // Check if files are ready for analysis
    function checkFilesReady() {
        if (songInput.files.length > 0 && (userBlob || userFileInput.files.length > 0)) {
            analyzeBtn.disabled = false;
        } else {
            analyzeBtn.disabled = true;
        }
    }
    
    // Analyze button handler
    analyzeBtn.addEventListener('click', async function() {
        if (!songInput.files[0] || !userBlob) {
            alert('Please upload a song file and record/upload your voice.');
            return;
        }
        
        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
        
        try {
            const formData = new FormData();
            formData.append('song', songInput.files[0]);
            formData.append('user', userBlob, 'recording.wav');
            
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.status === 'error') {
                throw new Error(result.error);
            }
            
            displayResults(result);
        } catch (error) {
            resultContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error</h3>
                    <p>${error.message || 'An error occurred during analysis'}</p>
                </div>
            `;
        } finally {
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = '<i class="fas fa-chart-line"></i> Analyze Similarity';
        }
    });
    
    // Display results
    function displayResults(result) {
        let feedbackClass = '';
        if (result.score > 85) feedbackClass = 'excellent';
        else if (result.score > 70) feedbackClass = 'good';
        else if (result.score > 50) feedbackClass = 'partial';
        else feedbackClass = 'low';
        
        resultContainer.innerHTML = `
            <div class="result-content">
                <h2>Analysis Results</h2>
                <div class="score-display">${result.score}%</div>
                <div class="feedback-message ${feedbackClass}">
                    ${result.feedback}
                </div>
                <div class="result-details">
                    <p>Original song: ${songInput.files[0].name}</p>
                    <p>Your recording: ${userFileInfo.textContent}</p>
                </div>
            </div>
        `;
    }
});