// /assets/js/turbo-config.js

function onPageLoad() {
  // Keep browser chrome and the accessible control in sync with the CSS theme.
  const updateMetaThemeColor = (theme) => {
    const metaTag = document.querySelector('meta[name="theme-color"]');
    const color = theme === 'dark' ? '#140F0E' : '#EFA58F';
    
    if (metaTag) {
      metaTag.setAttribute('content', color);
    } else {
      const meta = document.createElement('meta');
      meta.name = "theme-color";
      meta.content = color;
      document.head.appendChild(meta);
    }
  };

  const updateToggleState = (button, theme) => {
    const isDark = theme === 'dark';
    const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';
    button.setAttribute('aria-label', label);
    button.setAttribute('aria-pressed', String(isDark));
    button.setAttribute('title', label);
  };

  // --- A. THEME TOGGLE LOGIC ---
  const toggleButton = document.querySelector('.theme-toggle');
  const htmlElement = document.documentElement;

  if (htmlElement.getAttribute('data-theme')) {
    updateMetaThemeColor(htmlElement.getAttribute('data-theme'));
  }

  if (toggleButton) {
    const newBtn = toggleButton.cloneNode(true);
    toggleButton.parentNode.replaceChild(newBtn, toggleButton);
    updateToggleState(newBtn, htmlElement.getAttribute('data-theme'));
    
    newBtn.addEventListener('click', function() {
      const currentTheme = htmlElement.getAttribute('data-theme');
      const newTheme = (currentTheme === 'light') ? 'dark' : 'light';
      
      htmlElement.classList.add('transition');
      setTimeout(() => {
        htmlElement.classList.remove('transition');
      }, 240);

      htmlElement.setAttribute('data-theme', newTheme);
      try { localStorage.setItem('theme', newTheme); } catch (error) {}
      
      updateMetaThemeColor(newTheme);
      updateToggleState(newBtn, newTheme);
    });
  }

  // --- B. FORM LOGIC ---
  const forms = document.querySelectorAll('form:not([data-turbo="false"])');
  forms.forEach(form => {
    form.addEventListener('submit', function(event) {
      if (form.method.toLowerCase() === 'get') return;
      
      if (form.action && !form.action.startsWith(window.location.origin)) {
        event.preventDefault();
        const formData = new FormData(form);
        
        fetch(form.action, {
            method: form.method,
            body: formData,
            headers: { 'Accept': 'application/json' }
        })
        .then(response => response.json())
        .then(data => {
          const successMessage = document.createElement('div');
          successMessage.classList.add('form-success');
          successMessage.textContent = "Form submitted successfully!";
          form.parentNode.insertBefore(successMessage, form.nextSibling);
          form.reset();
        })
        .catch(error => console.error('Error:', error));
      }
    });
  });

  // Fade loaded images in and collapse missing portfolio artwork cleanly.
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    const markImageError = () => {
      img.classList.add('image-error');
      img.setAttribute('aria-hidden', 'true');
      const portfolioItem = img.closest('.portfolio-item');
      if (portfolioItem) {
        portfolioItem.classList.add('portfolio-item--text-only');
        const mediaLink = img.closest('a');
        if (mediaLink) mediaLink.hidden = true;
      }
    };

    if (img.complete && img.naturalWidth > 0) {
      img.style.opacity = '1';
    } else if (img.complete) {
      markImageError();
    } else {
      img.addEventListener('load', () => {
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!reduceMotion && typeof img.animate === 'function') {
          img.animate(
            [{ opacity: 0 }, { opacity: 1 }],
            { duration: 450, easing: 'ease-out' }
          );
        }
      });
      img.addEventListener('error', markImageError);
    }
  });
}

// 1. Run on Turbo Load (Navigations)
document.addEventListener("turbo:load", onPageLoad);

// 2. Run on Initial Load (First visit)
document.addEventListener("DOMContentLoaded", function() {
    if (!document.documentElement.hasAttribute('data-turbo-preview')) {
        onPageLoad();
    }
});

// 3. Visual Transition States
document.addEventListener("turbo:before-render", function() {
  document.body.classList.add("content-changing");
});
document.addEventListener("turbo:render", function() {
  document.body.classList.remove("content-changing");
});
