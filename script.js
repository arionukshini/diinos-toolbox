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

  let revealed = false;

  function reveal() {
    if (revealed) return;
    revealed = true;
    dim.classList.add('on');
    status.textContent = 'READY';
    status.classList.add('ready');
    setTimeout(() => heroContent.classList.add('show'), 250);
  }

  function tryPlay() {
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
  const failSafe = setTimeout(reveal, 9000);
  video.addEventListener('ended', () => clearTimeout(failSafe));

  if (video.readyState >= 2) {
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
  window.addEventListener('keydown', (e) => {
    if (!revealed && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      skipIntro();
    }
  }, { once: false });

  /* ---------------------------------------------------------
     2. Download button
     Swap data-cdn for the real Discord CDN link when ready.
  --------------------------------------------------------- */
  const dlBtn = document.getElementById('downloadBtn');
  const cdnUrl = dlBtn.dataset.cdn;
  const isPlaceholder = cdnUrl.includes('PLACEHOLDER');

  dlBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (isPlaceholder) {
      const meta = dlBtn.querySelector('.dl-meta');
      const original = meta.textContent;
      meta.textContent = 'link not set — edit data-cdn in index.html';
      dlBtn.style.borderColor = '#ff3350';
      setTimeout(() => { meta.textContent = original; }, 3200);
      return;
    }
    window.location.href = cdnUrl;
  });

  // Enter triggers the download once the page has revealed, echoing the
  // app's own single-keypress navigation.
  window.addEventListener('keydown', (e) => {
    if (revealed && e.key === 'Enter' && document.activeElement !== dlBtn) {
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
  resize();
  window.addEventListener('resize', resize);

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let t = 0;

  function drawSigil() {
    ctx.clearRect(0, 0, w, h);

    const cell = Math.max(4, Math.min(w, h) * 0.012) * dpr;
    const cols = rows[0].length;
    const rcount = rows.length;
    const gridW = cell * cols;
    const gridH = cell * rcount;
    const originX = w - gridW - 40 * dpr;
    const originY = h * 0.14;

    const breathe = reduceMotion ? 0.5 : (Math.sin(t) * 0.5 + 0.5);
    const baseAlpha = 0.05 + breathe * 0.10;

    for (let r = 0; r < rcount; r++) {
      for (let c = 0; c < cols; c++) {
        if (rows[r][c] !== '1') continue;
        const x = originX + c * cell;
        const y = originY + r * cell;
        const flicker = reduceMotion ? 1 : (0.7 + 0.3 * Math.sin(t * 1.7 + r * 0.6 + c * 0.4));
        ctx.fillStyle = `rgba(255, 51, 80, ${(baseAlpha * flicker).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(x, y, cell * 0.32, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    t += 0.012;
    requestAnimationFrame(drawSigil);
  }

  requestAnimationFrame(drawSigil);

  /* ---------------------------------------------------------
     4. Dynamic Favicon Generator & Updater
     Renders the horned D logo onto a high-DPI canvas and updates
     the browser favicon dynamically on load / update.
  --------------------------------------------------------- */
  function updateFavicon() {
    try {
      const size = 128;
      const c = document.createElement('canvas');
      c.width = size;
      c.height = size;
      const cx = c.getContext('2d');
      if (!cx) return;

      // Dark badge container
      const bgGrad = cx.createLinearGradient(0, 0, size, size);
      bgGrad.addColorStop(0, '#180c0e');
      bgGrad.addColorStop(1, '#080405');

      cx.fillStyle = bgGrad;
      cx.beginPath();
      if (cx.roundRect) {
        cx.roundRect(0, 0, size, size, 28);
      } else {
        cx.rect(0, 0, size, size);
      }
      cx.fill();

      cx.strokeStyle = '#4a1a20';
      cx.lineWidth = 4;
      cx.stroke();

      // Red gradient for D and horns
      cx.save();
      cx.translate(19, 14);
      const s = 0.43;
      cx.scale(s, s);

      const redGrad = cx.createLinearGradient(0, 0, 0, size);
      redGrad.addColorStop(0, '#ff5a6e');
      redGrad.addColorStop(0.5, '#dc243c');
      redGrad.addColorStop(1, '#7a0f1d');

      cx.fillStyle = redGrad;

      // Unified Horned D (100% Single Continuous Path)
      const dPath = new Path2D();
      dPath.moveTo(25, 50);
      dPath.bezierCurveTo(10, 38, 6, 18, 18, 2);
      dPath.bezierCurveTo(34, 16, 52, 32, 75, 50);
      dPath.lineTo(115, 50);
      dPath.bezierCurveTo(138, 32, 156, 16, 172, 2);
      dPath.bezierCurveTo(184, 18, 180, 38, 138, 50);
      dPath.bezierCurveTo(155, 52, 185, 85, 185, 137.5);
      dPath.bezierCurveTo(185, 190, 150, 225, 105, 225);
      dPath.lineTo(29, 225);
      dPath.bezierCurveTo(26.8, 225, 25, 223.2, 25, 221);
      dPath.lineTo(25, 50);
      dPath.closePath();

      dPath.moveTo(70, 95);
      dPath.lineTo(100, 95);
      dPath.bezierCurveTo(122, 95, 140, 114, 140, 137.5);
      dPath.bezierCurveTo(140, 161, 122, 180, 100, 180);
      dPath.lineTo(70, 180);
      dPath.closePath();

      cx.fill(dPath, 'evenodd');

      cx.restore();

      let link = document.querySelector('link[rel="icon"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = c.toDataURL('image/png');
    } catch (e) {
      console.warn('Favicon update warning:', e);
    }
  }

  updateFavicon();
  window.updateFavicon = updateFavicon;

})();

