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

function initializePage() {
  initializeTheme();
  initializeAnalytics();
}

document.addEventListener('turbo:load', initializePage);

document.addEventListener('turbo:before-render', () => {
  document.body.classList.add('content-changing');
});

document.addEventListener('turbo:render', () => {
  document.body.classList.remove('content-changing');
});
