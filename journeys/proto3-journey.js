/* User journey 01 — Prototype 3 (WhatsApp link): ideal user journey + "What if…" branches.
   Each step puts the prototype into a fixed state; screens come from proto3-screens.js. */
(function () {
  var P = window.Proto3, X = window.JourneyExtras;
  var root = document.querySelector('[data-journey="proto3"]');
  if (!P || !root || !window.createJourney) return;

  // ---------- state helpers ----------
  var MIN = 60 * 1000, SEC = 1000;
  function S() { return P.S; }
  function base() { P.fresh(); var s = S(); s.chatType = 'group'; s.selectedGroup = 'g1'; }
  function addGroup() {
    P.GROUPS[0].members.forEach(function (n) {
      var c = P.CONTACTS.find(function (x) { return x.name === n; });
      P.addFriend(n, c ? c.phone : '00000 00000');
    });
  }
  function sent(msLeft) {               // seats held, link shared in the group
    base(); addGroup(); var s = S();
    s.phase = 'sent'; s.deadline = Date.now() + msLeft; P.sendRequests(); s.payMode = 'split'; s.pinned = true;
  }
  function fr(first) { return S().friends.find(function (f) { return f.name.indexOf(first) === 0; }); }
  function paid() { for (var i = 0; i < arguments.length; i++) fr(arguments[i]).stage = 'paid'; }
  function follow(first) { S().active = fr(first).id; }       // whose phone is on the right
  function cover(payer, who) { var p = fr(payer), c = fr(who); p.covers = [c.id]; c.coveredBy = p.id; }
  function waiting() { S().hostScreen = 'waiting'; }

  // ---------- scenarios ----------
  var happy = {
    chip: 'Ideal user journey', friendName: 'Aditi',
    steps: [
      { title: 'Manasi picks seats for the gang',
        host: 'Selects 10 premium seats for Ramayana. Seats already held by other split groups show as Pending.',
        friend: 'Aditi is going about her day. Nothing to do yet.',
        setup: function () { base(); S().hostScreen = 'seats'; } },
      { title: 'Split Payment sits right on checkout',
        host: 'A new “Split Payment” card on the checkout page, next to the order total and the refundable ₹25 seat-hold fee.',
        friend: 'Still nothing. Friends aren’t asked to install or sign in to anything.',
        setup: function () { base(); S().hostScreen = 'confirm'; } },
      { title: 'Share where the group already talks',
        host: 'Instead of an in-app contact picker, the share sheet goes straight to WhatsApp groups and contacts.',
        friend: 'No change yet.',
        setup: function () { base(); S().hostScreen = 'confirm'; S().shareOpen = true; } },
      { title: 'Host pays only her share to hold seats',
        host: 'Picking “Ramayana Gang 🎬” splits the bill five ways. Manasi pays her share; the link goes live once it succeeds.',
        friend: 'Not sent yet. The request only goes out once seats are held.',
        setup: function () { base(); addGroup(); var s = S(); s.hostScreen = 'pay'; s.payMode = 'split'; } },
      { title: 'The link lands in the group chat',
        host: 'The Split Pay card is posted in the WhatsApp group with each person’s share and a 10-minute hold timer.',
        friend: 'Aditi gets a normal WhatsApp notification on her lock screen.',
        setup: function () { sent(9 * MIN + 42 * SEC); var s = S(); s.pinned = false; s.hostScreen = 'whatsapp'; follow('Aditi'); fr('Aditi').stage = 'idle'; } },
      { title: 'Pinned so it doesn’t get buried',
        host: 'Manasi pins the card. It stays on top of the chat even as messages pile up.',
        friend: 'Aditi opens the chat and sees the pinned card with her share and a Pay button.',
        setup: function () { sent(9 * MIN + 10 * SEC); S().hostScreen = 'whatsapp'; follow('Aditi'); } },
      { title: 'Paying from the chat, not from BookMyShow',
        host: 'Manasi’s tracker flips Aditi to “Paying…” the moment she opens the link. Everyone else is still at Sent.',
        friend: 'Tapping Pay opens a light payment page: booking details, the hold timer and her usual UPI apps.',
        setup: function () { sent(8 * MIN + 15 * SEC); waiting(); follow('Aditi'); fr('Aditi').stage = 'chooser'; } },
      { title: 'A familiar UPI step',
        host: 'Kabir has already paid. Manasi can see it without asking anyone.',
        friend: 'She confirms with her UPI PIN on Paytm, exactly like any other payment.',
        setup: function () { sent(7 * MIN + 48 * SEC); waiting(); paid('Kabir'); follow('Aditi'); var f = fr('Aditi'); f.stage = 'upi'; f.app = 'Paytm'; f.pin = '12'; } },
      { title: 'Paid, and everyone can see it',
        host: 'Progress updates live: 3 of 5 paid. No screenshots, no mental math.',
        friend: 'Aditi is done. She can see how many others still have to pay before seats are confirmed.',
        setup: function () { sent(7 * MIN + 20 * SEC); waiting(); paid('Kabir', 'Aditi'); follow('Aditi'); } },
      { title: 'Everyone’s in. Booking confirmed',
        host: 'All shares are in, so the booking confirms. Manasi gets the tickets and a split summary.',
        friend: 'Aditi gets a confirmation too. Nobody owes anybody.',
        setup: function () { sent(3 * MIN); var s = S(); follow('Aditi');
          s.friends.forEach(function (f) { f.stage = 'paid'; }); s.phase = 'confirmed'; s.hostScreen = 'confirmed'; } }
    ]
  };

  var fails = {
    chip: 'a friend’s payment fails?', tag: 'What if · a friend’s payment fails', friendName: 'Aditi',
    steps: [
      { title: 'Aditi enters her UPI PIN',
        host: 'Aditi shows as “Paying…”. Kabir has already paid.',
        friend: 'She pays from the split-pay card on Paytm as usual.',
        setup: function () { sent(7 * MIN + 30 * SEC); waiting(); paid('Kabir'); follow('Aditi'); var f = fr('Aditi'); f.stage = 'upi'; f.app = 'Paytm'; f.pin = '123'; } },
      { title: 'The bank declines it',
        host: 'Manasi doesn’t see the failure screen, and a declined charge doesn’t turn Aditi’s row red.',
        friend: 'Aditi can retry or switch UPI apps. If her account simply can’t pay right now, there’s a new way out: let Manasi know.',
        setup: failedState(7 * MIN + 12 * SEC),
        after: function () { X.tellHostButton(P.ROOTS.friend, 'Manasi'); } },
      { title: 'Manasi is asked, not chased',
        host: 'A prompt on Manasi’s tracker: Aditi’s payment didn’t go through. She can pay Aditi’s share right now, or give her a minute.',
        friend: 'Aditi is told Manasi knows, and that her seat stays held while Manasi decides. No awkward texts.',
        setup: failedState(6 * MIN + 55 * SEC),
        after: function () { var amt = P.inr(fr('Aditi').share); X.hostPayForDialog(P.ROOTS.host, 'Aditi', amt); X.friendToldHost(P.ROOTS.friend, 'Manasi', amt); } },
      { title: 'Manasi pays Aditi’s share',
        host: 'The same UPI sheet she used for her own share, labelled as covering Aditi.',
        friend: 'Still waiting. Nothing for Aditi to do.',
        setup: function () { failedState(6 * MIN + 40 * SEC)(); var s = S(); s.hostScreen = 'pay'; s.payMode = 'single'; },
        after: function () { X.hostPayingFor(P.ROOTS.host, 'Aditi'); X.friendToldHost(P.ROOTS.friend, 'Manasi', P.inr(fr('Aditi').share)); } },
      { title: 'Seat saved, settle up later',
        host: 'Aditi’s row turns green, so the group stays on track for the booking. The money between Manasi and Aditi is a normal UPI payback later.',
        friend: 'Aditi sees that Manasi paid for her and exactly how much she owes.',
        setup: function () { sent(6 * MIN + 30 * SEC); waiting(); paid('Kabir', 'Aditi'); follow('Aditi'); S().toast = 'You paid ' + P.inr(fr('Aditi').share) + ' for Aditi'; },
        after: function () { X.friendCoveredByHost(P.ROOTS.friend, 'Manasi', P.inr(fr('Aditi').share)); } }
    ]
  };
  function failedState(msLeft) {
    return function () { sent(msLeft); waiting(); paid('Kabir'); follow('Aditi'); var f = fr('Aditi'); f.stage = 'failed'; f.app = 'Paytm'; f.failCount = 1; f.failReason = 'Transaction declined by bank. Please try again.'; };
  }

  var noPay = {
    chip: 'someone doesn’t pay?', tag: 'What if · someone doesn’t pay', friendName: 'Vikram',
    steps: [
      { title: 'Vikram goes quiet',
        host: 'Three of five have paid. Vikram and Sneha are still at “Sent” with four minutes left on the hold.',
        friend: 'Vikram hasn’t even opened the notification. This is where the planner usually starts chasing.',
        friendView: 'home',
        setup: function () { sent(4 * MIN + 12 * SEC); waiting(); paid('Kabir', 'Aditi'); follow('Vikram'); } },
      { title: 'A nudge instead of a chase',
        host: 'Manasi taps Remind next to Vikram. One tap, no awkward follow-up message.',
        friend: 'Vikram opens the group and sees the card with his share. Say he’s hit his UPI limit for the day and can’t pay.',
        setup: function () { sent(3 * MIN + 50 * SEC); waiting(); paid('Kabir', 'Aditi'); S().toast = 'Reminder sent to Vikram'; follow('Vikram'); } },
      { title: 'Sneha covers Vikram',
        host: 'Manasi taps + next to Sneha and adds Vikram. His row folds into hers with a 🎟 ×2 pill. Coverage can’t be nested.',
        friend: 'Sneha’s card now shows the combined amount, so nobody pays blind.',
        friendName: 'Sneha',
        setup: function () { sent(3 * MIN + 20 * SEC); waiting(); paid('Kabir', 'Aditi'); cover('Sneha', 'Vikram'); S().coverFor = fr('Sneha').id; follow('Sneha'); } },
      { title: 'One payment, two seats',
        host: 'Sneha is “Paying…” for both. The remaining amount hasn’t changed; it just has one payer now.',
        friend: 'Her payment page says “Includes Vikram’s share”. One UPI payment covers both.',
        friendName: 'Sneha',
        setup: function () { sent(2 * MIN + 55 * SEC); waiting(); paid('Kabir', 'Aditi'); cover('Sneha', 'Vikram'); follow('Sneha'); fr('Sneha').stage = 'chooser'; } },
      { title: 'Both marked paid in the same instant',
        host: 'Booking confirms. The summary shows Sneha ×2 rather than counting Vikram as a separate payment.',
        friend: 'Vikram’s phone says Sneha paid for him. Nothing to pay, nobody to chase.',
        setup: function () { sent(2 * MIN + 30 * SEC); var s = S(); cover('Sneha', 'Vikram'); follow('Vikram');
          s.friends.forEach(function (f) { f.stage = 'paid'; }); s.phase = 'confirmed'; s.hostScreen = 'confirmed'; } }
    ]
  };

  var unknown = {
    chip: 'someone doesn’t know the sender?', tag: 'What if · the link reaches someone who doesn’t know Manasi (a gap)', friendName: 'wrong number',
    steps: [
      { title: 'The link lands with the wrong person',
        host: 'Say Vikram’s number was saved wrong in Manasi’s phone. She sends the split link from WhatsApp as usual.',
        friend: 'A stranger gets a WhatsApp message from “Manasi Madan” with a payment card. The only action on the card is Pay. There’s no “I don’t know this person”.',
        setup: function () { sent(9 * MIN + 30 * SEC); var s = S(); s.chatType = 'personal'; s.pinned = false; s.hostScreen = 'whatsapp'; follow('Vikram'); } },
      { title: 'Manasi can’t tell, and can’t fix it',
        host: 'The stranger stays at “Sent” until the hold ends. A wrong number looks like a slow friend, and one person can’t be removed without releasing everyone.',
        friend: 'Their only way out is WhatsApp’s own block or report, which BookMyShow never hears about. Prototype 1 closes this gap.',
        setup: function () { sent(6 * MIN + 10 * SEC); var s = S(); s.chatType = 'personal'; waiting(); paid('Kabir', 'Aditi'); follow('Vikram'); } }
    ]
  };

  var timeout = {
    chip: 'time runs out?', tag: 'What if · the 10-minute hold runs out', friendName: 'Sneha',
    steps: [
      { title: 'Nine seconds left',
        host: 'The ring has turned red. Nobody else has paid yet.',
        friend: 'Sneha is still on the UPI PIN screen.',
        setup: function () { sent(9 * SEC); waiting(); follow('Sneha'); var f = fr('Sneha'); f.stage = 'upi'; f.app = 'Paytm'; f.pin = '1'; } },
      { title: 'Time ran out',
        host: 'The seats go back on sale and Manasi’s share is refunded. The ₹25 hold fee isn’t refunded on an expired hold.',
        friend: 'Sneha isn’t left on a dead PIN pad. She sees that her seat was released and nothing is charged.',
        setup: function () { sent(SEC); follow('Sneha'); fr('Sneha').stage = 'upi'; P.endHold('expired'); } },
      { title: 'A 3-hour cooldown',
        host: '“Pick seats again” explains a 3-hour block on new holds, which stops people hoarding seats. The way out is browsing other showtimes.',
        friend: 'Nothing more for Sneha to do.',
        setup: function () { sent(SEC); follow('Sneha'); fr('Sneha').stage = 'upi'; P.endHold('expired'); S().dialog = 'cooldown'; } }
    ]
  };

  var partial = {
    chip: 'only some people could pay?', tag: 'What if · only some of the group paid in time', friendName: 'Aditi',
    steps: [
      { title: 'The hold ends with 3 of 5 paid',
        host: '“Time ran out”, but Kabir and Aditi paid in time. A second option appears: See tickets for those who paid.',
        friend: 'For now, Aditi is told the booking didn’t go through and her money is on its way back.',
        setup: function () { sent(SEC); paid('Kabir', 'Aditi'); follow('Aditi'); P.endHold('expired'); } },
      { title: 'Keep the tickets for those who paid',
        host: 'Manasi confirms tickets for the people who paid. Their refunds are cancelled and the booking is partially confirmed.',
        friend: 'Aditi’s screen flips to “Your ticket is confirmed!”',
        setup: function () { sent(SEC); paid('Kabir', 'Aditi'); follow('Aditi'); P.endHold('expired');
          S().friends.forEach(function (f) { if (f.stage === 'paid') f.refund = false; }); S().hostScreen = 'partialConfirmed'; } },
      { title: 'Unpaid friends are released, not charged',
        host: 'Sneha and Vikram flash as “Not confirmed”. It’s a status, not a payment demand. Their seats go back on sale.',
        friend: 'Vikram sees his seat was released. Nothing was deducted from him.',
        friendName: 'Vikram', scrollHost: true,
        setup: function () { sent(SEC); paid('Kabir', 'Aditi'); follow('Vikram'); P.endHold('expired');
          S().friends.forEach(function (f) { if (f.stage === 'paid') f.refund = false; }); S().hostScreen = 'partialConfirmed'; } }
    ]
  };

  // ---------- tap hints: what gets tapped on this screen to reach the next step ----------
  function act(a, extra) { return '[data-act="' + a + '"]' + (extra || ''); }
  function byId(a, first) { return function () { return act(a, '[data-id="' + fr(first).id + '"]'); }; }
  function taps(steps, list) { list.forEach(function (t, i) { if (t) steps[i].tap = t; }); }
  taps(happy.steps, [
    [['host', act('goCheckout')]],
    [['host', act('openShare')]],
    [['host', act('pickGroup', '[data-id="g1"]')]],
    [['host', act('hostPayGo')]],
    [['host', act('togglePin')], ['friend', act('fOpenWA')]],
    [['friend', act('fOpenPay')]],
    [['friend', act('fPayUPI', '[data-app="Paytm"]')]],
    [['friend', act('pinKey', '[data-k="7"]')]]
  ]);
  taps(fails.steps, [
    [['friend', act('pinKey', '[data-k="4"]')]],
    [['friend', act('fTellHost')]],
    [['host', act('hostPayFor')]],
    [['host', act('hostPayGo')]]
  ]);
  taps(noPay.steps, [
    function () { return [['host', byId('remind', 'Vikram')()]]; },
    function () { return [['host', byId('openCover', 'Sneha')()]]; },
    [['host', '.dialog ' + act('closeCover')], ['friend', act('fOpenPay')]],
    [['friend', act('fPayUPI', '[data-app="Paytm"]')]]
  ]);
  taps(timeout.steps, [null, [['host', act('tryCooldown')]]]);
  taps(partial.steps, [[['host', act('keepPartial')]]]);

  // ---------- phones ----------
  function mountPhone(slot, id) {
    var sr = slot.attachShadow({ mode: 'open' });
    sr.innerHTML = '<link rel="stylesheet" href="journeys/proto3.css"><div class="phone" id="' + id + '"></div>';
    return sr;
  }

  window.createJourney(root, {
    scenarios: [happy, fails, noPay, unknown, timeout, partial],
    roots: function () { return P.ROOTS; },
    mount: function (hostSlot, friendSlot) {
      P.ROOTS.host = mountPhone(hostSlot, 'host');
      P.ROOTS.friend = mountPhone(friendSlot, 'friend');
    },
    render: function (st) {
      st.setup();
      P.renderHost();
      if (st.friendView === 'home') {   // lock screen with the WhatsApp notification still unopened
        P.ROOTS.friend.querySelector('#friend').innerHTML = P.friendHome('🎬 Split Pay: Pay ' + P.inr(P.S.hostShare) + ' for Ramayana');
      } else P.renderFriend();
      var chat = P.ROOTS.friend.querySelector('.wa-chat'); if (chat) chat.scrollTop = chat.scrollHeight;
      var hs = P.ROOTS.host.querySelector('.scroll'); if (hs) hs.scrollTop = st.scrollHost ? hs.scrollHeight : 0;
    }
  });
})();
