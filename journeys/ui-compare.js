/* "Improving the UI": before/after pairs for two screens, both inside BookMyShow.
   Before = rendered by Prototype 1's own code (proto1-screens.js).
   After  = the Figma redesigns: Split Payment widget (nodes 35:517 → 35:543 → 36:1218) placed in
            Prototype 1's checkout, and the host waiting screen (node 36:1269).
   Each phone sits in its own shadow root. */
(function () {
  var P = window.Proto1;
  var slots = document.querySelectorAll('[data-ui]');
  if (!P || !slots.length) return;

  var MIN = 60 * 1000;
  var GANG = ['Aditi Rao', 'Kabir Shah', 'Sneha Iyer', 'Vikram Nair'];
  var A = 'assets/';

  // ---------- after: Split Payment widget (three Figma states, cycles on its own and on tap) ----------
  var CONTACTS = ['Shanaya', 'Preeti', 'Aaryan Malik', 'Shanaya'];
  var ROW_TOP = [18, 62, 106, 146];
  var widget = '<div class="sp" data-state="closed">' +
      '<div class="sp-icon"><span class="ta"><img src="' + A + 'ui-ticket-a.svg" alt=""></span><span class="tb"><img src="' + A + 'ui-ticket-b.svg" alt=""></span></div>' +
      '<p class="sp-t">Split Payment</p><p class="sp-s">Let your friends pre-pay in real time</p>' +
      '<div class="sp-search"><img src="' + A + 'ui-search.svg" alt=""><span>Search</span></div>' +
      '<div class="sp-list">' + CONTACTS.map(function (n, i) {
        return '<p class="nm" style="top:' + ROW_TOP[i] + 'px">' + n + '</p><p class="ph" style="top:' + (ROW_TOP[i] + 13) + 'px">91 9898989989</p>' +
          '<span class="add' + (i === 0 ? ' first' : '') + '" style="top:' + (ROW_TOP[i] + 4) + 'px">Add</span>';
      }).join('') + '<img class="ok" src="' + A + 'ui-check.svg" alt="">' +
      '</div>' +
    '</div>';

  // ---------- after: host waiting screen (Figma 36:1269, 440×956) ----------
  var PARTY = [['Priya', '1 ticket', 'Confirmed'], ['Ravi', '2 tickets', 'Confirmed'], ['Ananya', '3 tickets', 'Pending'],
               ['Arjun', '4 tickets', 'Pending'], ['Divya', '5 tickets', 'Pending'], ['Rohan', '6 tickets', 'Pending']];
  var waitingAfter = '<div class="bw-scroll"><div class="bw">' +
      '<div class="bw-top"></div>' +
      '<img class="bw-card" src="' + A + 'ui-ticket-card.svg" alt="">' +
      '<img class="bw-perf" src="' + A + 'ui-perf.svg" alt="">' +
      '<p class="t8" style="top:66px">STARLIGHT CINEMA</p>' +
      '<p class="t21">MIDNIGHT<br>ORBIT</p>' +
      '<p class="t7 sb" style="top:145px">LOCATION</p>' +
      '<p class="t9" style="top:158px">Downtown · Screen 02</p>' +
      '<p class="t7 md" style="top:178px">STANDARD ADMISSION</p>' +
      '<p class="t7 sb" style="top:209px">SEAT</p>' +
      '<p class="t15">A01-11</p>' +
      '<p class="t7 sb" style="top:209px;left:130px">TICKETs</p>' +
      '<p class="t9 sb" style="top:225px;left:139px">10</p>' +
      '<img class="bw-arc" src="' + A + 'ui-ring-arc.svg" alt="">' +
      '<img class="bw-ring" src="' + A + 'ui-ring-inner.svg" alt="">' +
      '<p class="bw-time">09:07</p><p class="bw-left">Left</p>' +
      '<p class="bw-h">Party Invites</p>' +
      '<p class="t9 sb" style="top:343px;left:380px">4/10</p>' +
      '<img class="bw-dots" src="' + A + 'ui-dots.svg" alt="">' +
      PARTY.map(function (p, i) {
        return '<div class="bw-row" style="top:' + (425 + 84 * i) + 'px"><div class="l"><span class="n">' + p[0] + '</span><span class="pill">' + p[1] + '</span></div>' +
          '<div class="r"><span class="b nudge">Nudge</span><span class="b ' + (p[2] === 'Confirmed' ? 'yes' : 'wait') + '">' + p[2] + '</span></div></div>';
      }).join('') +
    '</div></div>';

  // ---------- Prototype 1 states ----------
  function S() { return P.S; }
  function gang() { GANG.forEach(function (n) { var c = P.CONTACTS.find(function (x) { return x.name === n; }); P.addFriend(n, c.phone); }); }
  function sent() { P.fresh(); gang(); var s = S(); s.phase = 'sent'; s.payMode = 'split'; s.deadline = Date.now() + 6 * MIN + 10000; P.sendRequests(); s.hostScreen = 'waiting'; }
  function fr(first) { return S().friends.find(function (f) { return f.name.indexOf(first) === 0; }); }
  var BEFORE = {
    checkout: { setup: function () { P.fresh(); gang(); var s = S(); s.hostScreen = 'confirm'; s.splitOpen = true; }, scrollTo: '.splitw' },
    waiting: { setup: function () { sent(); fr('Kabir').stage = 'paid'; fr('Aditi').stage = 'chooser'; } }
  };

  function offTop(el, stop) { var t = 0; while (el && el !== stop) { t += el.offsetTop; el = el.offsetParent; } return t; }
  function mount(slot) {
    var sr = slot.attachShadow({ mode: 'open' });
    sr.innerHTML = '<link rel="stylesheet" href="journeys/proto1.css"><link rel="stylesheet" href="journeys/ui-after.css"><div class="phone" id="host"></div>';
    return sr;
  }
  function renderProto(root, setup) {
    var saved = { host: P.ROOTS.host, friend: P.ROOTS.friend };
    P.ROOTS.host = root; P.ROOTS.friend = null;
    try { setup(); P.renderHost(); }
    finally { P.ROOTS.host = saved.host; P.ROOTS.friend = saved.friend; }
  }
  function scrollToEl(root, sel) {   // once the shadow stylesheets have laid the screen out
    var go = function () { var hs = root.querySelector('.scroll'), t = root.querySelector(sel); if (hs && t) hs.scrollTop = offTop(t, hs.offsetParent) - offTop(hs, hs.offsetParent) - 12; };
    root.querySelector('link').addEventListener('load', function () { setTimeout(go, 50); });
    setTimeout(go, 800);
  }

  // closed → open → picked, on a loop while visible; a tap moves it on a step
  function runWidget(sp) {
    var ORDER = ['closed', 'open', 'picked'], i = 0, timer = null, seen = false;
    function reveal() {   // keep the whole widget in view as it grows
      var hs = sp.getRootNode().querySelector('.scroll'); if (!hs) return;
      var top = offTop(sp, hs.offsetParent) - offTop(hs, hs.offsetParent);
      hs.scrollTo({ top: Math.max(0, top + sp.offsetHeight - hs.clientHeight + 12), behavior: 'smooth' });
    }
    function step() { i = (i + 1) % ORDER.length; sp.dataset.state = ORDER[i]; setTimeout(reveal, 470); }
    function loop() { clearInterval(timer); timer = setInterval(step, 2200); }
    sp.addEventListener('click', function () { step(); loop(); });
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting && !seen) { seen = true; loop(); } else if (!e.isIntersecting && seen) { seen = false; clearInterval(timer); } });
    }).observe(sp.getRootNode().host);
  }

  Array.prototype.forEach.call(slots, function (slot) {
    var key = slot.dataset.ui.split('-'), screen = key[0], side = key[1];
    var root = mount(slot), b = BEFORE[screen];
    if (side === 'before') {
      renderProto(root, b.setup);
      if (screen === 'checkout') {   // just Prototype 1's split widget, on its own
        var old = root.querySelector('.splitw');
        root.innerHTML = '<link rel="stylesheet" href="journeys/proto1.css"><link rel="stylesheet" href="journeys/ui-after.css">' +
          '<div class="sp-solo before">' + (old ? old.outerHTML : '') + '</div>';
        return;
      }
      if (b.scrollTo) scrollToEl(root, b.scrollTo);
      return;
    }
    if (screen === 'waiting') {
      root.querySelector('.phone').innerHTML = waitingAfter;
      return;
    }
    // checkout after: just the new widget, on its own
    root.innerHTML = '<link rel="stylesheet" href="journeys/ui-after.css"><div class="sp-solo">' + widget + '</div>';
    runWidget(root.querySelector('.sp'));
  });
})();
