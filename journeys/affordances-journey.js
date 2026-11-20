/* "Building affordances for the issues noted": the user-testing fixes in Prototype 1, shown on the
   host's phone in Frame 26. Uses the same Prototype 1 screens as "Shifting gears"; the module's
   shadow-root target is swapped to this phone for each render. */
(function () {
  var P = window.Proto1;
  var root = document.querySelector('[data-journey="affordances"]');
  if (!P || !root || !window.createJourney) return;

  var MIN = 60 * 1000, SEC = 1000;
  var GANG = ['Aditi Rao', 'Kabir Shah', 'Sneha Iyer', 'Vikram Nair'];
  var phone = null;                                   // this section's shadow root

  function S() { return P.S; }
  function fr(first) { return S().friends.find(function (f) { return f.name.indexOf(first) === 0; }); }
  function paid() { for (var i = 0; i < arguments.length; i++) fr(arguments[i]).stage = 'paid'; }
  function sent(msLeft) {
    P.fresh();
    GANG.forEach(function (n) { var c = P.CONTACTS.find(function (x) { return x.name === n; }); P.addFriend(n, c.phone); });
    var s = S(); s.phase = 'sent'; s.payMode = 'split'; s.deadline = Date.now() + msLeft; P.sendRequests(); s.hostScreen = 'waiting';
  }
  function cover(payer, who) { var p = fr(payer), c = fr(who); p.covers = [c.id]; c.coveredBy = p.id; }
  function act(a, extra) { return '[data-act="' + a + '"]' + (extra || ''); }
  function byId(a, first) { return act(a, '[data-id="' + fr(first).id + '"]'); }

  var replacement = {
    chip: 'Handling replacement situations',
    steps: [
      { title: 'Vikram can’t make it',
        host: 'In testing, the participant didn’t understand how to replace someone. Now the × next to an unpaid friend starts a clear choice instead of deleting the row.',
        scrollHost: 'end', setup: function () { sent(6 * MIN + 10 * SEC); paid('Kabir'); },
        tap: function () { return [['host', byId('askRemove', 'Vikram')]]; } },
      { title: '“Replace this person or release their seat?”',
        host: 'Two plain options: give the seat to someone else, or let it go back on sale.',
        setup: function () { sent(6 * MIN); paid('Kabir'); var s = S(); s.dialog = 'removeChoice'; s.removeTarget = fr('Vikram').id; },
        tap: [['host', act('startReplace')]] },
      { title: 'Pick who takes the seat',
        host: 'Search contacts or type a number. The new person takes Vikram’s seat at the same ₹670.80 share.',
        setup: function () { sent(5 * MIN + 45 * SEC); paid('Kabir'); var s = S(); s.dialog = 'replace'; s.removeTarget = fr('Vikram').id; s.query = ''; },
        tap: [['host', act('replaceContact', '[data-id="c5"]')]] },
      { title: 'Same seat, new person',
        host: 'Priya gets a fresh request for that seat. Nobody else’s share changes and the hold keeps running.',
        scrollHost: 'end', setup: function () { sent(5 * MIN + 30 * SEC); paid('Kabir'); var f = fr('Vikram'); f.name = 'Priya Menon'; f.phone = '98190 55678'; S().toast = 'Replaced with Priya'; } }
    ]
  };

  var lastChance = {
    chip: 'Last chance to pay / save seats',
    steps: [
      { title: 'Under a minute left',
        host: 'The participant was anxious that nobody would pay before the timer ran out. Vikram can’t pay, so Manasi drags his name onto Sneha’s: one friend takes over another’s seat in a single gesture.',
        scrollHost: 'end', setup: function () { sent(48 * SEC); paid('Aditi'); },
        tap: function () { return [['host', '.prow[data-fid="' + fr('Vikram').id + '"] .drag-handle', { dragTo: '.prow[data-fid="' + fr('Sneha').id + '"]' }]]; } },
      { title: 'Vikram’s seat nests under Sneha',
        host: 'His row drops in under hers (↳), with an × to undo it. Sneha’s request now covers both seats in one payment.',
        scrollHost: 'end', setup: function () { sent(40 * SEC); paid('Aditi'); cover('Sneha', 'Vikram'); S().toast = 'Sneha is now paying for Vikram too'; } },
      { title: '“Pay ₹X to keep all seats, or release unpaid seats”',
        host: 'Time’s up with Kabir still unpaid. Instead of cancelling everyone, Manasi gets a last chance with the exact amount.',
        setup: function () { sent(SEC); paid('Aditi', 'Sneha'); cover('Sneha', 'Vikram'); fr('Vikram').stage = 'paid'; P.holdExpire(); },
        tap: [['host', act('payKeepAll')]] },
      { title: 'Pay the rest',
        host: 'The same UPI sheet, for Kabir’s ₹670.80.',
        setup: function () { sent(SEC); paid('Aditi', 'Sneha'); cover('Sneha', 'Vikram'); fr('Vikram').stage = 'paid'; P.holdExpire(); var s = S(); s.payMode = 'cover'; s.hostScreen = 'pay'; },
        tap: [['host', act('hostPayGo')]] },
      { title: 'Every seat saved',
        host: 'Booking confirmed for all five. The summary shows Sneha ×2 and that Manasi covered Kabir.',
        setup: function () { sent(SEC); paid('Aditi', 'Sneha'); cover('Sneha', 'Vikram'); fr('Vikram').stage = 'paid'; P.holdExpire();
          var s = S(); s.coverAmt = P.remaining(); fr('Kabir').stage = 'cancelled'; s.phase = 'confirmed'; s.hostScreen = 'confirmed'; } }
    ]
  };

  var reminders = {
    chip: 'Pacing reminders',
    steps: [
      { title: 'One nudge',
        host: 'Vikram hasn’t paid. Manasi taps Remind and a nudge goes to his phone.',
        scrollHost: 'end', setup: function () { sent(5 * MIN); paid('Aditi'); },
        tap: function () { return [['host', byId('remind', 'Vikram')]]; } },
      { title: 'Then a cooldown',
        host: 'Remind turns into a greyed-out “Reminded” for 30 seconds, so an anxious host can’t spam a friend with nudges.',
        scrollHost: 'end', setup: function () { sent(4 * MIN + 55 * SEC); paid('Aditi'); fr('Vikram').remindUntil = Date.now() + 30 * SEC; S().toast = 'Reminder sent to Vikram'; } },
      { title: 'Paced, not blocked',
        host: 'Once the cooldown is over, Remind is back. Kabir and Sneha can still be reminded at any time.',
        scrollHost: 'end', setup: function () { sent(4 * MIN + 20 * SEC); paid('Aditi'); fr('Vikram').remindUntil = Date.now() - SEC; } }
    ]
  };

  // render into this section's phone, then hand the module back to the "Shifting gears" phones
  function withPhone(fn) {
    var saved = { host: P.ROOTS.host, friend: P.ROOTS.friend };
    P.ROOTS.host = phone; P.ROOTS.friend = null;
    try { fn(); } finally { P.ROOTS.host = saved.host; P.ROOTS.friend = saved.friend; }
  }

  window.createJourney(root, {
    scenarios: [replacement, lastChance, reminders],
    whatIf: false,
    roots: function () { return { host: phone }; },
    mount: function (hostSlot) {
      phone = hostSlot.attachShadow({ mode: 'open' });
      phone.innerHTML = '<link rel="stylesheet" href="journeys/proto1.css"><div class="phone" id="host"></div>';
    },
    render: function (st) {
      withPhone(function () {
        st.setup();
        P.renderHost();
        var hs = phone.querySelector('.scroll'); if (hs) hs.scrollTop = st.scrollHost === 'end' ? hs.scrollHeight : 0;
      });
    }
  });
})();
