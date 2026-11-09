// Media footnotes.
// Desktop (mouse): opens on hover, click pins it open; placed above or below the number,
//   whichever has more room on screen, and kept inside the window.
// Touch: tap the number to open a bottom sheet; tap outside (or the number again) to close.
// Both: Esc closes; clicking the photo/video opens it full screen (lightbox).
// Videos marked data-sound try to play with audio (browsers allow it only after a click/tap).
(() => {
  const desktop = matchMedia("(hover: hover) and (pointer: fine)");
  const GAP = 10;
  const fns = [...document.querySelectorAll(".fn")];
  let current = null;
  let closeTimer = null;
  let progressFrame = null;

  const play = (v) => {
    if (!v) return;
    if (v.hasAttribute("data-sound")) {
      v.muted = false;
      v.play().catch(() => { v.muted = true; v.play().catch(() => {}); });
    } else {
      v.play().catch(() => {});
    }
  };

  // Thin bar under some videos, so viewers can tell when they loop.
  function trackProgress(fn) {
    const v = fn.querySelector(".fn-pop video");
    const bar = fn.querySelector(".fn-progress > span");
    if (!v || !bar) return;
    const tick = () => {
      if (v.duration) bar.style.transform = "scaleX(" + v.currentTime / v.duration + ")";
      progressFrame = requestAnimationFrame(tick);
    };
    tick();
  }

  function place(fn) {
    const pop = fn.querySelector(".fn-pop");
    pop.style.removeProperty("--fn-shift");
    pop.style.removeProperty("--fn-max-h");
    fn.classList.remove("is-below");
    if (!desktop.matches) return;

    const mark = fn.querySelector(".fn-mark").getBoundingClientRect();
    const above = mark.top - GAP;
    const below = window.innerHeight - mark.bottom - GAP;
    fn.classList.toggle("is-below", below > above);
    const room = Math.max(above, below);

    // Shrink the media if the card is taller than the room on that side.
    let r = pop.getBoundingClientRect();
    const media = pop.querySelector("img, video");
    if (media && r.height > room) {
      const mh = media.getBoundingClientRect().height - (r.height - room);
      pop.style.setProperty("--fn-max-h", `${Math.max(80, mh)}px`);
      r = pop.getBoundingClientRect();
    }
    // Keep it inside the window sideways.
    const vw = document.documentElement.clientWidth;
    let shift = 0;
    if (r.left < GAP) shift = GAP - r.left;
    else if (r.right > vw - GAP) shift = vw - GAP - r.right;
    if (shift) pop.style.setProperty("--fn-shift", `${shift}px`);
  }

  function open(fn) {
    clearTimeout(closeTimer);
    if (current === fn) return;
    if (current) close(current);
    current = fn;
    fn.classList.add("is-open");
    // Lift the paragraph above its neighbours (the scroll fade gives paragraphs their own layer).
    fn.closest("p, li, figure")?.classList.add("has-open-fn");
    fn.querySelector(".fn-mark").setAttribute("aria-expanded", "true");
    place(fn);
    play(fn.querySelector(".fn-pop video"));
    trackProgress(fn);
  }

  function close(fn) {
    if (!fn) return;
    fn.classList.remove("is-open", "is-pinned", "is-below");
    fn.closest("p, li, figure")?.classList.remove("has-open-fn");
    fn.querySelector(".fn-mark").setAttribute("aria-expanded", "false");
    const v = fn.querySelector(".fn-pop video");
    if (v) v.pause();
    cancelAnimationFrame(progressFrame);
    if (current === fn) current = null;
  }

  fns.forEach((fn, i) => {
    const mark = fn.querySelector(".fn-mark");
    const pop = fn.querySelector(".fn-pop");
    pop.id = `fn-pop-${i + 1}`;
    mark.setAttribute("aria-controls", pop.id);
    mark.setAttribute("aria-expanded", "false");
    mark.setAttribute("aria-label", `Footnote ${i + 1}`);

    fn.addEventListener("mouseenter", () => { if (desktop.matches) open(fn); });
    fn.addEventListener("mouseleave", () => {
      if (!desktop.matches || fn.classList.contains("is-pinned")) return;
      closeTimer = setTimeout(() => close(fn), 200);
    });
    mark.addEventListener("click", () => {
      if (desktop.matches) {
        if (fn.classList.contains("is-pinned")) close(fn);
        else { open(fn); fn.classList.add("is-pinned"); }
      } else {
        current === fn ? close(fn) : open(fn);
      }
    });
    pop.querySelectorAll("img, video").forEach((m) => {
      m.addEventListener("click", () => lightbox(m, pop.querySelector(".fn-cap")));
    });
  });

  // Tap/click outside closes; Esc closes.
  document.addEventListener("click", (e) => {
    if (current && !current.contains(e.target)) close(current);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && current) {
      const mark = current.querySelector(".fn-mark");
      close(current);
      mark.focus();
    }
  });
  window.addEventListener("resize", () => close(current));

  // Lightbox (native <dialog>: handles Esc and focus for us).
  const dlg = document.createElement("dialog");
  dlg.className = "lightbox";
  dlg.innerHTML = '<button class="lb-close" type="button" aria-label="Close">&times;</button><figure class="lb-fig"></figure>';
  document.body.append(dlg);
  const fig = dlg.querySelector(".lb-fig");

  function lightbox(media, cap) {
    close(current);
    let m;
    if (media.tagName === "VIDEO") {
      m = document.createElement("video");
      m.src = media.currentSrc || media.src;
      m.poster = media.poster;
      m.loop = true;
      m.playsInline = true;
      m.controls = true;
      m.currentTime = media.currentTime || 0;
    } else {
      m = document.createElement("img");
      m.src = media.currentSrc || media.src;
      m.alt = media.alt;
    }
    fig.replaceChildren(m);
    if (cap) {
      const c = document.createElement("figcaption");
      c.innerHTML = cap.innerHTML;
      c.style.fontStyle = getComputedStyle(cap).fontStyle; // gallery captions are upright, footnotes italic
      fig.append(c);
    }
    document.documentElement.classList.add("lb-open");
    dlg.showModal();
    if (m.tagName === "VIDEO") {
      m.muted = false; // the click that opened this counts as permission for sound
      m.play().catch(() => { m.muted = true; m.play().catch(() => {}); });
    }
  }

  window.openLightbox = lightbox;

  dlg.addEventListener("click", (e) => {
    if (e.target === dlg || e.target === fig || e.target.closest(".lb-close")) dlg.close();
  });
  dlg.addEventListener("close", () => {
    const v = fig.querySelector("video");
    if (v) v.pause();
    fig.replaceChildren();
    document.documentElement.classList.remove("lb-open");
  });
})();
