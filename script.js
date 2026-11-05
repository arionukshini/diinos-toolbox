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
    if (toolsMenu.open || e.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (e.key.toLowerCase() === 'h') { e.preventDefault(); reveal(); openTools(); return; }
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

  const toolsMenu = document.getElementById('toolsMenu');
  const toolsTrigger = document.getElementById('toolsTrigger');
  const toolSearch = document.getElementById('toolSearch');
  const results = document.getElementById('toolResults');
  const detail = document.getElementById('toolDetail');
  const catalog = [
    ['01', 'Windows / Office activation', 'Activation tool access', 'Opens the third-party activation tool after confirmation in the Windows app.', 'Main menu → 1'],
    ['02', 'Office downloader', 'Microsoft installers in 42 languages', 'Choose an Office language. The app downloads the official Microsoft installer and shows progress.', 'Main menu → 2 → Choose a language'],
    ['03', 'qBittorrent', 'Detect an existing client or download its installer', 'The app checks for qBittorrent first. Open an existing installation or download the official installer.', 'Main menu → 3, or Games → 2'],
    ['04', 'Minecraft tools', 'Bedrock setup, Java launchers and clients', 'Browse Minecraft Bedrock setup, Prism, PineconeMC, Freesm and Flarial tools.', 'Main menu → 4'],
    ['BE', 'Minecraft Bedrock setup', 'Store, setup download and install folder', 'Open the Store, download the setup archive, or open the Minecraft install folder. Option 4 asks before excluding that same folder from Defender scans.', 'Main menu → 4 → 1'],
    ['05', 'Defender folder exclusion', 'Choose a folder and confirm the change', 'An explicit action in the Windows app. Administrator approval is requested only when needed; opening menus never changes exclusions.', 'Main menu → 5'],
    ['06', 'Downloads folder', 'Find your downloaded installers', 'Open your Windows Downloads folder. Completed app downloads also open it automatically.', 'Main menu → 6'],
    ['07', 'Movie search', 'Find a title on Heartive', 'Type a movie title in the app to open Heartive search results in your browser.', 'Main menu → 7 → 1'],
    ['08', 'Game search', 'Search FitGirl and SteamRIP together', 'Type a game title to open search results on both sites. The Games menu also has individual site links and qBittorrent access.', 'Main menu → 8 → 1'],
    ['I', 'System info', 'CPU, RAM, graphics and disk space', 'Read your Windows system information locally. Hardware details are cached and live memory and disk values refresh without starting PowerShell.', 'Main menu → I; R to refresh'],
    ['U', 'Update checker', 'Check for new Toolbox releases', 'Check the public release announcement on this website. If a newer version is available, press D in the app to open its download.', 'Main menu → U; R to check again'],
  ];
  let previousFocus;
  function showTools() {
    detail.hidden = true;
    results.hidden = false;
    const query = toolSearch.value.trim().toLowerCase();
    const matching = catalog.filter(item => item.join(' ').toLowerCase().includes(query));
    results.replaceChildren();
    matching.forEach(item => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'tool-item';
      const symbol = document.createElement('span');
      symbol.className = 'tool-symbol';
      symbol.textContent = item[0];
      symbol.setAttribute('aria-hidden', 'true');
      const text = document.createElement('span');
      const name = document.createElement('span');
      name.className = 'tool-name';
      name.textContent = item[1];
      const summary = document.createElement('span');
      summary.className = 'tool-summary';
      summary.textContent = item[2];
      text.append(name, summary);
      const arrow = document.createElement('span');
      arrow.className = 'tool-arrow';
      arrow.textContent = '›';
      arrow.setAttribute('aria-hidden', 'true');
      button.append(symbol, text, arrow);
      button.addEventListener('click', () => {
        results.hidden = true;
        document.getElementById('noTools').hidden = true;
        detail.hidden = false;
        document.getElementById('detailTitle').textContent = item[1];
        document.getElementById('detailCopy').textContent = item[3];
        document.getElementById('detailPath').textContent = 'In the Windows app: ' + item[4];
        document.getElementById('backTools').focus();
      });
      results.append(button);
    });
    document.getElementById('noTools').hidden = matching.length > 0;
    document.getElementById('toolCount').textContent = matching.length + ' tools';
  }
  function openTools() {
    previousFocus = document.activeElement;
    toolSearch.value = '';
    showTools();
    toolsMenu.showModal();
    toolSearch.focus();
  }
  toolsTrigger.addEventListener('click', openTools);
  document.getElementById('closeTools').addEventListener('click', () => toolsMenu.close());
  toolsMenu.addEventListener('close', () => previousFocus?.focus());
  toolsMenu.addEventListener('click', event => { if (event.target === toolsMenu) {
    const r = toolsMenu.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) toolsMenu.close();
  }});
  toolSearch.addEventListener('input', showTools);
  document.getElementById('backTools').addEventListener('click', () => { showTools(); toolSearch.focus(); });
  toolsMenu.addEventListener('keydown', event => {
    if (detail.hidden && ['ArrowDown', 'ArrowUp'].includes(event.key)) {
      const buttons = [...results.querySelectorAll('button')];
      if (!buttons.length) return;
      event.preventDefault();
      const current = buttons.indexOf(document.activeElement);
      const next = current < 0
        ? (event.key === 'ArrowDown' ? 0 : buttons.length - 1)
        : (current + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next].focus();
      buttons[next].scrollIntoView({block:'nearest'});
    } else if (event.key === 'Enter' && document.activeElement === toolSearch) {
      event.preventDefault();
      results.querySelector('button')?.click();
    }
  });

})();

