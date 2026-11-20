// Scales the 1728px Figma artboard to the viewport (>= 900px), and on smaller
// screens scales the collage blocks ([data-fit]) to the column width.
(function () {
  var ARTBOARD = 1728;
  var BREAKPOINT = 900;
  var stage = document.getElementById('stage');
  var fits = Array.prototype.slice.call(document.querySelectorAll('[data-fit]'));

  // Lock each collage block to its designed size (inline !important beats the mobile reset).
  fits.forEach(function (el) {
    el.style.setProperty('width', el.style.width, 'important');
    el.style.setProperty('height', el.style.height, 'important');
    el._w = parseFloat(el.style.width);
  });

  function contentWidth(el) {
    var cs = getComputedStyle(el);
    return el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  }

  function layout() {
    var vw = document.documentElement.clientWidth;
    if (vw >= BREAKPOINT) {
      stage.style.zoom = Math.min(1, vw / ARTBOARD);
      fits.forEach(function (el) { el.style.zoom = ''; });
    } else {
      stage.style.zoom = '';
      fits.forEach(function (el) {
        el.style.zoom = Math.min(1, contentWidth(el.parentElement) / el._w);
      });
    }
  }

  layout();
  window.addEventListener('resize', layout);
})();
