(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var toggle = document.querySelector("[data-menu-toggle]");
    var links = document.querySelector("[data-nav-links]");

    if (toggle && links) {
      toggle.addEventListener("click", function () {
        var isOpen = links.getAttribute("data-open") === "true";
        links.setAttribute("data-open", isOpen ? "false" : "true");
        toggle.setAttribute("aria-expanded", isOpen ? "false" : "true");
      });

      links.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
          links.setAttribute("data-open", "false");
          toggle.setAttribute("aria-expanded", "false");
        });
      });
    }

    var sections = document.querySelectorAll("main section[id]");
    var navLinks = document.querySelectorAll(".navbar__link");

    if (sections.length && navLinks.length && "IntersectionObserver" in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) {
              return;
            }
            navLinks.forEach(function (link) {
              var isCurrent = link.getAttribute("href") === "#" + entry.target.id;
              link.setAttribute("aria-current", isCurrent ? "true" : "false");
            });
          });
        },
        { rootMargin: "-40% 0px -55% 0px" }
      );

      sections.forEach(function (section) {
        observer.observe(section);
      });
    }
  });
})();
