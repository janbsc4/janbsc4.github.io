// /assets/js/turbo-config.js

function onPageLoad() {
  // --- A. THEME TOGGLE LOGIC ---
  const toggleButton = document.querySelector('.theme-toggle');
  const htmlElement = document.documentElement;

  if (toggleButton) {
    // 1. Remove old listeners by cloning the button
    // This ensures we don't have duplicate listeners if Turbo misfires
    const newBtn = toggleButton.cloneNode(true);
    toggleButton.parentNode.replaceChild(newBtn, toggleButton);
    
    // 2. Add the Click Listener
    newBtn.addEventListener('click', function() {
      const currentTheme = htmlElement.getAttribute('data-theme');
      const newTheme = (currentTheme === 'light') ? 'dark' : 'light';
      
      // Add transition class for smooth fade (from your original code)
      htmlElement.classList.add('transition');
      setTimeout(() => {
        htmlElement.classList.remove('transition');
      }, 1000);

      // Set the new theme
      htmlElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
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

  // --- C. IMAGE LOADING LOGIC ---
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    if (img.complete) {
      img.style.opacity = '1';
    } else {
      img.style.opacity = '0';
      img.style.transition = 'opacity 0.7s ease';
      img.addEventListener('load', () => img.style.opacity = '1');
      img.addEventListener('error', () => img.style.opacity = '0.5');
    }
  });
}

// 1. Run on Turbo Load (Navigations)
document.addEventListener("turbo:load", onPageLoad);

// 2. Run on Initial Load (First visit)
// This ensures the button works even if Turbo hasn't "kicked in" yet
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