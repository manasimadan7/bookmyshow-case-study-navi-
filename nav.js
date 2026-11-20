/* Page contents indicator: one entry per section with data-toc, the current one highlighted,
   plus a thin reading-progress bar. Clicking an entry scrolls to that section. */
(function () {
  var nav = document.querySelector('.toc');
  if (!nav) return;
  var list = nav.querySelector('.toc-list');
  var bar = nav.querySelector('.toc-progress i');
  var sections = Array.prototype.slice.call(document.querySelectorAll('[data-toc]'));

  list.innerHTML = sections.map(function (s, i) {
    return '<li><a href="#" data-i="' + i + '"><span class="toc-n">' + String(i + 1).padStart(2, '0') + '</span>' + s.dataset.toc + '</a></li>';
  }).join('');
  var links = Array.prototype.slice.call(list.querySelectorAll('a'));

  function top(el) { return el.getBoundingClientRect().top + window.scrollY; }
  list.addEventListener('click', function (e) {
    var a = e.target.closest('a'); if (!a) return;
    e.preventDefault();
    var y = top(sections[+a.dataset.i]) - nav.offsetHeight - 16;
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
  });

  var current = -1, ticking = false;
  function update() {
    ticking = false;
    var line = window.innerHeight * 0.4, idx = 0;
    sections.forEach(function (s, i) { if (s.getBoundingClientRect().top <= line) idx = i; });
    var max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ')';
    if (idx === current) return;
    current = idx;
    links.forEach(function (a, i) {
      a.classList.toggle('on', i === idx);
      if (i === idx) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
    // keep the active entry visible when the list scrolls sideways (narrow screens)
    var a = links[idx];
    if (list.scrollWidth > list.clientWidth) list.scrollTo({ left: a.offsetLeft - (list.clientWidth - a.offsetWidth) / 2, behavior: 'smooth' });
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();
