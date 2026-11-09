// One-row gallery.
// Swipe/scroll on touch; chevron buttons and arrow keys on desktop. Neighbouring slides fade
// and shrink with their distance from the centre (the "tween" carousel effect).
// Click/tap a photo or video to open it full screen (lightbox from footnotes.js).
// Videos have no controls: they play muted while on screen.
document.querySelectorAll(".gallery").forEach((gal) => {
  const track = gal.querySelector(".gal-track");
  const slides = [...track.querySelectorAll(".gal-slide")];
  const count = gal.querySelector(".gal-count");

  const center = (el) => { const r = el.getBoundingClientRect(); return r.left + r.width / 2; };
  const currentIndex = () => {
    const c = center(track);
    let best = 0, bestD = Infinity;
    slides.forEach((s, i) => { const d = Math.abs(center(s) - c); if (d < bestD) { bestD = d; best = i; } });
    return best;
  };
  const go = (i) => {
    const wraps = i < 0 || i >= slides.length;
    i = (i + slides.length) % slides.length;
    const s = slides[i];
    // Wrapping around jumps straight there instead of sliding past every photo.
    track.scrollTo({ left: s.offsetLeft - (track.clientWidth - s.offsetWidth) / 2, behavior: wraps ? "instant" : "smooth" });
  };

  gal.querySelector(".gal-prev").addEventListener("click", () => go(currentIndex() - 1));
  gal.querySelector(".gal-next").addEventListener("click", () => go(currentIndex() + 1));
  track.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); go(currentIndex() - 1); }
    if (e.key === "ArrowRight") { e.preventDefault(); go(currentIndex() + 1); }
  });

  // Fade/shrink by distance from centre; update the counter.
  let frame = 0;
  const update = () => {
    frame = 0;
    const c = center(track);
    slides.forEach((s) => {
      const p = Math.min(1, Math.abs(center(s) - c) / s.offsetWidth);
      s.style.setProperty("--p", p.toFixed(3));
    });
    count.textContent = `${currentIndex() + 1} / ${slides.length}`;
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
  track.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  update();

  // Click/tap opens the lightbox (a swipe doesn't fire click).
  slides.forEach((s) => {
    const media = s.querySelector("img, video");
    media.addEventListener("click", () => {
      if (window.openLightbox) window.openLightbox(media, s.querySelector("figcaption"));
    });
  });

  // Gallery videos play muted while on screen.
  const seen = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? e.target.play().catch(() => {}) : e.target.pause()));
  }, { threshold: 0.6 });
  gal.querySelectorAll("video").forEach((v) => seen.observe(v));

  // Thin bar under each video, so viewers can tell when it loops.
  gal.querySelectorAll(".gal-video").forEach((w) => {
    const v = w.querySelector("video");
    const bar = w.querySelector(".gal-progress > span");
    let raf = 0;
    const tick = () => {
      if (v.duration) bar.style.transform = "scaleX(" + v.currentTime / v.duration + ")";
      raf = requestAnimationFrame(tick);
    };
    v.addEventListener("play", () => { cancelAnimationFrame(raf); tick(); });
    v.addEventListener("pause", () => cancelAnimationFrame(raf));
  });
});
