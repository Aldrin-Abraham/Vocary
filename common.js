/**
 * VOCARY COMMON JAVASCRIPT
 * Shared functionality across all pages
 */

document.addEventListener('DOMContentLoaded', function() {
    // ===== Space Background Animation =====
    function initSpaceBackground() {
        const constellation = document.getElementById('constellation');
        if (!constellation) return;
        
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Create stars
        for (let i = 0; i < 200; i++) {
            const star = document.createElement('div');
            star.className = 'estrela';
            
            // Random position
            const left = Math.random() * width;
            const top = Math.random() * height;
            
            // Random styles
            const size = Math.floor(Math.random() * 3) + 1;
            star.style.left = `${left}px`;
            star.style.top = `${top}px`;
            star.classList.add(`tam${size}`);
            
            constellation.appendChild(star);
        }
        
        // Create meteors
        function createMeteor() {
            const meteor = document.createElement('div');
            meteor.className = 'meteoro';
            
            // Random style
            const style = Math.floor(Math.random() * 4) + 1;
            meteor.classList.add(`style${style}`);
            
            constellation.appendChild(meteor);
            
            // Remove meteor after animation completes
            setTimeout(() => {
                meteor.remove();
            }, 1000);
        }
        
        // Create meteors periodically
        setInterval(createMeteor, 2000);
        
        // Initial meteors
        for (let i = 0; i < 3; i++) {
            setTimeout(createMeteor, i * 500);
        }
    }

    // ===== Mobile Navigation Toggle =====
    function initMobileNav() {
        const navToggle = document.querySelector('.nav-toggle');
        const navLinks = document.querySelector('.nav-links');
        
        if (navToggle && navLinks) {
            navToggle.addEventListener('click', () => {
                navLinks.classList.toggle('active');
                navToggle.innerHTML = navLinks.classList.contains('active') ? 
                    '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
            });
        }
    }

    // ===== Scroll Reveal Animations =====
    function initScrollAnimations() {
        const animateOnScroll = function() {
            const elements = document.querySelectorAll('[data-animate]');
            
            elements.forEach(element => {
                const elementPosition = element.getBoundingClientRect().top;
                const screenPosition = window.innerHeight / 1.3;
                
                if (elementPosition < screenPosition) {
                    element.classList.add('animate');
                }
            });
        };

        // Trigger animations on load and scroll
        window.addEventListener('load', animateOnScroll);
        window.addEventListener('scroll', animateOnScroll);
    }

    // ===== Navbar Scroll Effect =====
    function initNavbarScroll() {
        window.addEventListener('scroll', function() {
            const nav = document.querySelector('.space-nav');
            if (nav) {
                if (window.scrollY > 50) {
                    nav.classList.add('scrolled');
                } else {
                    nav.classList.remove('scrolled');
                }
            }
        });
    }

    // ===== Smooth Scrolling =====
    function initSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;
                
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 80,
                        behavior: 'smooth'
                    });
                    
                    // Close mobile menu if open
                    const navLinks = document.querySelector('.nav-links');
                    if (navLinks && navLinks.classList.contains('active')) {
                        navLinks.classList.remove('active');
                        document.querySelector('.nav-toggle').innerHTML = '<i class="fas fa-bars"></i>';
                    }
                }
            });
        });
    }

    // ===== Voice Wave Animation =====
    function initVoiceWave() {
        const voiceWave = document.getElementById('voiceWave');
        if (!voiceWave) return;
        
        const canvas = document.createElement('canvas');
        canvas.width = voiceWave.offsetWidth;
        canvas.height = voiceWave.offsetHeight;
        voiceWave.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        let step = 0;
        
        const drawWave = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#9d4edd';
            
            const amplitude = canvas.height / 4;
            const frequency = 0.02;
            
            for (let x = 0; x < canvas.width; x++) {
                const y = canvas.height / 2 + amplitude * Math.sin(x * frequency + step);
                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            
            ctx.stroke();
            
            step += 0.1;
            requestAnimationFrame(drawWave);
        };
        
        drawWave();
    }

    // ===== Initialize All Functions =====
    initSpaceBackground();
    initMobileNav();
    initScrollAnimations();
    initNavbarScroll();
    initSmoothScrolling();
    initVoiceWave();

    // ===== Utility Functions =====
    function debounce(func, wait = 20, immediate = true) {
        let timeout;
        return function() {
            const context = this, args = arguments;
            const later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }

    // Expose some functions to global scope if needed
    window.vocary = {
        debounce: debounce
    };
});

