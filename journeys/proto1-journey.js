/* User journey 02 — Prototype 1 (inline checkout, no WhatsApp): ideal user journey + "What if…" branches.
   Each step puts the prototype into a fixed state; screens come from proto1-screens.js. */
(function () {
  var P = window.Proto1, X = window.JourneyExtras;
  var root = document.querySelector('[data-journey="proto1"]');
  if (!P || !root || !window.createJourney) return;

  // ---------- state helpers ----------
  var MIN = 60 * 1000, SEC = 1000;
  var GANG = ['Aditi Rao', 'Kabir Shah', 'Sneha Iyer', 'Vikram Nair'];
  function S() { return P.S; }
  function base() { P.fresh(); }
  var STRANGER = '+91 98765 43210';           // a mistyped number that isn't in Manasi's contacts
  function addGang(customKabir, names) {
    (names || GANG).forEach(function (n) {
      var c = P.CONTACTS.find(function (x) { return x.name === n; });
      if (c) P.addFriend(n, c.phone); else P.addFriend(n, n.replace('+91 ', ''));
    });
    if (customKabir) {                       // Kabir skipped snacks: host lowers his share and absorbs the rest
      var k = fr('Kabir'); k.share = 50000; k._custom = true;
      S().hostShare = P.MOVIE.total - S().friends.reduce(function (a, f) { return a + f.share; }, 0);
    }
  }
  function checkout(opts) { base(); var s = S(); s.hostScreen = 'confirm'; s.splitOpen = !!opts.open; if (opts.friends) addGang(opts.custom, opts.names); }
  function sent(msLeft, custom, names) {      // host paid her share, requests are out
    base(); addGang(custom, names); var s = S();
    s.phase = 'sent'; s.payMode = 'split'; s.deadline = Date.now() + msLeft; P.sendRequests(); s.hostScreen = 'waiting';
  }
  function fr(first) { return S().friends.find(function (f) { return f.name.indexOf(first) === 0; }); }
  function paid() { for (var i = 0; i < arguments.length; i++) fr(arguments[i]).stage = 'paid'; }
  function follow(first) { S().active = fr(first).id; }
  function cover(payer, who) { var p = fr(payer), c = fr(who); p.covers = [c.id]; c.coveredBy = p.id; }
  function confirmAll() { var s = S(); s.friends.forEach(function (f) { f.stage = 'paid'; }); s.phase = 'confirmed'; s.hostScreen = 'confirmed'; }

  // ---------- scenarios ----------
  var ideal = {
    chip: 'Ideal user journey', friendName: 'Aditi',
    steps: [
      { title: 'Manasi picks seats for the gang',
        host: 'Same start: 10 premium seats for Ramayana, with seats held by other split groups marked Pending.',
        friend: 'Aditi’s phone is idle. No group chat involved this time.',
        friendView: 'blank', setup: function () { base(); S().hostScreen = 'seats'; } },
      { title: 'Split Payment, right where she pays',
        host: 'The split lives inside checkout as a collapsed card, sitting between the order total and the pay button.',
        friend: 'Nothing yet.',
        friendView: 'blank', scrollHost: '.splitw', setup: function () { checkout({}); } },
      { title: 'It opens in place, not in a new screen',
        host: 'Tapping it expands an inline widget: search contacts by name or number, with suggestions right below. No sheet, no context switch.',
        friend: 'Nothing yet.',
        friendView: 'blank', scrollHost: '.splitw', setup: function () { checkout({ open: true }); } },
      { title: 'Adding the gang from contacts',
        host: 'Four friends added. The bill splits five ways and Manasi, as organiser, absorbs the rounding.',
        friend: 'Still nothing. Requests only go out after Manasi pays.',
        friendView: 'blank', scrollHost: '.splitw', setup: function () { checkout({ open: true, friends: true }); } },
      { title: 'Amounts can be edited',
        host: 'Kabir skipped the snacks, so Manasi taps his amount and sets it to ₹500. Her own share goes up to cover the difference.',
        friend: 'This kind of tweak is what Prototype 3 deliberately leaves out.',
        friendView: 'blank', scrollHost: '.splitw', setup: function () { checkout({ open: true, friends: true, custom: true }); } },
      { title: 'Host pays her share first',
        host: 'Manasi pays only her part through UPI. Requests go out once it clears, and the 10-minute hold starts.',
        friend: 'Not sent yet.',
        friendView: 'blank', setup: function () { base(); addGang(true); var s = S(); s.hostScreen = 'pay'; s.payMode = 'split'; } },
      { title: 'A request, not a chat message',
        host: 'Manasi lands on a live tracker: everyone’s status, the money collected so far, and the hold countdown.',
        friend: 'Aditi gets a compact BookMyShow card over her lock screen: amount, show, seats and time left. Pay, or say “Not now”.',
        setup: function () { sent(9 * MIN + 40 * SEC, true); follow('Aditi'); } },
      { title: 'Full booking, one tap away',
        host: 'Nothing for Manasi to do.',
        friend: '“View full booking” opens the whole split: who owes what, who’s paid, and the order total. Everything is in the open.',
        setup: function () { sent(9 * MIN + 12 * SEC, true); follow('Aditi'); fr('Aditi').showDetails = true; } },
      { title: 'Paying with any UPI app',
        host: 'Aditi flips to “Paying…”.',
        friend: 'She picks Paytm, PhonePe, Google Pay or BHIM. BookMyShow doesn’t need a wallet of its own.',
        setup: function () { sent(8 * MIN + 30 * SEC, true); paid('Kabir'); follow('Aditi'); fr('Aditi').stage = 'chooser'; } },
      { title: 'UPI PIN, and done',
        host: 'Kabir has already paid his ₹500.',
        friend: 'A familiar PIN screen in her own UPI app.',
        setup: function () { sent(8 * MIN + 5 * SEC, true); paid('Kabir'); follow('Aditi'); var f = fr('Aditi'); f.stage = 'upi'; f.app = 'PhonePe'; f.pin = '12'; } },
      { title: 'Progress Manasi can see',
        host: '3 of 5 paid. The progress bar and amounts update without anyone posting screenshots.',
        friend: 'Paid. Aditi sees how many are left and how long the hold has.',
        setup: function () { sent(7 * MIN + 40 * SEC, true); paid('Kabir', 'Aditi'); follow('Aditi'); } },
      { title: 'Everyone’s in. Booking confirmed',
        host: 'Tickets confirmed, with a split summary that reflects Kabir’s custom amount.',
        friend: 'Aditi gets the confirmation. Nobody owes anybody.',
        setup: function () { sent(4 * MIN, true); follow('Aditi'); confirmAll(); } }
    ]
  };

  var fails = {
    chip: 'a friend’s payment fails?', tag: 'What if · a friend’s payment fails', friendName: 'Aditi',
    steps: [
      { title: 'Aditi enters her UPI PIN',
        host: 'Aditi shows as “Paying…”.',
        friend: 'She’s paying her share in PhonePe.',
        setup: function () { sent(7 * MIN + 30 * SEC); paid('Kabir'); follow('Aditi'); var f = fr('Aditi'); f.stage = 'upi'; f.app = 'PhonePe'; f.pin = '123'; } },
      { title: 'The bank declines it',
        host: 'Manasi doesn’t see the failure screen, and a declined charge doesn’t turn Aditi’s row red.',
        friend: 'Aditi can retry or switch UPI apps. If she simply can’t pay right now, there’s a new way out: let Manasi know.',
        setup: failedState(7 * MIN + 12 * SEC),
        after: function () { X.tellHostButton(P.ROOTS.friend, 'Manasi'); } },
      { title: 'Manasi is asked, not chased',
        host: 'A prompt on Manasi’s tracker: Aditi’s payment didn’t go through. She can pay Aditi’s share now, or give her a minute.',
        friend: 'Aditi is told Manasi knows, and that her seat stays held while Manasi decides.',
        setup: failedState(6 * MIN + 55 * SEC),
        after: function () { var amt = P.inr(fr('Aditi').share); X.hostPayForDialog(P.ROOTS.host, 'Aditi', amt); X.friendToldHost(P.ROOTS.friend, 'Manasi', amt); } },
      { title: 'Manasi pays Aditi’s share',
        host: 'The same UPI sheet she used for her own share, labelled as covering Aditi.',
        friend: 'Still waiting. Nothing for Aditi to do.',
        setup: function () { failedState(6 * MIN + 40 * SEC)(); var s = S(); s.hostScreen = 'pay'; s.payMode = 'single'; },
        after: function () { X.hostPayingFor(P.ROOTS.host, 'Aditi'); X.friendToldHost(P.ROOTS.friend, 'Manasi', P.inr(fr('Aditi').share)); } },
      { title: 'Seat saved, settle up later',
        host: 'Aditi’s row turns green and the booking stays on track. Manasi and Aditi settle up later with a normal UPI payback.',
        friend: 'Aditi sees that Manasi paid for her and exactly how much she owes.',
        setup: function () { sent(6 * MIN + 30 * SEC); paid('Kabir', 'Aditi'); follow('Aditi'); S().toast = 'You paid ' + P.inr(fr('Aditi').share) + ' for Aditi'; },
        after: function () { X.friendCoveredByHost(P.ROOTS.friend, 'Manasi', P.inr(fr('Aditi').share)); } }
    ]
  };
  function failedState(msLeft) {
    return function () { sent(msLeft); paid('Kabir'); follow('Aditi'); var f = fr('Aditi'); f.stage = 'failed'; f.app = 'PhonePe'; f.failCount = 1; f.failReason = 'Transaction declined by bank. Please try again.'; };
  }

  var notNow = {
    chip: 'someone says “Not now”?', tag: 'What if · someone can’t pay right now', friendName: 'Vikram',
    steps: [
      { title: 'Vikram gets the request',
        host: 'Kabir and Aditi have paid. Vikram and Sneha are still pending.',
        friend: 'The same compact card, with an honest way out: “Not now”.',
        setup: function () { sent(5 * MIN + 10 * SEC); paid('Kabir', 'Aditi'); follow('Vikram'); } },
      { title: 'He taps “Not now”',
        host: 'Vikram’s row turns red as Declined, with a Re-send button. Manasi knows right away instead of waiting on silence.',
        friend: 'Vikram sees that Manasi has been told he can’t pay right now. No awkward conversation needed.',
        setup: function () { sent(4 * MIN + 50 * SEC); paid('Kabir', 'Aditi'); follow('Vikram'); fr('Vikram').stage = 'declined'; } },
      { title: 'Sneha covers Vikram',
        host: 'Manasi taps + next to Sneha and adds Vikram. Declined friends can be covered, so his row folds into hers as 🎟 ×2.',
        friend: 'Sneha’s request now shows the combined amount and says it includes Vikram’s share.',
        friendName: 'Sneha',
        setup: function () { sent(4 * MIN + 20 * SEC); paid('Kabir', 'Aditi'); fr('Vikram').stage = 'declined'; cover('Sneha', 'Vikram'); S().coverFor = fr('Sneha').id; follow('Sneha'); } },
      { title: 'One payment, two seats',
        host: 'Sneha is “Paying…” for both.',
        friend: 'She enters her PIN once for the combined amount.',
        friendName: 'Sneha',
        setup: function () { sent(3 * MIN + 55 * SEC); paid('Kabir', 'Aditi'); fr('Vikram').stage = 'declined'; cover('Sneha', 'Vikram'); follow('Sneha'); var f = fr('Sneha'); f.stage = 'upi'; f.app = 'Paytm'; f.pin = '12'; } },
      { title: 'Both marked paid together',
        host: 'Booking confirmed. Sneha ×2 in the summary, not two separate payments.',
        friend: 'Vikram’s phone says Sneha paid for him.',
        setup: function () { sent(3 * MIN + 30 * SEC); cover('Sneha', 'Vikram'); follow('Vikram'); confirmAll(); } }
    ]
  };

  var drop = {
    chip: 'the host needs to drop someone?', tag: 'What if · someone drops out of the plan', friendName: 'Sneha',
    steps: [
      { title: 'Before sending: just tap ×',
        host: 'Every friend in the inline widget has an ×. Removing someone re-splits the bill right away, and Manasi absorbs any remainder.',
        friend: 'Nothing has been sent yet, so nobody is told.',
        friendView: 'blank', scrollHost: '.splitw', setup: function () { checkout({ open: true, friends: true }); } },
      { title: 'After sending: Vikram can’t make it',
        host: 'Requests are already out. The same × shows next to anyone who hasn’t paid yet.',
        friend: 'Sneha has a request for ₹670.80, a five-way split.',
        setup: function () { sent(8 * MIN + 20 * SEC); follow('Sneha'); } },
      { title: 'Removed, and the split adjusts',
        host: 'Vikram is gone from the list and the shares are recalculated, without cancelling the booking.',
        friend: 'Sneha’s request now shows a four-way split at the new amount.',
        setup: function () { sent(8 * MIN); var s = S(); s.friends = s.friends.filter(function (f) { return f.name.indexOf('Vikram') !== 0; }); P.shares(); s.toast = 'Vikram removed'; follow('Sneha'); } }
    ]
  };

  var KNOWN = ['Aditi Rao', 'Kabir Shah', 'Sneha Iyer'];
  var unknown = {
    chip: 'someone doesn’t know the sender?', tag: 'What if · the request reaches someone who doesn’t know Manasi', friendName: 'wrong number',
    steps: [
      { title: 'A number that isn’t in her contacts',
        host: 'Manasi means to add Vikram but types a digit wrong. Before adding it, BookMyShow checks: “Not in your contacts. Are you sure it’s the right person?”',
        friend: 'Nothing has been sent yet.',
        friendView: 'blank', scrollHost: '.splitw',
        setup: function () { checkout({ open: true, friends: true, names: KNOWN }); var s = S(); s.dialog = 'confirmNum'; s.pendingNum = '9876543210'; } },
      { title: 'She adds it anyway',
        host: 'The number gets its own row in the split, with no name, just digits. The split is still five ways.',
        friend: 'Still nothing sent.',
        friendView: 'blank', scrollHost: '.splitw',
        setup: function () { checkout({ open: true, friends: true, names: KNOWN.concat([STRANGER]) }); } },
      { title: 'A request from a stranger',
        host: 'Requests go out once Manasi pays her share. The wrong number shows as “Sent” like everyone else.',
        friend: 'The person at that number has never heard of Manasi. The card names her and the show, with a small “Report” next to “Not now”.',
        scrollHost: 'end',
        setup: function () { sent(9 * MIN + 20 * SEC, false, KNOWN.concat([STRANGER])); follow('+91'); } },
      { title: 'They tap Report',
        host: 'The row turns red as Declined and a “Reported” toast appears. Right now a report looks the same as “Not now”. It should get its own status so Manasi knows it’s the wrong person, not a friend dropping out.',
        friend: 'They’re out of the flow and nothing is charged.',
        scrollHost: 'end',
        setup: function () { sent(9 * MIN, false, KNOWN.concat([STRANGER])); follow('+91'); fr('+91').stage = 'declined'; S().toast = 'Reported'; } }
    ]
  };

  var timeout = {
    chip: 'time runs out?', tag: 'What if · the 10-minute hold runs out', friendName: 'Sneha',
    steps: [
      { title: 'Nine seconds left',
        host: 'The ring is red. Only Manasi has paid.',
        friend: 'Sneha is still on the UPI PIN screen.',
        setup: function () { sent(9 * SEC); follow('Sneha'); var f = fr('Sneha'); f.stage = 'upi'; f.app = 'Paytm'; f.pin = '1'; } },
      { title: 'Time ran out',
        host: 'Seats go back on sale and Manasi’s share is refunded. The ₹25 hold fee isn’t refunded on an expired hold.',
        friend: 'Sneha isn’t left on a dead PIN pad. She sees her seat was released.',
        setup: function () { sent(SEC); follow('Sneha'); fr('Sneha').stage = 'upi'; P.endHold('expired'); } },
      { title: 'A 3-hour cooldown',
        host: '“Pick seats again” explains the 3-hour block on new holds, which stops people hoarding seats.',
        friend: 'Nothing more for Sneha to do.',
        setup: function () { sent(SEC); follow('Sneha'); fr('Sneha').stage = 'upi'; P.endHold('expired'); S().dialog = 'cooldown'; } }
    ]
  };

  var partial = {
    chip: 'only some people could pay?', tag: 'What if · only some of the group paid in time', friendName: 'Aditi',
    steps: [
      { title: 'The hold ends with 3 of 5 paid',
        host: '“Time ran out”, but Kabir and Aditi paid in time, so “See tickets for those who paid” appears.',
        friend: 'For now, Aditi is told the booking didn’t go through and her refund is on its way.',
        setup: function () { sent(SEC); paid('Kabir', 'Aditi'); follow('Aditi'); P.endHold('expired'); } },
      { title: 'Keep the tickets for those who paid',
        host: 'The booking is partially confirmed for Manasi, Kabir and Aditi.',
        friend: 'Aditi’s screen flips to “Your ticket is confirmed!”',
        setup: function () { sent(SEC); paid('Kabir', 'Aditi'); follow('Aditi'); P.endHold('expired');
          S().friends.forEach(function (f) { if (f.stage === 'paid') f.refund = false; }); S().hostScreen = 'partialConfirmed'; } },
      { title: 'Unpaid friends are released, not charged',
        host: 'Sneha and Vikram flash as “Not confirmed”. Their seats go back on sale.',
        friend: 'Vikram sees his seat was released. Nothing was deducted from him.',
        friendName: 'Vikram', scrollHost: 'end',
        setup: function () { sent(SEC); paid('Kabir', 'Aditi'); follow('Vikram'); P.endHold('expired');
          S().friends.forEach(function (f) { if (f.stage === 'paid') f.refund = false; }); S().hostScreen = 'partialConfirmed'; } }
    ]
  };

  // ---------- tap hints: what gets tapped on this screen to reach the next step ----------
  function act(a, extra) { return '[data-act="' + a + '"]' + (extra || ''); }
  function byId(a, first) { return act(a, '[data-id="' + fr(first).id + '"]'); }
  function taps(steps, list) { list.forEach(function (t, i) { if (t) steps[i].tap = t; }); }
  taps(ideal.steps, [
    [['host', act('goCheckout')]],
    [['host', act('toggleSplit')]],
    [['host', act('addC', '[data-id="c1"]')]],
    function () { return [['host', byId('editAmt', 'Kabir')]]; },
    [['host', act('goPaySplit')]],
    [['host', act('hostPayGo')]],
    [['friend', act('fDetails')]],
    [['friend', '.det-sheet button' + act('fCloseDetails')]],
    [['friend', act('fApp', '[data-app="PhonePe"]')]],
    [['friend', act('pinKey', '[data-k="7"]')]]
  ]);
  taps(fails.steps, [
    [['friend', act('pinKey', '[data-k="4"]')]],
    [['friend', act('fTellHost')]],
    [['host', act('hostPayFor')]],
    [['host', act('hostPayGo')]]
  ]);
  taps(notNow.steps, [
    [['friend', act('fDecline')]],
    function () { return [['host', byId('openCover', 'Sneha')]]; },
    [['host', '.dialog ' + act('closeCover')], ['friend', act('fPay')]],
    [['friend', act('pinKey', '[data-k="7"]')]]
  ]);
  taps(unknown.steps, [
    [['host', act('confirmAddNum')]],
    [['host', act('goPaySplit')]],
    [['friend', act('fReport')]]
  ]);
  taps(drop.steps, [
    function () { return [['host', byId('rm', 'Vikram')]]; },
    function () { return [['host', byId('rmWait', 'Vikram')]]; }
  ]);
  taps(timeout.steps, [null, [['host', act('tryCooldown')]]]);
  taps(partial.steps, [[['host', act('keepPartial')]]]);

  // ---------- phones ----------
  function mountPhone(slot, id) {
    var sr = slot.attachShadow({ mode: 'open' });
    sr.innerHTML = '<link rel="stylesheet" href="journeys/proto1.css"><div class="phone" id="' + id + '"></div>';
    return sr;
  }
  function offTop(el, stop) { var t = 0; while (el && el !== stop) { t += el.offsetTop; el = el.offsetParent; } return t; }

  window.createJourney(root, {
    scenarios: [ideal, fails, notNow, unknown, drop, timeout, partial],
    roots: function () { return P.ROOTS; },
    mount: function (hostSlot, friendSlot) {
      P.ROOTS.host = mountPhone(hostSlot, 'host');
      P.ROOTS.friend = mountPhone(friendSlot, 'friend');
    },
    render: function (st) {
      st.setup();
      P.renderHost();
      if (st.friendView === 'blank') P.ROOTS.friend.querySelector('#friend').innerHTML = P.friendHome();
      else P.renderFriend();
      var hs = P.ROOTS.host.querySelector('.scroll');
      if (hs) {
        if (st.scrollHost === 'end') hs.scrollTop = hs.scrollHeight;
        else if (st.scrollHost) {
          var t = P.ROOTS.host.querySelector(st.scrollHost), stop = hs.offsetParent;
          hs.scrollTop = t ? offTop(t, stop) - offTop(hs, stop) - 12 : 0;
        } else hs.scrollTop = 0;
      }
    }
  });
})();
