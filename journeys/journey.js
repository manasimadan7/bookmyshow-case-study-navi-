/* Journey stepper: host phone on the left, friend phone on the right, a story in the middle,
   step indicators + prev/next, and optional "What if…" scenarios that branch off the ideal user journey.
   window.createJourney(root, { scenarios, mount(hostSlot, friendSlot), render(step) }) */
(function () {
  function createJourney(root, cfg) {
    var q = function (s) { return root.querySelector(s); };
    var el = {
      chips: q('.j-chips'), tag: q('.j-tag'), dots: q('.j-dots'), count: q('.j-count'), title: q('.j-title'),
      host: q('.j-host-txt'), friend: q('.j-friend-txt'), friendLabel: q('.j-label.friend'),
      prev: q('.j-prev'), next: q('.j-next')
    };
    cfg.mount(q('[data-phone="host"]'), q('[data-phone="friend"]'));

    var sc = 0, cur = 0;
    var scenarios = cfg.scenarios;

    // scenario chips: first one is the ideal user journey, the rest are "What if…" branches
    if (el.chips) {
      var whatIf = cfg.whatIf !== false;   // false: plain pills, no "What if…" label or main chip
      el.chips.innerHTML = scenarios.map(function (s, i) {
        return (whatIf && i === 1 ? '<span class="j-chips-label">What if…</span>' : '') +
          '<button type="button" class="j-chip' + (whatIf && i === 0 ? ' main' : '') + '" data-s="' + i + '" aria-pressed="false">' + s.chip + '</button>';
      }).join('');
      el.chips.addEventListener('click', function (e) {
        var b = e.target.closest('.j-chip'); if (b) { sc = +b.dataset.s; cur = 0; buildDots(); render(); }
      });
    }

    function buildDots() {
      el.dots.innerHTML = scenarios[sc].steps.map(function (s, i) {
        return '<button type="button" class="j-dot" role="tab" aria-label="Step ' + (i + 1) + ': ' + s.title + '" data-i="' + i + '"><span></span></button>';
      }).join('');
    }

    // ---- tap hints: a finger pulses on whatever gets tapped to reach the next step ----
    // step.tap = [['host'|'friend', cssSelector], ...] or a function returning that list
    var TAP_CSS = '.tap-hint{position:absolute;z-index:80;width:0;height:0;pointer-events:none}' +
      '.tap-hint .ring{position:absolute;left:-22px;top:-22px;width:44px;height:44px;border-radius:50%;background:rgba(232,53,77,.28);border:2px solid rgba(232,53,77,.9);animation:tapRing 1.5s ease-out infinite}' +
      '.tap-hint .dot{position:absolute;left:-7px;top:-7px;width:14px;height:14px;border-radius:50%;background:rgba(232,53,77,.85);box-shadow:0 0 0 3px #fff;animation:tapDot 1.5s ease-in-out infinite}' +
      '.tap-hint svg{position:absolute;left:-22px;top:-11.5px;width:46px;height:46px;filter:drop-shadow(0 3px 4px rgba(0,0,0,.35));animation:tapFinger 1.5s ease-in-out infinite;transform-origin:22px 11.5px}' +
      '@keyframes tapRing{0%,30%{transform:scale(.4);opacity:0}40%{opacity:1}100%{transform:scale(1.7);opacity:0}}' +
      '@keyframes tapDot{0%,25%{transform:scale(0)}35%{transform:scale(1)}70%,100%{transform:scale(0)}}' +
      '@keyframes tapFinger{0%{transform:translate(10px,14px)}30%{transform:translate(0,0) scale(.9)}45%{transform:translate(0,0) scale(1)}100%{transform:translate(10px,14px)}}' +
      // drag variant: press on the handle, slide to the drop target (--dx/--dy), let go
      '.tap-hint.drag .ring{display:none}' +
      '.tap-hint.drag .dot,.tap-hint.drag svg{animation-duration:2.2s;animation-timing-function:ease-in-out}' +
      '.tap-hint.drag .dot{animation-name:dragDot}.tap-hint.drag svg{animation-name:dragFinger}' +
      '.tap-hint .trail{position:absolute;left:0;top:0;height:3px;width:var(--len);transform-origin:0 50%;transform:rotate(var(--ang));background:repeating-linear-gradient(90deg,rgba(232,53,77,.8) 0 6px,transparent 6px 11px);border-radius:2px;margin-top:-1.5px;animation:dragTrail 2.2s ease-in-out infinite}' +
      '@keyframes dragFinger{0%{transform:translate(10px,14px);opacity:0}12%{transform:translate(0,0) scale(.9);opacity:1}62%{transform:translate(var(--dx),var(--dy)) scale(.9);opacity:1}75%{transform:translate(var(--dx),var(--dy)) scale(1);opacity:1}100%{transform:translate(var(--dx),var(--dy)) scale(1);opacity:0}}' +
      '@keyframes dragDot{0%,10%{transform:translate(0,0) scale(0)}16%{transform:translate(0,0) scale(1)}62%{transform:translate(var(--dx),var(--dy)) scale(1)}74%,100%{transform:translate(var(--dx),var(--dy)) scale(0)}}' +
      '@keyframes dragTrail{0%,12%{opacity:0;clip-path:inset(0 100% 0 0)}62%{opacity:1;clip-path:inset(0 0 0 0)}85%,100%{opacity:0;clip-path:inset(0 0 0 0)}}' +
      '@media (prefers-reduced-motion:reduce){.tap-hint *{animation:none!important}}';
    var FINGER = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" stroke="#1e1e1e" stroke-width="1.1" stroke-linejoin="round" d="M10 7.5c0-.83.67-1.5 1.5-1.5S13 6.67 13 7.5v6h1.76c.19 0 .37.04.54.11l4.54 2.26c.53.22.91.76.91 1.38 0 .06-.01.13-.02.2l-.75 5.27c-.11.73-.69 1.28-1.44 1.28h-6.79c-.41 0-.79-.17-1.06-.44l-4.94-4.94.79-.8c.2-.2.48-.33.79-.33.09 0 .16.02.24.03l3.43.72V7.5z"/></svg>';
    var tapTimer = null;
    function placeTaps(st) {
      clearTimeout(tapTimer);
      var roots = cfg.roots ? cfg.roots() : null;
      if (!roots) return;
      ['host', 'friend'].forEach(function (k) {
        var r = roots[k]; if (!r) return;
        if (!r.querySelector('style[data-tap]')) { var s = document.createElement('style'); s.setAttribute('data-tap', ''); s.textContent = TAP_CSS; r.appendChild(s); }
        Array.prototype.forEach.call(r.querySelectorAll('.tap-hint'), function (n) { n.remove(); });
      });
      var list = typeof st.tap === 'function' ? st.tap() : st.tap;
      if (!list || !list.length) return;
      // wait for the prototype's slide-in animations to settle before measuring
      tapTimer = setTimeout(function () {
        // layout position inside the phone (ignores slide-in transforms, so it's right even mid-animation)
        function pos(phone, el) {
          if (!el || !el.offsetWidth) return null;
          var x = el.offsetWidth / 2, y = el.offsetHeight / 2, n = el;
          while (n && n !== phone) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
          if (n !== phone) return null;
          for (var p = el.parentElement; p && p !== phone; p = p.parentElement) { x -= p.scrollLeft; y -= p.scrollTop; }
          return { x: x, y: y };
        }
        list.forEach(function (t) {
          var r = roots[t[0]]; if (!r) return;
          var phone = r.querySelector('.phone'); if (!phone) return;
          var at = pos(phone, r.querySelector(t[1])); if (!at) return;
          var x = at.x, y = at.y;
          var to = t[2] && t[2].dragTo ? pos(phone, r.querySelector(t[2].dragTo)) : null;
          if (y < 0 || y > phone.clientHeight || x < 0 || x > phone.clientWidth) return;   // scrolled out of view
          var hint = document.createElement('div');
          hint.className = 'tap-hint' + (to ? ' drag' : '');
          hint.style.left = x + 'px'; hint.style.top = y + 'px';
          var trail = '';
          if (to) {
            var dx = to.x - x, dy = to.y - y;
            hint.style.setProperty('--dx', dx + 'px'); hint.style.setProperty('--dy', dy + 'px');
            hint.style.setProperty('--len', Math.hypot(dx, dy) + 'px');
            hint.style.setProperty('--ang', Math.atan2(dy, dx) + 'rad');
            trail = '<span class="trail"></span>';
          }
          hint.innerHTML = trail + '<span class="ring"></span><span class="dot"></span>' + FINGER;
          phone.appendChild(hint);
        });
      }, 450);
    }

    function render() {
      var S = scenarios[sc], st = S.steps[cur];
      cfg.render(st);
      if (st.after) st.after();          // journey-only additions layered on the prototype screens
      placeTaps(st);
      if (el.tag) { el.tag.textContent = S.tag || ''; el.tag.hidden = !S.tag; }
      el.count.textContent = 'Step ' + (cur + 1) + ' of ' + S.steps.length;
      el.title.textContent = st.title;
      el.host.textContent = st.host;
      if (el.friend) el.friend.textContent = st.friend || '';
      if (el.friendLabel) el.friendLabel.textContent = 'Friend (' + (st.friendName || S.friendName || 'Aditi') + ')';
      el.prev.disabled = cur === 0;
      el.next.disabled = cur === S.steps.length - 1;
      Array.prototype.forEach.call(el.dots.children, function (d, i) {
        d.classList.toggle('on', i === cur); d.classList.toggle('done', i < cur);
        d.setAttribute('aria-selected', i === cur ? 'true' : 'false');
      });
      if (el.chips) Array.prototype.forEach.call(el.chips.querySelectorAll('.j-chip'), function (c) {
        var on = +c.dataset.s === sc; c.classList.toggle('on', on); c.setAttribute('aria-pressed', on ? 'true' : 'false');
        // keep the active chip visible when the row scrolls sideways (mobile)
        if (on && el.chips.scrollWidth > el.chips.clientWidth) {
          var left = c.offsetLeft - el.chips.offsetLeft, right = left + c.offsetWidth;
          if (left < el.chips.scrollLeft || right > el.chips.scrollLeft + el.chips.clientWidth) el.chips.scrollLeft = left - 16;
        }
      });
    }
    function go(i) { cur = Math.max(0, Math.min(scenarios[sc].steps.length - 1, i)); render(); }

    el.prev.addEventListener('click', function () { go(cur - 1); });
    el.next.addEventListener('click', function () { go(cur + 1); });
    el.dots.addEventListener('click', function (e) { var b = e.target.closest('.j-dot'); if (b) go(+b.dataset.i); });

    // arrow keys move through the journey that is most on screen
    var ratio = 0;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { ratio = es[0].intersectionRatio; }, { threshold: [0, 0.25, 0.5, 0.75, 1] }).observe(root);
    }
    document.addEventListener('keydown', function (e) {
      if (ratio < 0.25 || e.altKey || e.ctrlKey || e.metaKey) return;
      var t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      if (e.key === 'ArrowRight') { go(cur + 1); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { go(cur - 1); e.preventDefault(); }
    });

    buildDots(); render();
  }
  window.createJourney = createJourney;

  /* ---- Journey-only additions (not in the prototypes): a failed payer can tell the host,
     and the host can pay that share. Built from the prototypes' own classes (.btn, .dialog, .tick…)
     so they read as part of the same UI. ---- */
  var SB = '<div class="sb"><span>4:02 PM</span><span>5G ▮▮▮ 54%</span></div>';
  var ICON = {
    bell: '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/></svg>',
    check: '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    alert: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#e8354d" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 7v6M12 17h0"/></svg>'
  };
  window.JourneyExtras = {
    // adds "Let <host> know" under the prototype's Retry / Use different app buttons
    tellHostButton: function (friendRoot, host) {
      var anchor = friendRoot.querySelector('[data-act="fBackPrompt"]');
      if (!anchor || friendRoot.querySelector('[data-act="fTellHost"]')) return;
      var b = document.createElement('button');
      b.className = 'btn ghost block'; b.setAttribute('data-act', 'fTellHost'); b.style.marginTop = '8px';
      b.textContent = 'Let ' + host + ' know I can’t pay';
      anchor.parentNode.insertBefore(b, anchor.nextSibling);
    },
    // friend: request sent to the host
    friendToldHost: function (friendRoot, host, amount) {
      friendRoot.querySelector('.phone').innerHTML = SB + '<div class="screen"><div class="center">' +
        '<div class="tick amber">' + ICON.bell + '</div>' +
        '<div style="font-size:20px;font-weight:700">' + host + ' has been told</div>' +
        '<div class="mut" style="margin:8px 12px 16px;line-height:1.5">Your ' + amount + ' didn’t go through. ' + host + ' can pay your share to keep your seat, and you settle up later.</div>' +
        '<div class="mut" style="font-size:12px">Your seat is still held while ' + host + ' decides.</div></div></div>';
    },
    // host: dialog over the waiting screen offering to pay the failed share
    hostPayForDialog: function (hostRoot, name, amount) {
      var screen = hostRoot.querySelector('.phone > .screen'); if (!screen) return;
      var d = document.createElement('div');
      d.innerHTML = '<div class="scrim" style="z-index:29"></div><div class="dialog" style="z-index:30">' +
        '<div style="width:56px;height:56px;border-radius:50%;background:#fdecea;display:grid;place-items:center;margin:0 auto 4px">' + ICON.alert + '</div>' +
        '<h4>' + name + '’s payment didn’t go through</h4>' +
        '<p>Her bank declined ' + amount + '. Pay her share now to keep everyone’s seats, and settle up with her later.</p>' +
        '<button class="btn block" data-act="hostPayFor">Pay ' + amount + ' for ' + name + '</button>' +
        '<button class="btn grey block" style="margin-top:8px">Give her a minute</button></div>';
      while (d.firstChild) screen.appendChild(d.firstChild);
    },
    // host: on the UPI sheet, say whose share is being paid
    hostPayingFor: function (hostRoot, name) {
      var t = hostRoot.querySelector('.sheet .mt'); if (!t) return;
      var note = document.createElement('div'); note.className = 'mut'; note.style.marginBottom = '2px';
      note.textContent = 'Covering ' + name + '’s share. She can pay you back later.';
      t.parentNode.insertBefore(note, t.nextSibling);
    },
    // friend: the host covered them
    friendCoveredByHost: function (friendRoot, host, amount) {
      friendRoot.querySelector('.phone').innerHTML = SB + '<div class="screen"><div class="center">' +
        '<div class="tick">' + ICON.check + '</div>' +
        '<div style="font-size:20px;font-weight:700">' + host + ' paid for you</div>' +
        '<div class="mut" style="margin:8px 12px 0;line-height:1.5">Your seat is safe. You owe ' + host + ' ' + amount + '. Pay her back whenever you’re ready.</div></div></div>';
    }
  };
})();
