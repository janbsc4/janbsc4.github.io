// Motion follows the site's two native metaphors: a printed editorial sheet and a frog mark.
const motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
let motionBody = null;
let hasIntroducedSite = false;
let scrollFrame = null;

function updateSectionMarker() {
  scrollFrame = null;

  const postBody = document.querySelector('.post-body');
  if (!postBody || motionMedia.matches) return;

  const headings = [...postBody.querySelectorAll('h2')];
  let currentHeading = null;
  const readingLine = window.innerHeight * 0.3;

  headings.forEach((heading) => {
    heading.classList.remove('is-current-section');
    if (heading.getBoundingClientRect().top <= readingLine) currentHeading = heading;
  });

  currentHeading?.classList.add('is-current-section');
}

function requestSectionMarker() {
  if (scrollFrame !== null) return;
  scrollFrame = window.requestAnimationFrame(updateSectionMarker);
}

function initializeMotion() {
  if (motionBody === document.body) return;
  motionBody = document.body;

  if (motionMedia.matches) {
    document.body.classList.remove('motion-enhanced', 'motion-enter', 'motion-first');
    updateSectionMarker();
    return;
  }

  document.body.classList.add('motion-enhanced');
  if (!hasIntroducedSite) {
    document.body.classList.add('motion-first');
    hasIntroducedSite = true;
  }

  document.body.classList.add('motion-enter');
  updateSectionMarker();
}

window.addEventListener('scroll', requestSectionMarker, { passive: true });
window.addEventListener('resize', requestSectionMarker, { passive: true });
motionMedia.addEventListener('change', () => {
  motionBody = null;
  initializeMotion();
});
document.addEventListener('turbo:load', initializeMotion);
initializeMotion();
