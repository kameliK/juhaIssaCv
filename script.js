// Extracted script from Issa.html

// Lightweight capability detection
function isLowPowerDevice() {
  try {
    const mem = navigator.deviceMemory || 4;
    const cpu = navigator.hardwareConcurrency || 4;
    const mobile = /Mobi|Android/i.test(navigator.userAgent || '');
    return mem <= 4 || cpu <= 4 || mobile;
  } catch (e) {
    return false;
  }
}

// Debounce helper
function debounce(fn, wait) {
  let t;
  return function(...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

// Create background effects (batched, adaptive to device)
function createBackgroundEffects() {
  const nodesContainer = document.getElementById('data-nodes');
  const binaryContainer = document.getElementById('binary-rain');

  // clear previous
  nodesContainer.innerHTML = '';
  binaryContainer.innerHTML = '';

  const lowPower = isLowPowerDevice();
  if (lowPower) document.body.classList.add('reduced-effects');
  else document.body.classList.remove('reduced-effects');

  // scale counts by capability
  const nodeCount = lowPower ? Math.max(6, Math.floor(window.innerWidth / 160)) : Math.max(12, Math.floor(window.innerWidth / 80));
  const binaryCount = lowPower ? Math.max(4, Math.floor(window.innerWidth / 280)) : Math.max(8, Math.floor(window.innerWidth / 140));

  const nodesFrag = document.createDocumentFragment();
  const binaryFrag = document.createDocumentFragment();

  // run in idle if available to avoid blocking
  const work = () => {
    for (let i = 0; i < nodeCount; i++) {
      const node = document.createElement('div');
      node.className = 'data-node';
      node.style.left = Math.random() * 100 + 'vw';
      node.style.top = Math.random() * 100 + 'vh';
      const size = Math.random() * (lowPower ? 5 : 8) + 3;
      node.style.width = size + 'px';
      node.style.height = size + 'px';
      const colors = ['#00f3ff', '#b100ff', '#ff00c8', '#00ff9d'];
      node.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      node.style.animationDuration = (Math.random() * (lowPower ? 16 : 12) + (lowPower ? 18 : 10)) + 's';
      node.style.animationDelay = (Math.random() * (lowPower ? 8 : 6)) + 's';
      nodesFrag.appendChild(node);
    }

    for (let i = 0; i < binaryCount; i++) {
      const binary = document.createElement('div');
      binary.className = 'binary-rain';
      let s = '';
      for (let j = 0; j < 12; j++) s += Math.round(Math.random()) + ' ';
      binary.textContent = s;
      binary.style.left = Math.random() * 100 + 'vw';
      binary.style.top = '-40px';
      binary.style.animationDuration = (Math.random() * (lowPower ? 12 : 8) + (lowPower ? 10 : 6)) + 's';
      binary.style.animationDelay = (Math.random() * (lowPower ? 6 : 4)) + 's';
      binary.style.fontSize = (Math.random() * (lowPower ? 4 : 6) + 10) + 'px';
      binaryFrag.appendChild(binary);
    }

    // append in one rAF for smoother paint
    requestAnimationFrame(() => {
      nodesContainer.appendChild(nodesFrag);
      binaryContainer.appendChild(binaryFrag);
    });
  };

  if ('requestIdleCallback' in window && !lowPower) {
    requestIdleCallback(work, { timeout: 1000 });
  } else {
    setTimeout(work, 120);
  }
}

// Re-create background on resize (debounced)
const handleResize = debounce(() => {
  createBackgroundEffects();
}, 400);
window.addEventListener('resize', handleResize);

// Respect prefers-reduced-motion early
const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Measure short-term FPS to decide reduced-effects fallback
function measureFPS(duration = 700) {
  return new Promise(resolve => {
    if (prefersReduced) return resolve(false);
    let frames = 0;
    let start = performance.now();
    function step(now) {
      frames++;
      if (now - start < duration) requestAnimationFrame(step);
      else {
        const fps = frames / ((now - start) / 1000);
        resolve(fps < 40); // true => low perf => reduce effects
      }
    }
    requestAnimationFrame(step);
  });
}

// Pause animations when page hidden, resume when visible
function setupVisibilityHandler() {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) document.body.classList.add('paused');
    else document.body.classList.remove('paused');
  }, { passive: true });
}

// Use passive listeners for scroll/wheel/touch to avoid blocking
function setupPassiveListeners() {
  ['wheel','touchstart','touchmove','touchend'].forEach(ev => {
    window.addEventListener(ev, () => {}, { passive: true });
  });
}

// Initialize and pick effect mode after measuring FPS
async function initPerformanceMode() {
  if (prefersReduced) {
    document.body.classList.add('reduced-effects');
    return;
  }

  // measure FPS, then toggle reduced-effects if needed
  const lowPerf = await measureFPS(800);
  if (lowPerf || isLowPowerDevice()) {
    document.body.classList.add('reduced-effects');
  } else {
    document.body.classList.remove('reduced-effects');
  }
}

