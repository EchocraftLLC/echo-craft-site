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

// Portfolio lightbox
(function () {
  const items = Array.from(document.querySelectorAll(".gallery-item"));
  if (!items.length) return;

  const overlay = document.createElement("div");
  overlay.className = "lightbox";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-hidden", "true");
  overlay.innerHTML = `
    <button class="lightbox__close" aria-label="Close">&times;</button>
    <button class="lightbox__prev" aria-label="Previous photo">&larr;</button>
    <div class="lightbox__stage">
      <img class="lightbox__img" alt="" />
      <div class="lightbox__details" aria-live="polite"></div>
    </div>
    <button class="lightbox__next" aria-label="Next photo">&rarr;</button>
  `;
  document.body.appendChild(overlay);

  const imgEl = overlay.querySelector(".lightbox__img");
  const detailsEl = overlay.querySelector(".lightbox__details");
  const closeBtn = overlay.querySelector(".lightbox__close");
  const prevBtn = overlay.querySelector(".lightbox__prev");
  const nextBtn = overlay.querySelector(".lightbox__next");

  let currentIndex = 0;
  let requestToken = 0;

  function formatExposure(seconds) {
    if (!seconds) return null;
    if (seconds >= 1) return `${seconds}s`;
    return `1/${Math.round(1 / seconds)}s`;
  }

  function formatExif(tags) {
    if (!tags) return "";
    const parts = [];
    const camera = [tags.Make, tags.Model].filter(Boolean).join(" ").trim();
    if (camera) parts.push(camera);
    if (tags.LensModel) parts.push(tags.LensModel);

    const settings = [];
    if (tags.FocalLength) settings.push(`${Math.round(tags.FocalLength)}mm`);
    if (tags.FNumber) settings.push(`f/${tags.FNumber}`);
    const exposure = formatExposure(tags.ExposureTime);
    if (exposure) settings.push(exposure);
    if (tags.ISO) settings.push(`ISO ${tags.ISO}`);
    if (settings.length) parts.push(settings.join(" · "));

    const date = tags.DateTimeOriginal || tags.CreateDate;
    if (date instanceof Date && !isNaN(date)) {
      parts.push(date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }));
    }

    return parts.join("<br>");
  }

  function loadDetails(src, token) {
    detailsEl.innerHTML = "";
    detailsEl.classList.remove("is-visible");
    if (typeof exifr === "undefined") return;
    exifr
      .parse(src, ["Make", "Model", "LensModel", "FocalLength", "FNumber", "ExposureTime", "ISO", "DateTimeOriginal", "CreateDate"])
      .then((tags) => {
        if (token !== requestToken) return; // a newer photo was opened meanwhile
        const html = formatExif(tags);
        if (html) {
          detailsEl.innerHTML = html;
          detailsEl.classList.add("is-visible");
        }
      })
      .catch(() => {
        // no EXIF data, or the image doesn't support it (e.g. was re-exported) - fail silently
      });
  }

  function nextAvailableIndex(start, direction) {
    for (let i = 0; i < items.length; i++) {
      const idx = (start + direction * i + items.length * items.length) % items.length;
      if (!items[idx].classList.contains("is-missing")) return idx;
    }
    return start;
  }

  function show(index) {
    currentIndex = ((index % items.length) + items.length) % items.length;
    const img = items[currentIndex].querySelector("img");
    const src = img.currentSrc || img.src;
    imgEl.src = src;
    imgEl.alt = img.alt || "";
    requestToken += 1;
    loadDetails(src, requestToken);
  }

  function open(index) {
    show(index);
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function close() {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  items.forEach((item, index) => {
    item.setAttribute("tabindex", "0");
    item.setAttribute("role", "button");
    item.setAttribute("aria-label", "View larger photo");
    item.addEventListener("click", () => {
      if (item.classList.contains("is-missing")) return;
      open(index);
    });
    item.addEventListener("keydown", (e) => {
      if (item.classList.contains("is-missing")) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open(index);
      }
    });
  });

  closeBtn.addEventListener("click", close);
  prevBtn.addEventListener("click", () => show(nextAvailableIndex(currentIndex - 1, -1)));
  nextBtn.addEventListener("click", () => show(nextAvailableIndex(currentIndex + 1, 1)));

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  document.addEventListener("keydown", (e) => {
    if (!overlay.classList.contains("is-open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(nextAvailableIndex(currentIndex - 1, -1));
    if (e.key === "ArrowRight") show(nextAvailableIndex(currentIndex + 1, 1));
  });
})();
