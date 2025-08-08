class SpaceBackground {
  constructor() {
    this.initElements();
    this.createStars();
    this.createMeteors();
  }

  initElements() {
    this.constellation = document.querySelector('.constellation');
    if (!this.constellation) {
      this.constellation = document.createElement('div');
      this.constellation.className = 'constellation';
      document.body.insertBefore(this.constellation, document.body.firstChild);
    }
  }

  createStars() {
    const starCount = 200;
    
    for (let i = 0; i < starCount; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      
      const size = Math.floor(Math.random() * 3) + 1;
      star.style.setProperty('--star-size', `${size}px`);
      star.style.top = `${Math.random() * 100}%`;
      star.style.left = `${Math.random() * 100}%`;
      star.style.setProperty('--twinkle-duration', `${3 + Math.random() * 4}s`);
      star.style.setProperty('--twinkle-opacity', `${0.3 + Math.random() * 0.5}`);
      
      if (Math.random() > 0.9) {
        star.style.backgroundColor = `hsl(${Math.random() * 60 + 200}, 100%, 80%)`;
      }
      
      this.constellation.appendChild(star);
    }
  }

  createMeteors() {
    for (let i = 1; i <= 4; i++) {
      this.spawnMeteor(i);
    }
    
    setInterval(() => {
      const style = Math.floor(Math.random() * 4) + 1;
      this.spawnMeteor(style);
    }, 2000);
  }

  spawnMeteor(style) {
    const meteor = document.createElement('div');
    meteor.className = `meteor style${style}`;
    this.constellation.appendChild(meteor);
    
    setTimeout(() => {
      meteor.remove();
    }, 1000);
  }
}