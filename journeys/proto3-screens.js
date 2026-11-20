/* Screen renderers extracted verbatim from 'BookMyShow Split Pay - Prototype 3 (WhatsApp Link).html'.
   Only change: $() resolves #host / #friend inside the journey's shadow roots. Driven by journey.js. */
window.Proto3 = (function(){
const ROOTS={host:null,friend:null};
const CONTACTS=[
 {id:'c1',name:'Aditi Rao',phone:'98200 11234'},
 {id:'c2',name:'Kabir Shah',phone:'98670 22345'},
 {id:'c3',name:'Sneha Iyer',phone:'99870 33456'},
 {id:'c4',name:'Vikram Nair',phone:'97690 44567'},
 {id:'c5',name:'Priya Menon',phone:'98190 55678'},
 {id:'c6',name:'Rohan Mehta',phone:'98330 66789'},
 {id:'c7',name:'Tanya Joshi',phone:'99200 77890'},
 {id:'c8',name:'Arjun Kulkarni',phone:'98920 88901'}
];
const GROUPS=[
 {id:'g1',name:'Ramayana Gang 🎬',members:['Aditi Rao','Kabir Shah','Sneha Iyer','Vikram Nair'],dp:'🎬'},
 {id:'g2',name:'College Besties',members:['Priya Menon','Rohan Mehta','Tanya Joshi','Arjun Kulkarni'],dp:'🎓'},
 {id:'g3',name:'Family',members:['Mom','Dad','Riya Madan','Kunal Madan'],dp:'👨‍👩‍👧‍👦'}
];
const MOVIE={title:'Ramayana',lang:'Hindi (3D)',when:'Thu, 19 Nov, 2026 | 04:30 PM',seats:'PREMIUM - D6, D7, D8, D9, D10, D11, D12, D13, D14, D15',range:'D6–D15',venue:'Cinepolis: Magnet Mall, Bhandup (W)',audi:'AUDI 2',n:10,tickets:300000,fees:35400,total:335400};
const HOLD_MS=10*60*1000;
const COLORS=['#dc3558','#7986cb','#4db6ac','#ffb74d','#a1887f','#9575cd','#4fc3f7','#81c784','#f06292'];
const col=s=>{let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))>>>0;return COLORS[h%COLORS.length]};
const ini=n=>n.replace(/[^A-Za-z ]/g,'').split(' ').filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase()||'#';
const av=(n,cls='')=>`<div class="av ${cls}" style="background:${col(n)}">${ini(n)}</div>`;
const inr=p=>'₹'+(p%100===0?(p/100).toLocaleString('en-IN'):(p/100).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2}));
const mmss=ms=>{ms=Math.max(0,ms);const s=Math.ceil(ms/1000);return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};

/* ---------- seat map data ---------- */
const ROWS='ABCDEFGHIJ'.split('');
const COLS=15;
const TAKEN=new Set();
(function(){const s=42;let r=s;function rng(){r=(r*16807+0)%2147483647;return r/2147483647}
  for(let i=0;i<50;i++){const row=ROWS[Math.floor(rng()*ROWS.length)];const c=Math.floor(rng()*COLS)+1;
    const id=row+c;if(!'D6 D7 D8 D9 D10 D11 D12 D13 D14 D15'.split(' ').includes(id))TAKEN.add(id)}
})();
const PRESELECTED=new Set('D6 D7 D8 D9 D10 D11 D12 D13 D14 D15'.split(' '));
const PENDING=new Set('E3 E4 E5 F8 F9 F10 F11 G2 G3'.split(' '));// seats held by other split-pay groups

/* ---------- state ---------- */
let S;
function fresh(){S={
  friends:[],hostShare:MOVIE.total,hostScreen:'seats',query:'',
  phase:'draft',payMode:'single',payBusy:false,deadline:0,active:null,toast:'',dialog:null,abuseInfo:false,
  selectedSeats:new Set(PRESELECTED),
  /* proto3 specific */
  shareOpen:false,chatType:'group',selectedGroup:null,selectedContacts:new Set(),
  pinned:false,hostWA:false,showPaidList:false,coverFor:null
}}
fresh();
const $=s=>(s.indexOf('#friend')===0?ROOTS.friend:ROOTS.host).querySelector(s);
const paidAmt=()=>S.friends.filter(f=>f.stage==='paid').reduce((a,f)=>a+f.share,0)+(S.phase==='draft'?0:S.hostShare);
function shares(){const n=S.friends.length+1;const base=Math.floor(MOVIE.total/n);S.friends.forEach(f=>{if(!f._custom)f.share=base});S.hostShare=MOVIE.total-S.friends.reduce((a,f)=>a+f.share,0)}
/* ---- pay-for-a-friend (covering) ---- */
function displayShare(f){return f.share+(f.covers||[]).reduce((a,id)=>{const c=S.friends.find(x=>x.id===id);return a+(c?c.share:0)},0)}
function coverCandidates(id){return S.friends.filter(x=>x.id!==id&&!x.coveredBy&&!(x.covers&&x.covers.length)&&['prompt','declined'].includes(x.stage))}
function cascadeCover(f){(f.covers||[]).forEach(id=>{const c=S.friends.find(x=>x.id===id);if(c)c.stage='paid'})}
const checkSvg='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#17803a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const hostLabel={prompt:['Sent','n'],chooser:['Paying…','b'],upi:['Paying…','b'],processing:['Paying…','b'],paid:[checkSvg,'g'],declined:['Declined','r'],cancelled:['Cancelled','n'],expired:['Expired','n']};

/* ---------- icons ---------- */
const I={
 back:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 5l-7 7 7 7"/></svg>',
 backW:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M15 5l-7 7 7 7"/></svg>',
 shield:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:none"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/></svg>',
 shieldw:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/></svg>',
 search:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
 check:'<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
 xw:'<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
 clock:'<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
 ticket:'<svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M3 8a2 2 0 002-2h14a2 2 0 002 2v2a2 2 0 000 4v2a2 2 0 00-2 2H5a2 2 0 00-2-2v-2a2 2 0 000-4z"/></svg>',
 chevDown:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>',
 pin:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 17v5M9 3h6l-1 7h3l-5 7-5-7h3z"/></svg>',
 pinFill:'<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1"><path d="M12 17v5M9 3h6l-1 7h3l-5 7-5-7h3z"/></svg>',
 waPhone:'<svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M6.6 10.8a13.4 13.4 0 006.6 6.6l2.2-2.2a.9.9 0 01.9-.2 10 10 0 003.1.5.9.9 0 01.9.9v3a.9.9 0 01-.9.9A15.2 15.2 0 013.1 4.6a.9.9 0 01.9-.9h3a.9.9 0 01.9.9 10 10 0 00.5 3.1.9.9 0 01-.2.9z"/></svg>',
 waVideo:'<svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M15 10l5-3v10l-5-3V17a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h9a1 1 0 011 1z"/></svg>',
 waDots:'<svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>',
 waSend:'<svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>',
 mic:'<svg width="22" height="22" viewBox="0 0 24 24" fill="#8c8c8c"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>',
 attach:'<svg width="22" height="22" viewBox="0 0 24 24" fill="#8c8c8c" transform="rotate(45)"><path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5a2.5 2.5 0 015 0v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6h-1.5v9.5a2.5 2.5 0 005 0V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6H16.5z"/></svg>',
 emoji:'<svg width="22" height="22" viewBox="0 0 24 24" fill="#8c8c8c"><circle cx="12" cy="12" r="10" fill="none" stroke="#8c8c8c" stroke-width="2"/><path d="M8 14s1.5 2 4 2 4-2 4-2" fill="none" stroke="#8c8c8c" stroke-width="2" stroke-linecap="round"/><circle cx="9" cy="10" r="1"/><circle cx="15" cy="10" r="1"/></svg>',
};
const sb=(dark)=>`<div class="sb ${dark?'dark':''}"><span>4:02 PM</span><span>5G ▮▮▮ 54%</span></div>`;
const splitIcon=`<div class="split-icon"><div class="sq"></div><div class="sq"></div><div class="sq"></div><div class="sq"></div></div>`;

