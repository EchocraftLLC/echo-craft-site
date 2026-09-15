// Mobile nav toggle
const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const open = siteNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => siteNav.classList.remove("is-open"));
  });
}

// Hero fade-in (skipped if user prefers reduced motion)
const heroContent = document.querySelector(".hero-content");
if (heroContent) {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) {
    heroContent.classList.add("is-visible");
  } else {
    requestAnimationFrame(() => {
      setTimeout(() => heroContent.classList.add("is-visible"), 80);
    });
  }
}
