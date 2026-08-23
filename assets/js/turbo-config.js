// /assets/js/turbo-config.js

const initializedThemeButtons = new WeakSet();
const pendingPageViews = [];
let goatCounterLoadListenerAttached = false;

function updateMetaThemeColor(theme) {
  const metaTag = document.querySelector('meta[name="theme-color"]');
  // Keep these colors synchronized with the palette tokens in site.css.
  const color = theme === 'dark' ? '#140F0E' : '#EFA58F';

  if (metaTag) {
    metaTag.setAttribute('content', color);
    return;
  }

  const meta = document.createElement('meta');
  meta.name = 'theme-color';
  meta.content = color;
  document.head.appendChild(meta);
}

function updateToggleState(button, theme) {
  const isDark = theme === 'dark';
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';
  button.setAttribute('aria-label', label);
  button.setAttribute('aria-pressed', String(isDark));
  button.setAttribute('title', label);
}

function initializeTheme() {
  const button = document.querySelector('.theme-toggle');
  const htmlElement = document.documentElement;
  const theme = htmlElement.getAttribute('data-theme');

  updateMetaThemeColor(theme);

  if (!button) return;

  updateToggleState(button, theme);
  if (initializedThemeButtons.has(button)) return;

  initializedThemeButtons.add(button);
  button.addEventListener('click', () => {
    const currentTheme = htmlElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    htmlElement.classList.add('transition');
    setTimeout(() => {
      htmlElement.classList.remove('transition');
    }, 240);

    htmlElement.setAttribute('data-theme', newTheme);
    try {
      localStorage.setItem('theme', newTheme);
    } catch {}

    updateMetaThemeColor(newTheme);
    updateToggleState(button, newTheme);
  });
}

function flushPendingPageViews() {
  if (!window.goatcounter || typeof window.goatcounter.count !== 'function') return;

  pendingPageViews.splice(0).forEach((pageView) => {
    window.goatcounter.count(pageView);
  });
}

function initializeAnalytics() {
  if (document.documentElement.hasAttribute('data-turbo-preview')) return;

  pendingPageViews.push({
    path: window.location.pathname + window.location.search,
    title: document.title
  });

  if (window.goatcounter && typeof window.goatcounter.count === 'function') {
    flushPendingPageViews();
    return;
  }

  if (goatCounterLoadListenerAttached) return;

  const script = document.querySelector('#goatcounter-script');
  if (!script) return;

  goatCounterLoadListenerAttached = true;
  script.addEventListener('load', flushPendingPageViews, { once: true });
}

async function handleCodeCopy(event) {
  const button = event.target.closest?.('.copy-code');
  if (!button) return;

  const block = button.closest('div.highlight');
  const pre = block?.querySelector('pre');
  if (!pre) return;

  const code = pre.querySelector('code');
  const status = button.querySelector('.copy-code-status');
  const text = (code || pre).textContent.replace(/\n$/, '');

  button.classList.remove('is-copied', 'is-failed');

  try {
    await navigator.clipboard.writeText(text);
    button.classList.add('is-copied');
    button.setAttribute('aria-label', 'Code copied');
    status.textContent = 'Code copied';
  } catch {
    button.classList.add('is-failed');
    button.setAttribute('aria-label', 'Copy failed');
    status.textContent = 'Copy failed';
  }

  setTimeout(() => {
    button.classList.remove('is-copied', 'is-failed');
    button.setAttribute('aria-label', 'Copy code to clipboard');
    status.textContent = '';
  }, 1600);
}

function initializeCodeCopy() {
  if (!navigator.clipboard) return;

  document.querySelectorAll('div.highlight').forEach((block) => {
    if (block.querySelector('.copy-code')) return;

    const pre = block.querySelector('pre');
    if (!pre) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'copy-code';
    button.setAttribute('aria-label', 'Copy code to clipboard');
    button.innerHTML = `
      <svg class="copy-code-copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="8" y="4" width="11" height="11" rx="1.5"></rect>
        <path d="M16 15v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2"></path>
      </svg>
      <svg class="copy-code-check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="m5 12 4 4L19 6"></path>
      </svg>
      <svg class="copy-code-failed-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
        <path d="M6 6l12 12M18 6 6 18"></path>
      </svg>
      <span class="visually-hidden copy-code-status" aria-live="polite"></span>
    `;

    block.appendChild(button);
  });
}

// Turbo restores cloned bodies without their element event listeners. Delegate
// copy clicks from the persistent document so restored buttons keep working.
document.addEventListener('click', handleCodeCopy);

// Turbo replaces the body on every visit, so the body doubles as a marker
// for whether the current render has been initialized. This keeps startup
// working even when turbo:load is missed, such as when the Turbo CDN is
// unreachable and full page loads become the norm.
let initializedBody = null;

function initializePage() {
  if (initializedBody === document.body) return;
  initializedBody = document.body;

  initializeTheme();
  initializeAnalytics();
  initializeCodeCopy();
}

document.addEventListener('turbo:load', initializePage);
initializePage();

document.addEventListener('turbo:before-render', () => {
  document.body.classList.add('content-changing');
});

document.addEventListener('turbo:render', () => {
  document.body.classList.remove('content-changing');
});