/* ---------- SEAT SELECTION ---------- */
function seatScreen(){
  let rows='';
  for(const r of ROWS){
    let cells=`<span class="rl">${r}</span>`;
    for(let c=1;c<=COLS;c++){const id=r+c;const on=S.selectedSeats.has(id);const tk=TAKEN.has(id);const pn=PENDING.has(id);cells+=`<button class="seat ${on?'on':''} ${tk?'taken':''} ${pn?'pending':''}" data-act="toggleSeat" data-sid="${id}">${c}</button>`}
    rows+=`<div class="seat-row">${cells}</div>`;
  }
  const n=S.selectedSeats.size;
  const price=n*30000;
  return `<div class="screen seat-screen">${sb(true)}
    <div class="seat-appbar">${I.backW}<span>${MOVIE.title}</span><span style="margin-left:auto;font-size:12px;color:rgba(255,255,255,.5)">${MOVIE.lang}</span></div>
    <div class="seat-info">
      <div style="font-size:12px;color:rgba(255,255,255,.5)">${MOVIE.venue} · ${MOVIE.audi}</div>
      <div style="font-size:12px;color:rgba(255,255,255,.5);margin-top:2px">${MOVIE.when}</div>
    </div>
    <div class="seat-map">
      <div class="screen-label">SCREEN THIS WAY</div>
      ${rows}
      <div class="seat-legend"><span><i style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12)"></i> Available</span><span><i style="background:var(--red)"></i> Selected</span><span><i style="background:rgba(245,166,35,.18);border:1px solid rgba(245,166,35,.5)"></i> Pending</span><span><i style="background:rgba(255,255,255,.03)"></i> Sold</span></div>
    </div>
    <div class="seat-bbar">
      <div class="sel-info">${n?`<b>${n} seat${n>1?'s':''}</b> · Premium · ${inr(price)}`:'Tap seats to select'}</div>
      <button class="btn" style="padding:10px 20px;font-size:14px" data-act="goCheckout" ${n?'':'disabled'}>Proceed</button>
    </div>
  </div>`;
}

/* ---------- HOST ---------- */
function miniRing(ms){
  const C=2*Math.PI*21;const frac=Math.max(0,ms)/HOLD_MS;const urgent=ms<60000;
  return `<svg width="52" height="52" viewBox="0 0 52 52"><circle cx="26" cy="26" r="21" fill="none" stroke="#eee" stroke-width="3.5"/><circle cx="26" cy="26" r="21" fill="none" stroke="${urgent?'#d33':'var(--red)'}" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-frac)}" transform="rotate(-90 26 26)" class="sc-ring"/></svg>`;
}
function splitPayCard(perspective,friendObj){
  const left=S.deadline?S.deadline-Date.now():HOLD_MS;
  const paidCount=S.friends.filter(f=>f.stage==='paid').length+1;
  const totalPeople=S.friends.length+1;
  const shareAmt=perspective==='host'?S.hostShare:(friendObj?displayShare(friendObj):S.hostShare);

  const names=['Manasi'].concat(S.friends.map(f=>f.name));
  const avHtml=names.slice(0,6).map((n,i)=>{
    const isPaid=i===0||(S.friends[i-1]&&S.friends[i-1].stage==='paid');
    return `<div class="sc-av" style="background:${col(n)}${isPaid?'':';opacity:.35'}">${ini(n)}</div>`;
  }).join('')+(names.length>6?`<div class="sc-av" style="background:#555">+${names.length-6}</div>`:'');

  const paidList=S.showPaidList?`<div class="sc-paid-list">${[{name:'You (Manasi)',paid:true}].concat(S.friends.map(f=>({name:f.name,paid:f.stage==='paid'}))).map(p=>`<div style="display:flex;align-items:center;gap:8px;padding:3px 0;font-size:11px"><div style="width:16px;height:16px;border-radius:50%;display:grid;place-items:center;background:${p.paid?'var(--green)':'#e8e8e8'};flex:none">${p.paid?'<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>':'<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#bbb" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="2"/></svg>'}</div><span style="flex:1;color:${p.paid?'#333':'#aaa'}">${p.name}</span><span style="font-weight:600;font-size:10px;color:${p.paid?'var(--green)':'#ccc'}">${p.paid?'Paid':'Pending'}</span></div>`).join('')}</div>`:'';

  return `<div class="split-card">
    <div class="sc-head"><div class="bms-dot"></div><div class="sc-head-label">BookMyShow · Split Pay</div></div>
    <div class="sc-body">
      <div class="sc-movie">${MOVIE.title}</div>
      <div class="sc-meta">${MOVIE.lang} · Thu 4:30 PM · ${MOVIE.venue.split(':')[0]}</div>
      <div class="sc-mid">
        <div class="sc-share">
          <div class="sc-share-label">Your share</div>
          <div class="sc-share-amt">${inr(shareAmt)}</div>
        </div>
        ${S.phase==='sent'?`<div class="sc-clock">${miniRing(left)}<div class="sc-clock-text" data-timer>${mmss(left)}</div></div>`:''}
      </div>
    </div>
    <div class="sc-foot">
      <div class="sc-avatars">${avHtml}</div>
      <div class="sc-count">${paidCount} of ${totalPeople} paid</div>
    </div>
    ${perspective==='host'&&S.phase==='sent'?`<div class="sc-paid-toggle" data-act="togglePaidList">${paidCount} of ${totalPeople} paid <span style="font-size:16px;transform:rotate(${S.showPaidList?'180':'0'}deg);transition:.2s;display:inline-flex">${I.chevDown}</span></div>${paidList}`:''}
    ${perspective==='friend'&&friendObj&&['prompt','idle'].includes(friendObj.stage)?`<button class="sc-cta" data-act="fOpenPay">Pay ${inr(displayShare(friendObj))} →</button>`:''}
  </div>`;
}

function shareSheet(){
  const groups=GROUPS.map(g=>`
    <div class="sc-row" style="cursor:pointer" data-act="pickGroup" data-id="${g.id}">
      <div class="av lg" style="background:#6b9b78;font-size:16px">${g.dp}</div>
      <div style="flex:1;min-width:0"><div class="nm">${g.name}</div><div class="sm">${g.members.length+1} members</div></div>
      <span style="color:#aaa;font-size:18px">›</span>
    </div>`).join('');
  const contacts=CONTACTS.slice(0,6).map(c=>{
    const on=S.selectedContacts.has(c.id);
    return `<div class="sc-row" style="cursor:pointer" data-act="toggleContact" data-id="${c.id}">
      ${av(c.name,'lg')}
      <div style="flex:1;min-width:0"><div class="nm">${c.name}</div><div class="sm">+91 ${c.phone}</div></div>
      <div class="sc-check ${on?'on':''}">${on?'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>':''}</div>
    </div>`}).join('');
  const selCount=S.selectedContacts.size;
  return `<div class="scrim" data-act="closeShare" style="z-index:20"></div>
  <div class="share-sheet" style="z-index:21">
    <div class="grab"></div>
    <div style="padding:4px 20px 10px"><div class="mt" style="font-size:17px">Share payment link</div><div class="mut">Friends pay on Paytm · 10 min hold</div></div>
    <div class="share-opts">
      <div class="share-opt" data-act="shareWA"><div class="s-icon" style="background:#25d366">💬</div><div class="s-label">WhatsApp</div></div>
      <div class="share-opt"><div class="s-icon" style="background:#e1e1e1">🔗</div><div class="s-label">Copy link</div></div>
      <div class="share-opt"><div class="s-icon" style="background:#0088cc">✈️</div><div class="s-label">Telegram</div></div>
      <div class="share-opt"><div class="s-icon" style="background:#e1e1e1">💬</div><div class="s-label">SMS</div></div>
    </div>
    <div class="share-contacts">
      <div class="sc-title">GROUPS</div>
      ${groups}
      <div class="sc-title" style="margin-top:14px">CONTACTS${selCount?` · ${selCount} selected`:''}</div>
      ${contacts}
      ${selCount>=2?`<button class="btn block" style="margin-top:12px" data-act="sendToContacts">Send to ${selCount} contacts</button>`:''}
    </div>
  </div>`;
}

