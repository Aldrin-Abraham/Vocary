class AudioRecorder {
  constructor(visualizerElement) {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.audioContext = null;
    this.analyser = null;
    this.visualizerElement = visualizerElement;
    this.canvas = null;
    this.ctx = null;
    this.animationId = null;
  }

  async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];
      
      // Set up audio analysis
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      source.connect(this.analyser);
      
      this.setupVisualizer();
      
      this.mediaRecorder.ondataavailable = e => this.audioChunks.push(e.data);
      
      this.mediaRecorder.start();
      return new Promise((resolve) => {
        this.mediaRecorder.onstop = () => {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
          this.cleanup();
          resolve(audioBlob);
        };
      });
    } catch (err) {
      console.error('Recording error:', err);
      throw new Error('Failed to access microphone');
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  }

  setupVisualizer() {
    if (!this.visualizerElement) return;
    
    this.visualizerElement.innerHTML = '';
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.visualizerElement.offsetWidth;
    this.canvas.height = this.visualizerElement.offsetHeight;
    this.visualizerElement.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    
    this.animationId = requestAnimationFrame(() => this.updateVisualizer());
  }

  updateVisualizer() {
    if (!this.analyser || !this.canvas) return;
    
    const width = this.canvas.width;
    const height = this.canvas.height;
    const ctx = this.ctx;
    
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
    
    this.animationId = requestAnimationFrame(() => this.updateVisualizer());
  }

  cleanup() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    if (this.canvas && this.visualizerElement) {
      this.visualizerElement.innerHTML = '';
      this.canvas = null;
      this.ctx = null;
    }
    
    this.analyser = null;
    this.audioContext = null;
  }
}