class ParticleText extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.canvas = document.createElement("canvas");
    this.shadowRoot.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d", { willReadFrequently: true });
    this.particles = [];
    this.mode = "gather";
    this.modes = ["disperse", "gather", "stop"];
    this.modeIndex = 0;
  }

  static get observedAttributes() {
    return ["size", "color", "sharp", "effect"];
  }

  connectedCallback() {
    this.resize();
    this.createParticles();
    this.animate();
    window.addEventListener("resize", () => {
      this.resize();
      this.createParticles();
    });
    this.timer = setInterval(() => {
      // this.mode = this.mode === "gather" ? "disperse" : "gather";
      this.mode = this.modes[this.modeIndex];
      this.modeIndex = (this.modeIndex + 1) % this.modes.length;
      if (this.mode === "disperse") {
        for (let p of this.particles) {
          const angle = Math.atan2(p.originY - this.canvas.height/2, p.originX - this.canvas.width/2);
          const speed = Math.random() * 5 + 2; // 隨機速度
          p.explodeVx = Math.cos(angle) * speed;
          p.explodeVy = Math.sin(angle) * speed;
        }
      }
    }, 1500);
  }

  disconnectedCallback() {
    clearInterval(this.timer);
  }

  attributeChangedCallback() {
    this.createParticles();
  }

  resize() {
    // 設定canvas寬高為元素client尺寸
    const width = this.clientWidth || 600;
    const height = this.clientHeight || 300;
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.width = width + "px";
    this.canvas.style.height = height + "px";
  }

  createParticles() {
    const text = this.textContent.trim();
    const size = parseInt(this.getAttribute("size")) || 2;
    const color = this.getAttribute("color") || "#ffffff";
    const sharp = this.getAttribute("sharp") || "circle";
    const effect = this.getAttribute("effect") || "spread";

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.font = `${this.canvas.height / 2}px sans-serif`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillStyle = "#000"; // 方便取 alpha
    this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2);

    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;

    this.particles = [];
    for (let y = 0; y < imageData.height; y += 4) {
      for (let x = 0; x < imageData.width; x += 4) {
        const index = (y * imageData.width + x) * 4;
        const alpha = data[index + 3];
        if (alpha > 128) {
          this.particles.push({
            x: x,
            y: y,
            originX: x,
            originY: y,
            vx: 0,
            vy: 0,
            explodeVx: 0,
            explodeVy: 0,
          });
        }
      }
    }

    this.particleColor = color;
    this.particleSize = size;
    this.particleShape = sharp;
    this.particlesEffect = effect;
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let p of this.particles) {
      if (this.particlesEffect === "spread") {
        if (this.mode === "gather") {
          p.vx += (p.originX - p.x) * 0.5;
          p.vy += (p.originY - p.y) * 0.5;
        } else if (this.mode === "disperse") {
          p.vx += (Math.random() - 0.5) * 2;
          p.vy += (Math.random() - 0.5) * 2;
        }
      }
      else if (this.particlesEffect === "explode") {
        if (this.mode === "gather") {
          p.vx += (p.originX - p.x) * 0.01;
          p.vy += (p.originY - p.y) * 0.01;
        } else if (this.mode === "disperse") {
          // 直接往炸開的方向跑
          p.vx += p.explodeVx * 0.1;
          p.vy += p.explodeVy * 0.1;
        }
      }
      p.vx *= 0.9;
      p.vy *= 0.9;
      p.x += p.vx;
      p.y += p.vy;

      this.ctx.fillStyle = this.particleColor;
      if (this.particleShape === "square") {
        this.ctx.fillRect(p.x, p.y, this.particleSize, this.particleSize);
      } else {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, this.particleSize, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    requestAnimationFrame(() => this.animate());
  }
}

customElements.define("particle-text", ParticleText);
