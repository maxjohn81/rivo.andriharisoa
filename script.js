// Année du pied de page
var yearElement = document.getElementById("annee");
if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

var contactForm = document.getElementById("contact-form");
if (contactForm) {
  var contactStatus = contactForm.querySelector("[data-contact-status]");
  var contactSubmit = contactForm.querySelector('[type="submit"]');

  contactForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    contactSubmit.disabled = true;
    contactStatus.textContent = "Envoi en cours\u2026";
    contactStatus.dataset.state = "sending";

    var formData = new FormData(contactForm);
    var payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      message: formData.get("message"),
      website: formData.get("website")
    };

    try {
      var response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      var result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "L\u2019envoi a \u00e9chou\u00e9. R\u00e9essaie plus tard.");
      }
      contactStatus.textContent = result.message;
      contactStatus.dataset.state = "success";
      contactForm.reset();
    } catch (error) {
      contactStatus.textContent = error.message || "Impossible de contacter le serveur. V\u00e9rifie ta connexion puis r\u00e9essaie.";
      contactStatus.dataset.state = "error";
    } finally {
      contactSubmit.disabled = false;
    }
  });
}

// Intro GSAP
function splitIntoCharacters(element, accessibleText) {
  var text = element.textContent;
  var textNodes = [];
  var walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  var characters = [];
  element.setAttribute("aria-label", accessibleText || text);

  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }

  textNodes.forEach(function (textNode) {
    var fragment = document.createDocumentFragment();
    Array.from(textNode.textContent).forEach(function (character) {
      var span = document.createElement("span");
      span.className = "intro-char";
      span.setAttribute("aria-hidden", "true");
      span.textContent = character === " " ? "\u00a0" : character;
      fragment.appendChild(span);
      characters.push(span);
    });
    textNode.replaceWith(fragment);
  });

  return characters;
}

