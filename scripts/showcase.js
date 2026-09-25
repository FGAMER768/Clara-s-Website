/*
  Vitrine des jeux : petits sons de survol et de validation sur les
  jaquettes, façon bibliothèque de jeux console.

  - Un son léger et discret joue au survol (souris ou focus clavier natif
    via Tab).
  - Un second son, un peu plus affirmé, joue à la validation (clic, ou
    Entrée quand une jaquette a le focus) juste avant que le lien navigue.
  - Les sons sont générés avec la Web Audio API : aucun fichier audio à
    charger, et ça respecte silencieusement les navigateurs qui bloquent
    l'audio avant une interaction utilisateur.

  Aucune navigation clavier personnalisée (flèches) n'est ajoutée : la
  navigation au clavier reste le comportement natif du navigateur (Tab /
  Maj+Tab / Entrée sur les liens), pour rester simple et sans surprise.
*/
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var showcase = document.querySelector(".showcase");
    if (!showcase) {
      return;
    }

    var tiles = Array.prototype.slice.call(showcase.querySelectorAll(".showcase__tile"));
    if (!tiles.length) {
      return;
    }

    /* ---------- Sons synthétisés (Web Audio API) ---------- */

    var AudioContextClass = window.AudioContext || window.webkitAudioContext;
    var audioCtx = null;

    function getAudioContext() {
      if (!AudioContextClass) {
        return null;
      }
      if (!audioCtx) {
        audioCtx = new AudioContextClass();
      }
      // Certains navigateurs démarrent le contexte en "suspended" tant
      // qu'aucune interaction utilisateur n'a eu lieu.
      if (audioCtx.state === "suspended") {
        audioCtx.resume().catch(function () {});
      }
      return audioCtx;
    }

    // Joue un petit "blip" : une note qui décroît vite en volume et en hauteur.
    function playTone(frequency, duration, volume, type) {
      var ctx = getAudioContext();
      if (!ctx) {
        return;
      }

      try {
        var oscillator = ctx.createOscillator();
        var gain = ctx.createGain();

        oscillator.type = type || "sine";
        oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + duration + 0.02);
      } catch (err) {
        // L'audio n'est jamais critique : on ignore silencieusement.
      }
    }

    function playHoverSound() {
      playTone(720, 0.09, 0.05, "sine");
    }

    function playSelectSound() {
      var ctx = getAudioContext();
      if (!ctx) {
        return;
      }
      // Deux notes courtes qui montent, façon confirmation de menu console.
      playTone(520, 0.09, 0.07, "triangle");
      window.setTimeout(function () {
        playTone(780, 0.12, 0.08, "triangle");
      }, 70);
    }

    var lastHoveredTile = null;

    // Sur tactile, un tap déclenche souvent "focus" (parfois "mouseenter"
    // aussi, simulé par le navigateur) immédiatement suivi de "click" :
    // sans garde-fou, ça joue le son de survol PUIS le son de sélection
    // pour un seul et même tap, ce qui donne les deux sons collés l'un
    // à l'autre. On ne joue le son de survol que si l'interaction vient
    // réellement d'un pointeur précis (souris) ou du clavier (Tab), pas
    // d'un tap tactile.
    var suppressHoverSound = false;

    function handleHoverEnter(tile) {
      if (suppressHoverSound || lastHoveredTile === tile) {
        return;
      }
      lastHoveredTile = tile;
      playHoverSound();
    }

    function handleHoverLeave(tile) {
      if (lastHoveredTile === tile) {
        lastHoveredTile = null;
      }
    }

    function activateTile(tile) {
      var href = tile.getAttribute("href");
      if (!href) {
        return;
      }
      playSelectSound();
      // Petit délai pour laisser le son de validation se faire entendre
      // avant que la page change (sinon la navigation coupe le son net).
      window.setTimeout(function () {
        window.location.href = href;
      }, 140);
    }

    tiles.forEach(function (tile) {
      // Son au survol souris.
      tile.addEventListener("mouseenter", function () {
        handleHoverEnter(tile);
      });
      tile.addEventListener("mouseleave", function () {
        handleHoverLeave(tile);
      });

      // Son au survol clavier (focus natif via Tab), cohérent avec la
      // souris : le style visuel :focus-visible existant s'en charge déjà.
      // Un tap tactile déclenche aussi "focus" juste avant "click" : le
      // handler pointerdown ci-dessous, appelé en premier, prévient ce
      // cas via suppressHoverSound pour ne garder que le son de tap.
      tile.addEventListener("focus", function () {
        handleHoverEnter(tile);
      });
      tile.addEventListener("blur", function () {
        handleHoverLeave(tile);
      });

      // Détecte si l'interaction en cours vient du tactile, avant même
      // que "focus" ou "click" ne se déclenchent (pointerdown est le
      // tout premier événement de la séquence, aussi bien pour la
      // souris que pour le doigt).
      tile.addEventListener("pointerdown", function (event) {
        suppressHoverSound = event.pointerType === "touch" || event.pointerType === "pen";
      });

      // Clic (souris ou tap) : son de validation avant la navigation.
      tile.addEventListener("click", function (event) {
        // Un clic du milieu / ctrl+clic / cmd+clic ouvre dans un nouvel
        // onglet : le navigateur gère déjà ça très bien, on ne touche à
        // rien dans ce cas précis.
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
          return;
        }
        event.preventDefault();
        activateTile(tile);
        // Le prochain focus (ex: Tab reçu juste après cette navigation
        // annulée sur la même page) doit à nouveau pouvoir jouer le son
        // de survol normalement.
        suppressHoverSound = false;
      });

      // Entrée sur une jaquette qui a le focus (Tab) : même son de
      // validation, sans toucher au reste du comportement clavier natif.
      tile.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          event.preventDefault();
          activateTile(tile);
        }
      });
    });
  });
})();