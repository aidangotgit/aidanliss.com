/* Route map: shows the empty start frame, then plays the GIF once the map is
   mostly on screen, so readers see the ride from Washington, D.C. onward.
   With reduced motion, shows the finished map instead. */
(() => {
  const img = document.querySelector("img[data-anim]");
  if (!img) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    img.src = img.dataset.end;
    return;
  }
  if (!("IntersectionObserver" in window)) {
    img.src = img.dataset.anim;
    return;
  }
  const io = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    io.disconnect();
    img.src = img.dataset.anim;
  }, { threshold: 0.6 });
  io.observe(img);
})();
