(function () {
  "use strict";

  // L'anneau du hero tourne en boucle infinie (CSS). Dès qu'il quitte le
  // viewport (on a scrollé plus bas dans la page), continuer à l'animer
  // ne sert à rien pour l'utilisateur mais consomme toujours du temps de
  // calcul en arrière-plan. On coupe simplement l'animation via une classe
  // quand le hero n'est plus visible, et on la relaisse tourner dès qu'il
  // revient à l'écran (ex: l'utilisateur remonte en haut de page).
  var ring = document.querySelector(".hero__ring");

  if (!ring || !("IntersectionObserver" in window)) {
    // Sans IntersectionObserver disponible, on ne fait rien : l'anneau
    // continue de tourner comme avant, aucune régression.
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        ring.classList.toggle("hero__ring--paused", !entry.isIntersecting);
      });
    },
    { threshold: 0 }
  );

  observer.observe(ring);
})();