function playIntro() {
  var overlay = document.querySelector(".intro-overlay");
  var hero = document.querySelector(".hero");
  if (!overlay || !hero) {
    return;
  }
  var heroPhoto = hero.querySelector(".hero-photo img");
  var header = document.querySelector("header");
  var name = hero.querySelector("h1 > span:first-child");
  var role = hero.querySelector("h1 > span:last-child");
  var description = hero.querySelector("p");
  var actions = hero.querySelector(".actions");
  var badges = hero.querySelectorAll(".hero-badge");
  var splashBall = overlay.querySelector(".splash-ball");
  var splashLogo = overlay.querySelector(".splash-logo");
  var splashGreeting = overlay.querySelector(".splash-greeting");
  var splashWelcome = overlay.querySelector(".splash-welcome");
  var reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (!window.gsap || reducedMotion) {
    overlay.remove();
    return;
  }

  document.body.classList.add("intro-playing");
  var nameCharacters = splitIntoCharacters(name);
  var roleLabel = Array.from(role.querySelectorAll(".role-line"))
    .map(function (line) {
      return line.textContent;
    })
    .join(" ");
  var currentHour = new Date().getHours();
  splashGreeting.textContent =
    currentHour >= 5 && currentHour < 12
      ? "Bonjour"
      : currentHour < 18
        ? "Bon après-midi"
        : "Bonsoir";
  var welcomeCharacters = splitIntoCharacters(splashWelcome);
  var roleCharacters = splitIntoCharacters(role, roleLabel);
  var timeline = window.gsap.timeline({
    onComplete: function () {
      document.body.classList.remove("intro-playing");
      overlay.remove();
      window.gsap.set(header, { clearProps: "all" });
    },
  });

  timeline.to(".intro-orb", {
    scale: 180,
    duration: 1.15,
    ease: "power4.inOut",
  });
  timeline.to(
    ".intro-orb",
    { autoAlpha: 0, duration: 0.2, ease: "power2.out" },
    ">-0.05",
  );
  var bounceDistance = Math.min(window.innerWidth * 0.34, 420);
  timeline.fromTo(
    splashBall,
    { x: -bounceDistance, y: 0, scale: 0.8, opacity: 1 },
    { x: -bounceDistance * 0.65, y: -150, duration: 0.28, ease: "power2.out" },
    ">",
  );
  timeline.to(splashBall, {
    x: -bounceDistance * 0.4,
    y: 0,
    rotation: 240,
    duration: 0.3,
    ease: "power2.in",
  });
  timeline.to(splashBall, {
    x: -bounceDistance * 0.18,
    y: -88,
    rotation: 390,
    duration: 0.2,
    ease: "power2.out",
  });
  timeline.to(splashBall, {
    x: 0,
    y: 0,
    rotation: 540,
    duration: 0.25,
    ease: "power2.in",
  });
  timeline.to(splashBall, {
    scale: 0.65,
    opacity: 0,
    duration: 0.18,
    ease: "power2.in",
  });
  timeline.fromTo(
    splashLogo,
    { scale: 0.35, opacity: 0, rotation: -18 },
    {
      scale: 1,
      opacity: 1,
      rotation: 0,
      duration: 0.5,
      ease: "back.out(1.8)",
    },
    "<",
  );
  timeline.to(splashGreeting, { opacity: 1, y: 0, duration: 0.35 }, ">-0.12");
  timeline.from(
    welcomeCharacters,
    {
      opacity: 0,
      duration: 0.025,
      stagger: 0.045,
      ease: "none",
    },
    ">-0.05",
  );
  timeline.to({}, { duration: 2 });
  timeline.to(
    overlay,
    { autoAlpha: 0, duration: 0.45, ease: "power2.inOut" },
    ">",
  );
  timeline.fromTo(
    header,
    { y: -48, opacity: 0, clipPath: "inset(0 50% 0 50%)" },
    {
      y: 0,
      opacity: 1,
      clipPath: "inset(0 0% 0 0%)",
      duration: 0.85,
      ease: "power4.out",
      clearProps: "clipPath",
    },
    ">",
  );
  timeline.fromTo(
    heroPhoto,
    { opacity: 0, scale: 1.08, clipPath: "inset(0 0 100% 0)" },
    {
      opacity: 1,
      scale: 1,
      clipPath: "inset(0 0 0% 0)",
      duration: 1.15,
      ease: "power3.out",
      clearProps: "clipPath,transform",
    },
    "<",
  );
  timeline.from(
    nameCharacters,
    {
      yPercent: 110,
      opacity: 0,
      duration: 0.65,
      stagger: 0.028,
      ease: "power4.out",
    },
    "-=0.15",
  );
  timeline.from(
    roleCharacters,
    {
      opacity: 0,
      duration: 0.01,
      stagger: 0.035,
      ease: "none",
    },
    ">-0.1",
  );
  timeline.from(
    description,
    { y: 24, opacity: 0, duration: 0.65, ease: "power3.out" },
    ">-0.15",
  );
  timeline.from(
    actions,
    { y: 20, opacity: 0, duration: 0.55, ease: "power3.out" },
    ">-0.25",
  );
  timeline.fromTo(
    badges,
    { scale: 0.65, opacity: 0, y: 18 },
    {
      scale: 1,
      opacity: 1,
      y: 0,
      duration: 0.55,
      stagger: 0.14,
      ease: "back.out(1.7)",
    },
    ">-0.05",
  );
  timeline.call(function () {
    badges.forEach(function (badge, index) {
      window.gsap.to(badge, {
        y: index % 2 === 0 ? -8 : 8,
        duration: 2.1 + index * 0.25,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: index * 0.16,
      });
    });
  });
}

playIntro();

// Compteurs des statistiques après leur entrée dans l'écran
var statsSection = document.querySelector(".stats-section");
var stats = statsSection ? statsSection.querySelectorAll(".stat") : [];
var reducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