// ===== Audio Recorder Class (Shared) =====
class AudioRecorder {
    constructor(recordBtnId, visualizerId, audioElementId) {
        this.recordBtn = document.getElementById(recordBtnId);
        this.visualizer = document.getElementById(visualizerId);
        this.audioElement = document.getElementById(audioElementId);
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.canvasContext = null;
        this.animationId = null;
        
        this.init();
    }
    
    init() {
        if (!this.recordBtn || !this.visualizer) return;
        
        // Set up canvas for visualizer
        const canvas = document.createElement('canvas');
        canvas.width = this.visualizer.offsetWidth;
        canvas.height = this.visualizer.offsetHeight;
        this.visualizer.appendChild(canvas);
        this.canvasContext = canvas.getContext('2d');
        
        // Add event listener to record button
        this.recordBtn.addEventListener('click', () => {
            if (this.isRecording) {
                this.stopRecording();
            } else {
                this.startRecording();
            }
        });
    }
    
    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];
            
            // Set up audio context for visualization
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = this.audioContext.createMediaStreamSource(stream);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            source.connect(this.analyser);
            
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);
            
            // Start visualization
            this.drawVisualizer();
            
            // Set up media recorder
            this.mediaRecorder.ondataavailable = event => {
                this.audioChunks.push(event.data);
            };
            
            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                const audioUrl = URL.createObjectURL(audioBlob);
                
                if (this.audioElement) {
                    this.audioElement.src = audioUrl;
                    this.audioElement.style.display = 'block';
                }
                
                // Stop visualization
                cancelAnimationFrame(this.animationId);
                
                // Clean up
                stream.getTracks().forEach(track => track.stop());
            };
            
            this.mediaRecorder.start();
            this.isRecording = true;
            this.recordBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Recording';
            this.recordBtn.classList.add('recording');
            
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Could not access microphone. Please ensure you have granted microphone permissions.');
        }
    }
    
    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            this.recordBtn.innerHTML = '<i class="fas fa-microphone"></i> Start Recording';
            this.recordBtn.classList.remove('recording');
        }
    }
    
    drawVisualizer() {
        if (!this.analyser || !this.canvasContext) return;
        
        this.analyser.getByteFrequencyData(this.dataArray);
        
        const width = this.visualizer.offsetWidth;
        const height = this.visualizer.offsetHeight;
        const barWidth = (width / this.analyser.frequencyBinCount) * 2.5;
        let x = 0;
        
        this.canvasContext.clearRect(0, 0, width, height);
        
        for (let i = 0; i < this.analyser.frequencyBinCount; i++) {
            const barHeight = (this.dataArray[i] / 255) * height;
            
            this.canvasContext.fillStyle = `hsl(${i * 2}, 100%, 50%)`;
            this.canvasContext.fillRect(x, height - barHeight, barWidth, barHeight);
            
            x += barWidth + 1;
        }
        
        this.animationId = requestAnimationFrame(() => this.drawVisualizer());
    }
}

// ===== File Upload Handler (Shared) =====
class FileUploadHandler {
    constructor(uploadAreaId, fileInputId) {
        this.uploadArea = document.getElementById(uploadAreaId);
        this.fileInput = document.getElementById(fileInputId);
        
        if (this.uploadArea && this.fileInput) {
            this.init();
        }
    }
    
    init() {
        // Handle drag and drop
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.style.borderColor = 'var(--accent-color)';
            this.uploadArea.style.backgroundColor = 'rgba(157, 78, 221, 0.1)';
        });
        
        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.style.borderColor = 'var(--primary-color)';
            this.uploadArea.style.backgroundColor = 'transparent';
        });
        
        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.style.borderColor = 'var(--primary-color)';
            this.uploadArea.style.backgroundColor = 'transparent';
            
            if (e.dataTransfer.files.length) {
                this.fileInput.files = e.dataTransfer.files;
                this.handleFileSelection();
            }
        });
        
        // Handle file input change
        this.fileInput.addEventListener('change', () => {
            this.handleFileSelection();
        });
    }
    
    handleFileSelection() {
        if (this.fileInput.files.length) {
            // Hide upload prompt
            const uploadPrompt = this.uploadArea.querySelector('.upload-prompt');
            if (uploadPrompt) {
                uploadPrompt.style.display = 'none';
            }
            
            // Show file name
            const fileNameDisplay = document.createElement('div');
            fileNameDisplay.className = 'file-name-display';
            fileNameDisplay.innerHTML = `
                <i class="fas fa-file-audio"></i>
                <span>${this.fileInput.files[0].name}</span>
            `;
            this.uploadArea.appendChild(fileNameDisplay);
        }
    }
}