/* Motion layer: arrows that flow toward their target, section cross-fade on scroll,
   and the brand-value cards (triangles line up, rectangles melt into a fluid circle, blocks become stairs).
   Everything is skipped for people who ask for reduced motion. */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  var stage = document.getElementById('stage');

  /* ---------- 1. Arrows: a brightness wave travels dash by dash toward the arrowhead ----------
     The Figma arrows are many small filled dash shapes in one path, so each dash becomes its own
     <path> and gets a staggered animation-delay ordered from tail to head. */
  var WAVE_MS = 2600;
  function animateArrow(img) {
    var target = img.dataset.arrow.split(',').map(Number);
    fetch(img.getAttribute('src')).then(function (r) { return r.text(); }).then(function (txt) {
      var doc = new DOMParser().parseFromString(txt, 'image/svg+xml');
      var svg = doc.documentElement, src = svg.querySelector('path');
      if (!src) return;
      svg = document.importNode(svg, true); src = svg.querySelector('path');
      var ink = (src.getAttribute('fill') || '').toLowerCase();
      svg.setAttribute('class', 'arrow-svg ' + (ink === 'black' || ink === '#000' || ink === '#000000' ? 'arrow-ink' : 'arrow-red'));
      svg.removeAttribute('style');
      svg.setAttribute('width', '100%'); svg.setAttribute('height', '100%');
      var pieces = (src.getAttribute('d').match(/M[^M]*/g) || []);
      var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      pieces.forEach(function (d) { var p = src.cloneNode(false); p.removeAttribute('id'); p.setAttribute('d', d); g.appendChild(p); });
      src.parentNode.replaceChild(g, src);
      img.replaceWith(svg);

      // dashes are the small pieces; bigger ones (arrowhead strokes) stay solid
      var dashes = [];
      Array.prototype.forEach.call(g.children, function (p) {
        var b = p.getBBox();
        if (Math.max(b.width, b.height) < 16) dashes.push({ el: p, x: b.x + b.width / 2, y: b.y + b.height / 2 });
        else p.classList.add('arrow-solid');
      });
      if (dashes.length < 3) return;
      var dist = function (d) { return Math.hypot(d.x - target[0], d.y - target[1]); };
      if (dist(dashes[0]) < dist(dashes[dashes.length - 1])) dashes.reverse();   // tail first, head last
      dashes.forEach(function (d, i) {
        d.el.classList.add('arrow-dash');
        d.el.style.animationDelay = Math.round((i / dashes.length) * WAVE_MS - WAVE_MS) + 'ms';
      });
      svg.style.setProperty('--wave', WAVE_MS + 'ms');
    }).catch(function () { /* keep the static arrow */ });
  }
  Array.prototype.forEach.call(document.querySelectorAll('img[data-arrow]'), animateArrow);

  /* ---------- 2. Sections: bouncy entrance from below, scroll-linked fade as they leave the top ----------
     Entering: once a section's top passes 88% of the viewport it springs into place (CSS transition with
     overshoot, see .fade-part / .is-in). It re-arms when the section drops fully below the viewport again. */
  var parts = Array.prototype.slice.call(document.querySelectorAll('#stage > .frame, #stage > .a'));
  parts.forEach(function (el) { el.classList.add('fade-part'); });
  var ticking = false;
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function fade() {
    ticking = false;
    var vh = window.innerHeight;
    parts.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.88) el.classList.add('is-in');          // spring in
      else if (r.top > vh) el.classList.remove('is-in');         // re-arm once it's back below the fold
      if (r.bottom < -200 || r.top > vh + 200) { el.style.opacity = 0; return; }
      var pin = clamp((vh - r.top) / (vh * 0.22));          // quick fade in as it arrives
      var pout = clamp(r.bottom / (vh * 0.3));             // fading out as its bottom leaves the top 30%
      el.style.opacity = Math.min(pin, pout).toFixed(3);
    });
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(fade); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  fade();

  /* ---------- 3. Brand-value cards ---------- */
  var KEYS = ['left', 'top', 'width', 'height'];
  function shapes(card) { return Array.prototype.slice.call(card.querySelectorAll('[data-to]')); }
  Array.prototype.forEach.call(document.querySelectorAll('.card[data-anim]'), function (card) {
    shapes(card).forEach(function (el, i) {
      el._from = KEYS.map(function (k) { return el.style[k]; });
      el._to = el.dataset.to.split(',').map(function (v) { return v + 'px'; });
      el.style.transitionDelay = (i * 90) + 'ms';
    });
  });
  function play(card, on) {
    clearTimeout(card._t);
    card.classList.toggle('is-on', on);
    if (!on) card.classList.remove('is-settled');
    shapes(card).forEach(function (el) {
      var v = on ? el._to : el._from;
      KEYS.forEach(function (k, i) { if (v[i]) el.style[k] = v[i]; });
    });
    if (on) card._t = setTimeout(function () { card.classList.add('is-settled'); }, 1300);   // start the fluid morph
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var card = e.target;
        if (e.intersectionRatio >= 0.6) { clearTimeout(card._d); card._d = setTimeout(function () { play(card, true); }, 250); }
        else if (e.intersectionRatio < 0.2) { clearTimeout(card._d); play(card, false); }
      });
    }, { threshold: [0, 0.2, 0.6, 1] });
    Array.prototype.forEach.call(document.querySelectorAll('.card[data-anim]'), function (c) { io.observe(c); });
  }
})();
