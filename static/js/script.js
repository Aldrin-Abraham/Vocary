class VocaryAnalyzer {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.userBlob = null;
    this.audioContext = null;
    this.analyser = null;
    this.recordingInterval = null;
    
    this.initElements();
    this.initEventListeners();
    this.initAudioContext();
  }

  initElements() {
    // File inputs
    this.songInput = document.getElementById('songInput');
    this.userInput = document.getElementById('userInput');
    
    // Upload areas
    this.songUpload = document.getElementById('songUpload');
    this.userUpload = document.getElementById('userUpload');
    
    // File info displays
    this.songFileInfo = document.getElementById('songFileInfo');
    this.userFileInfo = document.getElementById('userFileInfo');
    
    // Recording
    this.recordBtn = document.getElementById('recordBtn');
    this.userAudio = document.getElementById('userAudio');
    this.visualizer = document.getElementById('visualizer');
    
    // Analysis
    this.analyzeBtn = document.getElementById('analyzeBtn');
    
    // Results
    this.resultsSection = document.getElementById('resultsSection');
  }

  initEventListeners() {
    // File upload handling
    this.songInput.addEventListener('change', () => this.handleFileUpload(this.songInput, this.songFileInfo));
    this.userInput.addEventListener('change', () => {
      this.handleFileUpload(this.userInput, this.userFileInfo);
      this.userBlob = this.userInput.files[0];
      this.checkFilesReady();
    });
    
    // Drag and drop
    this.setupDragAndDrop(this.songUpload, this.songInput);
    this.setupDragAndDrop(this.userUpload, this.userInput);
    
    // Recording
    this.recordBtn.addEventListener('click', () => this.toggleRecording());
    
    // Analysis
    this.analyzeBtn.addEventListener('click', () => this.analyzeSimilarity());
  }

  initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.error('Web Audio API not supported', e);
      this.showError('Your browser doesn\'t support audio recording. Try Chrome or Firefox.');
    }
  }

  setupDragAndDrop(uploadArea, inputElement) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      uploadArea.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      uploadArea.addEventListener(eventName, () => {
        uploadArea.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      uploadArea.addEventListener(eventName, () => {
        uploadArea.classList.remove('dragover');
      });
    });

    uploadArea.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files.length > 0 && files[0].type.match('audio.*')) {
        inputElement.files = files;
        this.handleFileUpload(inputElement, inputElement === this.songInput ? this.songFileInfo : this.userFileInfo);
        
        if (inputElement === this.userInput) {
          this.userBlob = files[0];
          this.checkFilesReady();
        }
      }
    });
  }

  handleFileUpload(input, infoElement) {
    if (input.files.length > 0) {
      const file = input.files[0];
      infoElement.textContent = file.name;
      infoElement.parentElement.classList.add('has-file');
      
      if (input === this.songInput) {
        this.checkFilesReady();
      }
    }
  }

  async toggleRecording() {
    if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.mediaRecorder = new MediaRecorder(stream);
        this.audioChunks = [];
        
        // Set up audio analyzer
        const source = this.audioContext.createMediaStreamSource(stream);
        this.analyser = this.audioContext.createAnalyser();
        source.connect(this.analyser);
        this.setupVisualizer();
        
        this.mediaRecorder.ondataavailable = e => this.audioChunks.push(e.data);
        this.mediaRecorder.onstop = () => {
          this.userBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
          const audioUrl = URL.createObjectURL(this.userBlob);
          this.userAudio.src = audioUrl;
          this.userFileInfo.textContent = 'Recording.wav';
          this.userFileInfo.parentElement.classList.add('has-file');
          this.checkFilesReady();
          
          // Clean up
          stream.getTracks().forEach(track => track.stop());
          if (this.recordingInterval) {
            clearInterval(this.recordingInterval);
            this.recordingInterval = null;
          }
          this.visualizer.innerHTML = '';
        };
        
        this.mediaRecorder.start();
        this.recordBtn.classList.add('recording');
        this.recordBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Recording';
        this.userInput.disabled = true;
        
        // Start visualization
        this.recordingInterval = setInterval(() => this.updateVisualizer(), 50);
      } catch (err) {
        console.error('Error accessing microphone:', err);
        this.showError('Microphone access denied. Please allow permissions.');
      }
    } else {
      this.mediaRecorder.stop();
      this.recordBtn.classList.remove('recording');
      this.recordBtn.innerHTML = '<i class="fas fa-microphone"></i> Start Recording';
      this.userInput.disabled = false;
    }
  }

  setupVisualizer() {
    this.visualizer.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.width = this.visualizer.offsetWidth;
    canvas.height = this.visualizer.offsetHeight;
    this.visualizer.appendChild(canvas);
    this.visualizerCanvas = canvas;
    this.visualizerCtx = canvas.getContext('2d');
  }

  updateVisualizer() {
    if (!this.analyser || !this.visualizerCanvas) return;
    
    const width = this.visualizerCanvas.width;
    const height = this.visualizerCanvas.height;
    const ctx = this.visualizerCtx;
    
    this.analyser.fftSize = 256;
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);
    
    ctx.clearRect(0, 0, width, height);
    
    const barWidth = (width / bufferLength) * 2.5;
    let x = 0;
    
    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * height;
      const hue = 200 + (i / bufferLength * 160);
      const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
      gradient.addColorStop(0, `hsl(${hue}, 100%, 50%)`);
      gradient.addColorStop(1, `hsl(${hue}, 100%, 30%)`);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, height - barHeight, barWidth, barHeight);
      
      x += barWidth + 1;
    }
  }

  checkFilesReady() {
    const hasSongFile = this.songInput.files.length > 0;
    const hasUserAudio = this.userBlob || this.userInput.files.length > 0;
    this.analyzeBtn.disabled = !(hasSongFile && hasUserAudio);
  }

  async analyzeSimilarity() {
    if (!this.songInput.files[0] || !this.userBlob) {
      this.showError('Please upload both files first');
      return;
    }
    
    this.setLoadingState(true);
    
    try {
      const formData = new FormData();
      formData.append('song', this.songInput.files[0]);
      formData.append('user', this.userBlob, 'recording.wav');
      
      const response = await fetch('/api/analyze/similarity', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      this.displayResults(result);
    } catch (error) {
      console.error('Analysis error:', error);
      this.showError(error.message || 'Analysis failed. Try again.');
    } finally {
      this.setLoadingState(false);
    }
  }

  displayResults(result) {
    let feedbackClass = '';
    if (result.score > 85) feedbackClass = 'excellent';
    else if (result.score > 70) feedbackClass = 'good';
    else if (result.score > 50) feedbackClass = 'partial';
    else feedbackClass = 'low';
    
    this.resultsSection.innerHTML = `
      <div class="results-content">
        <div class="score-display">
          <div class="score-value">${result.score}%</div>
          <div class="score-label">Delusion Level</div>
        </div>
        
        <div class="main-result">
          <div class="result-icon">
            <i class="fas fa-${feedbackClass === 'excellent' ? 'grin-stars' : feedbackClass === 'low' ? 'sad-tear' : 'meh'}"></i>
          </div>
          <h2>${result.title || 'Results Are In!'}</h2>
          <p>${result.feedback || 'See details below'}</p>
        </div>
        
        <div class="visualizations">
          <div class="visualization-card">
            <h3><i class="fas fa-chart-line"></i> Pitch Accuracy</h3>
            <div class="viz-container" id="pitchViz"></div>
          </div>
          <div class="visualization-card">
            <h3><i class="fas fa-sliders-h"></i> Timbre Analysis</h3>
            <div class="viz-container" id="timbreViz"></div>
          </div>
        </div>
        
        <div class="feedback-section">
          <h3><i class="fas fa-comment-alt"></i> Brutal Honesty</h3>
          <div class="feedback-points">
            ${result.details ? result.details.map(d => `<p>• ${d}</p>`).join('') : '<p>No additional feedback</p>'}
          </div>
        </div>
        
        <div class="share-section">
          <h3><i class="fas fa-share-alt"></i> Share Your Shame</h3>
          <div class="share-buttons">
            <button class="share-button twitter">
              <i class="fab fa-twitter"></i> Twitter
            </button>
            <button class="share-button instagram">
              <i class="fab fa-instagram"></i> Instagram
            </button>
            <button class="share-button copy-link">
              <i class="fas fa-link"></i> Copy Link
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Initialize visualizations
    this.initResultVisualizations(result);
  }

  initResultVisualizations(result) {
    // This would be replaced with actual Chart.js or similar implementations
    const pitchViz = document.getElementById('pitchViz');
    const timbreViz = document.getElementById('timbreViz');
    
    if (pitchViz) {
      pitchViz.innerHTML = '<canvas id="pitchChart"></canvas>';
      // Initialize pitch chart here
    }
    
    if (timbreViz) {
      timbreViz.innerHTML = '<canvas id="timbreChart"></canvas>';
      // Initialize timbre chart here
    }
  }

  showError(message) {
    this.resultsSection.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Error</h3>
        <p>${message}</p>
      </div>
    `;
  }

  setLoadingState(isLoading) {
    this.analyzeBtn.disabled = isLoading;
    this.analyzeBtn.innerHTML = isLoading 
      ? '<i class="fas fa-spinner fa-spin"></i> Analyzing...' 
      : '<i class="fas fa-rocket"></i> Launch Analysis';
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  new VocaryAnalyzer();
});