if (window.gsap && !reducedMotion && "IntersectionObserver" in window) {
  stats.forEach(function (stat) {
    var counter = stat.querySelector("[data-count]");
    var finalValue = Number(counter.dataset.count);
    var prefix = counter.dataset.prefix || "";
    var suffix = counter.dataset.suffix || "";
    var count = { value: 0 };
    counter.textContent = "0" + suffix;

    var observer = new IntersectionObserver(
      function (entries) {
        if (
          !entries.some(function (entry) {
            return entry.isIntersecting;
          })
        ) {
          return;
        }
        observer.disconnect();
        window.gsap.fromTo(
          stat,
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.65, ease: "power3.out" },
        );
        window.gsap.to(count, {
          value: finalValue,
          duration: 1.4,
          ease: "power2.out",
          onUpdate: function () {
            var displayedValue = Math.round(count.value);
            counter.textContent = prefix + displayedValue + suffix;
          },
        });
      },
      { threshold: 0.2 },
    );
    observer.observe(statsSection);
  });
}

// Apparition des sections au défilement
if (window.gsap && !reducedMotion && "IntersectionObserver" in window) {
  var animatedSections = document.querySelectorAll(
    "main > section:not(.hero):not(.stats-section)",
  );

  animatedSections.forEach(function (section) {
    if (section.classList.contains("project-detail")) {
      return;
    }
    var selector;

    if (section.id === "services") {
      selector = ".section-eyebrow, h2, .service-card";
    } else if (section.id === "projets") {
      selector = ".section-eyebrow, h2, .filters";
      section.querySelectorAll(".work").forEach(function (card) {
        var cardObserver = new IntersectionObserver(
          function (entries) {
            if (
              !entries.some(function (entry) {
                return entry.isIntersecting;
              })
            ) {
              return;
            }
            cardObserver.disconnect();
            window.gsap.fromTo(
              card,
              { opacity: 0 },
              { opacity: 1, duration: 0.7, ease: "power3.out" },
            );
          },
          { threshold: 0.15 },
        );
        cardObserver.observe(card);
      });
    } else if (section.id === "apropos") {
      selector =
        ".section-eyebrow, .about h2, .about p, .about-timeline li, .skills h3";
      var skillBubbles = section.querySelectorAll(".skill-bubble");
      var skillBubblesContainer = section.querySelector(".skill-bubbles");
      if (skillBubblesContainer && skillBubbles.length) {
        var skillsObserver = new IntersectionObserver(
          function (entries) {
            if (
              !entries.some(function (entry) {
                return entry.isIntersecting;
              })
            ) {
              return;
            }
            skillsObserver.disconnect();
            window.gsap.fromTo(
              skillBubbles,
              { y: 28, scale: 0.72, opacity: 0 },
              {
                y: 0,
                scale: 1,
                opacity: 1,
                duration: 0.55,
                stagger: 0.075,
                ease: "back.out(1.5)",
                clearProps: "transform,opacity",
              },
            );
          },
          { threshold: 0.15 },
        );
        skillsObserver.observe(skillBubblesContainer);
      }
    } else if (section.id === "contact") {
      selector = ".section-eyebrow, h2, p, .mail, .socials, form";
    }

    if (!selector) {
      return;
    }

    var targets = section.querySelectorAll(selector);
    var revealObserver = new IntersectionObserver(
      function (entries) {
        if (
          !entries.some(function (entry) {
            return entry.isIntersecting;
          })
        ) {
          return;
        }
        revealObserver.disconnect();
        window.gsap.fromTo(
          targets,
          { y: 32, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            stagger: 0.12,
            ease: "power3.out",
          },
        );
      },
      { threshold: 0.15 },
    );
    revealObserver.observe(section);
  });
}

// Thème clair / sombre
var themeToggle = document.querySelector("[data-theme-toggle]");
var savedTheme;
try {
  savedTheme = localStorage.getItem("theme");
} catch (error) {
  console.error("Impossible de lire le thème enregistré.", error);
}
var darkTheme =
  savedTheme === "dark" ||
  (savedTheme !== "light" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches);
