/* Dark mode for the solutions part of the page: a dark circle blows up behind the page in the blank gap
   before "Building user journeys", and zooms back out in the blank gap after user testing, so the closing
   trade-off section is light again. Both are tied to scroll position, so scrolling back up reverses them. */
(function () {
  var gapIn = document.querySelector('.dark-gap:not(.dark-gap-out)');
  var gapOut = document.querySelector('.dark-gap-out');
  if (!gapIn) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var bg = document.createElement('div');
  bg.className = 'dark-reveal';
  bg.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(bg, document.body.firstChild);

  var ticking = false;
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ease(p) { return p * p * (3 - 2 * p); }        // smoothstep
  // 0 when the gap's top reaches the middle of the screen, 1 once 65% of the gap has scrolled past that point
  function through(gap, vh) { var r = gap.getBoundingClientRect(); return clamp((vh * 0.5 - r.top) / (r.height * 0.65)); }
  function update() {
    ticking = false;
    var vw = window.innerWidth, vh = window.innerHeight;
    var pin = through(gapIn, vh), pout = gapOut ? through(gapOut, vh) : 0;
    if (reduce) { pin = pin > 0.5 ? 1 : 0; pout = pout > 0.5 ? 1 : 0; }
    var full = Math.hypot(vw, vh) / 2 + 40;                 // radius that covers the whole screen from its centre
    var r = full * ease(pin) * (1 - ease(pout));
    bg.style.clipPath = 'circle(' + r.toFixed(1) + 'px at 50% 55%)';
    document.body.classList.toggle('is-dark', pin > 0.75 && pout < 0.25);
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();
