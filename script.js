/**
ed, 60fps Hardware-Accelerated
 */

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // DOM References
  // ---------------------------------------------------------------------------
  const stage = document.getElementById('stage');
  const screen1 = document.getElementById('screen1');
  const screen2 = document.getElementById('screen2');
  const screen3 = document.getElementById('screen3');

  const inviteBtn = document.getElementById('inviteBtn');
  const dateClickable = document.getElementById('dateClickable');
  const dateText = document.getElementById('dateText');
  const dateChars = document.querySelectorAll('.date-char');
  const datePrompt = document.getElementById('datePrompt');

  const calligraphyStage = document.getElementById('calligraphyStage');
  const trackLine1 = document.getElementById('trackLine1');
  const trackLine2 = document.getElementById('trackLine2');
  const penNib = document.getElementById('penNib');
  const flourishSvg = document.getElementById('flourishSvg');
  const flourishPath = document.getElementById('flourishPath');

  const birthdayBlessing = document.getElementById('birthdayBlessing');
  const replayBox = document.getElementById('replayBox');
  const replayBtn = document.getElementById('replayBtn');
  const celebrationGarland = document.querySelector('.celebration-garland');

  const audioToggleBtn = document.getElementById('audioToggleBtn');
  const touchFxLayer = document.getElementById('touchFxLayer');

  const bgCanvas = document.getElementById('bgCanvas');
  const bgCtx = bgCanvas ? bgCanvas.getContext('2d') : null;
  const petalCanvas = document.getElementById('petalCanvas');
  const petalCtx = petalCanvas ? petalCanvas.getContext('2d') : null;

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  let currentScreen = 1;
  let isTransitioning = false;
  let dateTimer = null;
  let handwritingAnimId = null;
  let canClickDate = false;
  let isMuted = true; // Muted by default per requirements

  // ---------------------------------------------------------------------------
  // Canvas Dimensions & Responsive Sizing
  // ---------------------------------------------------------------------------
  let width = window.innerWidth;
  let height = window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resizeCanvases() {
    width = window.innerWidth;
    height = window.innerHeight;

    if (bgCanvas && bgCtx) {
      bgCanvas.width = width * dpr;
      bgCanvas.height = height * dpr;
      bgCtx.scale(dpr, dpr);
    }

    if (petalCanvas && petalCtx) {
      petalCanvas.width = width * dpr;
      petalCanvas.height = height * dpr;
      petalCtx.scale(dpr, dpr);
    }
  }

  window.addEventListener('resize', resizeCanvases, { passive: true });
  resizeCanvases();

  // ---------------------------------------------------------------------------
  // Audio Engine (Web Audio API Synthesizer — Muted by default)
  // ---------------------------------------------------------------------------
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playTone(freq, duration = 0.6, type = 'sine', gainVal = 0.15) {
    if (isMuted || !audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Audio fallback safe
    }
  }

  // Romantic music box harp notes
  function playChord(frequencies, delayBetween = 80) {
    if (isMuted || !audioCtx) return;
    frequencies.forEach((f, idx) => {
      setTimeout(() => {
        playTone(f, 1.2, 'sine', 0.12);
      }, idx * delayBetween);
    });
  }

  // Audio Toggle Button Listener
  if (audioToggleBtn) {
    audioToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      initAudio();
      isMuted = !isMuted;
      audioToggleBtn.classList.toggle('playing', !isMuted);
      if (!isMuted) {
        // Welcome chime
        playChord([523.25, 659.25, 783.99, 1046.50]); // C5 - E5 - G5 - C6
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Background Particles: Fireflies & Floating Light Orbs
  // ---------------------------------------------------------------------------
  const fireflies = [];
  const FIREFLY_COUNT = Math.min(38, Math.floor(window.innerWidth / 12));

  class Firefly {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * width;
      this.y = initial ? Math.random() * height : height + 10;
      this.radius = 1.2 + Math.random() * 2.2;
      this.speedX = (Math.random() - 0.5) * 0.45;
      this.speedY = -0.2 - Math.random() * 0.45;
      this.alpha = 0.2 + Math.random() * 0.6;
      this.pulseSpeed = 0.015 + Math.random() * 0.03;
      this.pulseOffset = Math.random() * Math.PI * 2;
      // Warm golden / pastel rose hues
      this.isRose = Math.random() > 0.65;
    }

    update() {
      this.x += this.speedX + Math.sin(this.pulseOffset) * 0.2;
      this.y += this.speedY;
      this.pulseOffset += this.pulseSpeed;

      if (this.y < -20 || this.x < -20 || this.x > width + 20) {
        this.reset();
      }
    }

    draw(ctx) {
      const currentAlpha = Math.max(0.05, this.alpha * (0.6 + 0.4 * Math.sin(this.pulseOffset)));
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

      const colorCore = this.isRose ? `rgba(255, 192, 203, ${currentAlpha})` : `rgba(255, 235, 150, ${currentAlpha})`;
      ctx.fillStyle = colorCore;
      ctx.shadowColor = this.isRose ? 'rgba(255, 150, 180, 0.9)' : 'rgba(255, 213, 107, 0.9)';
      ctx.shadowBlur = this.radius * 7;
      ctx.fill();

      // Outer delicate halo
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 3, 0, Math.PI * 2);
      ctx.fillStyle = this.isRose ? `rgba(255, 170, 190, ${currentAlpha * 0.15})` : `rgba(255, 220, 120, ${currentAlpha * 0.15})`;
      ctx.fill();

      ctx.restore();
    }
  }

  for (let i = 0; i < FIREFLY_COUNT; i++) {
    fireflies.push(new Firefly());
  }

  // ---------------------------------------------------------------------------
  // Floating Flower Petals Engine (Rose & Cherry Blossom)
  // ---------------------------------------------------------------------------
  const petals = [];
  const PETAL_COUNT = Math.min(32, Math.floor(window.innerWidth / 15));

  class Petal {
    constructor(isBurst = false, originX = 0, originY = 0) {
      this.reset(true, isBurst, originX, originY);
    }

    reset(initial = false, isBurst = false, originX = 0, originY = 0) {
      if (isBurst) {
        this.x = originX + (Math.random() - 0.5) * 40;
        this.y = originY + (Math.random() - 0.5) * 40;
        const angle = Math.random() * Math.PI * 2;
        const spd = 2 + Math.random() * 5;
        this.speedX = Math.cos(angle) * spd;
        this.speedY = Math.sin(angle) * spd - 1.5;
      } else {
        this.x = Math.random() * (width + 100) - 50;
        this.y = initial ? Math.random() * height : -30;
        this.speedX = 0.5 + Math.random() * 1.2;
        this.speedY = 0.8 + Math.random() * 1.4;
      }

      this.size = 9 + Math.random() * 11;
      this.rotation = Math.random() * 360;
      this.rotSpeed = (Math.random() - 0.5) * 1.8;
      this.wobble = Math.random() * Math.PI * 2;
      this.wobbleSpeed = 0.02 + Math.random() * 0.035;
      this.flip = Math.random();
      this.flipSpeed = 0.015 + Math.random() * 0.025;
      this.alpha = 0.65 + Math.random() * 0.35;
      this.isBurst = isBurst;
      this.decay = isBurst ? 0.006 + Math.random() * 0.008 : 0;
    }

    update() {
      this.wobble += this.wobbleSpeed;
      this.flip += this.flipSpeed;
      this.rotation += this.rotSpeed;

      if (this.isBurst) {
        this.speedX *= 0.96;
        this.speedY += 0.06; // Gravity
        this.alpha -= this.decay;
      } else {
        this.x += this.speedX + Math.sin(this.wobble) * 0.8;
        this.y += this.speedY;
      }

      if (this.isBurst) {
        if (this.alpha <= 0) this.alpha = 0;
      } else {
        if (this.y > height + 40 || this.x > width + 60) {
          this.reset(false);
        }
      }
    }

    draw(ctx) {
      if (this.alpha <= 0) return;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate((this.rotation * Math.PI) / 180);
      ctx.scale(Math.cos(this.flip), 1);

      // Draw graceful curved petal shape
      ctx.beginPath();
      ctx.moveTo(0, -this.size);
      ctx.bezierCurveTo(this.size * 0.8, -this.size * 0.6, this.size * 0.8, this.size * 0.7, 0, this.size);
      ctx.bezierCurveTo(-this.size * 0.8, this.size * 0.7, -this.size * 0.8, -this.size * 0.6, 0, -this.size);

      // Romantic rose petal gradient
      const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, this.size);
      grad.addColorStop(0, `rgba(255, 225, 235, ${this.alpha * 0.95})`);
      grad.addColorStop(0.55, `rgba(255, 175, 195, ${this.alpha * 0.85})`);
      grad.addColorStop(1, `rgba(240, 130, 160, ${this.alpha * 0.75})`);

      ctx.fillStyle = grad;
      ctx.shadowColor = 'rgba(255, 180, 195, 0.4)';
      ctx.shadowBlur = 4;
      ctx.fill();

      ctx.restore();
    }
  }

  for (let i = 0; i < PETAL_COUNT; i++) {
    petals.push(new Petal());
  }

  function spawnPetalBurst(x, y, count = 28) {
    for (let i = 0; i < count; i++) {
      petals.push(new Petal(true, x, y));
    }
  }

  // ---------------------------------------------------------------------------
  // Master Animation Loop (Canvases)
  // ---------------------------------------------------------------------------
  function renderCanvases() {
    // 1. Background fireflies & ambient light
    if (bgCtx) {
      bgCtx.clearRect(0, 0, width, height);
      for (let i = 0; i < fireflies.length; i++) {
        fireflies[i].update();
        fireflies[i].draw(bgCtx);
      }
    }

    // 2. Foreground floating flower petals
    if (petalCtx) {
      petalCtx.clearRect(0, 0, width, height);
      for (let i = petals.length - 1; i >= 0; i--) {
        petals[i].update();
        petals[i].draw(petalCtx);
        if (petals[i].isBurst && petals[i].alpha <= 0) {
          petals.splice(i, 1);
        }
      }
    }

    requestAnimationFrame(renderCanvases);
  }
  requestAnimationFrame(renderCanvases);

  // ---------------------------------------------------------------------------
  // Screen Transition Coordinator
  // ---------------------------------------------------------------------------
  function transitionToScreen(fromEl, toEl, onComplete) {
    if (isTransitioning) return;
    isTransitioning = true;

    fromEl.classList.remove('active');
    fromEl.classList.add('leaving');

    toEl.classList.remove('hidden');
    toEl.classList.add('entering');

    // Trigger reflow for CSS transition
    void toEl.offsetWidth;

    setTimeout(() => {
      toEl.classList.remove('entering');
      toEl.classList.add('active');
    }, 40);

    setTimeout(() => {
      fromEl.classList.remove('leaving');
      fromEl.classList.add('hidden');
      isTransitioning = false;
      if (onComplete) onComplete();
    }, 800);
  }

  // ---------------------------------------------------------------------------
  // SCREEN 1 -> SCREEN 2: The Invitation Action
  // ---------------------------------------------------------------------------
  if (inviteBtn) {
    inviteBtn.addEventListener('click', (e) => {
      e.preventDefault();
      initAudio();
      triggerTouchSparkles(e.clientX || width / 2, e.clientY || height / 2);
      playChord([523.25, 659.25, 783.99, 1046.50]); // Opening celebratory chord

      transitionToScreen(screen1, screen2, () => {
        currentScreen = 2;
        startDateScreenSequence();
      });
    });
  }

  // ---------------------------------------------------------------------------
  // SCREEN 2: The Special Date (01-11-26) Animation & Logic
  // ---------------------------------------------------------------------------
  function startDateScreenSequence() {
    canClickDate = false; // Block until the 2-second timer elapses
    datePrompt.classList.remove('visible');

    // Reset date characters
    dateChars.forEach((ch) => ch.classList.remove('revealed'));

    // Reveal date characters in graceful typewriter sequence
    const notes = [440, 493.88, 523.25, 587.33, 659.25, 698.46, 783.99, 880];
    dateChars.forEach((ch, idx) => {
      setTimeout(() => {
        ch.classList.add('revealed');
        if (!isMuted) playTone(notes[idx % notes.length], 0.35, 'sine', 0.09);
        // Little particle burst at character
        const rect = ch.getBoundingClientRect();
        if (rect.width > 0) {
          triggerTouchSparkles(rect.left + rect.width / 2, rect.top + rect.height / 2, 4);
        }
      }, 200 + idx * 130);
    });

    // 2-Second Timer: Keep date visible for at least 2 full seconds before showing prompt
    if (dateTimer) clearTimeout(dateTimer);
    dateTimer = setTimeout(() => {
      datePrompt.classList.add('visible');
      canClickDate = true;
      if (!isMuted) playTone(783.99, 0.7, 'sine', 0.06);
    }, 2000);
  }

  // Handle Date Tap/Click
  function handleDateClick(e) {
    if (!canClickDate || isTransitioning) return;
    canClickDate = false;

    const clickX = e.clientX || width / 2;
    const clickY = e.clientY || height / 2;

    // Spectacular celebration burst!
    triggerTouchSparkles(clickX, clickY, 24);
    spawnPetalBurst(clickX, clickY, 32);
    playChord([587.33, 739.99, 880, 1174.66], 70); // Golden glissando

    transitionToScreen(screen2, screen3, () => {
      currentScreen = 3;
      startHandwritingAnimation();
    });
  }

  if (dateClickable) {
    dateClickable.addEventListener('click', handleDateClick);
    dateClickable.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleDateClick(e);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // SCREEN 3: Real-Pen Progressive Handwriting Animation
  // ---------------------------------------------------------------------------
  function resetHandwritingStage() {
    if (trackLine1) trackLine1.style.clipPath = 'inset(0 100% 0 0)';
    if (trackLine2) trackLine2.style.clipPath = 'inset(0 100% 0 0)';
    if (penNib) penNib.style.opacity = '0';
    if (flourishSvg) flourishSvg.classList.remove('visible');
    if (flourishPath) flourishPath.classList.remove('drawn');
  }

  function startHandwritingAnimation() {
    if (handwritingAnimId) cancelAnimationFrame(handwritingAnimId);

    if (!trackLine1 || !trackLine2 || !penNib || !calligraphyStage) return;

    resetHandwritingStage();
    celebrationGarland.classList.remove('visible');
    birthdayBlessing.classList.remove('visible');
    replayBox.classList.remove('visible');

    // Measure positions relative to calligraphyStage
    const stageRect = calligraphyStage.getBoundingClientRect();
    const r1 = trackLine1.getBoundingClientRect();
    const r2 = trackLine2.getBoundingClientRect();

    const x1Start = r1.left - stageRect.left;
    const x1End = r1.right - stageRect.left;
    const y1 = r1.top - stageRect.top + r1.height * 0.52;

    const x2Start = r2.left - stageRect.left;
    const x2End = r2.right - stageRect.left;
    const y2 = r2.top - stageRect.top + r2.height * 0.52;

    penNib.style.opacity = '1';
    penNib.style.left = `${x1Start}px`;
    penNib.style.top = `${y1}px`;

    let startTime = null;
    const durationLine1 = 2100;   // "Happy Birthday" reveal
    const pauseBetween = 400;     // Pen lift & transition to Line 2
    const durationLine2 = 2000;   // "AIKANSH" (Capital letters) reveal
    const pauseFlourish = 250;    // Pause before flourish
    const durationFlourish = 850; // Underline flourish draw

    let lastSparkleTime = 0;
    let melodyNoteIndex = 0;
    // Soft romantic music-box melody of Happy Birthday notes
    const birthdayMelody = [
      523.25, 523.25, 587.33, 523.25, 698.46, 659.25,
      523.25, 523.25, 587.33, 523.25, 783.99, 698.46,
      523.25, 523.25, 1046.50, 880, 698.46, 659.25, 587.33,
      987.77, 987.77, 880, 698.46, 783.99, 698.46
    ];

    function playMelodyStep(elapsed) {
      if (isMuted) return;
      const noteInterval = 320;
      const expectedIndex = Math.floor(elapsed / noteInterval);
      if (expectedIndex > melodyNoteIndex && melodyNoteIndex < birthdayMelody.length) {
        melodyNoteIndex = expectedIndex;
        playTone(birthdayMelody[melodyNoteIndex % birthdayMelody.length], 0.7, 'triangle', 0.08);
      }
    }

    function emitPenSparkle(screenX, screenY, ts) {
      if (ts - lastSparkleTime > 70) {
        lastSparkleTime = ts;
        triggerTouchSparkles(screenX, screenY, 2);
      }
    }

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      playMelodyStep(elapsed);

      // Phase 1: Line 1 ("Happy Birthday")
      if (elapsed < durationLine1) {
        const p = elapsed / durationLine1;
        trackLine1.style.clipPath = `inset(0 ${(1 - p) * 100}% 0 0)`;
        const curX = x1Start + (x1End - x1Start) * p;
        penNib.style.left = `${curX}px`;
        penNib.style.top = `${y1}px`;
        emitPenSparkle(stageRect.left + curX, stageRect.top + y1, timestamp);
        handwritingAnimId = requestAnimationFrame(step);
      }
      // Phase 2: Pen Lift from Line 1 to Line 2
      else if (elapsed < durationLine1 + pauseBetween) {
        trackLine1.style.clipPath = 'inset(0 0% 0 0)';
        const p = (elapsed - durationLine1) / pauseBetween;
        const curX = x1End + (x2Start - x1End) * p;
        const curY = y1 + (y2 - y1) * p - Math.sin(p * Math.PI) * 22; // Arc pen lift
        penNib.style.left = `${curX}px`;
        penNib.style.top = `${curY}px`;
        penNib.style.opacity = `${1 - 0.4 * Math.sin(p * Math.PI)}`;
        handwritingAnimId = requestAnimationFrame(step);
      }
      // Phase 3: Line 2 ("AIKANSH" in All Capitals)
      else if (elapsed < durationLine1 + pauseBetween + durationLine2) {
        penNib.style.opacity = '1';
        const p = (elapsed - (durationLine1 + pauseBetween)) / durationLine2;
        trackLine2.style.clipPath = `inset(0 ${(1 - p) * 100}% 0 0)`;
        const curX = x2Start + (x2End - x2Start) * p;
        penNib.style.left = `${curX}px`;
        penNib.style.top = `${y2}px`;
        emitPenSparkle(stageRect.left + curX, stageRect.top + y2, timestamp);
        handwritingAnimId = requestAnimationFrame(step);
      }
      // Phase 4: Underline Flourish Reveal
      else if (elapsed < durationLine1 + pauseBetween + durationLine2 + pauseFlourish + durationFlourish) {
        trackLine2.style.clipPath = 'inset(0 0% 0 0)';
        track2Completed();
        handwritingAnimId = requestAnimationFrame(step);
      }
      // Phase 5: Grand Finale & Completion!
      else {
        trackLine1.style.clipPath = 'inset(0 0% 0 0)';
        trackLine2.style.clipPath = 'inset(0 0% 0 0)';
        finishSurprise();
      }
    }

    function track2Completed() {
      trackLine2.style.width = '100%';
      penNib.style.opacity = '0';
      if (flourishSvg && !flourishSvg.classList.contains('visible')) {
        flourishSvg.classList.add('visible');
        if (flourishPath) flourishPath.classList.add('drawn');
      }
    }

    function finishSurprise() {
      trackLine1.style.width = '100%';
      trackLine2.style.width = '100%';
      penNib.style.opacity = '0';
      if (flourishSvg) flourishSvg.classList.add('visible');
      if (flourishPath) flourishPath.classList.add('drawn');

      // Grand celebration burst
      triggerTouchSparkles(width / 2, height * 0.45, 28);
      spawnPetalBurst(width / 2, height * 0.35, 40);

      setTimeout(() => celebrationGarland.classList.add('visible'), 200);
      setTimeout(() => birthdayBlessing.classList.add('visible'), 500);
      setTimeout(() => replayBox.classList.add('visible'), 1000);

      if (!isMuted) {
        playChord([659.25, 783.99, 1046.50, 1318.51], 100);
      }
    }

    handwritingAnimId = requestAnimationFrame(step);
  }

  // ---------------------------------------------------------------------------
  // Replay Functionality
  // ---------------------------------------------------------------------------
  if (replayBtn) {
    replayBtn.addEventListener('click', (e) => {
      e.preventDefault();
      triggerTouchSparkles(e.clientX || width / 2, e.clientY || height / 2);

      if (handwritingAnimId) cancelAnimationFrame(handwritingAnimId);
      if (dateTimer) clearTimeout(dateTimer);

      celebrationGarland.classList.remove('visible');
      birthdayBlessing.classList.remove('visible');
      replayBox.classList.remove('visible');
      datePrompt.classList.remove('visible');
      dateChars.forEach((ch) => ch.classList.remove('revealed'));
      resetHandwritingStage();

      transitionToScreen(screen3, screen1, () => {
        currentScreen = 1;
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Interactive Tap / Touch Sparkles Effect
  // ---------------------------------------------------------------------------
  function triggerTouchSparkles(x, y, count = 8) {
    if (!touchFxLayer) return;
    for (let i = 0; i < count; i++) {
      const sp = document.createElement('span');
      sp.className = 'tap-sparkle';
      sp.style.left = `${x}px`;
      sp.style.top = `${y}px`;

      const angle = Math.random() * Math.PI * 2;
      const dist = 25 + Math.random() * 55;
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist;

      sp.style.setProperty('--tx', `${tx}px`);
      sp.style.setProperty('--ty', `${ty}px`);

      if (Math.random() > 0.5) {
        sp.style.background = '#ffb3c6';
        sp.style.boxShadow = '0 0 10px #ffb3c6, 0 0 16px #ffd56b';
      }

      touchFxLayer.appendChild(sp);
      setTimeout(() => sp.remove(), 750);
    }
  }

  // Global touch listener for magical interactivity
  window.addEventListener('pointerdown', (e) => {
    // Only spawn ambient sparkles if not clicking an interactive button
    if (!e.target.closest('button') && !e.target.closest('#dateClickable')) {
      triggerTouchSparkles(e.clientX, e.clientY, 6);
    }
  }, { passive: true });

  // Initialize stage on page load
  window.addEventListener('DOMContentLoaded', () => {
    resetHandwritingStage();
  });

})();
