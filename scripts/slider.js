(function () {
  "use strict";

  document.querySelectorAll("[data-slider]").forEach(function (slider) {
    // Toute la mise en place d'UN slider est protégée individuellement :
    // une erreur inattendue sur un slider ne doit jamais empêcher les
    // AUTRES sliders de la même page de fonctionner. Sans ce garde-fou,
    // une exception non interceptée dans un callback forEach stoppe net
    // toute la boucle : les sliders suivants ne reçoivent alors jamais
    // leurs écouteurs de clic, ce qui les rend inertes sans la moindre
    // erreur visible pour qui ne regarde pas la console.
    try {
      setupSlider(slider);
    } catch (error) {
      console.error("Slider non initialisé :", slider, error);
    }
  });

  function setupSlider(slider) {
    var viewport = slider.querySelector("[data-slider-viewport]");
    var previousButton = slider.querySelector("[data-slider-prev]");
    var nextButton = slider.querySelector("[data-slider-next]");
    // Le <p> de statut ("3 / 7") est placé, dans le HTML actuel du site,
    // juste APRÈS .media-slider plutôt qu'à l'intérieur (comme un frère,
    // pas un enfant) : slider.querySelector() ne le trouve donc jamais.
    // On élargit la recherche au parent direct du slider, qui contient
    // les deux, plutôt que d'exiger que le statut soit dans le slider
    // lui-même. Le statut est purement informatif (aria-live) : son
    // absence éventuelle ne doit de toute façon jamais empêcher les
    // flèches de fonctionner, d'où le fallback sur un objet inoffensif.
    var status =
      slider.querySelector("[data-slider-status]") ||
      (slider.parentElement && slider.parentElement.querySelector("[data-slider-status]"));

    if (!viewport || !previousButton || !nextButton) {
      console.warn("Slider incomplet, éléments manquants :", {
        slider: slider,
        viewport: viewport,
        previousButton: previousButton,
        nextButton: nextButton
      });
      return;
    }

    if (!status) {
      // Pas bloquant : le slider reste pleinement utilisable sans son
      // indicateur "X / N", on évite juste qu'écrire dedans plante.
      status = { textContent: "" };
    }

    // Les slides dont l'image ne charge pas se retirent elles-mêmes (onerror),
    // donc on relit la liste à chaque fois plutôt que de la figer au démarrage.
    function getSlides() {
      return slider.querySelectorAll(".media-slider__slide");
    }

    // Position de scroll de la Nème slide, lue directement dans le DOM
    // (offsetLeft) plutôt que recalculée en multipliant un "pas" par un
    // index : ça reste juste même si les slides n'ont pas exactement la
    // même largeur (arrondis du navigateur, dernière slide partielle...),
    // et ça tombe toujours exactement sur le point d'alignement
    // scroll-snap de la slide visée au lieu d'une position arithmétique
    // qui peut légèrement le manquer.
    function getSlideOffset(index) {
      var slides = getSlides();
      var target = slides[Math.max(0, Math.min(index, slides.length - 1))];
      return target ? target.offsetLeft : 0;
    }

    // Index de la slide actuellement la plus proche du bord gauche du
    // viewport, déduit de la position de scroll réelle plutôt que d'une
    // division approximative scrollLeft / step (qui peut dériver d'une
    // unité selon les arrondis, faisant passer une slide au clic).
    function getCurrentIndex() {
      var slides = getSlides();
      var scrollLeft = viewport.scrollLeft;
      var closestIndex = 0;
      var closestDistance = Infinity;
      slides.forEach(function (slide, index) {
        var distance = Math.abs(slide.offsetLeft - scrollLeft);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });
      return closestIndex;
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

      var maxScroll = viewport.scrollWidth - viewport.clientWidth;

      // Tant que le viewport n'a pas encore de vraie largeur (images pas
      // chargées, police pas prête, etc.), maxScroll peut valoir 0 ou
      // négatif : on ne fige alors PAS les boutons sur "disabled", on
      // attend simplement le prochain passage (resize/load/observer)
      // pour ne jamais bloquer le slider dans un état figé.
      if (maxScroll <= 0 && slides.length > 1) {
        previousButton.disabled = viewport.scrollLeft <= 1;
        nextButton.disabled = false;
        status.textContent = "1 / " + slides.length;
        return;
      }

      var currentSlide = getCurrentIndex();
      previousButton.disabled = viewport.scrollLeft <= 1;
      nextButton.disabled = viewport.scrollLeft >= maxScroll - 1;
      status.textContent = Math.min(currentSlide + 1, slides.length) + " / " + slides.length;
    }

    function moveSlider(direction) {
      var slides = getSlides();
      if (!slides.length) {
        return;
      }
      var targetIndex = getCurrentIndex() + direction;
      var maxScroll = viewport.scrollWidth - viewport.clientWidth;
      var targetOffset = getSlideOffset(targetIndex);

      viewport.scrollTo({
        left: Math.max(0, Math.min(targetOffset, maxScroll)),
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

    // Les images chargent en asynchrone et peuvent changer la largeur
    // réelle du viewport/track après le premier rendu (avant que "load"
    // ne se déclenche pour toute la page) : un ResizeObserver capte ça
    // de façon fiable, plutôt que de dépendre uniquement de "load".
    if ("ResizeObserver" in window) {
      var resizeObserver = new ResizeObserver(function () {
        updateControls();
      });
      resizeObserver.observe(viewport);
    }

    updateControls();
  }
})();