function hostConfirm(){
  return `<div class="appbar" style="color:var(--ink)">${I.back}<span>Confirm booking</span></div>
  <div class="scroll">
    <div class="card" style="padding:14px 14px 12px">
      <div class="row" style="align-items:flex-start"><div class="mt" style="font-size:19px">${MOVIE.title}</div><div style="font-size:17px;font-weight:600;color:var(--red)">${MOVIE.n} tickets</div></div>
      <div class="mut" style="color:#555;margin-top:4px;line-height:1.5">${MOVIE.when}<br>${MOVIE.lang}<br>${MOVIE.seats}<br>${MOVIE.venue} (${MOVIE.audi})</div>
    </div>
    <div class="card row" style="gap:10px"><div class="row" style="gap:10px;justify-content:flex-start"><div style="width:34px;height:34px;border-radius:8px;background:#e8eefb;display:grid;place-items:center;font-size:10px;font-weight:700;color:#1b4fa8">UPI</div><div><div style="font-weight:600;font-size:14px">Save up to ₹200.0</div><div class="mut">Paytm UPI</div></div></div><span class="btn ghost sm" style="pointer-events:none">Apply</span></div>
    <div class="card">
      <div class="row pr"><span style="color:#555">Ticket(s) price</span><span>₹3,000.00</span></div>
      <div class="row pr"><span style="color:#555">Convenience fees ⌄</span><span>₹354.00</span></div>
      <div class="hold-fee-row"><span>Seat-hold fee <span class="fee-q" data-act="showAbuseInfo">?</span></span><span>₹25.00 (refundable)</span></div>
      <div class="hr"></div>
      <div class="row pr" style="font-weight:600"><span>Order total</span><span>₹3,379.00</span></div>
    </div>
    <div class="split-trigger" data-act="openShare">
      <div class="ic">${splitIcon}</div>
      <div style="flex:1"><div class="st-title">Split Payment <span class="neon-tag">NEW</span></div><div class="st-sub">Share link · friends pay on Paytm</div></div>
      <span class="chevron">${I.chevDown}</span>
    </div>
    <div class="card"><div class="row"><b style="font-size:14px">Booking details sent to</b><span style="color:var(--red);font-size:13px;font-weight:600">Edit</span></div><div class="mut" style="color:#555;margin-top:4px">+91-98XXX XXXXX | name@example.com</div></div>
    <div class="mut" style="padding:2px 4px 8px">By proceeding, I express my consent to complete this transaction.</div>
  </div>
  <div class="bbar">
    <div><div class="mut" style="font-size:11px">${S.friends.length?'Your share':'Total'}</div><div style="font-size:22px;font-weight:700;color:var(--red)">${inr(S.hostShare)}</div>${S.friends.length?`<div class="mut" style="font-size:10px">of ${inr(MOVIE.total)} · +₹25 hold fee (you only)</div>`:`<div class="mut" style="font-size:10px">+₹25 hold fee (refundable)</div>`}</div>
    <button class="btn" style="flex:1;max-width:210px" data-act="${S.friends.length?'goPaySplit':'goPaySingle'}">${S.friends.length?'Pay & hold seats':'Continue'}</button>
  </div>`;
}

function waScreen(isSent){
  const isGroup=S.chatType==='group';
  const grp=S.selectedGroup?GROUPS.find(g=>g.id===S.selectedGroup):GROUPS[0];
  const chatName=isGroup?(grp?grp.name:'Group Chat'):'Split Pay Links';
  const dp=isGroup?`<div class="wa-dp grp" style="font-size:16px">${grp?grp.dp:'👥'}</div>`:`<div class="wa-dp">${ini('Manasi Madan')}</div>`;
  const status=isGroup?`${grp?grp.members.length+1:5} members`:'online';

  const pinnedBanner=S.pinned?`<div class="wa-pinned" data-act="scrollToCard">${I.pinFill}<div class="pin-text">📌 Split Pay · ${MOVIE.title} · ${inr(S.hostShare)} each</div></div>`:'';

  /* build chat messages */
  let msgs=`<div class="date-chip"><span>Today</span></div>`;
  if(isGroup){
    msgs+=`<div class="bubble recv"><div class="b-inner"><div class="b-name" style="color:${col('Kabir Shah')}">Kabir Shah</div>Bro booked the tickets?? 🎬<div class="b-time">3:58 PM</div></div></div>`;
    msgs+=`<div class="bubble sent"><div class="b-inner">Yes! 10 seats for Ramayana 🔥<div class="b-time">3:59 PM <span class="b-ticks">✓✓</span></div></div></div>`;
    msgs+=`<div class="bubble sent"><div class="b-inner">Everyone pay up, here's the link 👇<div class="b-time">4:00 PM <span class="b-ticks">✓✓</span></div></div></div>`;
  } else {
    msgs+=`<div class="bubble sent"><div class="b-inner">Hey! Booked Ramayana tickets, sending you the split pay link 🎬<div class="b-time">4:00 PM <span class="b-ticks">✓✓</span></div></div></div>`;
  }
  /* the split pay card as a sent bubble */
  msgs+=`<div class="bubble sent" id="splitMsg"><div class="b-inner card-bubble" style="overflow:hidden;border-radius:10px">
    <button class="sc-pin ${S.pinned?'pinned':''}" data-act="togglePin" title="${S.pinned?'Unpin':'Pin'} message">${S.pinned?I.pinFill:I.pin}</button>
    ${splitPayCard('host')}
    <div style="padding:4px 8px 4px;text-align:right"><span class="b-time" style="float:none">4:01 PM <span class="b-ticks">✓✓</span></span></div>
  </div></div>`;

  if(isGroup){
    if(S.friends.some(f=>f.stage==='paid')){
      const paidNames=S.friends.filter(f=>f.stage==='paid').map(f=>f.name.split(' ')[0]);
      paidNames.forEach(n=>{
        msgs+=`<div class="bubble recv"><div class="b-inner"><div class="b-name" style="color:${col(n)}">${n}</div>Done! Paid ✅<div class="b-time">4:03 PM</div></div></div>`;
      });
    }
  }

  return `<div class="screen wa-screen">${sb(true)}
    <div class="wa-header">
      <span class="wa-back">${I.backW}</span>
      ${dp}
      <div class="wa-info"><div class="wa-name">${chatName}</div><div class="wa-status">${status}</div></div>
      <div class="wa-icons">${I.waVideo} ${I.waPhone} ${I.waDots}</div>
    </div>
    ${pinnedBanner}
    <div class="wa-chat">${msgs}</div>
    <div class="wa-compose">
      ${I.emoji}
      ${I.attach}
      <div class="wa-input">Message</div>
      ${I.mic}
    </div>
  </div>`;
}

