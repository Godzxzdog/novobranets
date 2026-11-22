// Дрібний дощ на canvas. Дешевий: до ~120 штрихів, пауза у фоновій вкладці,
// вимкнений за prefers-reduced-motion. Нічого не блокує кліки.

import { approach } from './atmosphere.js';

export class Mist {
  constructor(canvas) {
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.drops = [];
    this.intensity = 0.3;
    this.target = 0.3;
    this.enabled = true;
    this.raf = 0;
    this.w = 0;
    this.h = 0;
    this.last = 0;
    this.resize = this.resize.bind(this);
    this.loop = this.loop.bind(this);
    window.addEventListener('resize', this.resize);
    document.addEventListener('visibilitychange', () => (document.hidden ? this.stop() : this.start()));
    this.resize();
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.c.width = Math.floor(this.w * dpr);
    this.c.height = Math.floor(this.h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  setTarget(rain) {
    this.target = rain;
  }

  setEnabled(on) {
    this.enabled = on;
    if (!on) {
      this.stop();
      this.ctx.clearRect(0, 0, this.w, this.h);
    } else {
      this.start();
    }
  }

  start() {
    if (this.raf || !this.enabled) return;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  stop() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  spawn(initial = false) {
    return {
      x: Math.random() * (this.w + 80) - 40,
      y: initial ? Math.random() * this.h : -20,
      len: 6 + Math.random() * 14,
      v: 180 + Math.random() * 220,
      a: 0.06 + Math.random() * 0.16,
    };
  }

  loop(now) {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.intensity = approach(this.intensity, this.target, 0.03);

    const want = Math.round(24 + this.intensity * 110);
    while (this.drops.length < want) this.drops.push(this.spawn(true));
    if (this.drops.length > want) this.drops.length = want;

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);
    ctx.lineWidth = 1;
    const wind = 0.28; // легкий нахил
    for (const d of this.drops) {
      d.y += d.v * dt;
      d.x -= d.v * dt * wind;
      if (d.y > this.h + 20 || d.x < -60) Object.assign(d, this.spawn(false));
      ctx.strokeStyle = `rgba(190,196,180,${d.a})`;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x + d.len * wind, d.y - d.len);
      ctx.stroke();
    }
    this.raf = requestAnimationFrame(this.loop);
  }
}
