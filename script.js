(() => {
  'use strict';

  /* ---------------------------------------------------------
     1. Intro video sequence
     play → freeze on last frame → dim → reveal hero content
  --------------------------------------------------------- */
  const video = document.getElementById('introVideo');
  const dim = document.getElementById('videoDim');
  const heroContent = document.getElementById('heroContent');
  const status = document.getElementById('termStatus');
  const eyebrow = document.getElementById('eyebrow');
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');

  let revealed = false;
  let failSafe;

  function reveal() {
    if (revealed) return;
    revealed = true;
    clearTimeout(failSafe);
    video.pause();
    dim.classList.add('on');
    status.textContent = 'READY';
    status.classList.add('ready');
    setTimeout(() => heroContent.classList.add('show'), 250);
  }

  function tryPlay() {
    if (revealed) return;
    const p = video.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => {
        // Autoplay with sound-adjacent policies blocked it; show content anyway.
        reveal();
      });
    }
  }

  video.addEventListener('ended', () => {
    // "pause" on the final frame rather than resetting to frame 0
    video.pause();
    if (video.duration && isFinite(video.duration)) {
      video.currentTime = Math.max(0, video.duration - 0.03);
    }
    reveal();
  });

  // Safety net: if video can't load at all, don't block the page forever.
  video.addEventListener('error', reveal);
  failSafe = setTimeout(reveal, 9000);
  video.addEventListener('ended', () => clearTimeout(failSafe));

  if (motionPreference.matches || navigator.connection?.saveData) {
    reveal();
  } else if (video.readyState >= 2) {
    tryPlay();
  } else {
    video.addEventListener('canplay', tryPlay, { once: true });
  }

  // Let an impatient visitor skip straight to content.
  function skipIntro() {
    if (revealed) return;
    reveal();
  }
  eyebrow.addEventListener('click', skipIntro);
  window.addEventListener('pointerdown', skipIntro, { once: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && !revealed) reveal();
  });

  /* ---------------------------------------------------------
     2. Download button
     Keep the actual href usable even when JavaScript is unavailable.
  --------------------------------------------------------- */
  const dlBtn = document.getElementById('downloadBtn');
  const cdnUrl = dlBtn.dataset.cdn;
  const isPlaceholder = !cdnUrl || cdnUrl.includes('PLACEHOLDER');

  dlBtn.addEventListener('click', (e) => {
    if (isPlaceholder) {
      e.preventDefault();
      const meta = dlBtn.querySelector('.dl-meta');
      const original = meta.textContent;
      meta.textContent = 'link not set — edit data-cdn in index.html';
      dlBtn.style.borderColor = '#ff3350';
      setTimeout(() => { meta.textContent = original; }, 3200);
      return;
    }
  });

  // Enter triggers the download once the page has revealed, echoing the
  // app's own single-keypress navigation.
  window.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    if (!revealed) {
      // Returning prevents this same keypress from also starting a download.
      if (e.key.length === 1 || e.key === 'Enter' || e.key === 'Escape' || e.key === 'Tab') {
        if (e.key !== 'Tab') e.preventDefault();
        skipIntro();
      }
      return;
    }
    if (e.key === 'Enter' && document.activeElement === document.body) {
      e.preventDefault();
      dlBtn.click();
    }
  });

  /* ---------------------------------------------------------
     3. Ambient braille heartagram sigil (canvas)
     A faint, slowly breathing dot-matrix heart, echoing the
     app's own braille-art logo, seated behind the page content.
  --------------------------------------------------------- */
  const canvas = document.getElementById('sigil');
  const ctx = canvas.getContext('2d');
  let w, h, dpr;

  // 17x15 bitmap heartagram-ish sigil (1 = dot)
  const rows = [
    '00011000011000',
    '00111100111100',
    '01111111111110',
    '01111111111110',
    '01111111111110',
    '00111111111100',
    '00011111111000',
    '00001111110000',
    '00000111100000',
    '00000011000000',
    '00000111100000',
    '00001111110000',
    '00001111110000',
    '00000111100000',
    '00000011000000',
  ];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.width = window.innerWidth * dpr;
    h = canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
  }
  let animationFrame;
  let t = 0;

  function drawSigil() {
    ctx.clearRect(0, 0, w, h);

    const cell = Math.max(4, Math.min(window.innerWidth, window.innerHeight) * 0.012) * dpr;
    const cols = rows[0].length;
    const rcount = rows.length;
    const gridW = cell * cols;
    const gridH = cell * rcount;
    const originX = w - gridW - 40 * dpr;
    const originY = h * 0.14;

    const breathe = motionPreference.matches ? 0.5 : (Math.sin(t) * 0.5 + 0.5);
    const baseAlpha = 0.05 + breathe * 0.10;

    for (let r = 0; r < rcount; r++) {
      for (let c = 0; c < cols; c++) {
        if (rows[r][c] !== '1') continue;
        const x = originX + c * cell;
        const y = originY + r * cell;
        const flicker = motionPreference.matches ? 1 : (0.7 + 0.3 * Math.sin(t * 1.7 + r * 0.6 + c * 0.4));
        ctx.fillStyle = `rgba(255, 51, 80, ${(baseAlpha * flicker).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(x, y, cell * 0.32, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    t += 0.012;
    if (!motionPreference.matches && !document.hidden) {
      animationFrame = requestAnimationFrame(drawSigil);
    }
  }

  function refreshSigil() {
    cancelAnimationFrame(animationFrame);
    resize();
    drawSigil();
  }
  window.addEventListener('resize', refreshSigil);
  document.addEventListener('visibilitychange', refreshSigil);
  motionPreference.addEventListener('change', () => {
    if (motionPreference.matches) reveal();
    refreshSigil();
  });
  refreshSigil();

})();

