(function () {
  "use strict";

  // Chemin du sprite d'icônes, déduit de l'emplacement de CE script
  // plutôt que codé en dur en relatif ("../icons/..."). Ainsi
  // lightbox.js fonctionne aussi bien inclus depuis la racine
  // (index.html, "scripts/lightbox.js") que depuis pages/*.html
  // ("../scripts/lightbox.js"), sans jamais pointer au mauvais endroit.
  var scriptEl = document.currentScript;
  var spritePath = "icons/sprite.svg";
  if (scriptEl && scriptEl.src) {
    spritePath = new URL("../icons/sprite.svg", scriptEl.src).href;
  }

  document.addEventListener("DOMContentLoaded", function () {
    var sliders = document.querySelectorAll("[data-slider]");
    var galleries = document.querySelectorAll(".gallery__item");
    if (!sliders.length && !galleries.length) {
      return;
    }

    // --- Construction de la lightbox (une seule instance, réutilisée
    // pour tous les sliders de la page) ---------------------------------
    // Contrairement aux versions précédentes (rail de slides déplacé par
    // transform ou par scroll), il n'y a ici qu'UNE SEULE image dans le
    // DOM à la fois : naviguer change juste son "src" au lieu de faire
    // coulisser un ensemble de slides. Il n'y a donc plus aucune largeur
    // à mesurer ni de position à calculer, ce qui élimine toute la classe
    // de bugs rencontrée avec les approches précédentes (images à moitié
    // visibles, écran vide, décalages qui s'accumulent).
    var lightbox = document.createElement("div");
    lightbox.className = "lightbox";
    lightbox.setAttribute("data-open", "false");
    lightbox.setAttribute("role", "dialog");
    lightbox.setAttribute("aria-modal", "true");
    lightbox.setAttribute("aria-hidden", "true");
    lightbox.innerHTML =
      '<button class="lightbox__close" type="button" data-lightbox-close aria-label="Fermer">' +
      '<svg aria-hidden="true"><use href="' + spritePath + '#icon-close"></use></svg>' +
      "</button>" +
      '<button class="lightbox__nav lightbox__nav--prev" type="button" data-lightbox-prev aria-label="Image précédente">' +
      '<svg aria-hidden="true"><use href="' + spritePath + '#icon-chevron-left"></use></svg>' +
      "</button>" +
      '<div class="lightbox__stage">' +
      '<img class="lightbox__image" data-lightbox-image alt="" />' +
      "</div>" +
      '<button class="lightbox__nav lightbox__nav--next" type="button" data-lightbox-next aria-label="Image suivante">' +
      '<svg aria-hidden="true"><use href="' + spritePath + '#icon-chevron-right"></use></svg>' +
      "</button>" +
      '<p class="lightbox__status" data-lightbox-status></p>';
    document.body.appendChild(lightbox);

    var stage = lightbox.querySelector(".lightbox__stage");
    var image = lightbox.querySelector("[data-lightbox-image]");
    var status = lightbox.querySelector("[data-lightbox-status]");
    var prevButton = lightbox.querySelector("[data-lightbox-prev]");
    var nextButton = lightbox.querySelector("[data-lightbox-next]");
    var closeButton = lightbox.querySelector("[data-lightbox-close]");

    var currentImages = [];
    var currentIndex = 0;
    var lastFocusedElement = null;

    function render(index) {
      if (!currentImages.length) {
        return;
      }
      currentIndex = Math.max(0, Math.min(index, currentImages.length - 1));
      var source = currentImages[currentIndex];

      // On rejoue la petite animation d'entrée à chaque changement
      // d'image : retirer puis remettre la classe force le navigateur à
      // relancer l'animation CSS (sinon la deuxième fois ne rejoue pas,
      // la classe étant déjà présente).
      image.classList.remove("lightbox__image--enter");
      image.removeAttribute("data-loaded");
      void image.offsetWidth; // force reflow

      image.alt = source.alt || "";
      image.src = source.currentSrc || source.src;
      image.classList.add("lightbox__image--enter");

      updateNav();
    }

    function updateNav() {
      var total = currentImages.length;
      prevButton.disabled = currentIndex <= 0;
      nextButton.disabled = currentIndex >= total - 1;
      status.textContent = (currentIndex + 1) + " / " + total;
    }

    function openLightbox(images, startIndex) {
      currentImages = images;
      lastFocusedElement = document.activeElement;
      render(startIndex);
      lightbox.setAttribute("data-open", "true");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      // Focus différé au frame suivant pour laisser data-open="true"
      // prendre effet avant de déplacer le focus (certains lecteurs
      // d'écran ignorent un focus posé sur un élément encore masqué).
      requestAnimationFrame(function () {
        closeButton.focus();
      });
    }

    function closeLightbox() {
      lightbox.setAttribute("data-open", "false");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
        lastFocusedElement.focus();
      }
    }

    function isOpen() {
      return lightbox.getAttribute("data-open") === "true";
    }

    image.addEventListener("load", function () {
      image.setAttribute("data-loaded", "true");
    });

    // --- Ouverture depuis n'importe quel slider ------------------------
    sliders.forEach(function (slider) {
      slider.addEventListener("click", function (event) {
        var img = event.target.closest(".media-slider__slide img");
        if (!img) {
          return;
        }
        var slides = slider.querySelectorAll(".media-slider__slide img");
        var images = Array.prototype.slice.call(slides);
        var startIndex = images.indexOf(img);
        openLightbox(images, Math.max(0, startIndex));
      });
    });

    // --- Ouverture depuis le cadrillage (.gallery) ----------------------
    // Même principe que les sliders : cliquer n'importe où sur une tuile
    // (y compris sa légende, positionnée en overlay au-dessus de l'image
    // et non comme un enfant du <img>) ouvre la lightbox avec toutes les
    // images du cadrillage, dans l'ordre où elles apparaissent.
    document.querySelectorAll(".gallery").forEach(function (gallery) {
      gallery.addEventListener("click", function (event) {
        var item = event.target.closest(".gallery__item");
        if (!item) {
          return;
        }
        var img = item.querySelector(".gallery__image img");
        if (!img) {
          return;
        }
        var items = gallery.querySelectorAll(".gallery__item");
        var images = Array.prototype.map.call(items, function (el) {
          return el.querySelector(".gallery__image img");
        }).filter(Boolean);
        var startIndex = images.indexOf(img);
        openLightbox(images, Math.max(0, startIndex));
      });
    });

    // --- Contrôles -------------------------------------------------------
    prevButton.addEventListener("click", function () {
      render(currentIndex - 1);
    });

    nextButton.addEventListener("click", function () {
      render(currentIndex + 1);
    });

    closeButton.addEventListener("click", closeLightbox);

    lightbox.addEventListener("click", function (event) {
      // Clic sur le fond sombre (en dehors de la stage) : on ferme.
      if (event.target === lightbox) {
        closeLightbox();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (!isOpen()) {
        return;
      }
      if (event.key === "Escape") {
        closeLightbox();
      } else if (event.key === "ArrowLeft") {
        render(currentIndex - 1);
      } else if (event.key === "ArrowRight") {
        render(currentIndex + 1);
      }
    });

    // --- Swipe tactile (mobile) ------------------------------------------
    // Ici pas de rail à faire coulisser avec le doigt : on se contente de
    // mesurer le geste au relâchement et de changer d'image d'un coup,
    // comme un clic sur une flèche.
    var touchStartX = 0;
    var touchStartY = 0;

    stage.addEventListener(
      "touchstart",
      function (event) {
        if (event.touches.length !== 1) {
          return;
        }
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
      },
      { passive: true }
    );

    stage.addEventListener(
      "touchend",
      function (event) {
        var deltaX = event.changedTouches[0].clientX - touchStartX;
        var deltaY = event.changedTouches[0].clientY - touchStartY;

        // Mouvement surtout vertical : l'utilisateur voulait probablement
        // faire défiler la page, pas changer d'image.
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
          return;
        }

        var threshold = 40;
        if (deltaX > threshold) {
          render(currentIndex - 1);
        } else if (deltaX < -threshold) {
          render(currentIndex + 1);
        }
      },
      { passive: true }
    );
  });
})();