function hostPay(){
  const amt=S.payMode==='cover'?remaining():S.hostShare;
  const split=S.payMode==='split';
  return `<div class="paybg">
    <div class="paytop"><div style="width:80px;height:80px;border-radius:50%;background:#b0182e;margin:0 auto 12px;display:grid;place-items:center;color:#fff;font-size:11px">bookmyshow</div>
    <div style="font-size:20px;font-weight:700">Bookmyshow <span style="color:#1a8fd8">✔</span></div><div style="font-size:14px;margin-top:4px">bookmyshow@yespay</div>
    <div style="font-size:52px;font-weight:700;margin-top:30px">${inr(amt)}</div></div>
    <div class="sheet" style="animation:none;padding:14px 16px 16px">
      <div class="grab"></div>
      <div class="mt" style="font-size:19px;margin:8px 0 4px">Pay ${inr(amt)} from</div>
      ${split?`<div class="mut" style="margin-bottom:2px">Your share. Link goes live once this succeeds.</div>`:S.payMode==='cover'?`<div class="mut">Covering the unpaid share.</div>`:''}
      <div class="pay-opt on"><div style="width:34px;height:34px;border-radius:50%;border:3px solid #0b3d91;display:grid;place-items:center"><i style="width:8px;height:8px;border-radius:50%;background:#0b3d91"></i></div><div><div style="font-size:17px;font-weight:600">SBI Bank</div><div style="font-size:13px;color:var(--mute)">Savings A/c: 6704</div></div><span style="margin-left:auto;color:#0b3d91;font-size:22px">●</span></div>
      <div class="pay-cta" style="margin-top:14px" data-act="hostPayGo">${S.payBusy?'<span class="spinner"></span> Processing…':I.shieldw+' Pay '+inr(amt)}</div>
    </div>
  </div>`;
}

const remaining=()=>MOVIE.total-paidAmt();
function ring(ms){const C=2*Math.PI*52;const frac=Math.max(0,ms)/HOLD_MS;return `<svg width="120" height="120" viewBox="0 0 132 132"><circle cx="66" cy="66" r="52" fill="none" stroke="#eee" stroke-width="9"/><circle id="ringc" cx="66" cy="66" r="52" fill="none" stroke="${ms<60000?'#d33':'var(--red)'}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-frac)}" transform="rotate(-90 66 66)"/></svg>`}

function hostWaiting(){
  const left=S.deadline-Date.now();
  const rem=remaining();
  const rows=S.friends.filter(f=>!f.coveredBy).map(f=>{const [lab,c]=hostLabel[f.stage]||['','n'];
    let act='';
    if(f.stage==='prompt')act=`<button class="btn ghost sm" style="padding:6px 9px;font-size:11px" data-act="remind" data-id="${f.id}">Remind</button>`;
    if(f.stage==='declined')act=`<button class="btn ghost sm" style="padding:6px 9px;font-size:11px" data-act="resend" data-id="${f.id}">Re-send</button>`;
    const covers=f.covers||[];
    const pill=covers.length?`<span class="cover-pill" data-act="openCover" data-id="${f.id}" title="Also paying for ${covers.map(id=>{const c=S.friends.find(x=>x.id===id);return c?c.name.split(' ')[0]:''}).join(', ')}">🎟 ×${1+covers.length}</span>`:'';
    const addBtn=f.stage==='prompt'?`<button class="add-cover" data-act="openCover" data-id="${f.id}" title="Let ${f.name.split(' ')[0]} pay for someone else too">+</button>`:'';
    return `<div class="prow"><div style="display:flex;align-items:center;gap:11px;flex:1;min-width:0">${av(f.name,'lg')}<div style="flex:1;min-width:0"><div class="nm">${f.name}</div><div class="sm" style="display:flex;align-items:center;gap:5px;flex-wrap:wrap">${inr(displayShare(f))}${pill}</div></div></div><div class="prow-actions">${act}<span class="chip ${c}">${lab}</span>${addBtn}</div></div>`}).join('');
  return `<div class="appbar"><span style="margin-left:6px">Waiting for friends</span><button style="margin-left:auto;font-size:12px;font-weight:600;color:var(--wa2)" data-act="goWA">Open WhatsApp</button></div>
  <div class="scroll">
    <div class="card" style="text-align:center">
      <div style="position:relative;width:120px;height:120px;margin:0 auto" id="ringwrap">${ring(left)}<div style="position:absolute;inset:0;display:grid;place-items:center"><div><div data-timer style="font-size:28px;font-weight:700;font-variant-numeric:tabular-nums">${mmss(left)}</div><div class="mut" style="font-size:10px">seats held</div></div></div></div>
      <div style="font-weight:600;margin-top:8px;font-size:15px">${MOVIE.title} · ${MOVIE.range}</div>
      <div class="mut" style="font-size:12px">Link shared on WhatsApp · waiting for payments</div>
    </div>
    <div class="card">
      <div class="row"><b style="font-size:14px">${inr(paidAmt())} of ${inr(MOVIE.total)}</b><span class="mut">${S.friends.filter(f=>f.stage==='paid').length+1}/${S.friends.length+1} paid</span></div>
      <div class="bar" style="margin-top:8px"><i style="width:${paidAmt()/MOVIE.total*100}%"></i></div>
      <div class="prow" style="margin-top:4px">${av('Manasi Madan','lg')}<div style="flex:1"><div class="nm">You</div><div class="sm">${inr(S.hostShare)}</div></div><span class="chip g">${checkSvg}</span></div>
      ${rows}
    </div>
    <div class="info">${I.shield}<div>Friends pay through the shared link on Paytm. If someone doesn't pay in time you can cover their share or release seats.</div></div>
  </div>
  <div style="flex:none;background:#fff;border-top:1px solid var(--line);padding:10px 14px 12px">
    <button class="btn block" data-act="cover" ${rem>0?'':'disabled'}>Pay remaining ${inr(rem)} myself</button>
    <button class="btn block" style="background:none;color:#777;font-weight:600;padding:8px;font-size:13px;margin-top:2px" data-act="askRelease">Release seats &amp; refund</button>
  </div>`;
}
function coverDialog(id){
  const f=S.friends.find(x=>x.id===id);if(!f)return'';
  const covers=f.covers||[];
  const cands=coverCandidates(id);
  const coveredRows=covers.map(cid=>{const c=S.friends.find(x=>x.id===cid);if(!c)return'';return `<div class="cover-row">${av(c.name,'lg')}<div style="flex:1;min-width:0"><div class="nm" style="font-size:13px">${c.name}</div><div class="sm">${inr(c.share)}</div></div><button class="cover-rm" data-act="uncover" data-id="${c.id}" data-fid="${id}" title="Remove">×</button></div>`}).join('');
  const candRows=cands.length?cands.map(c=>`<button class="cover-cand" data-act="pickCover" data-id="${c.id}" data-fid="${id}">${av(c.name,'lg')}<div style="flex:1;min-width:0;text-align:left"><div class="nm" style="font-size:13px">${c.name}</div><div class="sm">${inr(c.share)}${c.stage==='declined'?' · declined':''}</div></div><span style="color:var(--red);font-size:13px;font-weight:700">+ Add</span></button>`).join(''):'<div class="mut" style="padding:6px 0">No one else left to add.</div>';
  return `<div class="scrim" style="z-index:29" data-act="closeCover"></div>
  <div class="dialog" style="text-align:left;z-index:30;max-height:80%;overflow-y:auto">
    <h4 style="margin-top:0">${f.name.split(' ')[0]}'s payment covers</h4>
    <div class="mut" style="margin-bottom:10px">Let them pay for a friend who's stuck, in one go.</div>
    <div class="cover-row">${av(f.name,'lg')}<div style="flex:1;min-width:0"><div class="nm" style="font-size:13px">${f.name} (themself)</div><div class="sm">${inr(f.share)}</div></div><span class="chip n">Always</span></div>
    ${coveredRows}
    <div class="hr" style="margin:10px 0"></div>
    <div style="font-size:12px;font-weight:600;color:#555;margin-bottom:4px">Add someone else</div>
    ${candRows}
    <div class="hr" style="margin:10px 0"></div>
    <div class="row pr" style="font-weight:700"><span>Total for ${f.name.split(' ')[0]}</span><span>${inr(displayShare(f))}</span></div>
    <button class="btn grey block" style="margin-top:10px" data-act="closeCover">Done</button>
  </div>`;
}

