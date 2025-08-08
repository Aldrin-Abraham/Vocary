class TimbreAnalyzer {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.audioContext = null;
    this.analyser = null;
    this.recordingInterval = null;
    this.timbreChart = null;

    this.initElements();
    this.initEventListeners();
    this.initAudioContext();
  }

  initElements() {
    // Recording elements
    this.recordBtn = document.getElementById('timbreRecordBtn');
    this.audioElement = document.getElementById('timbreAudio');
    this.visualizer = document.getElementById('timbreVisualizer');
    this.analyzeBtn = document.getElementById('timbreAnalyzeBtn');
    
    // Results elements
    this.resultsSection = document.getElementById('timbreResults');
    this.timbreRadar = document.getElementById('timbreRadar');
    this.timbreClassification = document.getElementById('timbreClassification');
    
    // File upload
    this.uploadArea = document.getElementById('timbreUpload');
    this.fileInput = document.getElementById('timbreInput');
  }

  initEventListeners() {
    this.recordBtn.addEventListener('click', () => this.toggleRecording());
    this.analyzeBtn.addEventListener('click', () => this.analyzeTimbre());
    this.fileInput.addEventListener('change', () => this.handleFileUpload());
    
    // Drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      this.uploadArea.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.uploadArea.classList.toggle('dragover', 
          eventName === 'dragenter' || eventName === 'dragover');
      });
    });

    this.uploadArea.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files.length > 0 && files[0].type.match('audio.*')) {
        this.fileInput.files = files;
        this.handleFileUpload();
      }
    });
  }

  initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      this.showError("Your browser doesn't support audio analysis. Try Chrome or Firefox.");
    }
  }

  async toggleRecording() {
    if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.mediaRecorder = new MediaRecorder(stream);
        this.audioChunks = [];
        
        // Setup audio analysis
        const source = this.audioContext.createMediaStreamSource(stream);
        this.analyser = this.audioContext.createAnalyser();
        source.connect(this.analyser);
        this.setupVisualizer();
        
        this.mediaRecorder.ondataavailable = e => this.audioChunks.push(e.data);
        this.mediaRecorder.onstop = () => {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
          this.audioElement.src = URL.createObjectURL(audioBlob);
          this.audioElement.style.display = 'block';
          
          // Clean up
          stream.getTracks().forEach(track => track.stop());
          if (this.recordingInterval) {
            clearInterval(this.recordingInterval);
          }
        };
        
        this.mediaRecorder.start();
        this.recordBtn.classList.add('recording');
        this.recordBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Recording';
      } catch (err) {
        this.showError("Couldn't access microphone. Please check permissions.");
      }
    } else {
      this.mediaRecorder.stop();
      this.recordBtn.classList.remove('recording');
      this.recordBtn.innerHTML = '<i class="fas fa-microphone"></i> Start Recording';
    }
  }

  setupVisualizer() {
    this.visualizer.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.width = this.visualizer.offsetWidth;
    canvas.height = this.visualizer.offsetHeight;
    this.visualizer.appendChild(canvas);
    
    this.recordingInterval = setInterval(() => {
      this.updateVisualizer(canvas);
    }, 50);
  }

  updateVisualizer(canvas) {
    if (!this.analyser) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
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

  handleFileUpload() {
    if (this.fileInput.files.length > 0) {
      const file = this.fileInput.files[0];
      this.audioElement.src = URL.createObjectURL(file);
      this.audioElement.style.display = 'block';
    }
  }

  async analyzeTimbre() {
    const audioSrc = this.audioElement.src;
    if (!audioSrc) {
      this.showError("Please record or upload audio first");
      return;
    }
    
    this.setLoadingState(true);
    
    try {
      // In a real app, this would call your backend API
      const mockResult = this.generateMockTimbreAnalysis();
      this.displayResults(mockResult);
    } catch (error) {
      this.showError("Analysis failed. Try again.");
      console.error(error);
    } finally {
      this.setLoadingState(false);
    }
  }

  generateMockTimbreAnalysis() {
    const voiceTypes = [
      "Sultry Jazz Singer",
      "Teenager Hitting Puberty", 
      "ASMR Whisperer",
      "Morning Radio DJ",
      "Tired College Professor",
      "Excited Puppy"
    ];
    
    const timbreTraits = [
      { name: "Brightness", value: Math.random() * 100 },
      { name: "Warmth", value: Math.random() * 100 },
      { name: "Richness", value: Math.random() * 100 },
      { name: "Breathiness", value: Math.random() * 100 },
      { name: "Roughness", value: Math.random() * 100 }
    ];
    
    const hnr = (Math.random() * 20 + 5).toFixed(1); // Harmonic-to-noise ratio
    
    return {
      voiceType: voiceTypes[Math.floor(Math.random() * voiceTypes.length)],
      timbreTraits,
      hnr,
      feedback: this.generateTimbreFeedback()
    };
  }

  generateTimbreFeedback() {
    const feedbacks = [
      "Your voice could melt butter... or maybe just cheese at room temperature",
      "If voices were colors, yours would be 'construction cone orange'",
      "You sound like you should be narrating nature documentaries",
      "Your vocal fry makes you sound either sexy or sleep-deprived. Hard to tell.",
      "10/10 would listen to your voicemail greeting on repeat",
      "Your voice is... memorable. Let's leave it at that."
    ];
    return feedbacks[Math.floor(Math.random() * feedbacks.length)];
  }

  displayResults(result) {
    this.resultsSection.innerHTML = `
      <div class="results-content">
        <h2>Timbre Analysis Results</h2>
        
        <div class="voice-type-display">
          <div class="voice-type-label">Your Voice Type:</div>
          <div class="voice-type-value">${result.voiceType}</div>
        </div>
        
        <div class="feedback-message">
          <i class="fas fa-comment-alt"></i>
          <p>${result.feedback}</p>
        </div>
        
        <div class="timbre-radar-container">
          <h3><i class="fas fa-chart-radar"></i> Timbre Characteristics</h3>
          <canvas id="timbreChart"></canvas>
        </div>
        
        <div class="hnr-info">
          <h3><i class="fas fa-wave-square"></i> Harmonic-to-Noise Ratio</h3>
          <p>${result.hnr} dB (higher is cleaner)</p>
        </div>
      </div>
    `;
    
    this.initTimbreChart(result.timbreTraits);
  }

  initTimbreChart(timbreTraits) {
    const ctx = document.getElementById('timbreChart').getContext('2d');
    this.timbreChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: timbreTraits.map(t => t.name),
        datasets: [{
          label: 'Your Voice',
          data: timbreTraits.map(t => t.value),
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
              showLabelBackdrop: false
            },
            min: 0,
            max: 100
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  showError(message) {
    this.resultsSection.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Oops!</h3>
        <p>${message}</p>
      </div>
    `;
  }

  setLoadingState(isLoading) {
    this.analyzeBtn.disabled = isLoading;
    this.analyzeBtn.innerHTML = isLoading
      ? '<i class="fas fa-spinner fa-spin"></i> Analyzing...'
      : '<i class="fas fa-sliders-h"></i> Analyze My Timbre';
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  new TimbreAnalyzer();
});