document.body.classList.toggle("dark-theme", darkTheme);
themeToggle.setAttribute("aria-pressed", darkTheme);
themeToggle.setAttribute(
  "aria-label",
  darkTheme ? "Activer le mode clair" : "Activer le mode sombre",
);
themeToggle.addEventListener("click", function () {
  darkTheme = document.body.classList.toggle("dark-theme");
  themeToggle.setAttribute("aria-pressed", darkTheme);
  themeToggle.setAttribute(
    "aria-label",
    darkTheme ? "Activer le mode clair" : "Activer le mode sombre",
  );
  try {
    localStorage.setItem("theme", darkTheme ? "dark" : "light");
  } catch (error) {
    console.error("Impossible d'enregistrer le thème.", error);
  }
});

// Menu mobile
var menuToggle = document.querySelector(".menu-toggle");
var navigation = document.getElementById("navigation-principale");
function closeMenu() {
  navigation.classList.remove("is-open");
  document.body.classList.remove("menu-open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Ouvrir le menu");
}
menuToggle.addEventListener("click", function () {
  var menuOuvert = navigation.classList.toggle("is-open");
  document.body.classList.toggle("menu-open", menuOuvert);
  menuToggle.setAttribute("aria-expanded", menuOuvert);
  menuToggle.setAttribute(
    "aria-label",
    menuOuvert ? "Fermer le menu" : "Ouvrir le menu",
  );
});
navigation.querySelectorAll("a").forEach(function (lien) {
  lien.addEventListener("click", closeMenu);
});
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape" && navigation.classList.contains("is-open")) {
    closeMenu();
    menuToggle.focus();
  }
});

// Repère la section visible dans la navigation
var navigationLinks = Array.from(navigation.querySelectorAll("a"));
var trackedSections = Array.from(
  document.querySelectorAll("main > section[id]"),
).filter(function (section) {
  return navigationLinks.some(function (link) {
    return new URL(link.href, window.location.href).hash === "#" + section.id;
  });
});

if ("IntersectionObserver" in window && trackedSections.length) {
  var visibleSections = new Set();
  var sectionObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          visibleSections.add(entry.target);
        } else {
          visibleSections.delete(entry.target);
        }
      });

      var anchorPosition = window.innerHeight * 0.2;
      var sectionsBeforeAnchor = Array.from(visibleSections)
        .filter(function (section) {
          return section.getBoundingClientRect().top <= anchorPosition;
        })
        .sort(function (a, b) {
          return b.getBoundingClientRect().top - a.getBoundingClientRect().top;
        });
      var activeSection =
        sectionsBeforeAnchor[0] ||
        Array.from(visibleSections).sort(function (a, b) {
          return a.getBoundingClientRect().top - b.getBoundingClientRect().top;
        })[0];

      navigationLinks.forEach(function (link) {
        if (
          activeSection &&
          new URL(link.href, window.location.href).hash ===
            "#" + activeSection.id
        ) {
          link.setAttribute("aria-current", "location");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    },
    { rootMargin: "-80px 0px -65% 0px" },
  );

  trackedSections.forEach(function (section) {
    sectionObserver.observe(section);
  });
}

// Filtrer les projets
var filtres = document.querySelectorAll(".filters button");
var projets = document.querySelectorAll(".work");
var vide = document.getElementById("vide");
filtres.forEach(function (f) {
  f.addEventListener("click", function () {
    filtres.forEach(function (b) {
      b.setAttribute("aria-pressed", b === f);
    });
    var cat = f.dataset.filter,
      visibles = 0;
    projets.forEach(function (p) {
      var ok = cat === "all" || p.dataset.cat === cat;
      p.hidden = !ok;
      if (ok) visibles++;
    });
    vide.hidden = visibles > 0;
  });
});