function hostConfirmed(){
  const rows=[`<div class="row pr"><span>You</span><span>${inr(S.hostShare+(S.coverAmt||0))} <span class="chip g">${checkSvg}</span></span></div>`].concat(S.friends.filter(f=>!f.coveredBy).map(f=>{const paid=f.stage==='paid';const covers=f.covers||[];const nm=f.name+(covers.length?` <span class="cover-pill" style="margin-left:4px">🎟 ×${1+covers.length}</span>`:'');return `<div class="row pr"><span>${nm}</span><span>${inr(displayShare(f))} ${paid?`<span class="chip g">${checkSvg}</span>`:'<span class="chip n">Covered</span>'}</span></div>`})).join('');
  return `<div class="scroll" style="padding-top:26px;text-align:center">
    <div class="tick" style="margin:10px auto 14px">${I.check}</div>
    <div style="font-size:22px;font-weight:700">Booking confirmed</div>
    <div class="mut" style="margin-top:4px">M-Ticket sent to +91-98XXX XXXXX</div>
    <div class="card" style="text-align:left;margin-top:18px">
      <div class="mt">${MOVIE.title}</div><div class="mut" style="color:#555;margin-top:4px;line-height:1.5">${MOVIE.when}<br>${MOVIE.lang} · ${MOVIE.n} seats<br>${MOVIE.range} · Premium<br>${MOVIE.venue}</div>
      <div class="hr" style="margin:10px 0"></div><div class="mut">Booking ID <b style="color:#333">BMS7K2Q9XD</b></div>
    </div>
    ${S.friends.length?`<div class="card" style="text-align:left"><b style="font-size:14px">Split summary</b><div style="margin-top:6px">${rows}</div></div>`:''}
    <button class="btn ghost block" data-act="reset">Restart prototype</button>
  </div>`;
}

function hostEnded(){
  const title=S.phase==='released'?'Seats released':'Time ran out';
  const sub=S.phase==='released'?'You released the seats. All payments are being refunded.':'Not everyone paid in time. Seats went back on sale.';
  const rows=[`<div class="row pr"><span>You</span><span>${inr(S.hostShare)}</span></div>`].concat(S.friends.filter(f=>f.refund).map(f=>`<div class="row pr"><span>${f.name}</span><span>${inr(f.share)}</span></div>`)).join('');
  const paidFriends=S.friends.filter(f=>f.stage==='paid');
  const canKeepPartial=S.phase==='expired'&&paidFriends.length>0&&paidFriends.length<S.friends.length;
  return `<div class="scroll" style="padding-top:26px;text-align:center">
    <div class="tick amber" style="margin:20px auto 14px">${I.clock}</div>
    <div style="font-size:22px;font-weight:700">${title}</div>
    <div class="mut" style="margin:4px 14px 0">${sub}</div>
    <div class="card" style="text-align:left;margin-top:18px"><b style="font-size:14px">Refunds to original UPI accounts</b><div style="margin-top:6px">${rows}</div><div class="mut" style="margin-top:6px">Usually within minutes, up to 3 working days.</div></div>
    <div class="info" style="margin-top:4px;background:#fff4e0;border:1px solid #ffe0b2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e65100" stroke-width="2" stroke-linecap="round" style="flex:none"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h0"/></svg><div style="color:#bf360c;font-size:12px">Your ₹25 hold fee was not refunded because the hold expired. Repeated expired holds may result in longer cooldowns.</div></div>
    ${canKeepPartial?`<div class="mut" style="margin-top:10px">${paidFriends.length} of ${S.friends.length} friends paid before the clock ran out.</div>`:''}
    <button class="btn block" style="margin-top:8px" data-act="tryCooldown">Pick seats again</button>
    ${canKeepPartial?`<button class="btn ghost block" style="margin-top:8px" data-act="keepPartial">See tickets for those who paid</button>`:''}
  </div>`;
}
function partialConfirmed(){
  const paidFriends=S.friends.filter(f=>f.stage==='paid');
  const unpaidFriends=S.friends.filter(f=>f.stage!=='paid');
  const confirmedCount=paidFriends.length+1,totalCount=S.friends.length+1;
  const confirmedRows=[`<div class="row pr"><span>You</span><span>${inr(S.hostShare)} <span class="chip g">${checkSvg}</span></span></div>`].concat(paidFriends.map(f=>`<div class="row pr"><span>${f.name}</span><span>${inr(f.share)} <span class="chip g">${checkSvg}</span></span></div>`)).join('');
  const unconfirmedRows=unpaidFriends.map(f=>`<div class="row pr flash-warn"><span>${f.name}</span><span class="chip r">Not confirmed</span></div>`).join('');
  return `<div class="scroll" style="padding-top:26px;text-align:center">
    <div class="tick" style="margin:10px auto 14px">${I.check}</div>
    <div style="font-size:22px;font-weight:700">Booking partially confirmed</div>
    <div class="mut" style="margin-top:4px">${confirmedCount} of ${totalCount} tickets confirmed · M‑Ticket sent for confirmed seats only</div>
    <div class="card" style="text-align:left;margin-top:18px">
      <div class="mt">${MOVIE.title}</div><div class="mut" style="color:#555;margin-top:4px;line-height:1.5">${MOVIE.when}<br>${MOVIE.lang} · ${confirmedCount} of ${MOVIE.n} seats confirmed<br>${MOVIE.venue}</div>
      <div class="hr" style="margin:10px 0"></div><div class="mut">Booking ID <b style="color:#333">BMS7K2Q9XD</b></div>
    </div>
    <div class="card" style="text-align:left"><b style="font-size:14px">Confirmed</b><div style="margin-top:6px">${confirmedRows}</div></div>
    ${unpaidFriends.length?`<div class="card" style="text-align:left;border-color:#f3c6c6"><b style="font-size:14px;color:#b23b3b">Not confirmed</b><div class="mut" style="margin:4px 0 8px">Their seats are released back on sale. Nothing was charged to them.</div>${unconfirmedRows}</div>`:''}
    <button class="btn ghost block" data-act="reset">Restart prototype</button>
  </div>`;
}

