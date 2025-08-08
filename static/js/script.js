// Main application controller
class VocaryApp {
    constructor() {
        this.initRecording();
        this.initFileUploads();
        this.initAnalysisButtons();
        this.initNavigation();
    }

    initRecording() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.userBlob = null;
        
        const recordBtn = document.getElementById('recordBtn');
        if (recordBtn) {
            recordBtn.addEventListener('click', this.toggleRecording.bind(this));
        }
    }

    async toggleRecording() {
        const recordBtn = document.getElementById('recordBtn');
        const userFileInput = document.getElementById('userFileInput');
        const userAudio = document.getElementById('userAudio');
        
        if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                this.mediaRecorder = new MediaRecorder(stream);
                this.audioChunks = [];
                
                this.mediaRecorder.ondataavailable = e => this.audioChunks.push(e.data);
                this.mediaRecorder.onstop = () => {
                    this.userBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                    const audioUrl = URL.createObjectURL(this.userBlob);
                    userAudio.src = audioUrl;
                    document.getElementById('userFileInfo').textContent = 'Recording.wav';
                    this.checkFilesReady();
                };
                
                this.mediaRecorder.start();
                recordBtn.classList.add('recording');
                recordBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Recording';
                userFileInput.disabled = true;
            } catch (err) {
                alert('Error accessing microphone: ' + err.message);
            }
        } else {
            this.mediaRecorder.stop();
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            recordBtn.classList.remove('recording');
            recordBtn.innerHTML = '<i class="fas fa-microphone"></i> Start Recording';
            userFileInput.disabled = false;
        }
    }

    initFileUploads() {
        const songInput = document.getElementById('songInput');
        const userFileInput = document.getElementById('userFileInput');
        
        if (songInput) {
            songInput.addEventListener('change', function() {
                const infoElement = document.getElementById('songFileInfo');
                if (this.files.length > 0) {
                    infoElement.textContent = this.files[0].name;
                    this.checkFilesReady();
                } else {
                    infoElement.textContent = 'No file selected';
                }
            });
        }
        
        if (userFileInput) {
            userFileInput.addEventListener('change', function() {
                const infoElement = document.getElementById('userFileInfo');
                if (this.files.length > 0) {
                    infoElement.textContent = this.files[0].name;
                    this.userBlob = this.files[0];
                    this.checkFilesReady();
                } else {
                    infoElement.textContent = 'No file selected';
                }
            });
        }
    }

    checkFilesReady() {
        const songInput = document.getElementById('songInput');
        const userFileInput = document.getElementById('userFileInput');
        const analyzeBtn = document.getElementById('analyzeBtn');
        
        if (songInput && analyzeBtn) {
            const hasUserAudio = this.userBlob || (userFileInput?.files.length > 0);
            analyzeBtn.disabled = !(songInput.files.length > 0 && hasUserAudio);
        }
    }

    initAnalysisButtons() {
        const analyzeBtn = document.getElementById('analyzeBtn');
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', this.analyzeSimilarity.bind(this));
        }
        
        const pitchBtn = document.getElementById('pitchBtn');
        if (pitchBtn) {
            pitchBtn.addEventListener('click', this.analyzePitch.bind(this));
        }
        
        const timbreBtn = document.getElementById('timbreBtn');
        if (timbreBtn) {
            timbreBtn.addEventListener('click', this.analyzeTimbre.bind(this));
        }
    }

    async analyzeSimilarity() {
        const songInput = document.getElementById('songInput');
        const analyzeBtn = document.getElementById('analyzeBtn');
        const resultContainer = document.getElementById('resultContainer');
        
        if (!songInput.files[0] || !this.userBlob) {
            alert('Please upload a song file and record/upload your voice.');
            return;
        }
        
        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
        
        try {
            const formData = new FormData();
            formData.append('song', songInput.files[0]);
            formData.append('user', this.userBlob, 'recording.wav');
            
            const response = await fetch('/api/analyze/similarity', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.status === 'error') {
                throw new Error(result.error);
            }
            
            this.displayResults(result);
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
    }

    async analyzePitch() {
        const audioInput = document.getElementById('audioInput');
        const pitchBtn = document.getElementById('pitchBtn');
        const resultContainer = document.getElementById('resultContainer');
        
        if (!audioInput.files[0]) {
            alert('Please upload or record an audio file.');
            return;
        }
        
        pitchBtn.disabled = true;
        pitchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
        
        try {
            const formData = new FormData();
            formData.append('audio', audioInput.files[0]);
            
            const response = await fetch('/api/analyze/pitch', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            this.displayPitchResults(result);
        } catch (error) {
            resultContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error</h3>
                    <p>${error.message || 'An error occurred during analysis'}</p>
                </div>
            `;
        } finally {
            pitchBtn.disabled = false;
            pitchBtn.innerHTML = '<i class="fas fa-wave-square"></i> Analyze Pitch';
        }
    }

    displayResults(result) {
        let feedbackClass = '';
        if (result.score > 85) feedbackClass = 'excellent';
        else if (result.score > 70) feedbackClass = 'good';
        else if (result.score > 50) feedbackClass = 'partial';
        else feedbackClass = 'low';
        
        document.getElementById('resultContainer').innerHTML = `
            <div class="result-content">
                <h2>Analysis Results</h2>
                <div class="score-display">${result.score}%</div>
                <div class="feedback-message ${feedbackClass}">
                    ${result.feedback}
                </div>
                <div class="result-details">
                    <p>Original song: ${document.getElementById('songInput').files[0].name}</p>
                    <p>Your recording: ${document.getElementById('userFileInfo').textContent}</p>
                </div>
            </div>
        `;
    }

    displayPitchResults(result) {
        // Implementation for displaying pitch analysis results
        // Including visualization of pitch contour, note distribution, etc.
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new VocaryApp();
});