class VocaryAnalyzer {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.userBlob = null;
    this.audioContext = null;
    this.analyser = null;
    this.recordingInterval = null;
    this.visualizerCanvas = null;
    this.visualizerCtx = null;
    
    this.initElements();
    this.initEventListeners();
    this.initAudioContext();
    this.initSpaceBackground();
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

  initSpaceBackground() {
    const constellation = document.querySelector('.constellation');
    if (!constellation) return;

    // Create stars
    for (let i = 0; i < 200; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      
      // Random size (1-3px)
      const size = Math.floor(Math.random() * 3) + 1;
      star.style.setProperty('--star-size', `${size}px`);
      
      // Random position
      star.style.top = `${Math.random() * 100}%`;
      star.style.left = `${Math.random() * 100}%`;
      
      // Random twinkle properties
      star.style.setProperty('--twinkle-duration', `${3 + Math.random() * 4}s`);
      star.style.setProperty('--twinkle-opacity', `${0.3 + Math.random() * 0.5}`);
      
      // Add some stars with different colors
      if (Math.random() > 0.9) {
        star.style.backgroundColor = `hsl(${Math.random() * 60 + 200}, 100%, 80%)`;
      }
      
      constellation.appendChild(star);
    }

    // Create meteors
    for (let i = 1; i <= 3; i++) {
      const meteor = document.createElement('div');
      meteor.className = `meteor m${i} style${i}`;
      constellation.appendChild(meteor);
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
      
      // Add cosmic loading effect
      this.createLoadingStars();
      
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
      this.removeLoadingStars();
    }
  }

  createLoadingStars() {
    const container = document.querySelector('.analyzer-container');
    for (let i = 0; i < 10; i++) {
      const star = document.createElement('div');
      star.className = 'loading-star';
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.animationDelay = `${i * 0.2}s`;
      container.appendChild(star);
    }
  }

  removeLoadingStars() {
    document.querySelectorAll('.loading-star').forEach(star => star.remove());
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
        
        <div class="main-result ${feedbackClass}">
          <div class="result-icon">
            <i class="fas fa-${feedbackClass === 'excellent' ? 'grin-stars' : 
                              feedbackClass === 'low' ? 'sad-tear' : 'meh'}"></i>
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
    this.setupShareButtons();
  }

  initResultVisualizations(result) {
    // Pitch visualization
    const pitchViz = document.getElementById('pitchViz');
    if (pitchViz) {
      pitchViz.innerHTML = '<canvas id="pitchChart"></canvas>';
      const ctx = pitchViz.querySelector('canvas').getContext('2d');
      
      // Mock data - in a real app this would come from the API
      const pitchData = Array.from({length: 100}, (_, i) => 
        Math.sin(i / 10) * 20 + 100 + Math.random() * 20
      );
      
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: Array.from({length: 100}, (_, i) => i),
          datasets: [{
            label: 'Pitch Deviation',
            data: pitchData,
            borderColor: '#9d4edd',
            backgroundColor: 'rgba(157, 78, 221, 0.1)',
            borderWidth: 2,
            tension: 0.1,
            fill: true
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: ctx => `Pitch: ${ctx.raw.toFixed(1)} Hz`
              }
            }
          },
          scales: {
            y: {
              title: { text: 'Frequency (Hz)', display: true }
            },
            x: {
              title: { text: 'Time (samples)', display: true }
            }
          }
        }
      });
    }
    
    // Timbre visualization
    const timbreViz = document.getElementById('timbreViz');
    if (timbreViz) {
      timbreViz.innerHTML = '<canvas id="timbreChart"></canvas>';
      const ctx = timbreViz.querySelector('canvas').getContext('2d');
      
      // Mock data - in a real app this would come from the API
      new Chart(ctx, {
        type: 'radar',
        data: {
          labels: ['Brightness', 'Warmth', 'Richness', 'Breathiness', 'Roughness'],
          datasets: [{
            label: 'Your Voice',
            data: [
              Math.random() * 100,
              Math.random() * 100,
              Math.random() * 100,
              Math.random() * 100,
              Math.random() * 100
            ],
            backgroundColor: 'rgba(157, 78, 221, 0.2)',
            borderColor: '#9d4edd',
            borderWidth: 2,
            pointBackgroundColor: '#9d4edd'
          }]
        },
        options: {
          responsive: true,
          scales: {
            r: {
              angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
              grid: { color: 'rgba(255, 255, 255, 0.1)' },
              pointLabels: { color: '#e2c2ff' },
              ticks: {
                backdropColor: 'rgba(0, 0, 0, 0)',
                color: '#e2c2ff',
                showLabelBackdrop: false,
                min: 0,
                max: 100
              }
            }
          },
          plugins: {
            legend: { display: false }
          }
        }
      });
    }
  }

  setupShareButtons() {
    // Twitter share
    document.querySelector('.share-button.twitter')?.addEventListener('click', () => {
      const text = `My vocal delusion score is ${document.querySelector('.score-value')?.textContent || '0%'}! Check out Vocary for brutally honest voice analysis.`;
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
    });
    
    // Instagram (would need more complex handling)
    document.querySelector('.share-button.instagram')?.addEventListener('click', () => {
      this.showError('Instagram sharing coming soon! Screenshot and share manually for now.');
    });
    
    // Copy link
    document.querySelector('.share-button.copy-link')?.addEventListener('click', () => {
      navigator.clipboard.writeText(window.location.href);
      const btn = document.querySelector('.share-button.copy-link');
      const originalText = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
      setTimeout(() => {
        btn.innerHTML = originalText;
      }, 2000);
    });
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