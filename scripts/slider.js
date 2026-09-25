(function () {
  "use strict";

  document.querySelectorAll("[data-slider]").forEach(function (slider) {
    var viewport = slider.querySelector("[data-slider-viewport]");
    var previousButton = slider.querySelector("[data-slider-prev]");
    var nextButton = slider.querySelector("[data-slider-next]");
    var status = slider.querySelector("[data-slider-status]");

    if (!viewport || !previousButton || !nextButton || !status) {
      return;
    }

    // Les slides dont l'image ne charge pas se retirent elles-mêmes (onerror),
    // donc on relit la liste à chaque fois plutôt que de la figer au démarrage.
    function getSlides() {
      return slider.querySelectorAll(".media-slider__slide");
    }

    function getStep() {
      var slides = getSlides();
      if (!slides.length) {
        return 0;
      }
      var track = slider.querySelector(".media-slider__track");
      var styles = window.getComputedStyle(track);
      var gap = parseFloat(styles.columnGap) || 0;
      return slides[0].getBoundingClientRect().width + gap;
    }

    function updateControls() {
      var slides = getSlides();

      if (!slides.length) {
        slider.hidden = true;
        return;
      }

      // Une seule slide restante : rien à faire défiler.
      if (slides.length === 1) {
        previousButton.disabled = true;
        nextButton.disabled = true;
        status.textContent = "1 / 1";
        return;
      }

      var step = getStep();
      var maxScroll = viewport.scrollWidth - viewport.clientWidth;
      var currentSlide = step ? Math.round(viewport.scrollLeft / step) : 0;
      previousButton.disabled = viewport.scrollLeft <= 1;
      nextButton.disabled = viewport.scrollLeft >= maxScroll - 1;
      status.textContent = Math.min(currentSlide + 1, slides.length) + " / " + slides.length;
    }

    function moveSlider(direction) {
      var step = getStep();
      if (!step) {
        return;
      }
      var targetScroll = viewport.scrollLeft + direction * step;

      viewport.scrollTo({
        left: Math.max(0, Math.min(targetScroll, viewport.scrollWidth - viewport.clientWidth)),
        behavior: "smooth"
      });
    }

    previousButton.addEventListener("click", function () {
      moveSlider(-1);
    });

    nextButton.addEventListener("click", function () {
      moveSlider(1);
    });

    viewport.addEventListener("scroll", updateControls, { passive: true });
    window.addEventListener("resize", updateControls);

    // Les erreurs de chargement d'image (onerror inline) retirent des slides
    // après le premier rendu : on laisse une passe au navigateur puis on relit l'état.
    window.addEventListener("load", updateControls);
    updateControls();
  });
})();