function renderHost(){
  const oldScroll=$('#host .scroll');
  const scrollTop=oldScroll?oldScroll.scrollTop:0;

  let h=sb(S.hostScreen==='pay'||S.hostScreen==='seats');
  if(S.hostScreen==='seats')h+=seatScreen();
  else if(S.hostScreen==='confirm'){
    let overlay=S.abuseInfo?`<div class="scrim" style="z-index:29" data-act="closeAbuseInfo"></div><div class="dialog" style="text-align:left;z-index:30"><div style="display:flex;align-items:center;gap:8px;margin-bottom:10px"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#43a047" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/></svg><b style="font-size:16px">Seat Hold Policy</b></div><div style="font-size:13px;color:#444;line-height:1.6"><p style="margin-bottom:8px"><b>Hold Fee:</b> ₹25 is charged to the organiser when seats are held. It's fully refunded when the booking completes.</p><p style="margin-bottom:8px"><b>If the hold expires:</b></p><ul style="padding-left:18px;margin-bottom:8px"><li>The ₹25 fee is not refunded</li><li>A 3-hour cooldown before you can hold again</li><li>Friends who already paid are refunded automatically</li></ul><p style="margin-bottom:8px"><b>Why?</b> Held seats are unavailable to other buyers. The fee and cooldown discourage holding without intent to pay, keeping the seat map accurate for everyone.</p><p style="color:#888;font-size:11px">The hold fee is charged only to the organiser and is not split among friends.</p></div><button class="btn block" style="margin-top:12px" data-act="closeAbuseInfo">Got it</button></div>`:'';
    h+=`<div class="screen">${hostConfirm()}${S.shareOpen?shareSheet():''}${overlay}</div>`;
  }
  else if(S.hostScreen==='pay')h+=`<div class="screen" style="background:#7a7a7a">${hostPay()}</div>`;
  else if(S.hostScreen==='whatsapp')h+=`${waScreen(true)}`;
  else if(S.hostScreen==='waiting')h+=`<div class="screen">${hostWaiting()}${S.dialog==='release'?`<div class="scrim" style="z-index:29"></div><div class="dialog"><h4>Release the seats?</h4><p>Seats go back on sale and ${inr(paidAmt())} already paid is refunded.</p><button class="btn block" data-act="doRelease">Release &amp; refund</button><button class="btn grey block" style="margin-top:8px" data-act="closeDialog">Keep waiting</button></div>`:''}${S.coverFor?coverDialog(S.coverFor):''}${S.toast?`<div class="toast">${S.toast}</div>`:''}</div>`;
  else if(S.hostScreen==='confirmed')h+=`<div class="screen">${hostConfirmed()}</div>`;
  else if(S.hostScreen==='partialConfirmed')h+=`<div class="screen">${partialConfirmed()}</div>`;
  else h+=`<div class="screen">${hostEnded()}${S.dialog==='cooldown'?`<div class="scrim" style="z-index:29" data-act="closeCooldown"></div><div class="dialog"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--red)" stroke-width="1.8" stroke-linecap="round" style="margin-bottom:8px"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 1.5M9.5 2.5h5"/></svg><h4>Cooldown active</h4><p>You can try booking again in <b style="color:var(--red)">3 hours</b>.<br><br>Expired seat holds affect availability for everyone. The cooldown helps ensure seats are held by people ready to pay.</p><button class="btn block" data-act="reset" style="margin-top:4px">Browse other showtimes</button><button class="btn grey block" data-act="closeCooldown" style="margin-top:8px">OK</button></div>`:''}</div>`;
  $('#host').innerHTML=h;

  const newScroll=$('#host .scroll');
  if(newScroll&&scrollTop)newScroll.scrollTop=scrollTop;
  /* auto-scroll WA chat to bottom */
  const waChat=$('#host .wa-chat');
  if(waChat)waChat.scrollTop=waChat.scrollHeight;
}

/* ---------- FRIEND ---------- */
const af=()=>S.friends.find(f=>f.id===S.active);

function friendHome(msg){
  const icons=[
    ['#34c759','📞','Phone'],['#5856d6','💬','Messages'],['#ff9500','📷','Camera'],['#007aff','🌐','Safari'],
    ['#ff3b30','🎵','Music'],['#5ac8fa','☁️','Weather'],['#ff2d55','🗺️','Maps'],['#30d158','💸','Pay'],
    ['#af52de','📅','Calendar'],['#ff6482','🏪','Store'],['#64d2ff','⚙️','Settings'],['#ffcc00','📝','Notes'],
    ['#ff9f0a','🎬','TV'],['#30b0c7','📘','Books'],['#8e8e93','📁','Files'],['#a2845e','🏠','Home'],
  ];
  const dockIcons=[['#30d158','📞'],['#5856d6','💬'],['#007aff','🌐'],['#ff9500','📷']];
  const grid=icons.map(ic=>`<div class="wp-cell"><div class="wp-icon" style="background:${ic[0]}">${ic[1]}</div><div class="wp-label">${ic[2]}</div></div>`).join('');
  const dock=dockIcons.map(ic=>`<i style="background:${ic[0]}">${ic[1]}</i>`).join('');
  return `<div class="screen home">${sb(true)}<div class="clock">4:02</div><div class="date">Thursday, 19 November</div><div class="wp-grid">${grid}</div><div class="wp-search">🔍 Search</div><div class="wp-dock">${dock}</div>${msg?`<div class="notif-lock" data-act="fOpenWA"><div class="nl-head"><div class="nl-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="#fff"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24z"/></svg></div><div class="nl-app">WhatsApp</div><div class="nl-time">now</div></div><div class="nl-title">${S.chatType==='group'?(GROUPS.find(g=>g.id===S.selectedGroup)||GROUPS[0]).name:'Manasi Madan'}</div><div class="nl-body">${msg}</div></div>`:''}</div>`;
}

function friendWA(f){
  const isGroup=S.chatType==='group';
  const grp=S.selectedGroup?GROUPS.find(g=>g.id===S.selectedGroup):GROUPS[0];
  const chatName=isGroup?(grp?grp.name:'Group Chat'):'Manasi Madan';
  const dp=isGroup?`<div class="wa-dp grp" style="font-size:16px">${grp?grp.dp:'👥'}</div>`:`${av('Manasi Madan','').replace('class="av"','class="wa-dp"')}`;
  const status=isGroup?`${grp?grp.members.length+1:5} members`:'online';

  const pinnedBanner=S.pinned?`<div class="wa-pinned">${I.pinFill}<div class="pin-text">📌 Split Pay · ${MOVIE.title} · ${inr(f.share)} each</div></div>`:'';

  let msgs=`<div class="date-chip"><span>Today</span></div>`;
  if(isGroup){
    msgs+=`<div class="bubble recv"><div class="b-inner"><div class="b-name" style="color:${col('Manasi Madan')}">Manasi Madan</div>Yes! 10 seats for Ramayana 🔥<div class="b-time">3:59 PM</div></div></div>`;
    msgs+=`<div class="bubble recv"><div class="b-inner"><div class="b-name" style="color:${col('Manasi Madan')}">Manasi Madan</div>Everyone pay up, here's the link 👇<div class="b-time">4:00 PM</div></div></div>`;
  } else {
    msgs+=`<div class="bubble recv"><div class="b-inner">Hey! Booked Ramayana tickets, sending you the split pay link 🎬<div class="b-time">4:00 PM</div></div></div>`;
  }
  /* received split card */
  msgs+=`<div class="bubble recv" id="splitMsgF"><div class="b-inner card-bubble" style="overflow:hidden;border-radius:10px">
    ${splitPayCard('friend',f)}
    <div style="padding:4px 8px 4px"><span class="b-time" style="float:none">4:01 PM</span></div>
  </div></div>`;

  if(f.stage==='paid'){
    msgs+=`<div class="bubble sent"><div class="b-inner">Done! Paid ✅<div class="b-time">4:03 PM <span class="b-ticks">✓✓</span></div></div></div>`;
  }

  return `<div class="screen wa-screen">${sb(true)}
    <div class="wa-header">
      <span class="wa-back">${I.backW}</span>
      ${dp}
      <div class="wa-info"><div class="wa-name">${chatName}</div><div class="wa-status">${status}</div></div>
      <div class="wa-icons">${I.waVideo} ${I.waPhone} ${I.waDots}</div>
    </div>
    ${pinnedBanner}
    <div class="wa-chat">${msgs}</div>
    <div class="wa-compose">
      ${I.emoji}
      ${I.attach}
      <div class="wa-input">Message</div>
      ${I.mic}
    </div>
  </div>`;
}

