// /assets/js/turbo-config.js
document.addEventListener("turbo:load", function() {
  console.log("Page loaded with Turbo!");
  
  // This function runs whenever a new page is loaded via Turbo
  // You can initialize any page-specific JavaScript here
});

// Add the loading class
document.addEventListener("turbo:before-render", function(event) {
  document.body.classList.add("turbo-loading");
});

// Remove the loading class
document.addEventListener("turbo:render", function() {
  // Remove the class after render, not after visit
  document.body.classList.remove("turbo-loading");
});

document.addEventListener("turbo:before-visit", function() {
  // This runs when a user clicks a link but before navigation begins
  // Good place to show loading indicators
});

document.addEventListener("turbo:visit", function() {
  // This runs after navigation is complete
  document.body.classList.remove("turbo-loading");
});


// Make forms work with Turbo
document.addEventListener("turbo:load", function() {
  const forms = document.querySelectorAll('form:not([data-turbo="false"])');
  
  forms.forEach(form => {
    form.addEventListener('submit', function(event) {
      // For forms that submit to external services
      if (form.method.toLowerCase() === 'get') {
        // Let the browser handle GET forms normally
        return;
      }
      
      // For forms handled by static site services like Formspree
      // This prevents full page reload
      if (form.action && !form.action.startsWith(window.location.origin)) {
        event.preventDefault();
        
        const formData = new FormData(form);
        
        fetch(form.action, {
          method: form.method,
          body: formData,
          headers: {
            'Accept': 'application/json'
          }
        })
        .then(response => response.json())
        .then(data => {
          // Handle success - show a message
          const successMessage = document.createElement('div');
          successMessage.classList.add('form-success');
          successMessage.textContent = "Form submitted successfully!";
          form.parentNode.insertBefore(successMessage, form.nextSibling);
          form.reset();
        })
        .catch(error => {
          // Handle error
          console.error('Error:', error);
        });
      }
    });
  });
});