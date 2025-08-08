class PitchAnalyzer {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.audioContext = null;
    this.analyser = null;
    this.recordingInterval = null;
    this.pitchChart = null;

    this.initElements();
    this.initEventListeners();
    this.initAudioContext();
  }

  initElements() {
    // Recording elements
    this.recordBtn = document.getElementById('pitchRecordBtn');
    this.audioElement = document.getElementById('pitchAudio');
    this.visualizer = document.getElementById('pitchVisualizer');
    this.analyzeBtn = document.getElementById('pitchAnalyzeBtn');
    
    // Results elements
    this.resultsSection = document.getElementById('pitchResults');
    this.pitchGraph = document.getElementById('pitchGraph');
    this.pitchFeedback = document.getElementById('pitchFeedback');
    
    // File upload
    this.uploadArea = document.getElementById('pitchUpload');
    this.fileInput = document.getElementById('pitchInput');
  }

  initEventListeners() {
    this.recordBtn.addEventListener('click', () => this.toggleRecording());
    this.analyzeBtn.addEventListener('click', () => this.analyzePitch());
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

  async analyzePitch() {
    const audioSrc = this.audioElement.src;
    if (!audioSrc) {
      this.showError("Please record or upload audio first");
      return;
    }
    
    this.setLoadingState(true);
    
    try {
      // In a real app, this would call your backend API
      const mockResult = this.generateMockPitchAnalysis();
      this.displayResults(mockResult);
    } catch (error) {
      this.showError("Analysis failed. Try again.");
      console.error(error);
    } finally {
      this.setLoadingState(false);
    }
  }

  generateMockPitchAnalysis() {
    // This would be replaced with actual analysis from your backend
    const pitchData = [];
    for (let i = 0; i < 100; i++) {
      pitchData.push(Math.sin(i / 5) * 10 + Math.random() * 5 + 60);
    }
    
    const accuracy = Math.min(100, Math.max(0, Math.floor(Math.random() * 100)));
    let feedback = "";
    
    if (accuracy > 85) {
      feedback = "Almost perfect! Were you using autotune?";
    } else if (accuracy > 70) {
      feedback = "Not terrible, but your shower singing is still better";
    } else if (accuracy > 50) {
      feedback = "Yikes. Stick to humming in your head";
    } else {
      feedback = "Please stop. Think of the children.";
    }
    
    return {
      accuracy,
      feedback,
      pitchData,
      noteDistribution: this.generateMockNoteDistribution(),
      vibrato: (Math.random() * 3 + 1).toFixed(1)
    };
  }

  generateMockNoteDistribution() {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return notes.map(note => ({
      note,
      frequency: Math.floor(Math.random() * 50)
    })).sort((a, b) => b.frequency - a.frequency);
  }

  displayResults(result) {
    this.resultsSection.innerHTML = `
      <div class="results-content">
        <h2>Pitch Analysis Results</h2>
        <div class="score-display">
          <div class="score-value">${result.accuracy}%</div>
          <div class="score-label">Accuracy Score</div>
        </div>
        
        <div class="feedback-message">
          <i class="fas fa-comment-alt"></i>
          <p>${result.feedback}</p>
        </div>
        
        <div class="pitch-graph-container">
          <h3><i class="fas fa-wave-square"></i> Pitch Contour</h3>
          <canvas id="pitchChart"></canvas>
        </div>
        
        <div class="note-distribution">
          <h3><i class="fas fa-music"></i> Note Distribution</h3>
          <canvas id="noteChart"></canvas>
        </div>
        
        <div class="vibrato-info">
          <h3><i class="fas fa-water"></i> Vibrato</h3>
          <p>Detected vibrato rate: ${result.vibrato} Hz</p>
        </div>
      </div>
    `;
    
    this.initPitchChart(result.pitchData);
    this.initNoteChart(result.noteDistribution);
  }

  initPitchChart(pitchData) {
    const ctx = document.getElementById('pitchChart').getContext('2d');
    this.pitchChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: Array.from({ length: pitchData.length }, (_, i) => i),
        datasets: [{
          label: 'Pitch (Hz)',
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

  initNoteChart(noteDistribution) {
    const ctx = document.getElementById('noteChart').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: noteDistribution.map(n => n.note),
        datasets: [{
          label: 'Frequency',
          data: noteDistribution.map(n => n.frequency),
          backgroundColor: noteDistribution.map((_, i) => 
            `hsl(${200 + (i * 30)}, 70%, 50%)`),
          borderColor: 'rgba(0, 0, 0, 0.1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => `Frequency: ${ctx.raw}%`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { text: 'Frequency (%)', display: true }
          }
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
      : '<i class="fas fa-gavel"></i> Judge My Pitch';
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  new PitchAnalyzer();
});