// Slightly adjust reveal thresholds / rAF usage for smoother transitions
function setupScrollReveal() {
  const selectors = '.timeline-item, .project-card, .skill-category, .stat-item, .section-header';
  const elems = document.querySelectorAll(selectors);
  elems.forEach((el) => el.classList.add('to-reveal'));
  const io = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        requestAnimationFrame(() => el.classList.add('in-view'));
        observer.unobserve(el);
      }
    });
  }, { root: null, rootMargin: '0px 0px -20% 0px', threshold: 0.14 }); // slightly larger margin for earlier start
  elems.forEach(e => io.observe(e));
}

// Ensure createBackgroundEffects runs after performance mode decided and in idle time
async function createBackgroundEffectsSafe() {
  await initPerformanceMode();
  if (document.body.classList.contains('reduced-effects')) {
    // still create but minimal
    createBackgroundEffects();
  } else {
    if ('requestIdleCallback' in window) requestIdleCallback(createBackgroundEffects, {timeout: 800});
    else setTimeout(createBackgroundEffects, 120);
  }
}

// animateSkillBars
function animateSkillBars() {
  document.querySelectorAll('.skill-progress').forEach(el => {
    const w = el.getAttribute('data-width') || el.dataset.width || el.style.width || '0';
    const width = String(w).replace('%','');
    el.style.width = width + '%';
    el.setAttribute('aria-valuenow', width);
  });
}

// updateDate
function updateDate() {
  const el = document.getElementById('current-date');
  if (el) {
    el.textContent = new Date().toLocaleString();
  }
}

// animateTerminal
function animateTerminal() {
  const out = document.querySelector('.terminal-output');
  if (!out) return;
  if (out.dataset.initialized) return;
  out.dataset.initialized = '1';
  const lines = [
    '<span class="terminal-prompt">> </span><span class="terminal-command">whoami</span><span class="terminal-response"> issajuha</span>',
    '<span class="terminal-prompt">> </span><span class="terminal-command">skills</span><span class="terminal-response"> Network Security, Python, ML</span>',
    '<span class="terminal-prompt">> </span><span class="terminal-command">contact</span><span class="terminal-response"> issajuha117@gmail.com</span>',
  ];
  lines.forEach((html, i) => {
    const line = document.createElement('div');
    line.className = 'terminal-line';
    line.innerHTML = html;
    line.style.animationDelay = (i * 0.45) + 's';
    out.appendChild(line);
  });
}

// setupNavigation
function setupNavigation() {
  const links = document.querySelectorAll('.nav-link');
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      links.forEach(l=>l.classList.remove('active'));
      e.currentTarget.classList.add('active');
    });
  });
}

// setupHoverEffects
function setupHoverEffects() {
  document.querySelectorAll('.cyber-contact-btn').forEach(btn => {
    btn.addEventListener('mouseenter', () => btn.classList.add('hovered'));
    btn.addEventListener('mouseleave', () => btn.classList.remove('hovered'));
  });
}

// setupKeyboardShortcuts
function setupKeyboardShortcuts() {
  window.addEventListener('keydown', (e) => {
    if (e.key === 't') {
      const el = document.getElementById('terminal');
      if (el) el.scrollIntoView({behavior:'smooth'});
    } else if (e.key === 's') {
      document.body.classList.toggle('reduced-effects');
    }
  });
}

// Hook into initialization
document.addEventListener('DOMContentLoaded', function() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║     CYBER CV v2.0 - INITIALIZING SYSTEMS...                 ║
║                                                              ║
║  ██╗███████╗███████╗ █████╗     ██╗██╗   ██╗██╗  ██╗ █████╗ ║
║  ██║██╔════╝██╔════╝██╔══██╗    ██║██║   ██║██║  ██║██╔══██╗║
║  ██║███████╗███████╗███████║    ██║██║   ██║███████║███████║║
║  ██║╚════██║╚════██║██╔══██║    ██║██║   ██║██╔══██║██╔══██║║
║  ██║███████║███████║██║  ██║    ██║╚██████╔╝██║  ██║██║  ██║║
║  ╚═╝╚══════╝╚══════╝╚═╝  ╚═╝    ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝║
║                                                              ║
║  Network & Security Engineer | Data Science Specialist       ║
╚══════════════════════════════════════════════════════════════╝
      `);
  
  setupPassiveListeners();
  setupVisibilityHandler();
  createBackgroundEffectsSafe(); // replaces previous direct call
  animateSkillBars();
  setupScrollReveal();
  updateDate();
  animateTerminal();
  setupNavigation();
  setupHoverEffects();
  setupKeyboardShortcuts();

  // Update date every minute
  setInterval(updateDate, 60000);

  // Add page load animation
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 1s ease';

  setTimeout(() => {
    document.body.style.opacity = '1';
  }, 300);

  console.log('Systems online. Ready for inspection.');
});

// Also re-evaluate mode on window focus and after resize debounce
window.addEventListener('focus', () => { initPerformanceMode(); }, { passive: true });
window.addEventListener('resize', debounce(() => { initPerformanceMode(); createBackgroundEffects(); }, 700));

// ...existing code... (if other functions are defined elsewhere, ensure script order preserves them)