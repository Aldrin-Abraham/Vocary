class VocaryWelcome {
  constructor() {
    this.initElements();
    this.initEventListeners();
    this.initAnimations();
    this.initTestimonialSlider();
    this.initSpaceBackground();
  }

  initElements() {
    // Navigation
    this.navToggle = document.querySelector('.nav-toggle');
    this.navLinks = document.querySelector('.nav-links');
    
    // Hero
    this.voiceWave = document.getElementById('voiceWave');
    
    // Features
    this.featureCards = document.querySelectorAll('.feature-card');
  }

  initEventListeners() {
    // Mobile nav toggle
    if (this.navToggle) {
      this.navToggle.addEventListener('click', () => {
        this.navLinks.classList.toggle('active');
      });
    }
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = anchor.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth'
          });
        }
      });
    });

    // Feature card hover effects
    this.featureCards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        const icon = card.querySelector('.feature-icon i');
        icon.style.transform = 'translateY(-5px) scale(1.1)';
      });

      card.addEventListener('mouseleave', () => {
        const icon = card.querySelector('.feature-icon i');
        icon.style.transform = '';
      });
    });
  }

  initSpaceBackground() {
    const constellation = document.querySelector('.constellation');
    if (!constellation) return;

    // Create stars
    for (let i = 0; i < 250; i++) {
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
      
      // Add some colorful stars
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

  initAnimations() {
    // Animate hero elements on load
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
      heroContent.style.opacity = '0';
      heroContent.style.transform = 'translateY(20px)';
      setTimeout(() => {
        heroContent.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        heroContent.style.opacity = '1';
        heroContent.style.transform = 'translateY(0)';
      }, 100);
    }

    // Intersection Observer for scroll animations
    const observerOptions = {
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    // Observe sections
    document.querySelectorAll('.features, .demo, .final-cta').forEach(section => {
      section.classList.add('pre-animate');
      observer.observe(section);
    });

    // Voice wave animation
    this.animateVoiceWave();
  }

  animateVoiceWave() {
    if (!this.voiceWave) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = this.voiceWave.offsetWidth;
    canvas.height = this.voiceWave.offsetHeight;
    this.voiceWave.appendChild(canvas);
    
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

  initTestimonialSlider() {
    const slider = document.querySelector('.testimonials-slider');
    if (!slider || slider.children.length <= 1) return;
    
    let currentIndex = 0;
    const testimonials = Array.from(slider.children);
    
    // Set initial state
    testimonials.forEach((testimonial, index) => {
      testimonial.style.opacity = index === 0 ? '1' : '0';
      testimonial.style.position = index === 0 ? 'relative' : 'absolute';
    });
    
    // Auto-rotate
    setInterval(() => {
      testimonials[currentIndex].style.opacity = '0';
      currentIndex = (currentIndex + 1) % testimonials.length;
      testimonials[currentIndex].style.opacity = '1';
      
      // Bring current to front
      testimonials.forEach((t, i) => {
        t.style.position = i === currentIndex ? 'relative' : 'absolute';
      });
    }, 8000);
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  new VocaryWelcome();
});