function friendPayPicker(f){
  /* BMS-styled payment method picker — step between WA and UPI PIN */
  return `<div class="screen" style="background:#f5f5f5">${sb()}
    <div class="appbar" style="background:var(--red);color:#fff;border-bottom:none">
      <span data-act="fBackWA" style="cursor:pointer">${I.backW}</span>
      <span style="font-weight:600">Pay your share</span>
    </div>
    <div class="scroll">
      <div class="card" style="text-align:center;padding:20px 14px 16px">
        <div style="width:52px;height:52px;border-radius:50%;background:var(--red);margin:0 auto 10px;display:grid;place-items:center;color:#fff;font-size:9px;font-weight:700;letter-spacing:.02em">BMS</div>
        <div style="font-size:13px;color:var(--mute)">BookMyShow Split Pay</div>
        <div style="font-size:36px;font-weight:700;color:var(--red);margin-top:4px">${inr(displayShare(f))}</div>
        ${(f.covers&&f.covers.length)?`<div class="mut" style="margin-top:2px">Includes ${f.covers.map(id=>{const c=S.friends.find(x=>x.id===id);return c?c.name.split(' ')[0]:''}).join(', ')}'s share</div>`:''}
      </div>
      <div class="card">
        <div style="font-size:13px;font-weight:600;margin-bottom:8px">Booking details</div>
        <div class="ptm-d-row"><span>Movie</span><span style="font-weight:600">${MOVIE.title}</span></div>
        <div class="ptm-d-row"><span>Show</span><span>Thu, 4:30 PM · 3D</span></div>
        <div class="ptm-d-row"><span>Venue</span><span>Cinepolis, Bhandup</span></div>
        <div class="ptm-d-row"><span>Seats</span><span>${MOVIE.range}</span></div>
        <div class="ptm-d-row"><span>Organiser</span><span>Manasi Madan</span></div>
        <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#a8680a;margin-top:8px"><span>⏰ Seats held for <b data-timer>${mmss(S.deadline-Date.now())}</b></span></div>
      </div>
      <div class="card">
        <div style="font-size:13px;font-weight:600;margin-bottom:10px">Choose payment method</div>
        <div class="ptm-method" data-act="fPayUPI" data-app="Paytm"><div class="pm-icon" style="background:#e8f4fd;color:#002970;font-size:11px">UPI</div><div style="flex:1"><div class="pm-name">Paytm UPI</div><div class="pm-sub">SBI Bank ••6704</div></div><span style="color:#aaa">›</span></div>
        <div class="ptm-method" data-act="fPayUPI" data-app="PhonePe"><div class="pm-icon" style="background:#f3e8fd;color:#6a2cb0;font-size:12px">P</div><div style="flex:1"><div class="pm-name">PhonePe</div><div class="pm-sub">Linked account</div></div><span style="color:#aaa">›</span></div>
        <div class="ptm-method" data-act="fPayUPI" data-app="GPay"><div class="pm-icon" style="background:#e8f6ec;color:#2e8b57;font-size:12px">G</div><div style="flex:1"><div class="pm-name">Google Pay</div><div class="pm-sub">Linked account</div></div><span style="color:#aaa">›</span></div>
      </div>
    </div>
  </div>`;
}
function paytmScreen(f){
  if(f.stage==='processing')return `<div class="screen ptm-screen">${sb()}<div class="center"><span class="spinner d" style="width:44px;height:44px;border-width:5px"></span><div style="margin-top:18px;font-weight:600">Processing payment…</div><div class="mut">Don't close the app</div></div></div>`;
  if(f.stage==='failed')return `<div class="screen ptm-screen">${sb()}
    <div class="ptm-header" style="background:#002970"><span class="wa-back">${I.backW}</span><div class="ptm-logo">Paytm</div></div>
    <div style="padding:30px 16px;text-align:center">
      <div style="width:56px;height:56px;border-radius:50%;background:#fdecea;display:grid;place-items:center;margin:0 auto"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d33" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg></div>
      <div style="font-size:20px;font-weight:700;margin-top:14px;color:#d33">Payment failed</div>
      <div class="mut" style="margin-top:6px">${f.failReason||'Transaction declined by bank. Please try again.'}</div>
      <div style="font-size:38px;font-weight:700;margin-top:18px">${inr(displayShare(f))}</div>
      <div class="mut" style="margin-top:4px">to BookMyShow</div>
    </div>
    <div style="padding:0 16px;display:flex;flex-direction:column;gap:8px">
      <button class="btn block" data-act="fRetryPay">Retry payment</button>
      <button class="btn grey block" data-act="fBackPrompt">Use different app</button>
    </div>
  </div>`;
  if(f.stage==='chooser')return friendPayPicker(f);
  if(f.stage==='upi'){
    const appName=f.app||'UPI';
    const appColor=f.app==='PhonePe'?'#6a2cb0':f.app==='GPay'?'#2e8b57':'#002970';
    const dots=[0,1,2,3].map(i=>`<i class="${i<(f.pin||'').length?'f':''}"></i>`).join('');
    const keys=['1','2','3','4','5','6','7','8','9','','0','⌫'].map(k=>k===''?'<button disabled style="background:#fafafa"></button>':`<button data-act="${k==='⌫'?'pinDel':'pinKey'}" data-k="${k}">${k}</button>`).join('');
    return `<div class="screen ptm-screen">${sb()}
      <div class="ptm-header" style="background:${appColor}"><span class="wa-back">${I.backW}</span><div class="ptm-logo">${appName}</div></div>
      <div class="ptm-pin">
        <div class="ptm-pin-title">Enter UPI PIN</div>
        <div class="ptm-pin-sub">Paying ${inr(displayShare(f))} to BookMyShow</div>
        <div class="pin">${dots}</div>
        <div class="mut" style="text-align:center;font-size:11px">Type any 4 digits</div>
      </div>
      <div class="keypad">${keys}</div>
    </div>`;
  }
  return friendPayPicker(f);
}

function friendResult(f){
  const manasi='Manasi';
  if(f.stage==='paid'&&f.refund&&(S.phase==='expired'||S.phase==='released'))return `<div class="screen">${sb()}<div class="center"><div class="tick amber">${I.clock}</div><div style="font-size:20px;font-weight:700">Booking didn't go through</div><div class="mut" style="margin-top:6px">${S.phase==='expired'?'The seat hold ran out':manasi+' released the seats'}. Your ${inr(f.share)} is being refunded.</div></div></div>`;
  if(f.stage==='paid'&&!f.refund&&S.phase==='expired')return `<div class="screen">${sb()}<div class="center"><div class="tick">${I.check}</div><div style="font-size:20px;font-weight:700">Your ticket is confirmed!</div><div class="mut" style="margin:6px 0 16px">The hold ran out for some others, but your payment went through in time — ${manasi} confirmed your seat anyway.</div></div></div>`;
  if(f.stage==='paid'){
    if(f.coveredBy){
      const payer=S.friends.find(x=>x.id===f.coveredBy);
      const payerName=payer?payer.name.split(' ')[0]:'A friend';
      return `<div class="screen">${sb()}<div class="center"><div class="tick">${I.check}</div><div style="font-size:20px;font-weight:700">${payerName} paid for you too! 🎉</div><div class="mut" style="margin:6px 0 16px">Your share of ${inr(f.share)} is covered — nothing to pay.</div><button class="btn ghost" data-act="fBackWA">Back to WhatsApp</button></div></div>`;
    }
    const amt=displayShare(f);
    const coverNote=(f.covers&&f.covers.length)?` (includes ${f.covers.map(id=>{const c=S.friends.find(x=>x.id===id);return c?c.name.split(' ')[0]:''}).join(', ')}'s share)`:'';
    if(S.phase==='confirmed')return `<div class="screen">${sb()}<div class="center"><div class="tick">${I.check}</div><div style="font-size:20px;font-weight:700">Booking confirmed</div><div class="mut" style="margin:6px 0 16px">You paid ${inr(amt)}${coverNote}. ${manasi} has the tickets.</div><button class="btn ghost" data-act="fBackWA">Back to WhatsApp</button></div></div>`;
    const paid=S.friends.filter(x=>x.stage==='paid').length+1;
    return `<div class="screen">${sb()}<div class="center"><div class="tick">${I.check}</div><div style="font-size:20px;font-weight:700">You paid ${inr(amt)}</div><div class="mut" style="margin:6px 0 16px">${coverNote?coverNote.replace(' (','').replace(')','.')+' ':''}Waiting for others — ${paid}/${S.friends.length+1} paid</div><div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#a8680a"><span>⏰ Held for <b data-timer>${mmss(S.deadline-Date.now())}</b></span></div><button class="btn ghost" style="margin-top:16px" data-act="fBackWA">Back to WhatsApp</button></div></div>`;
  }
  const map={declined:['red',I.xw,'Payment declined',`${manasi} was notified.`],
    cancelled:['grey',I.xw,'Cancelled',S.phase==='confirmed'?`${manasi} covered your share.`:`${manasi} released the seats.`],
    expired:['amber',I.clock,'Not confirmed','You didn\'t pay before the hold ended — this seat was released. Any partial payment will be refunded.']};
  const m=map[f.stage];
  return `<div class="screen">${sb()}<div class="center"><div class="tick ${m[0]}">${m[1]}</div><div style="font-size:20px;font-weight:700">${m[2]}</div><div class="mut" style="margin-top:6px">${m[3]}</div></div></div>`;
}

