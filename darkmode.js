/* Dark mode from "Building user journeys" onward: a dark circle grows behind the page as that
   section scrolls in, and once it covers the screen the page switches its colours (body.is-dark).
   Scrolling back up shrinks the circle and returns to light. */
(function () {
  var gap = document.querySelector('.dark-gap');   // the blank stretch before "Building user journeys"
  if (!gap) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var bg = document.createElement('div');
  bg.className = 'dark-reveal';
  bg.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(bg, document.body.firstChild);

  var ticking = false;
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function update() {
    ticking = false;
    var vw = window.innerWidth, vh = window.innerHeight;
    var r = gap.getBoundingClientRect();
    // 0 when the gap's top reaches the middle of the screen (the previous section is leaving),
    // 1 once 65% of the gap has scrolled past that point, i.e. the circle blows up over empty space
    var p = clamp((vh * 0.5 - r.top) / (r.height * 0.65));
    if (reduce) p = p > 0.5 ? 1 : 0;
    var full = Math.hypot(vw, vh) / 2 + 40;                 // radius that covers the whole screen from its centre
    var eased = p * p * (3 - 2 * p);                         // smoothstep
    bg.style.clipPath = 'circle(' + (eased * full).toFixed(1) + 'px at 50% 55%)';
    document.body.classList.toggle('is-dark', p > 0.75);
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();
