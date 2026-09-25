(function () {
  "use strict";

  var STORAGE_KEY = "clara-portfolio-lang";
  var DEFAULT_LANG = "fr";
  var translations = {};
  var currentLang = DEFAULT_LANG;

  function getStoredLang() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      return null;
    }
  }

  function storeLang(lang) {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (error) {
      /* stockage indisponible, on continue sans persister */
    }
  }

  function detectInitialLang() {
    var stored = getStoredLang();
    if (stored === "fr" || stored === "en") {
      return stored;
    }
    var browserLang = (navigator.language || "fr").slice(0, 2);
    return browserLang === "en" ? "en" : "fr";
  }

  function translate(lang) {
    var dict = translations[lang];
    if (!dict) {
      return;
    }

    document.documentElement.setAttribute("lang", lang);

    document.querySelectorAll("[data-i18n]").forEach(function (node) {
      var key = node.getAttribute("data-i18n");
      if (dict[key]) {
        node.textContent = dict[key];
      }
    });

    document.querySelectorAll("[data-i18n-attr]").forEach(function (node) {
      var pairs = node.getAttribute("data-i18n-attr").split(",");
      pairs.forEach(function (pair) {
        var parts = pair.split(":");
        var attr = parts[0].trim();
        var key = parts[1].trim();
        if (dict[key]) {
          node.setAttribute(attr, dict[key]);
        }
      });
    });

    document.querySelectorAll("[data-lang-btn]").forEach(function (btn) {
      var isActive = btn.getAttribute("data-lang-btn") === lang;
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    if (dict["meta.title"]) {
      document.title = dict["meta.title"];
    }

    currentLang = lang;
  }

  function setLang(lang) {
    if (!translations[lang]) {
      return;
    }
    translate(lang);
    storeLang(lang);
  }

  function init(data) {
    translations = data;
    var initialLang = detectInitialLang();
    translate(initialLang);

    document.querySelectorAll("[data-lang-btn]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setLang(btn.getAttribute("data-lang-btn"));
      });
    });
  }

  // Chemin du fichier de traductions calculé relativement à ce script
  // (et non à la page HTML qui l'inclut) : index.html est à la racine,
  // mais les fiches projet sont dans pages/, donc un chemin en dur
  // ("data/i18n.json") casse silencieusement dès qu'on change de dossier.
  function getI18nDataUrl() {
    var scripts = document.getElementsByTagName("script");
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].getAttribute("src") || "";
      if (/(^|\/)i18n\.js(\?.*)?$/.test(src)) {
        return new URL("../data/i18n.json", new URL(src, document.baseURI)).href;
      }
    }
    // Repli raisonnable si jamais le script a été renommé ou inline.
    return "data/i18n.json";
  }

  fetch(getI18nDataUrl())
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Impossible de charger les traductions");
      }
      return response.json();
    })
    .then(init)
    .catch(function (error) {
      console.error(error);
    });

  window.claraPortfolioI18n = {
    setLang: setLang,
    getLang: function () {
      return currentLang;
    }
  };
})();
