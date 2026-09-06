import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Prologue() {
  const navigate = useNavigate();
  const containerRef = useRef(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    // Web Audio Engine
    let audioCtx = null;
    let audioEnabled = true;
    let nightAmbienceGain = null;
    let cricketTimer = null;

    function initAudioEngine() {
      if (!audioCtx) {
        try {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (AudioContextClass) audioCtx = new AudioContextClass();
        } catch (_) {}
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      startCalmNightAmbience();
    }

    function startCalmNightAmbience() {
      if (!audioEnabled || !audioCtx || nightAmbienceGain) return;
      try {
        nightAmbienceGain = audioCtx.createGain();
        nightAmbienceGain.gain.setValueAtTime(0.045, audioCtx.currentTime);
        nightAmbienceGain.connect(audioCtx.destination);

        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const filter = audioCtx.createBiquadFilter();

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(220, audioCtx.currentTime);

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(146.83, audioCtx.currentTime);
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(220.0, audioCtx.currentTime);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(nightAmbienceGain);

        osc1.start();
        osc2.start();

        function spawnCricketChirp() {
          if (!audioEnabled || !audioCtx) return;
          try {
            const now = audioCtx.currentTime;
            const cOsc = audioCtx.createOscillator();
            const cGain = audioCtx.createGain();
            cOsc.type = 'sine';
            cOsc.frequency.setValueAtTime(4600 + Math.random() * 600, now);
            cGain.gain.setValueAtTime(0.008, now);
            cGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
            cOsc.connect(cGain);
            cGain.connect(audioCtx.destination);
            cOsc.start(now);
            cOsc.stop(now + 0.12);
          } catch (_) {}
          cricketTimer = setTimeout(spawnCricketChirp, 1800 + Math.random() * 3200);
        }
        spawnCricketChirp();
      } catch (_) {}
    }

    function playMascotChirp(preset) {
      if (!audioEnabled) return;
      initAudioEngine();
      if (!audioCtx) return;
      try {
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';

        if (preset === 'salute') {
          osc.frequency.setValueAtTime(1600, now);
          osc.frequency.exponentialRampToValueAtTime(3200, now + 0.08);
          osc.frequency.exponentialRampToValueAtTime(2200, now + 0.16);
          osc.frequency.exponentialRampToValueAtTime(3400, now + 0.24);
          gain.gain.setValueAtTime(0.24, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
          osc.start(now);
          osc.stop(now + 0.32);
        } else if (preset === 'takeoff') {
          osc.frequency.setValueAtTime(1200, now);
          osc.frequency.exponentialRampToValueAtTime(2800, now + 0.14);
          gain.gain.setValueAtTime(0.22, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
          osc.start(now);
          osc.stop(now + 0.2);
        } else {
          osc.frequency.setValueAtTime(1800 + Math.random() * 400, now);
          osc.frequency.exponentialRampToValueAtTime(3000, now + 0.07);
          osc.frequency.exponentialRampToValueAtTime(1900, now + 0.15);
          gain.gain.setValueAtTime(0.18, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
          osc.start(now);
          osc.stop(now + 0.18);
        }

        osc.connect(gain);
        gain.connect(audioCtx.destination);
      } catch (_) {}
    }

    function playSynthTone(freq, type, duration, gainVal) {
      if (!audioEnabled) return;
      initAudioEngine();
      if (!audioCtx) return;
      try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(freq || 440, audioCtx.currentTime);
        gain.gain.setValueAtTime(gainVal || 0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + (duration || 0.3));
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + (duration || 0.3));
      } catch (_) {}
    }

    // Particle Canvas Engine
    const canvas = root.querySelector('#particlesCanvas');
    const ctx = canvas ? canvas.getContext('2d') : null;
    let stars = [];
    const wakeParticles = [];

    function resizeCanvas() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    function initStarfield(count) {
      stars = [];
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          size: Math.random() * 1.6 + 0.6,
          alpha: Math.random() * 0.8 + 0.2,
          twinkleSpeed: Math.random() * 0.02 + 0.005,
        });
      }
    }
    initStarfield(85);

    function emitFlightWake(x, y, vx, vy) {
      if (wakeParticles.length > 120) wakeParticles.shift();
      const hue = Math.random() > 0.4 ? '0, 210, 211' : '255, 122, 61';
      wakeParticles.push({
        x: x + (Math.random() - 0.5) * 12,
        y: y + (Math.random() - 0.5) * 12,
        vx: vx * -0.2 + (Math.random() - 0.5) * 1.5,
        vy: vy * -0.2 + (Math.random() - 0.5) * 1.5,
        size: Math.random() * 4 + 2,
        life: 1.0,
        decay: Math.random() * 0.025 + 0.015,
        hue,
      });
    }

    function emitStardustBurst(x, y, count = 16) {
      for (let i = 0; i < count; i++) {
        if (wakeParticles.length > 200) wakeParticles.shift();
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4.5 + 1.5;
        const colors = ['255, 190, 46', '255, 71, 87', '0, 210, 211', '255, 235, 160'];
        const chosenColor = colors[Math.floor(Math.random() * colors.length)];
        wakeParticles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 5 + 3,
          life: 1.0,
          decay: Math.random() * 0.025 + 0.015,
          hue: chosenColor,
        });
      }
    }

    function renderParticles() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const pVal = parseFloat(document.documentElement.style.getPropertyValue('--p')) || 0;
      const starOpacityMultiplier = Math.max(0, 1 - pVal * 1.2);

      if (starOpacityMultiplier > 0.01) {
        for (let s = 0; s < stars.length; s++) {
          const star = stars[s];
          star.alpha += star.twinkleSpeed;
          const a = (Math.sin(star.alpha) * 0.4 + 0.6) * starOpacityMultiplier;
          ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      for (let w = wakeParticles.length - 1; w >= 0; w--) {
        const p = wakeParticles[w];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        if (p.life <= 0) {
          wakeParticles.splice(w, 1);
          continue;
        }
        ctx.fillStyle = `rgba(${p.hue}, ${p.life})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = `rgba(${p.hue}, 0.6)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // Flight Controller
    const mascotEl = root.querySelector('#persistentMascot');
    const mascotChassis = root.querySelector('#mascotChassis');
    const birdRightWing = root.querySelector('#birdRightWing');
    const landingMoon = root.querySelector('#landingMoon');
    const groundCourtyard = root.querySelector('#groundCourtyardArea');
    const lunarFlash = root.querySelector('#lunarArrivalFlash');
    const mainContent = root.querySelector('#mainFlightContent');

    let flightMode = 'prologue';
    let scrollTargetProgress = 0;
    let scrollCurrentProgress = 0;
    let lastMascotX = window.innerWidth * 0.335;
    let lastMascotY = window.innerHeight * 0.73;
    let currentTilt = 0;
    let isChirpingNow = false;
    let chirpStartTime = 0;
    let chirpDuration = 360;
    let animFrameId = null;

    function triggerMascotChirp(preset) {
      isChirpingNow = true;
      chirpStartTime = performance.now();
      chirpDuration = preset === 'salute' ? 420 : 320;
      playMascotChirp(preset);
    }

    function triggerMascotCheer(_ignoredText, preset) {
      triggerMascotChirp(preset || 'chirp');
    }

    // Touch / Click on mascot
    if (mascotEl) {
      mascotEl.addEventListener('click', (e) => {
        e.stopPropagation();
        initAudioEngine();
        triggerMascotChirp('salute');
        emitStardustBurst(lastMascotX, lastMascotY, 18);
      });
    }

    const flightStations = [
      { p: 0.0, x: 0.78, y: 0.28, rot: -6, scale: 1.1 },
      { p: 0.18, x: 0.22, y: 0.45, rot: 14, scale: 1.0 },
      { p: 0.38, x: 0.8, y: 0.5, rot: -12, scale: 1.0 },
      { p: 0.56, x: 0.18, y: 0.48, rot: 12, scale: 0.95 },
      { p: 0.74, x: 0.82, y: 0.42, rot: -8, scale: 1.05 },
      { p: 0.88, x: 0.22, y: 0.5, rot: 8, scale: 1.0 },
      { p: 1.0, x: 0.5, y: 0.35, rot: 0, scale: 2.2 },
    ];

    function interpolateScrollFlight(progress) {
      const p = Math.max(0, Math.min(1, progress));
      const stations = flightStations;
      let i = 0;
      while (i < stations.length - 1 && stations[i + 1].p <= p) {
        i++;
      }
      if (i >= stations.length - 1) return stations[stations.length - 1];

      const p1 = stations[i];
      const p2 = stations[i + 1];
      const localT = (p - p1.p) / (p2.p - p1.p);
      const t = localT * localT * (3 - 2 * localT);

      const xNorm = p1.x + (p2.x - p1.x) * t;
      const yNorm = p1.y + (p2.y - p1.y) * t;
      const rot = p1.rot + (p2.rot - p1.rot) * t;
      const scale = p1.scale + (p2.scale - p1.scale) * t;

      return {
        x: xNorm * window.innerWidth,
        y: yNorm * window.innerHeight,
        rot,
        scale,
      };
    }

    const cinematicFlightPos = { x: window.innerWidth * 0.335, y: window.innerHeight * 0.73, rot: 0, scale: 0.7 };
    let isCinematicRunning = false;

    function startContinuousAscentLaunch() {
      isCinematicRunning = true;
      flightMode = 'prologue';
      initAudioEngine();

      document.body.classList.add('prologue-locked');
      if (mainContent) mainContent.classList.remove('content-revealed');

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const nestCoord = { x: vw * 0.335, y: vh * 0.73 };
      const closeViewerCoord = { x: vw * 0.5, y: vh * 0.44 };
      const underLandingCoord = { x: vw * 0.32, y: vh * 0.78 };
      const moonCoord = { x: vw * 0.86, y: vh * 0.12 };

      if (groundCourtyard) groundCourtyard.classList.remove('ground-descended');
      if (landingMoon) landingMoon.classList.remove('lunar-ignited');

      cinematicFlightPos.x = nestCoord.x;
      cinematicFlightPos.y = nestCoord.y;
      cinematicFlightPos.scale = 0.68;
      cinematicFlightPos.rot = 0;
      triggerMascotCheer('Waking up in the botanical oak nest...', 'takeoff');

      setTimeout(() => {
        triggerMascotCheer('Taking flight towards you! 🪶', 'takeoff');
        const t0 = performance.now();
        const dur1 = 2200;

        function stepToViewer(now) {
          const t = Math.min(1, (now - t0) / dur1);
          const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

          cinematicFlightPos.x = nestCoord.x + (closeViewerCoord.x - nestCoord.x) * ease;
          cinematicFlightPos.y = nestCoord.y + (closeViewerCoord.y - nestCoord.y) * ease - Math.sin(t * Math.PI) * 40;
          cinematicFlightPos.scale = 0.68 + (2.2 - 0.68) * ease;
          cinematicFlightPos.rot = Math.sin(t * Math.PI * 4) * 8;

          if (t < 1) {
            requestAnimationFrame(stepToViewer);
          } else {
            executeViewerSalute(closeViewerCoord, underLandingCoord, moonCoord);
          }
        }
        requestAnimationFrame(stepToViewer);
      }, 1600);
    }

    function executeViewerSalute(closePos, underPos, moonPos) {
      if (birdRightWing) birdRightWing.classList.add('saluting');
      triggerMascotCheer('“Salute, Learner! Welcome to LiteraAI!” 🪶', 'salute');

      setTimeout(() => {
        if (birdRightWing) birdRightWing.classList.remove('saluting');
        triggerMascotCheer('Flying from below the landing page to reach the moon!', 'takeoff');

        if (groundCourtyard) groundCourtyard.classList.add('ground-descended');

        const t0 = performance.now();
        const durAscent = 3200;
        const p0 = { x: closePos.x, y: closePos.y };
        const p1 = { x: underPos.x, y: underPos.y };
        const p2 = { x: window.innerWidth * 0.62, y: window.innerHeight * 0.4 };
        const p3 = { x: moonPos.x, y: moonPos.y };

        function stepAscentToMoon(now) {
          const t = Math.min(1, (now - t0) / durAscent);
          const mt = 1 - t;

          const curX = mt * mt * mt * p0.x + 3 * mt * mt * t * p1.x + 3 * mt * t * t * p2.x + t * t * t * p3.x;
          const curY = mt * mt * mt * p0.y + 3 * mt * mt * t * p1.y + 3 * mt * t * t * p2.y + t * t * t * p3.y;

          cinematicFlightPos.x = curX;
          cinematicFlightPos.y = curY;
          cinematicFlightPos.scale = 2.2 - (2.2 - 1.1) * t;
          cinematicFlightPos.rot = 14 - t * 24 + Math.sin(t * Math.PI * 6) * 6;

          if (t > 0.45 && t < 0.47) playMascotChirp();
          if (t > 0.8 && t < 0.82) playMascotChirp();

          if (t < 1) {
            requestAnimationFrame(stepAscentToMoon);
          } else {
            onArrivalAtMoon();
          }
        }
        requestAnimationFrame(stepAscentToMoon);
      }, 2100);
    }

    function onArrivalAtMoon() {
      if (landingMoon) landingMoon.classList.add('lunar-ignited');
      if (lunarFlash) lunarFlash.classList.add('pop');
      playSynthTone(880, 'sine', 0.4, 0.3);

      document.body.classList.remove('prologue-locked');
      if (mainContent) mainContent.classList.add('content-revealed');

      triggerMascotCheer('Reached the Moon! Scroll down to explore with me! 🌟', 'salute');

      setTimeout(() => {
        isCinematicRunning = false;
        flightMode = 'scrolling';
      }, 800);
    }

    function masterAnimationTick() {
      let targetX, targetY, targetScale, targetRot;

      if (flightMode === 'prologue' && isCinematicRunning) {
        targetX = cinematicFlightPos.x;
        targetY = cinematicFlightPos.y;
        targetScale = cinematicFlightPos.scale;
        targetRot = cinematicFlightPos.rot;
      } else {
        scrollCurrentProgress += (scrollTargetProgress - scrollCurrentProgress) * 0.085;
        const scrollState = interpolateScrollFlight(scrollCurrentProgress);
        targetX = scrollState.x;
        targetY = scrollState.y;
        targetScale = scrollState.scale;
        targetRot = scrollState.rot;
      }

      const vx = targetX - lastMascotX;
      const vy = targetY - lastMascotY;
      const velocityMag = Math.sqrt(vx * vx + vy * vy);

      const dynamicBank = targetRot + Math.max(-25, Math.min(25, vx * 1.5));
      currentTilt += (dynamicBank - currentTilt) * 0.12;

      if (mascotEl) {
        mascotEl.style.left = `${targetX}px`;
        mascotEl.style.top = `${targetY}px`;
      }
      if (mascotChassis) {
        mascotChassis.style.transform = `rotate(${currentTilt}deg) scale(${targetScale})`;
      }

      const wingFlapEls = root.querySelectorAll('.wing-dyn');
      const flapDuration = Math.max(0.12, 0.32 - velocityMag * 0.02);
      wingFlapEls.forEach((w) => {
        w.style.animationDuration = `${flapDuration}s`;
      });

      if (velocityMag > 1.0 || Math.random() < 0.2) {
        emitFlightWake(targetX, targetY + 15, vx, vy);
      }

      const hudProg = root.querySelector('#hudProgressBar');
      if (hudProg) hudProg.style.width = `${scrollCurrentProgress * 100}%`;

      // Beak Kinematic Morphing
      let beakOpen = 0;
      if (isChirpingNow) {
        const elapsed = performance.now() - chirpStartTime;
        if (elapsed < chirpDuration) {
          const cycle = Math.sin((elapsed / 55) * Math.PI);
          beakOpen = Math.max(0, cycle) * 8.5;
        } else {
          isChirpingNow = false;
        }
      }
      const lowerBeakEl = root.querySelector('#birdBeakLower');
      const mouthCavityEl = root.querySelector('#birdMouthCavity');
      if (lowerBeakEl) {
        lowerBeakEl.setAttribute(
          'd',
          `M90 128 Q100 ${132 + beakOpen} 110 128 Q108 ${138 + beakOpen * 1.6} 100 ${
            140 + beakOpen * 1.8
          } Q92 ${138 + beakOpen * 1.6} 90 128 Z`
        );
      }
      if (mouthCavityEl) {
        mouthCavityEl.setAttribute('d', `M91 127 Q100 127 109 127 Q100 ${127 + beakOpen * 1.2} 91 127 Z`);
      }

      const isNearBottom = scrollCurrentProgress >= 0.94;
      document.body.classList.toggle('dawn-finale-active', isNearBottom);

      lastMascotX = targetX;
      lastMascotY = targetY;

      renderParticles();
      animFrameId = requestAnimationFrame(masterAnimationTick);
    }
    animFrameId = requestAnimationFrame(masterAnimationTick);

    startContinuousAscentLaunch();

    function onWindowScroll() {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      scrollTargetProgress = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
      document.documentElement.style.setProperty('--p', scrollTargetProgress.toFixed(4));
    }
    window.addEventListener('scroll', onWindowScroll, { passive: true });
    onWindowScroll();

    // Reveal Blocks via IntersectionObserver
    if (window.IntersectionObserver) {
      const revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('in-view');
            }
          });
        },
        { threshold: 0.15 }
      );
      root.querySelectorAll('.reveal-block').forEach((el) => revealObserver.observe(el));
    } else {
      root.querySelectorAll('.reveal-block').forEach((el) => el.classList.add('in-view'));
    }

    // Polyglot Data & Tab Switching
    const polyglotData = {
      hi: {
        sentence: 'ज्ञान से संसार प्रकाशित होता है।',
        translit: 'Gyan se sansar prakashit hota hai.',
        meaning: '“Knowledge illuminates the world.”',
        tokens: [
          { term: 'ज्ञान (Gyan)', gloss: 'Knowledge • Noun' },
          { term: 'संसार (Sansar)', gloss: 'World • Noun' },
          { term: 'प्रकाशित (Prakashit)', gloss: 'Illuminated • Adj' },
          { term: 'होता है (Hota hai)', gloss: 'Becomes • Verb' },
        ],
      },
      ta: {
        sentence: 'அறிவு உலகை ஒளிரச் செய்கிறது.',
        translit: 'Arivu ulagai olirach seigiradhu.',
        meaning: '“Knowledge illuminates the world.”',
        tokens: [
          { term: 'அறிவு (Arivu)', gloss: 'Knowledge • Noun' },
          { term: 'உலகை (Ulagai)', gloss: 'World (Acc) • Noun' },
          { term: 'ஒளிர (Olira)', gloss: 'To Shine • Verb' },
          { term: 'செய்கிறது (Seigiradhu)', gloss: 'Causes • Verb' },
        ],
      },
      te: {
        sentence: 'జ్ఞానము లోకాన్ని ప్రకాశింపజేస్తుంది.',
        translit: 'Jnanamu lokanni prakashimpajestundi.',
        meaning: '“Knowledge illuminates the world.”',
        tokens: [
          { term: 'జ్ఞానము (Jnanamu)', gloss: 'Knowledge • Noun' },
          { term: 'లోకాన్ని (Lokanni)', gloss: 'World • Noun' },
          { term: 'ప్రకాశింప (Prakasimpan)', gloss: 'Radiance • Noun' },
          { term: 'జేస్తుంది (Jestundi)', gloss: 'Performs • Verb' },
        ],
      },
      kn: {
        sentence: 'ಜ್ಞಾನವು ಜಗತ್ತನ್ನು ಬೆಳಗಿಸುತ್ತದೆ.',
        translit: 'Jnanavu jagattannu belagisuttade.',
        meaning: '“Knowledge illuminates the world.”',
        tokens: [
          { term: 'ಜ್ಞಾನವು (Jnanavu)', gloss: 'Knowledge • Noun' },
          { term: 'ಜಗತ್ತನ್ನು (Jagattannu)', gloss: 'Universe • Noun' },
          { term: 'ಬೆಳಗಿಸುತ್ತದೆ (Belagisuttade)', gloss: 'Illuminates • Verb' },
          { term: 'ಪ್ರಕಾಶ (Prakasha)', gloss: 'Light • Noun' },
        ],
      },
      ml: {
        sentence: 'ജ്ഞാനം ലോകത്തെ പ്രകാശിപ്പിക്കുന്നു.',
        translit: 'Jnanam lokathe prakashippikkunnu.',
        meaning: '“Knowledge illuminates the world.”',
        tokens: [
          { term: 'ജ്ഞാനം (Jnanam)', gloss: 'Knowledge • Noun' },
          { term: 'ലോകത്തെ (Lokathe)', gloss: 'World • Noun' },
          { term: 'പ്രകാശം (Prakasham)', gloss: 'Luminosity • Noun' },
          { term: 'ആക്കുന്നു (Akkunnu)', gloss: 'Makes • Verb' },
        ],
      },
      en: {
        sentence: 'Knowledge illuminates the entire universe.',
        translit: 'Knowledge / Foundational Literacy',
        meaning: '“Knowledge illuminates the world.”',
        tokens: [
          { term: 'Knowledge', gloss: 'Skill / Mastery • Noun' },
          { term: 'Illuminates', gloss: 'Enlightens • Verb' },
          { term: 'Entire', gloss: 'Complete • Adj' },
          { term: 'Universe', gloss: 'World / Earth • Noun' },
        ],
      },
    };

    const scriptTabBtns = root.querySelectorAll('.script-tab-btn');
    const targetSentenceEl = root.querySelector('#polyTargetSentence');
    const targetTranslitEl = root.querySelector('#polyTranslit');
    const targetMeaningEl = root.querySelector('#polyMeaning');
    const tokenGridEl = root.querySelector('#polyTokenGrid');

    scriptTabBtns.forEach((tabBtn) => {
      tabBtn.addEventListener('click', () => {
        scriptTabBtns.forEach((b) => b.classList.remove('active'));
        tabBtn.classList.add('active');
        const langKey = tabBtn.getAttribute('data-lang-key');
        const data = polyglotData[langKey];

        if (data && targetSentenceEl && targetTranslitEl && targetMeaningEl && tokenGridEl) {
          targetSentenceEl.textContent = data.sentence;
          targetTranslitEl.textContent = data.translit;
          targetMeaningEl.textContent = data.meaning;

          let tokenHtml = '';
          data.tokens.forEach((tok) => {
            tokenHtml += `<div class="word-token-card"><div class="token-term">${tok.term}</div><div class="token-gloss">${tok.gloss}</div></div>`;
          });
          tokenGridEl.innerHTML = tokenHtml;
        }
        playSynthTone(523.25, 'triangle', 0.25, 0.2);
      });
    });

    // 3D Certificate interaction
    const certCard = root.querySelector('#certCard3D');
    if (certCard) {
      certCard.addEventListener('mousemove', (e) => {
        const rect = certCard.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;
        certCard.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      });
      certCard.addEventListener('mouseleave', () => {
        certCard.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
      });
    }

    // Gold Button Ripple Effect
    root.querySelectorAll('.btn-gold').forEach((goldBtn) => {
      goldBtn.addEventListener('click', (e) => {
        const rect = goldBtn.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const ripple = document.createElement('span');
        ripple.classList.add('gold-ripple');
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = `${size}px`;
        ripple.style.height = `${size}px`;
        ripple.style.left = `${x - size / 2}px`;
        ripple.style.top = `${y - size / 2}px`;
        goldBtn.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
      });
    });

    // Any language pair chip click leads to language selection
    root.querySelectorAll('.language-pairs-grid .btn-gold-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        document.body.classList.remove('prologue-locked');
        navigate('/welcome');
      });
    });

    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('scroll', onWindowScroll);
      document.body.classList.remove('prologue-locked');
      document.body.classList.remove('dawn-finale-active');
      if (cricketTimer) clearTimeout(cricketTimer);
      if (audioCtx) {
        try {
          audioCtx.close();
        } catch (_) {}
      }
    };
  }, [navigate]);

  // Handle RISE button click -> Immediately proceed to choose your language
  const handleRiseClick = (e) => {
    e.preventDefault();
    document.body.classList.remove('prologue-locked');
    document.body.classList.remove('dawn-finale-active');
    navigate('/welcome');
  };

  return (
    <div ref={containerRef} className="prologue-page-wrapper">
      <style>{`
        .prologue-page-wrapper {
          --font-display: "Space Grotesk", sans-serif;
          --font-mono: "JetBrains Mono", monospace;
          --font-mascot: "Baloo 2", cursive, sans-serif;
          --font-body: "Nunito", sans-serif;

          --space-deep: #02050f;
          --space-mid: #080f26;
          --space-glow: #121c45;
          --twilight-violet: #2b1a52;
          --twilight-cyan: #0a467c;
          --dawn-sky-top: #a8dfff;
          --dawn-sky-mid: #68c5ff;
          --dawn-sky-gold: #ffe79a;
          --dawn-sky-coral: #ff8e72;

          --brand-red: #ff4757;
          --brand-orange: #ff7a3d;
          --brand-gold: #ffbe2e;
          --brand-cyan: #00d2d3;
          --brand-blue: #2e86de;
          --brand-emerald: #10ac84;
          --brand-purple: #5f27cd;

          --hud-glass: rgba(8, 16, 38, 0.75);
          --hud-border: rgba(120, 180, 255, 0.28);
          --glass-card: rgba(13, 23, 50, 0.62);
          --glass-card-hover: rgba(22, 38, 78, 0.82);
          --glass-border-subtle: rgba(255, 255, 255, 0.14);
          --glass-border-bright: rgba(255, 255, 255, 0.4);

          --text-primary: #ffffff;
          --text-secondary: rgba(225, 240, 255, 0.82);
          --text-muted: rgba(160, 190, 230, 0.6);
          --text-accent: #00d2d3;
          --p: 0;

          background: var(--space-deep);
          color: var(--text-primary);
          font-family: var(--font-body);
          position: relative;
          min-height: 100vh;
          width: 100%;
          overflow-x: hidden;
        }

        body.prologue-locked {
          overflow: hidden !important;
          height: 100vh;
        }

        #worldStage {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .sky-layer-night {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 80% 15%, rgba(46, 70, 140, 0.28) 0%, transparent 60%),
                      linear-gradient(180deg, #020510 0%, #060d24 35%, #0f1a42 70%, #1a1638 100%);
          opacity: calc(1 - var(--p));
          transition: opacity 0.1s linear;
        }

        .sky-layer-dawn {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 82% 8%, rgba(255, 235, 170, 0.95) 0%, rgba(255, 180, 100, 0.4) 35%, transparent 65%),
                      linear-gradient(180deg, #b8e6ff 0%, #7dc9ff 25%, #4fa8ff 55%, #2a6ed8 80%, #153c8b 100%);
          opacity: var(--p);
          transition: opacity 0.1s linear;
        }

        .celestial-anchor {
          position: absolute;
          top: 10%;
          right: 14%;
          width: 140px;
          height: 140px;
          transform: translate(50%, -50%);
          pointer-events: none;
          z-index: 5;
        }

        .moon-element {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, #ffffff 0%, #e2e8f0 45%, #94a3b8 100%);
          box-shadow: 0 0 50px 15px rgba(180, 215, 255, 0.35), 0 0 120px 40px rgba(100, 160, 255, 0.15);
          opacity: calc(1 - var(--p) * 1.2);
          transform: scale(calc(1 - var(--p) * 0.15)) translateY(calc(var(--p) * -80px));
          transition: box-shadow 0.5s ease, transform 0.5s ease;
        }
        .moon-element.lunar-ignited {
          box-shadow: 0 0 90px 35px rgba(255, 220, 140, 0.9), 0 0 180px 70px rgba(0, 210, 211, 0.6);
          transform: scale(1.18);
        }
        .moon-element .crater {
          position: absolute;
          border-radius: 50%;
          background: rgba(100, 116, 139, 0.3);
        }
        .c-1 { width: 26px; height: 26px; top: 22px; left: 32px; }
        .c-2 { width: 16px; height: 16px; top: 62px; left: 82px; }
        .c-3 { width: 14px; height: 14px; top: 92px; left: 44px; }

        .moon-halo {
          position: absolute;
          inset: -45px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(230, 240, 255, 0.35) 0%, transparent 70%);
          animation: moonHaloGlow 6s ease-in-out infinite alternate;
        }
        @keyframes moonHaloGlow {
          0% { transform: scale(0.95); opacity: 0.7; }
          100% { transform: scale(1.2); opacity: 1; }
        }

        .sun-element {
          position: absolute;
          inset: -20px;
          border-radius: 50%;
          background: radial-gradient(circle at 40% 40%, #ffffff 0%, #fff0a8 30%, #ff9f43 70%, #ee5253 100%);
          box-shadow: 0 0 80px 30px rgba(255, 190, 46, 0.6), 0 0 160px 70px rgba(255, 107, 107, 0.3);
          opacity: var(--p);
          transform: scale(calc(0.7 + var(--p) * 0.3)) translateY(calc((1 - var(--p)) * 120px));
        }

        .sun-corona {
          position: absolute;
          inset: -120px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255, 215, 100, 0.25) 0%, rgba(255, 140, 50, 0.08) 50%, transparent 70%);
          animation: coronaPulse 8s ease-in-out infinite alternate;
          opacity: var(--p);
        }
        @keyframes coronaPulse {
          0% { transform: scale(0.95) rotate(0deg); }
          100% { transform: scale(1.1) rotate(180deg); }
        }

        #particlesCanvas {
          position: fixed;
          inset: 0;
          z-index: 2;
          pointer-events: none;
        }

        .script-glyph {
          position: absolute;
          font-family: var(--font-display);
          font-weight: 700;
          color: rgba(180, 220, 255, 0.12);
          pointer-events: none;
          transition: transform 0.2s ease-out;
          text-shadow: 0 0 20px rgba(0, 210, 211, 0.15);
        }

        #groundCourtyardArea {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 62%;
          pointer-events: none;
          z-index: 6;
          transition: transform 1.6s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 1.6s ease;
          will-change: transform, opacity;
        }
        #groundCourtyardArea.ground-descended {
          transform: translateY(150px);
          opacity: 0.15;
        }

        .tree-school-photo {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center bottom;
          -webkit-mask-image: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.55) 12%, #000 26%);
          mask-image: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.55) 12%, #000 26%);
        }

        .firefly-node {
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: radial-gradient(circle, #fffceb 0%, #ffde59 60%, rgba(255, 222, 89, 0) 100%);
          box-shadow: 0 0 12px 4px rgba(255, 220, 90, 0.85);
          animation: fireflyGlide 5s ease-in-out infinite;
          pointer-events: none;
          z-index: 12;
        }
        @keyframes fireflyGlide {
          0%, 100% { transform: translate(0, 0); opacity: 0.4; }
          25% { transform: translate(14px, -18px); opacity: 1; }
          50% { transform: translate(-10px, -8px); opacity: 0.7; }
          75% { transform: translate(12px, 10px); opacity: 0.95; }
        }

        #persistentMascot {
          position: fixed;
          left: 33.5vw;
          top: 73vh;
          width: 86px;
          height: 86px;
          transform: translate(-50%, -50%) scale(0.7);
          z-index: 95;
          pointer-events: auto;
          cursor: grab;
          filter: drop-shadow(0 14px 28px rgba(0, 0, 0, 0.5));
          will-change: left, top, transform;
          transition: width 0.3s ease, height 0.3s ease;
        }

        .mascot-chassis {
          width: 100%;
          height: 100%;
          position: relative;
          transform-origin: center center;
        }

        .bird-vector {
          width: 100%;
          height: 100%;
          overflow: visible;
          display: block;
        }

        .wing-dyn {
          transform-box: fill-box;
          animation: wingFlapDynamic 0.28s ease-in-out infinite alternate;
        }
        .wing-dyn.left { transform-origin: 100% 60%; }
        .wing-dyn.right { transform-origin: 0% 60%; animation-delay: 0.04s; }
        @keyframes wingFlapDynamic {
          0% { transform: rotate(-28deg) scaleY(0.9); }
          100% { transform: rotate(26deg) scaleY(1.1); }
        }

        .wing-dyn.right.saluting {
          animation: wingSaluteGesture 0.75s ease-in-out infinite alternate !important;
        }
        @keyframes wingSaluteGesture {
          0% { transform: rotate(10deg); }
          100% { transform: rotate(-55deg) scaleY(1.15); }
        }

        .mascot-engine-glow {
          position: absolute;
          inset: -15px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255, 122, 61, 0.35) 0%, rgba(255, 71, 87, 0.1) 45%, transparent 70%);
          pointer-events: none;
          z-index: -1;
          animation: enginePulse 2s ease-in-out infinite alternate;
        }
        @keyframes enginePulse {
          0% { transform: scale(0.9); opacity: 0.6; }
          100% { transform: scale(1.15); opacity: 0.95; }
        }

        #lunarArrivalFlash {
          position: fixed;
          inset: 0;
          background: radial-gradient(circle at 86% 12%, #ffffff 0%, rgba(255, 220, 140, 0.85) 30%, rgba(0, 210, 211, 0) 70%);
          z-index: 98;
          opacity: 0;
          pointer-events: none;
        }
        #lunarArrivalFlash.pop {
          animation: flashPopBurst 0.9s ease-out forwards;
        }
        @keyframes flashPopBurst {
          0% { opacity: 0; }
          25% { opacity: 1; }
          100% { opacity: 0; }
        }

        .hud-layer {
          position: fixed;
          inset: 0;
          z-index: 50;
          pointer-events: none;
        }

        .hud-bottom-ribbon {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: rgba(255, 255, 255, 0.08);
          z-index: 50;
          pointer-events: none;
        }
        .hud-progress-fill {
          height: 100%;
          width: 0%;
          background: linear-gradient(90deg, var(--brand-cyan), var(--brand-orange), var(--brand-gold));
          box-shadow: 0 0 12px rgba(0, 210, 211, 0.6);
          transition: width 0.1s linear;
        }

        main.flight-journey {
          position: relative;
          z-index: 10;
          width: 100%;
          opacity: 0;
          transform: translateY(40px);
          pointer-events: none;
          transition: opacity 1.2s cubic-bezier(0.2, 0.8, 0.2, 1), transform 1.2s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        main.flight-journey.content-revealed {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }

        section.chapter-section {
          position: relative;
          min-height: 100vh;
          padding: 120px 24px 80px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .container-xl {
          width: 100%;
          max-width: 1240px;
          margin: 0 auto;
        }

        .headline-display {
          font-family: var(--font-display);
          font-size: clamp(2.4rem, 5.5vw, 4.4rem);
          font-weight: 700;
          line-height: 1.06;
          letter-spacing: -0.03em;
          color: #ffffff;
          margin-bottom: 20px;
          max-width: 900px;
        }
        .headline-display .gradient-text {
          background: linear-gradient(135deg, #ffffff 0%, var(--brand-gold) 50%, var(--brand-orange) 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .lede-paragraph {
          font-size: clamp(1.05rem, 1.8vw, 1.25rem);
          font-weight: 600;
          line-height: 1.6;
          color: var(--text-secondary);
          max-width: 680px;
          margin-bottom: 36px;
        }

        .glass-panel {
          background: var(--glass-card);
          backdrop-filter: blur(24px) saturate(160%);
          -webkit-backdrop-filter: blur(24px) saturate(160%);
          border: 1px solid var(--glass-border-subtle);
          border-radius: 24px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15);
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        .reveal-block {
          opacity: 0;
          transform: translateY(32px);
          transition: opacity 0.8s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .reveal-block.in-view {
          opacity: 1;
          transform: translateY(0);
        }

        #chapter-00 {
          min-height: 100vh;
          text-align: center;
          padding-top: 140px;
        }
        .hero-content-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          max-width: 1180px;
          margin: 0 auto;
        }

        .language-paths-card {
          width: 100%;
          max-width: 880px;
          padding: 44px 40px;
          text-align: center;
          margin: 0 auto 26px;
        }
        .language-paths-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .language-paths-icon {
          font-size: 2.3rem;
          line-height: 1;
          filter: drop-shadow(0 0 12px rgba(0, 210, 211, 0.5));
        }
        .language-paths-title {
          font-family: var(--font-display);
          font-size: clamp(1.4rem, 2.8vw, 2rem);
          font-weight: 800;
          letter-spacing: -0.01em;
          background: linear-gradient(135deg, #ffffff 0%, var(--brand-cyan) 55%, var(--brand-gold) 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .language-paths-desc {
          font-size: clamp(1rem, 1.6vw, 1.1rem);
          font-weight: 600;
          line-height: 1.65;
          color: var(--text-secondary);
          max-width: 620px;
          margin: 0 auto 24px;
        }

        .language-pairs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          gap: 14px;
          width: 100%;
          margin-bottom: 50px;
        }

        .btn-gold-chip {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 18px;
          width: 100%;
          font-family: var(--font-display);
          font-size: 0.86rem;
          font-weight: 700;
          letter-spacing: 0.01em;
          text-transform: none;
          color: #3b2800;
          background: linear-gradient(180deg, #fff7c7 0%, #ffd438 45%, #ffb300 80%, #ea9900 100%);
          border: 1.5px solid rgba(220, 150, 0, 0.8);
          border-bottom: 3px solid #a86200;
          border-radius: 999px;
          box-shadow: 0 6px 16px rgba(255, 179, 0, 0.35), 0 2px 4px rgba(59, 40, 0, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.85);
          cursor: pointer;
          overflow: hidden;
          user-select: none;
          transition: transform 0.12s ease, filter 0.15s ease, box-shadow 0.15s ease, border-bottom 0.1s ease;
        }
        .btn-gold-chip::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 45%;
          height: 100%;
          background: linear-gradient(115deg, transparent 0%, rgba(255, 255, 255, 0.85) 50%, transparent 100%);
          transform: translateX(-180%) skewX(-25deg);
          animation: goldShine 3.6s ease-in-out infinite;
          pointer-events: none;
        }
        .btn-gold-chip:hover {
          filter: brightness(1.06);
          transform: translateY(-2px);
          box-shadow: 0 10px 22px rgba(255, 179, 0, 0.5), 0 2px 6px rgba(59, 40, 0, 0.2), inset 0 1.5px 1px rgba(255, 255, 255, 0.95);
        }

        .split-feature-layout {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 50px;
          align-items: center;
          width: 100%;
        }

        .feature-narrative {
          display: flex;
          flex-direction: column;
        }

        .polyglot-card-container {
          display: flex;
          flex-direction: column;
          gap: 28px;
          width: 100%;
        }

        .script-tabs-header {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding-bottom: 6px;
        }
        .script-tab-btn {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 0.95rem;
          padding: 12px 24px;
          border-radius: 999px;
          background: rgba(255, 190, 46, 0.08);
          border: 1.5px solid rgba(255, 190, 46, 0.4);
          color: var(--brand-gold);
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
        }
        .script-tab-btn.active {
          background: linear-gradient(180deg, #fff7c7 0%, #ffd438 45%, #ffb300 80%, #ea9900 100%);
          border: 1.5px solid rgba(220, 150, 0, 0.8);
          border-bottom: 3px solid #a86200;
          color: #3b2800;
          box-shadow: 0 8px 24px rgba(255, 179, 0, 0.45), inset 0 1.5px 1px rgba(255, 255, 255, 0.85);
        }

        .polyglot-drill-box {
          padding: 40px;
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 40px;
          align-items: center;
        }

        .sentence-display-area {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .target-sentence {
          font-family: var(--font-display);
          font-size: clamp(1.6rem, 3.2vw, 2.4rem);
          font-weight: 700;
          color: #ffffff;
          line-height: 1.3;
        }
        .transliteration-text {
          font-family: var(--font-mono);
          font-size: 1rem;
          color: var(--brand-gold);
        }
        .english-meaning {
          font-size: 1.1rem;
          color: var(--text-secondary);
          font-weight: 600;
        }

        .word-by-word-matrix {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }
        .word-token-card {
          background: rgba(6, 14, 34, 0.7);
          border: 1px solid var(--hud-border);
          padding: 14px 18px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .token-term {
          font-family: var(--font-display);
          font-size: 1.2rem;
          font-weight: 700;
          color: #ffffff;
        }
        .token-gloss {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: var(--brand-cyan);
          margin-top: 4px;
        }

        .certificate-showcase-container {
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          gap: 48px;
          align-items: center;
          width: 100%;
        }

        .certificate-3d-card {
          position: relative;
          background: #f7f9fc;
          color: #04182c;
          padding: 40px 44px;
          border-radius: 16px;
          box-shadow: 0 30px 70px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 210, 211, 0.2);
          border: 3px solid #2e86de;
          transform-style: preserve-3d;
          transition: transform 0.2s ease-out;
        }
        .cert-corner {
          position: absolute;
          width: 46px;
          height: 46px;
          border: 2px solid #94a9c9;
          opacity: 0.7;
          pointer-events: none;
        }
        .cert-corner-tl { top: 14px; left: 14px; border-right: none; border-bottom: none; border-radius: 12px 0 0 0; }
        .cert-corner-tr { top: 14px; right: 14px; border-left: none; border-bottom: none; border-radius: 0 12px 0 0; }
        .cert-corner-bl { bottom: 14px; left: 14px; border-right: none; border-top: none; border-radius: 0 0 0 12px; }
        .cert-corner-br { bottom: 14px; right: 14px; border-left: none; border-top: none; border-radius: 0 0 12px 0; }
        .cert-header { text-align: center; margin-bottom: 18px; }
        .cert-academy-label {
          font-family: var(--font-mono);
          font-size: 0.72rem;
          letter-spacing: 0.22em;
          color: #334155;
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        .cert-header h3 {
          font-family: var(--font-display);
          font-size: 1.7rem;
          font-weight: 800;
          letter-spacing: 0.02em;
          color: #04182c;
          text-transform: uppercase;
        }
        .cert-recipient { text-align: center; margin-bottom: 18px; }
        .cert-recipient .for-text {
          font-size: 0.9rem;
          font-style: italic;
          font-family: var(--font-body);
          color: #334155;
          margin-bottom: 8px;
        }
        .cert-name-input {
          font-family: var(--font-display);
          font-size: 1.9rem;
          font-weight: 800;
          color: #04182c;
          border: none;
          background: transparent;
          text-align: center;
          width: 100%;
          border-bottom: 1px solid #cbd5e1;
          outline: none;
          padding: 4px 0 10px;
        }
        .cert-description {
          text-align: center;
          font-size: 0.92rem;
          line-height: 1.6;
          color: #334155;
          margin-bottom: 14px;
        }
        .cert-course-name {
          display: block;
          font-family: var(--font-display);
          font-size: 1.3rem;
          font-weight: 800;
          color: #04182c;
          margin-top: 4px;
        }
        .cert-score-pill {
          display: block;
          width: fit-content;
          margin: 0 auto 34px;
          background: rgba(46, 134, 222, 0.1);
          border: 1px solid rgba(46, 134, 222, 0.35);
          color: #2e86de;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 0.9rem;
          padding: 8px 20px;
          border-radius: 999px;
        }
        .cert-footer { display: flex; justify-content: space-between; align-items: center; }
        .cert-footer-col { font-family: var(--font-mono); font-size: 0.72rem; color: #64748b; }
        .cert-footer-label { font-weight: 700; color: #334155; margin-bottom: 6px; }
        .cert-meta-line { margin-top: 2px; }
        .cert-footer-right { text-align: right; }
        .cert-board-name {
          font-family: var(--font-mascot);
          font-style: italic;
          font-weight: 700;
          font-size: 1.05rem;
          color: #04182c;
          margin-bottom: 4px;
        }
        .cert-seal {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: #eaf2fb;
          border: 3px solid #2e86de;
          box-shadow: 0 4px 12px rgba(46, 134, 222, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
        }

        /* Sunrise Finale */
        body.dawn-finale-active main.flight-journey .chapter-section,
        body.dawn-finale-active footer.hud-footer {
          opacity: 0 !important;
          pointer-events: none !important;
          transition: opacity 0.8s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.8s ease;
          transform: translateY(40px);
        }

        #sunriseFinaleCenterPrompt {
          position: fixed;
          top: 64%;
          left: 50%;
          transform: translate(-50%, -50%) scale(0.85);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 16px;
          z-index: 120;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.8s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        body.dawn-finale-active #sunriseFinaleCenterPrompt {
          opacity: 1;
          pointer-events: auto;
          transform: translate(-50%, -50%) scale(1);
        }

        .pure-sunrise-badge {
          font-family: var(--font-mascot);
          font-size: clamp(2.8rem, 6.5vw, 4.6rem);
          font-weight: 800;
          color: #04182c;
          text-shadow: 0 4px 24px rgba(255, 255, 255, 0.95), 0 0 45px rgba(255, 190, 46, 0.85);
          line-height: 1.05;
          letter-spacing: -0.01em;
          animation: glowPulseTitle 2.5s ease-in-out infinite alternate;
        }

        @keyframes glowPulseTitle {
          0% { text-shadow: 0 4px 24px rgba(255, 255, 255, 0.95), 0 0 35px rgba(255, 190, 46, 0.6); }
          100% { text-shadow: 0 4px 30px rgba(255, 255, 255, 1), 0 0 55px rgba(255, 140, 50, 0.95); }
        }

        .btn-gold {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 16px 42px;
          font-family: var(--font-display);
          font-size: 1.15rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #3b2800;
          background: linear-gradient(180deg, #fff7c7 0%, #ffd438 45%, #ffb300 80%, #ea9900 100%);
          border: 1.5px solid rgba(220, 150, 0, 0.8);
          border-bottom: 4px solid #a86200;
          border-radius: 999px;
          box-shadow: 0 12px 36px rgba(255, 179, 0, 0.5), 0 2px 6px rgba(59, 40, 0, 0.25), inset 0 1.5px 1px rgba(255, 255, 255, 0.85);
          cursor: pointer;
          overflow: hidden;
          user-select: none;
          transition: transform 0.12s ease, filter 0.15s ease, box-shadow 0.15s ease, border-bottom 0.1s ease;
        }
        .btn-gold::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 45%;
          height: 100%;
          background: linear-gradient(115deg, transparent 0%, rgba(255, 255, 255, 0.85) 50%, transparent 100%);
          transform: translateX(-180%) skewX(-25deg);
          animation: goldShine 3s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes goldShine {
          0% { transform: translateX(-180%) skewX(-25deg); }
          35%, 100% { transform: translateX(340%) skewX(-25deg); }
        }
        .btn-gold:hover {
          filter: brightness(1.06);
          transform: translateY(-3px) scale(1.04);
          box-shadow: 0 18px 44px rgba(255, 179, 0, 0.65), 0 4px 8px rgba(59, 40, 0, 0.25), inset 0 2px 1px rgba(255, 255, 255, 0.95);
        }
        .btn-gold:active {
          transform: translateY(2px) scale(1);
          border-bottom-width: 1px;
          box-shadow: 0 3px 10px rgba(255, 179, 0, 0.35), 0 1px 2px rgba(59, 40, 0, 0.2), inset 0 1px 2px rgba(0, 0, 0, 0.15);
        }

        .gold-ripple {
          position: absolute;
          border-radius: 50%;
          transform: scale(0);
          animation: goldRippleEffect 0.6s linear;
          background-color: rgba(255, 255, 255, 0.6);
          pointer-events: none;
        }
        @keyframes goldRippleEffect {
          to { transform: scale(4); opacity: 0; }
        }

        footer.hud-footer {
          width: 100%;
          padding: 40px 24px 60px;
          text-align: center;
          font-family: var(--font-mono);
          font-size: 0.8rem;
          color: var(--text-muted);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          position: relative;
          z-index: 20;
        }
        footer.hud-footer a {
          color: var(--brand-cyan);
          text-decoration: none;
          margin: 0 8px;
        }

        @media (max-width: 1024px) {
          .split-feature-layout,
          .polyglot-drill-box,
          .certificate-showcase-container {
            grid-template-columns: 1fr;
            gap: 32px;
          }
        }
        @media (max-width: 768px) {
          section.chapter-section { padding: 100px 18px 60px; }
          .headline-display { font-size: 2.2rem; }
          #persistentMascot { width: 65px; height: 65px; }
        }
      `}</style>

      {/* World Stage */}
      <div id="worldStage">
        <div className="sky-layer-night" />
        <div className="sky-layer-dawn" />

        <div className="celestial-anchor">
          <div className="moon-element" id="landingMoon">
            <div className="moon-halo" />
            <div className="crater c-1" />
            <div className="crater c-2" />
            <div className="crater c-3" />
          </div>
          <div className="sun-element" />
          <div className="sun-corona" />
        </div>

        <canvas id="particlesCanvas" />

        <div className="script-glyph" style={{ top: '18%', left: '8%', fontSize: '4rem' }}>अ</div>
        <div className="script-glyph" style={{ top: '25%', right: '10%', fontSize: '3.5rem' }}>அ</div>
        <div className="script-glyph" style={{ top: '55%', left: '6%', fontSize: '4.5rem' }}>అ</div>
        <div className="script-glyph" style={{ top: '68%', right: '8%', fontSize: '3.8rem' }}>ಅ</div>
        <div className="script-glyph" style={{ top: '85%', left: '12%', fontSize: '4.2rem' }}>അ</div>

        <div id="groundCourtyardArea">
          <img
            className="tree-school-photo"
            alt="Tree with nest beside a lantern-lit school at night"
            src="/assets/app_background.png"
          />
          <div className="firefly-node" style={{ left: '58%', top: '55%', animationDelay: '0s' }} />
          <div className="firefly-node" style={{ left: '65%', top: '68%', animationDelay: '1.2s' }} />
          <div className="firefly-node" style={{ left: '72%', top: '58%', animationDelay: '2.4s' }} />
          <div className="firefly-node" style={{ left: '60%', top: '72%', animationDelay: '0.8s' }} />
          <div className="firefly-node" style={{ left: '80%', top: '64%', animationDelay: '1.8s' }} />
        </div>
      </div>

      {/* Mascot */}
      <div id="persistentMascot" title="Click me to chirp & guide!">
        <div className="mascot-engine-glow" />
        <div className="mascot-chassis" id="mascotChassis">
          <svg className="bird-vector" viewBox="0 0 200 200">
            <defs>
              <linearGradient id="birdBodyGrad" x1="42" y1="44" x2="155" y2="171" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FF5353" />
                <stop offset="0.55" stopColor="#E82A3A" />
                <stop offset="1" stopColor="#9C0A28" />
              </linearGradient>
              <linearGradient id="birdWingGrad" x1="40" y1="78" x2="76" y2="148" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FF8364" />
                <stop offset="1" stopColor="#B71233" />
              </linearGradient>
              <linearGradient id="birdBellyGrad" x1="100" y1="119" x2="100" y2="169" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFF5D6" />
                <stop offset="1" stopColor="#FFC570" />
              </linearGradient>
              <linearGradient id="birdBeakGrad" x1="100" y1="111" x2="100" y2="142" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFF275" />
                <stop offset="1" stopColor="#FF9615" />
              </linearGradient>
            </defs>

            <path d="M73 62 Q82 31 100 49 Q118 31 127 62" fill="#A80D29" />
            <path d="M79 61 Q91 26 100 53 Q109 26 121 61" fill="#FF4757" />
            <path d="M42 112 Q42 65 79 52 Q100 39 122 52 Q159 65 159 112 L151 150 Q138 174 100 177 Q62 174 49 150 Z" fill="url(#birdBodyGrad)" />

            <path className="wing-dyn left" id="birdLeftWing" d="M61 113 Q40 82 22 70 Q18 101 39 130 Q48 140 64 136 Z" fill="url(#birdWingGrad)" stroke="#8A0C22" strokeWidth="2" />
            <path className="wing-dyn right" id="birdRightWing" d="M139 113 Q160 82 178 70 Q182 101 161 130 Q152 140 136 136 Z" fill="url(#birdWingGrad)" stroke="#8A0C22" strokeWidth="2" />

            <path d="M67 137 Q100 116 133 137 L137 159 Q100 177 63 159 Z" fill="url(#birdBellyGrad)" />

            <ellipse cx="79" cy="96" rx="21" ry="23" fill="#FFFFFF" />
            <ellipse cx="121" cy="96" rx="21" ry="23" fill="#FFFFFF" />
            <ellipse cx="81" cy="99" rx="10" ry="12" fill="#2E1B17" />
            <ellipse cx="119" cy="99" rx="10" ry="12" fill="#2E1B17" />
            <circle cx="84" cy="95" r="4" fill="#FFFFFF" />
            <circle cx="122" cy="95" r="4" fill="#FFFFFF" />

            <path id="birdMouthCavity" d="M91 127 Q100 127 109 127 Q100 127 91 127 Z" fill="#8A0C22" />
            <path id="birdBeakUpper" d="M88 118 Q100 110 112 118 L100 129 Z" fill="url(#birdBeakGrad)" stroke="#D47310" strokeWidth="1.8" />
            <path id="birdBeakLower" d="M90 128 Q100 132 110 128 Q108 138 100 140 Q92 138 90 128 Z" fill="#FF9615" stroke="#D47310" strokeWidth="1.8" />
          </svg>
        </div>
      </div>

      <div id="lunarArrivalFlash" />

      <div className="hud-layer">
        <div className="hud-bottom-ribbon">
          <div className="hud-progress-fill" id="hudProgressBar" />
        </div>
      </div>

      {/* Main Content */}
      <main className="flight-journey" id="mainFlightContent">
        {/* Chapter 00 */}
        <section className="chapter-section" id="chapter-00">
          <div className="container-xl">
            <div className="hero-content-box">
              <h1 className="headline-display reveal-block">
                Read the world,<br />
                <span className="gradient-text">in your own words.</span>
              </h1>

              <p className="lede-paragraph reveal-block">
                Choose your interface language and your target learning language. LiteraAI adapts lessons, pronunciation practice, writing exercises, and assessments to help you learn naturally.
              </p>

              <div className="glass-panel language-paths-card reveal-block">
                <div className="language-paths-header">
                  <span className="language-paths-icon">🌐</span>
                  <h3 className="language-paths-title">30 Language Learning Paths</h3>
                </div>
                <p className="language-paths-desc">
                  Learn English, Tamil, Telugu, Kannada, Malayalam, and Hindi through your preferred language interface.
                </p>
              </div>

              <div className="language-pairs-grid reveal-block">
                <button className="btn-gold-chip btn-gold" type="button">English → Tamil</button>
                <button className="btn-gold-chip btn-gold" type="button">English → Telugu</button>
                <button className="btn-gold-chip btn-gold" type="button">English → Kannada</button>
                <button className="btn-gold-chip btn-gold" type="button">English → Malayalam</button>
                <button className="btn-gold-chip btn-gold" type="button">English → Hindi</button>

                <button className="btn-gold-chip btn-gold" type="button">Tamil → English</button>
                <button className="btn-gold-chip btn-gold" type="button">Tamil → Telugu</button>
                <button className="btn-gold-chip btn-gold" type="button">Tamil → Kannada</button>
                <button className="btn-gold-chip btn-gold" type="button">Tamil → Malayalam</button>
                <button className="btn-gold-chip btn-gold" type="button">Tamil → Hindi</button>

                <button className="btn-gold-chip btn-gold" type="button">Telugu → English</button>
                <button className="btn-gold-chip btn-gold" type="button">Telugu → Tamil</button>
                <button className="btn-gold-chip btn-gold" type="button">Telugu → Kannada</button>
                <button className="btn-gold-chip btn-gold" type="button">Telugu → Malayalam</button>
                <button className="btn-gold-chip btn-gold" type="button">Telugu → Hindi</button>

                <button className="btn-gold-chip btn-gold" type="button">Kannada → English</button>
                <button className="btn-gold-chip btn-gold" type="button">Kannada → Tamil</button>
                <button className="btn-gold-chip btn-gold" type="button">Kannada → Telugu</button>
                <button className="btn-gold-chip btn-gold" type="button">Kannada → Malayalam</button>
                <button className="btn-gold-chip btn-gold" type="button">Kannada → Hindi</button>

                <button className="btn-gold-chip btn-gold" type="button">Malayalam → English</button>
                <button className="btn-gold-chip btn-gold" type="button">Malayalam → Tamil</button>
                <button className="btn-gold-chip btn-gold" type="button">Malayalam → Telugu</button>
                <button className="btn-gold-chip btn-gold" type="button">Malayalam → Kannada</button>
                <button className="btn-gold-chip btn-gold" type="button">Malayalam → Hindi</button>

                <button className="btn-gold-chip btn-gold" type="button">Hindi → English</button>
                <button className="btn-gold-chip btn-gold" type="button">Hindi → Tamil</button>
                <button className="btn-gold-chip btn-gold" type="button">Hindi → Telugu</button>
                <button className="btn-gold-chip btn-gold" type="button">Hindi → Kannada</button>
                <button className="btn-gold-chip btn-gold" type="button">Hindi → Malayalam</button>
              </div>
            </div>
          </div>
        </section>

        {/* Chapter 03 */}
        <section className="chapter-section" id="chapter-03">
          <div className="container-xl">
            <div className="polyglot-card-container reveal-block">
              <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto 20px' }}>
                <h2 className="headline-display">
                  Six living languages.<br />
                  <span className="gradient-text">One seamless journey.</span>
                </h2>
              </div>

              <div className="script-tabs-header" id="polyglotTabs">
                <button className="script-tab-btn active" data-lang-key="hi">Hindi // हिंदी</button>
                <button className="script-tab-btn" data-lang-key="ta">Tamil // தமிழ்</button>
                <button className="script-tab-btn" data-lang-key="te">Telugu // తెలుగు</button>
                <button className="script-tab-btn" data-lang-key="kn">Kannada // ಕನ್ನಡ</button>
                <button className="script-tab-btn" data-lang-key="ml">Malayalam // മലയാളം</button>
                <button className="script-tab-btn" data-lang-key="en">English // Universal</button>
              </div>

              <div className="glass-panel polyglot-drill-box">
                <div className="sentence-display-area">
                  <div className="target-sentence" id="polyTargetSentence">ज्ञान से संसार प्रकाशित होता है।</div>
                  <div className="transliteration-text" id="polyTranslit">Gyan se sansar prakashit hota hai.</div>
                  <div className="english-meaning" id="polyMeaning">“Knowledge illuminates the world.”</div>
                </div>

                <div className="word-by-word-matrix" id="polyTokenGrid">
                  <div className="word-token-card">
                    <div className="token-term">ज्ञान (Gyan)</div>
                    <div className="token-gloss">Knowledge • Noun</div>
                  </div>
                  <div className="word-token-card">
                    <div className="token-term">संसार (Sansar)</div>
                    <div className="token-gloss">World • Noun</div>
                  </div>
                  <div className="word-token-card">
                    <div className="token-term">प्रकाशित (Prakashit)</div>
                    <div className="token-gloss">Illuminated • Adj</div>
                  </div>
                  <div className="word-token-card">
                    <div className="token-term">होता है (Hota hai)</div>
                    <div className="token-gloss">Becomes • Verb</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Chapter 01: Voice Practice */}
        <section className="chapter-section" id="chapter-01">
          <div className="container-xl">
            <div className="split-feature-layout">
              <div className="feature-narrative reveal-block">
                <h2 className="headline-display">Voice Practice</h2>
                <p className="lede-paragraph">
                  Build speaking confidence through AI-powered pronunciation training. Learners listen, speak, and receive instant pronunciation accuracy feedback in real time.
                </p>
                <p className="lede-paragraph">
                  Interactive voice recognition, XP rewards, and progressive levels make practice engaging and effective.
                </p>
                <p className="lede-paragraph">
                  Helping learners master clear pronunciation and fluent communication, one word at a time.
                </p>
              </div>

              <div className="reveal-block" style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid var(--glass-border-subtle)', boxShadow: '0 30px 70px rgba(0,0,0,0.45)' }}>
                <img src="/assets/bird_speaking.jpg" alt="LiteraAI Voice Practice" style={{ width: '100%', height: 'auto', display: 'block' }} />
              </div>
            </div>
          </div>
        </section>

        {/* Chapter 02: Writing Practice */}
        <section className="chapter-section" id="chapter-02">
          <div className="container-xl">
            <div className="split-feature-layout" style={{ gridTemplateColumns: '1.2fr 1fr' }}>
              <div className="reveal-block" style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid var(--glass-border-subtle)', boxShadow: '0 30px 70px rgba(0,0,0,0.45)' }}>
                <img src="/assets/bird_writing.jpg" alt="LiteraAI Writing Practice" style={{ width: '100%', height: 'auto', display: 'block' }} />
              </div>

              <div className="feature-narrative reveal-block">
                <h2 className="headline-display">Writing Practice</h2>
                <p className="lede-paragraph">
                  Transforming language learning into an engaging writing journey. Learners identify letters through visuals, pronunciation, and guided tracing for all 6 languages.
                </p>
                <p className="lede-paragraph">
                  Interactive feedback, XP rewards, and gamified progress.
                </p>
                <p className="lede-paragraph">
                  Building literacy foundations, one letter at a time with LiteraAI.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Chapter 04: Courses */}
        <section className="chapter-section" id="chapter-04">
          <div className="container-xl">
            <div className="split-feature-layout">
              <div className="feature-narrative reveal-block">
                <h2 className="headline-display">Courses Section</h2>
                <p className="lede-paragraph">
                  Structured learning paths designed to build literacy skills step by step.
                </p>
                <p className="lede-paragraph">
                  From reading everyday words to understanding real-world sentences, learners progress through Foundation, Beginner, Intermediate, and Advanced levels.
                </p>
                <p className="lede-paragraph">
                  Interactive lessons, visual learning, and practical exercises transform knowledge into confidence.
                </p>
                <p className="lede-paragraph">
                  Empowering learners to read, understand, and apply language skills in everyday life.
                </p>
              </div>

              <div className="reveal-block" style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid var(--glass-border-subtle)', boxShadow: '0 30px 70px rgba(0,0,0,0.45)' }}>
                <img src="/assets/course_foundation.jpg" alt="LiteraAI Courses" style={{ width: '100%', height: 'auto', display: 'block' }} />
              </div>
            </div>
          </div>
        </section>

        {/* Chapter 05: Verified Credentials */}
        <section className="chapter-section" id="chapter-05">
          <div className="container-xl">
            <div className="certificate-showcase-container reveal-block">
              <div className="feature-narrative">
                <h2 className="headline-display">
                  A credential you built<br />
                  <span className="gradient-text">with your own hands.</span>
                </h2>
                <p className="lede-paragraph">
                  Finish a foundational course and receive a verifiable certificate in your name. Type your name into the preview to see your future milestone illuminated.
                </p>
              </div>

              <div className="certificate-3d-card" id="certCard3D">
                <div className="cert-corner cert-corner-tl" />
                <div className="cert-corner cert-corner-tr" />
                <div className="cert-corner cert-corner-bl" />
                <div className="cert-corner cert-corner-br" />

                <div className="cert-header">
                  <div className="cert-academy-label">LiteraAI Literacy Academy</div>
                  <h3>Certificate of Achievement</h3>
                </div>
                <div className="cert-recipient">
                  <div className="for-text">This is proudly presented to:</div>
                  <input type="text" className="cert-name-input" id="certNameInput" defaultValue="Learner Name" title="Type your name here!" />
                </div>
                <div className="cert-description">
                  for successfully completing the literacy course:
                  <span className="cert-course-name">Understanding Everyday Sentences</span>
                </div>
                <div className="cert-score-pill">✓ Mastery Score: 90%</div>
                <div className="cert-footer">
                  <div className="cert-footer-col">
                    <div className="cert-footer-label">🛡️ LiteraAI Verified Learning</div>
                    <div className="cert-meta-line">Credential ID: LIT-D8B45BEB</div>
                    <div className="cert-meta-line">Date of Issue: 05/09/2026</div>
                  </div>
                  <div className="cert-seal">🏅</div>
                  <div className="cert-footer-col cert-footer-right">
                    <div className="cert-board-name">LiteraAI Board</div>
                    <div className="cert-meta-line">AUTHORIZED SIGNATORY</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Chapter 06: League */}
        <section className="chapter-section" id="chapter-06">
          <div className="container-xl">
            <div className="split-feature-layout">
              <div className="reveal-block" style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid var(--glass-border-subtle)', boxShadow: '0 30px 70px rgba(0,0,0,0.45)' }}>
                <img src="/assets/bird_league.jpg" alt="LiteraAI League" style={{ width: '100%', height: 'auto', display: 'block' }} />
              </div>

              <div className="feature-narrative reveal-block">
                <h2 className="headline-display">League</h2>
                <p className="lede-paragraph">
                  Turn learning into achievement through competitive league progression.
                </p>
                <p className="lede-paragraph">
                  Learners earn XP, climb from Bronze to Gold League, and prove their skills through milestone-based exams.
                </p>
                <p className="lede-paragraph">
                  Leaderboards, rewards, and rank advancement create motivation while reinforcing real learning outcomes.
                </p>
                <p className="lede-paragraph">
                  Upon successful completion, learners receive a verified certificate celebrating their literacy journey and accomplishments.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Sunrise Finale Prompt with RISE button */}
      <div id="sunriseFinaleCenterPrompt">
        <div className="pure-sunrise-badge">Ready to Rise?</div>
        <button
          className="btn-gold btn-pure-rise"
          id="pureRiseActionBtn"
          type="button"
          onClick={handleRiseClick}
        >
          <span>RISE</span>
        </button>
      </div>

      <footer className="hud-footer">
        <div>
          LITERA<span style={{ color: 'var(--brand-cyan)' }}>AI</span> — Planetary Literacy Infrastructure Engine.
        </div>
        <div style={{ marginTop: 10 }}>
          <a href="#">Privacy Architecture</a> · 
          <a href="#">Pedagogical Whitepaper</a> · 
          <a href="#">Open API</a> · 
          <a href="#">Contact Mission Control</a>
        </div>
      </footer>
    </div>
  );
}
