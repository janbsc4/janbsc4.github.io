// Motion follows the site's two native metaphors: a printed editorial sheet and a frog mark.
const motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
let motionBody = null;
let hasIntroducedSite = false;

function initializeMotion() {
  if (motionBody === document.body) return;
  motionBody = document.body;

  if (motionMedia.matches) {
    document.body.classList.remove('motion-enhanced', 'motion-enter', 'motion-first');
    return;
  }

  document.body.classList.add('motion-enhanced');
  if (!hasIntroducedSite) {
    document.body.classList.add('motion-first');
    hasIntroducedSite = true;
  }

  document.body.classList.add('motion-enter');
}

motionMedia.addEventListener('change', () => {
  motionBody = null;
  initializeMotion();
});
document.addEventListener('turbo:load', initializeMotion);
initializeMotion();
