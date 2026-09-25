(function () {
  "use strict";

  // Sélecteur des boutons qui reçoivent l'effet "goutte d'eau" au tap :
  // tous les boutons interactifs du site (navbar, sliders, lightbox).
  // La lightbox construit ses boutons dynamiquement après ce script,
  // d'où la délégation d'événement sur document plutôt qu'un binding
  // direct sur chaque bouton trouvé au chargement.
  var RIPPLE_SELECTOR =
    ".navbar__icon-btn, .navbar__lang-btn, .media-slider__button, " +
    ".lightbox__nav, .lightbox__close";

  var DURATION = 550; // doit correspondre à l'animation dans ripple.css

  function spawnRipple(button, clientX, clientY) {
    button.classList.add("ripple-host");

    var rect = button.getBoundingClientRect();
    // Le cercle doit pouvoir couvrir tout le bouton même quand le point
    // de contact est excentré : son diamètre est deux fois la distance
    // au coin le plus éloigné.
    var offsetX = clientX - rect.left;
    var offsetY = clientY - rect.top;
    var maxDistance = Math.max(
      Math.hypot(offsetX, offsetY),
      Math.hypot(rect.width - offsetX, offsetY),
      Math.hypot(offsetX, rect.height - offsetY),
      Math.hypot(rect.width - offsetX, rect.height - offsetY)
    );
    var size = maxDistance * 2;

    var ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.width = size + "px";
    ripple.style.height = size + "px";
    ripple.style.left = offsetX + "px";
    ripple.style.top = offsetY + "px";

    button.appendChild(ripple);
    window.setTimeout(function () {
      ripple.remove();
    }, DURATION);
  }

  // Un clic déclenché au clavier (Enter/Espace sur un bouton focus) ou
  // par lecteur d'écran n'a pas de coordonnées fiables : dans ce cas on
  // centre simplement le ripple sur le bouton plutôt que de l'ignorer,
  // pour garder un retour visuel cohérent au clavier aussi.
  function centerOf(button) {
    var rect = button.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }

  document.addEventListener(
    "pointerdown",
    function (event) {
      // Seuls le tap tactile et le clic souris principal déclenchent le
      // ripple ; on ignore le clic droit et les boutons désactivés.
      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }
      var button = event.target.closest(RIPPLE_SELECTOR);
      if (!button || button.disabled) {
        return;
      }
      spawnRipple(button, event.clientX, event.clientY);
    },
    { passive: true }
  );

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    var button = event.target.closest(RIPPLE_SELECTOR);
    if (!button || button.disabled) {
      return;
    }
    var center = centerOf(button);
    spawnRipple(button, center.x, center.y);
  });
})();
