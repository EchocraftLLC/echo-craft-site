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

// "View more" galleries: extra photos are listed in images/gallery.json,
// which .github/workflows/gallery.yml keeps up to date.
(function () {
  const wraps = document.querySelectorAll(".view-more-wrap");
  if (!wraps.length) return;
  fetch("images/gallery.json")
    .then((r) => (r.ok ? r.json() : {}))
    .catch(() => ({}))
    .then((manifest) => {
      wraps.forEach((wrap) => {
        const cat = wrap.dataset.for;
        const files = manifest[cat] || [];
        const grid = document.getElementById("more-" + cat);
        if (!files.length || !grid) return;
        const label = cat.charAt(0).toUpperCase() + cat.slice(1);
        files.forEach((file) => {
          const fig = document.createElement("figure");
          fig.className = "gallery-item";
          const img = document.createElement("img");
          const stem = file.replace(/\.[^.]+$/, "");
          img.src = `images/${cat}/${encodeURIComponent(file)}`;
          img.srcset = `images/thumbs/${cat}/${encodeURIComponent(stem)}.jpg 800w, ${img.src} 1600w`;
          img.sizes = "(max-width: 720px) 50vw, 33vw";
          img.alt = `${label} photography`;
          img.loading = "lazy";
          img.decoding = "async";
          img.addEventListener("error", () => fig.remove());
          fig.appendChild(img);
          grid.appendChild(fig);
        });
        grid.previousElementSibling.classList.add("gallery--has-more");
        wrap.hidden = false;
        const btn = wrap.querySelector(".view-more");
        btn.addEventListener("click", () => {
          const open = grid.hidden;
          grid.hidden = !open;
          btn.setAttribute("aria-expanded", open ? "true" : "false");
          btn.textContent = open ? `Show fewer ${cat}` : `View more ${cat}`;
          if (!open) grid.previousElementSibling.scrollIntoView({ block: "center" });
        });
      });
    });
})();

// Portfolio lightbox
(function () {
  if (!document.querySelector(".gallery")) return;
  // Only photos currently on screen (skips collapsed "View more" grids).
  const getItems = () =>
    Array.from(document.querySelectorAll(".gallery-item")).filter((el) => !el.closest("[hidden]"));
  let items = getItems();

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

  // exifr is only needed for the lightbox, so it loads on first use.
  let exifrLoader = null;
  function loadExifr() {
    if (typeof exifr !== "undefined") return Promise.resolve();
    if (!exifrLoader) {
      exifrLoader = new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/npm/exifr@7.1.3/dist/lite.umd.js";
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }
    return exifrLoader;
  }

  function loadDetails(src, token) {
    detailsEl.innerHTML = "";
    detailsEl.classList.remove("is-visible");
    loadExifr().then(() => parseDetails(src, token)).catch(() => {});
  }

  function parseDetails(src, token) {
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
    const src = img.src;
    imgEl.src = src;
    imgEl.alt = img.alt || "";
    requestToken += 1;
    loadDetails(src, requestToken);
  }

  let lastFocus = null;
  function open(index) {
    lastFocus = document.activeElement;
    show(index);
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }

  function close() {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }

  function activate(item) {
    if (item.classList.contains("is-missing")) return;
    items = getItems();
    open(items.indexOf(item));
  }

  // Delegated so photos added later by "View more" work too.
  document.addEventListener("click", (e) => {
    const item = e.target.closest && e.target.closest(".gallery-item");
    if (item) activate(item);
  });
  document.addEventListener("keydown", (e) => {
    const item = e.target.closest && e.target.closest(".gallery-item");
    if (item && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      activate(item);
    }
  });
  const decorate = (item) => {
    item.setAttribute("tabindex", "0");
    item.setAttribute("role", "button");
    item.setAttribute("aria-label", "View larger photo");
  };
  document.querySelectorAll(".gallery-item").forEach(decorate);
  new MutationObserver((muts) =>
    muts.forEach((mu) => mu.addedNodes.forEach((n) => n.classList && n.classList.contains("gallery-item") && decorate(n)))
  ).observe(document.body, { childList: true, subtree: true });

  closeBtn.addEventListener("click", close);
  prevBtn.addEventListener("click", () => show(nextAvailableIndex(currentIndex - 1, -1)));
  nextBtn.addEventListener("click", () => show(nextAvailableIndex(currentIndex + 1, 1)));

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  document.addEventListener("keydown", (e) => {
    if (!overlay.classList.contains("is-open")) return;
    if (e.key === "Tab") {
      // keep keyboard focus inside the lightbox while it is open
      const focusable = [closeBtn, prevBtn, nextBtn];
      const idx = focusable.indexOf(document.activeElement);
      e.preventDefault();
      focusable[(idx + (e.shiftKey ? -1 : 1) + focusable.length) % focusable.length].focus();
    }
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(nextAvailableIndex(currentIndex - 1, -1));
    if (e.key === "ArrowRight") show(nextAvailableIndex(currentIndex + 1, 1));
  });
})();

// Booking page: show scheduler / payment buttons only when js/site-config.js has links.
(function () {
  const box = document.getElementById("reserve");
  const cfg = window.ECHOCRAFT;
  if (!box || !cfg) return;
  const holder = box.querySelector(".reserve__buttons");
  const add = (url, label) => {
    if (!/^https:\/\//.test(url || "")) return;
    const a = document.createElement("a");
    a.className = "btn";
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = label;
    holder.appendChild(a);
  };
  add(cfg.schedulerUrl, cfg.schedulerLabel || "Pick a date");
  add(cfg.paymentUrl, cfg.paymentLabel || "Pay your retainer");
  if (holder.children.length) box.hidden = false;
})();
