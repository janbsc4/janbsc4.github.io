(function () {
  "use strict";

  var root = document.documentElement;
  var frame = document.querySelector("[data-cv-frame]");
  var regions = Array.prototype.slice.call(
    document.querySelectorAll(".cv-header-main, .cv-header-side, .cv-main, .cv-sidebar")
  );
  var status = document.querySelector("[data-cv-fit-status]");
  var printButton = document.querySelector("[data-cv-print]");
  var scheduledFrame = null;
  var measuring = false;

  if (!frame || !status || !printButton) return;

  function isOverflowing() {
    var tolerance = 2;
    var frameOverflows = frame.scrollHeight > frame.clientHeight + tolerance;
    var regionOverflows = regions.some(function (region) {
      return region.scrollHeight > region.clientHeight + tolerance;
    });

    return frameOverflows || regionOverflows;
  }

  function setResult(result) {
    root.dataset.fit = result;
    status.textContent = status.dataset[result];
  }

  function measure() {
    if (measuring) return;
    measuring = true;
    root.dataset.density = "normal";
    setResult("checking");
    // Force layout so the print event cannot run before fit has been resolved.
    void frame.offsetHeight;

    if (!isOverflowing()) {
      setResult("normal");
      measuring = false;
      return;
    }

    root.dataset.density = "compact";
    void frame.offsetHeight;
    setResult(isOverflowing() ? "overflow" : "compact");
    measuring = false;
  }

  function scheduleMeasure() {
    if (scheduledFrame !== null) cancelAnimationFrame(scheduledFrame);
    scheduledFrame = requestAnimationFrame(function () {
      scheduledFrame = null;
      measure();
    });
  }

  printButton.addEventListener("click", function () {
    measure();
    window.print();
  });

  window.addEventListener("beforeprint", measure);
  window.addEventListener("resize", scheduleMeasure);

  if ("ResizeObserver" in window) {
    var observer = new ResizeObserver(scheduleMeasure);
    observer.observe(frame);
  }

  var imagesReady = Array.prototype.map.call(document.images, function (image) {
    if (image.complete) return Promise.resolve();
    return new Promise(function (resolve) {
      image.addEventListener("load", resolve, { once: true });
      image.addEventListener("error", resolve, { once: true });
    });
  });

  var fontsReady = document.fonts && document.fonts.ready
    ? document.fonts.ready
    : Promise.resolve();

  Promise.all([fontsReady].concat(imagesReady)).then(measure);
}());
