// ============================================================
//  Scroll-driven animations  — estilo Apple
//  Cada elemento .sfx entra desde abajo y sale hacia arriba
//  en función de su posición relativa en el viewport.
// ============================================================

const ELEMENTS_SELECTOR = [
  '.sfx',
  '.sfx-slow',
  '.sfx-scale',
  '.sfx-left',
  '.sfx-right',
  '.sfx-fade',
].join(',');

// Config por tipo
const CONFIGS = {
  sfx:       { enterY: 60,  exitY: -40,  scale: 1,    opacity: true },
  'sfx-slow':{ enterY: 80,  exitY: -50,  scale: 1,    opacity: true },
  'sfx-scale':{ enterY: 40, exitY: -30,  scale: 0.88, opacity: true },
  'sfx-left':{ enterX: -80, exitX: 60,   scale: 1,    opacity: true },
  'sfx-right':{ enterX: 80, exitX: -60,  scale: 1,    opacity: true },
  'sfx-fade':{ enterY: 20,  exitY: -15,  scale: 1,    opacity: true },
};

function getConfig(el) {
  for (const key of Object.keys(CONFIGS)) {
    if (el.classList.contains(key)) return { key, ...CONFIGS[key] };
  }
  return { key: 'sfx', ...CONFIGS.sfx };
}

// Easing: ease-in-out cubic
function ease(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Clamp between 0 and 1
function clamp(v) { return Math.max(0, Math.min(1, v)); }

function updateElement(el) {
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight;

  // progress 0 = bottom of viewport, 1 = top of viewport
  // "enter zone": element bottom enters viewport → element center reaches viewport center
  // "exit zone":  element center passes viewport center → element top leaves viewport

  const cfg = getConfig(el);

  // How far the element has traveled through the screen
  // 0   = just entering from bottom
  // 0.5 = element center is at viewport center (fully "in")
  // 1   = element has left the top

  const elementCenter = rect.top + rect.height / 2;
  const raw = 1 - elementCenter / vh; // 0 at bottom, 1 at top

  // Enter phase: raw 0 → 0.4  →  progress 0 → 1
  // Stay phase:  raw 0.4 → 0.6 → fully visible
  // Exit phase:  raw 0.6 → 1   →  progress 0 → 1

  const ENTER_END  = 0.42;
  const EXIT_START = 0.58;

  let enterP = clamp((raw) / ENTER_END);
  let exitP  = clamp((raw - EXIT_START) / (1 - EXIT_START));

  const eEnter = ease(enterP);
  const eExit  = ease(exitP);

  // Y axis
  const enterY = (cfg.enterY ?? 0) * (1 - eEnter);
  const exitY  = (cfg.exitY  ?? 0) * eExit;

  // X axis
  const enterX = (cfg.enterX ?? 0) * (1 - eEnter);
  const exitX  = (cfg.exitX  ?? 0) * eExit;

  const translateY = enterY + exitY;
  const translateX = enterX + exitX;

  // Scale
  const enterScale = cfg.scale + (1 - cfg.scale) * eEnter;
  const exitScale  = 1 - (1 - cfg.scale) * eExit;
  const scale = Math.min(enterScale, exitScale);

  // Opacity
  let opacity = 1;
  if (cfg.opacity) {
    opacity = Math.min(eEnter, 1 - eExit * 0.5);
    opacity = clamp(opacity);
  }

  el.style.transform  = `translateY(${translateY}px) translateX(${translateX}px) scale(${scale})`;
  el.style.opacity    = opacity;
  el.style.willChange = 'transform, opacity';
}

// Only update elements that are near the viewport (performance)
let allElements = [];

function onScroll() {
  const vh = window.innerHeight;
  for (const el of allElements) {
    const rect = el.getBoundingClientRect();
    // Only process elements within 1.5 viewports
    if (rect.bottom > -vh * 0.5 && rect.top < vh * 1.5) {
      updateElement(el);
    }
  }
}

export function initScrollFX() {
  allElements = Array.from(document.querySelectorAll(ELEMENTS_SELECTOR));
  if (!allElements.length) return;

  // Set initial state (hidden below)
  allElements.forEach(el => {
    const cfg = getConfig(el);
    el.style.transform = `translateY(${cfg.enterY ?? 60}px) translateX(${cfg.enterX ?? 0}px) scale(${cfg.scale ?? 1})`;
    el.style.opacity = '0';
    el.style.transition = 'none'; // JS controls this, no CSS transition
  });

  // Passive scroll listener + rAF throttle
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        onScroll();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // Run once on load
  onScroll();
}
