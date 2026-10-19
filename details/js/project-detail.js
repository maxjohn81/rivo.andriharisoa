var prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

if (window.gsap && !prefersReducedMotion && "IntersectionObserver" in window) {
  document
    .querySelectorAll(".project-detail-reveal")
    .forEach(function (target) {
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
            target,
            { y: 28, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" },
          );
        },
        { threshold: 0.15 },
      );
      observer.observe(target);
    });
}