function renderFriend(){
  const f=af();let h;
  if(!f||S.phase==='draft'||f.stage==='idle'){
    const msg=S.phase==='sent'?'🎬 Split Pay: Pay '+inr(S.hostShare)+' for Ramayana':null;
    h=friendHome(msg);
  }else if(f.stage==='prompt'){
    h=friendWA(f);
  }else if(['chooser','upi','processing','failed'].includes(f.stage)){
    h=paytmScreen(f);
  }else h=friendResult(f);
  $('#friend').innerHTML=h;
  /* auto-scroll WA chat */
  const waChat=$('#friend .wa-chat');
  if(waChat)waChat.scrollTop=waChat.scrollHeight;
}

function renderTabs(){
  $('#ftabs').innerHTML=S.friends.length?S.friends.map(f=>{const st=S.phase==='draft'?'':(f.stage==='paid'?'paid':f.stage==='declined'?'declined':f.stage==='failed'?'declined':['chooser','upi','processing'].includes(f.stage)?'paying':f.stage==='prompt'?'pending':'');return `<button class="tab ${f.id===S.active?'on':''}" data-act="tab" data-id="${f.id}"><span class="dot ${st}"></span>${f.name.split(' ')[0]}</button>`}).join(''):'<span class="mut" style="font-size:12px">Share the link to see friend views</span>';
}
function renderSide(){
  let cur=0;
  if(S.hostScreen==='seats')cur=1;
  if(S.hostScreen==='confirm')cur=2;
  if(S.hostScreen==='pay')cur=3;
  if(S.hostScreen==='whatsapp')cur=4;
  if(S.hostScreen==='waiting'){const f=af();cur=f&&['chooser','upi','processing'].includes(f.stage)?6:5}
  if(S.phase==='confirmed'||S.hostScreen==='partialConfirmed')cur=7;
  const names=['Select seats from the seat map','Tap Split Payment on checkout','Share link on WhatsApp','Pay your own share to hold seats','Friends open link, pay on Paytm','Friend pays via UPI on Paytm','All paid: booking confirmed'];
  $('#side').innerHTML=`
  <section><h3>Flow</h3><ol class="steps">${names.map((n,i)=>`<li class="${i+1<cur||cur===7?'done':i+1===cur?'cur':''}">${n}</li>`).join('')}</ol></section>
  <section><h3>Demo controls</h3><div class="demo">
    <button class="pri" data-act="reset">↺ Restart</button>
    <button data-act="othersPay" ${S.phase==='sent'?'':'disabled style="opacity:.4"'}>Other friends pay</button>
    <button data-act="othersDecline" ${S.phase==='sent'?'':'disabled style="opacity:.4"'}>Other friends decline</button>
    <button data-act="skip" ${S.phase==='sent'?'':'disabled style="opacity:.4"'}>Jump to last 10 sec</button>
  </div><div class="note">Use tabs above the friend phone to switch who you're acting as.</div></section>
  <section><h3>Design decisions</h3><ul class="pts">
    <li><b>WhatsApp link share.</b> No in-app contact picker — organiser shares on WhatsApp where their group already lives.</li>
    <li><b>Paytm payment.</b> Friends pay through a familiar payments app, not inside BookMyShow.</li>
    <li><b>Pinnable message.</b> Split pay card can be pinned in the chat so it doesn't get buried by texts.</li>
    <li><b>Group-aware card.</b> Shows group avatars and payment progress — everyone sees who's paid.</li>
    <li><b>10-min hold, no extension.</b> Keeps inventory moving.</li>
    <li><b>Equal split only.</b> Deliberate trade-off — this variant optimises for speed over customisation. Unequal splits add a configuration step that fights the "share and go" ethos.</li>
    <li><b>Partial confirmation on expiry.</b> If the hold runs out with some — not all — friends paid, the host can choose to confirm tickets just for who paid instead of cancelling everyone; the rest flash as "Not confirmed" and their seats release.</li>
    <li><b>Pay-for-a-friend.</b> While waiting, tap + next to anyone to fold a stuck friend's equal share into theirs — one Paytm payment covers both.</li>
    <li><b>Theatre-side impact.</b> Held seats show as "Pending" on the seat map, keeping inventory transparent for the exhibitor. The 10-min cap + hold fee limit ghost-booking risk.</li>
  </ul></section>
  <section><h3>Why this variant</h3><div style="font-size:12px;color:#555;line-height:1.6">
    <p style="margin-bottom:6px"><b>WhatsApp link (this)</b> meets users where their group already lives — no need to add contacts inside BMS. Friends pay through Paytm, a familiar app. Trade-off: equal split only, and the organiser can't see real-time progress inside BMS.</p>
    <p style="margin-bottom:6px"><b>Inline widget (Proto 1)</b> keeps everything on the checkout page — zero navigation cost, lowest friction, with editable split amounts.</p>
    <p><b>Bottom drawer (Proto 2)</b> gives more room for the contact list and split amounts, making it easier to manage larger groups with custom amounts.</p>
  </div></section>`;
}
function addFriend(name,phone){
  if(S.friends.length>=MOVIE.n-1)return;
  const f={id:'f'+Date.now()+Math.random().toString(16).slice(2,5),name,phone,share:0,stage:'idle',pin:'',app:'',showDetails:false,failCount:0,covers:[],coveredBy:null};
  S.friends.push(f);if(!S.active)S.active=f.id;shares();
}
function sendRequests(){S.friends.forEach(f=>{if(f.stage==='idle')f.stage='prompt'});if(!af()||af().stage==='idle')S.active=S.friends[0].id}
function checkDone(){
  if(S.phase!=='sent')return;
  if(S.friends.every(f=>f.stage==='paid')){S.phase='confirmed';S.hostScreen='confirmed'}
}
function endHold(kind){
  S.phase=kind;S.hostScreen='ended';
  S.friends.forEach(f=>{if(f.stage==='paid')f.refund=true;else if(!['declined','cancelled'].includes(f.stage))f.stage=kind==='expired'?'expired':'cancelled'});
}
return {ROOTS, get S(){return S}, fresh, addFriend, sendRequests, shares, endHold, checkDone, cascadeCover, renderHost, friendHome, friendWA, paytmScreen, friendResult, renderFriend, GROUPS, CONTACTS, HOLD_MS, inr, displayShare};
})();
