/* Screen renderers extracted verbatim from 'BookMyShow Split Pay - Prototype 1.html'.
   Only change: $() resolves #host / #friend inside the journey's shadow roots. Driven by proto1-journey.js. */
window.Proto1 = (function(){
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
// pre-fill some taken seats randomly but deterministically
(function(){const s=42;let r=s;function rng(){r=(r*16807+0)%2147483647;return r/2147483647}
  for(let i=0;i<50;i++){const row=ROWS[Math.floor(rng()*ROWS.length)];const c=Math.floor(rng()*COLS)+1;
    const id=row+c;if(!'D6 D7 D8 D9 D10 D11 D12 D13 D14 D15'.split(' ').includes(id))TAKEN.add(id)}
})();
const PRESELECTED=new Set('D6 D7 D8 D9 D10 D11 D12 D13 D14 D15'.split(' '));
const PENDING=new Set('E3 E4 E5 F8 F9 F10 F11 G2 G3'.split(' '));// seats held by other split-pay groups

/* ---------- state ---------- */
let S;
function fresh(){S={
  friends:[],hostShare:MOVIE.total,hostScreen:'seats',sheet:null,query:'',
  phase:'draft',payMode:'single',payBusy:false,deadline:0,active:null,toast:'',dialog:null,detail:null,
  selectedSeats:new Set(PRESELECTED),splitOpen:false,abuseInfo:false,editingFriend:null,coverFor:null
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
 ext:'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5"/></svg>',
 timer:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a8680a" stroke-width="2.4" stroke-linecap="round" style="flex:none"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 1.5M9.5 2.5h5"/></svg>',
 chevDown:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>'
};
const sb=(dark)=>`<div class="sb ${dark?'dark':''}"><span>4:02 PM</span><span>5G ▮▮▮ 54%</span></div>`;
const splitIcon=`<div class="split-icon"><div class="sq"></div><div class="sq"></div><div class="sq"></div><div class="sq"></div></div>`;

/* ---------- SEAT SELECTION ---------- */
function seatScreen(){
  let rows='';
  for(const r of ROWS){
    let cells=`<span class="rl">${r}</span>`;
    for(let c=1;c<=COLS;c++){
      const id=r+c;
      const cls=TAKEN.has(id)?'taken':S.selectedSeats.has(id)?'sel':PENDING.has(id)?'pending':'avail';
      cells+=`<div class="seat ${cls}" data-act="toggleSeat" data-sid="${id}">${c}</div>`;
    }
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
function hostConfirm(){
  const n=S.friends.length;
  const isOpen=S.splitOpen;
  /* dropdown widget - collapsed or expanded inline */
  let friendRows='';
  if(n>0){
    friendRows=`<div style="margin-top:6px">
      <div class="sw-row">${av('Manasi Madan','lgw')}<div><div class="nm">You</div><div class="sm">Organiser · absorbs rounding</div></div><div class="amt">${inr(S.hostShare)}</div></div>
      ${S.friends.map(f=>`<div class="sw-row">${av(f.name,'lgw')}<div><div class="nm">${f.name}</div><div class="sm">+91 ${f.phone}</div></div>${S.editingFriend===f.id?`<input class="amt-edit" data-act="commitAmt" data-id="${f.id}" value="${(f.share/100).toFixed(0)}" type="number" min="1" inputmode="numeric" autofocus>`:`<div class="amt edit-tap" data-act="editAmt" data-id="${f.id}">${inr(f.share)} <span style="font-size:9px;color:#aaa">✎</span></div>`}<button class="sw-rm" data-act="rm" data-id="${f.id}">×</button></div>`).join('')}
    </div>`;
  }
  const addSection=isOpen?`
    <div class="sw-search">${I.search}<input id="q" placeholder="Name or mobile number" value="${S.query}" inputmode="text" autocomplete="off"></div>
    <div id="sugg">${suggestions()}</div>
    <div style="font-size:10.5px;color:#999;margin-top:6px;display:flex;gap:6px;align-items:flex-start">${I.shield}<span>You pay first. Friends get a request and pay with any UPI app. Seats held 10 min.</span></div>`:'';

  const widget=`
   <div class="splitw ${isOpen?'open':''}" ${!isOpen&&n===0?'data-act="toggleSplit"':''} ${!isOpen&&n===0?'style="cursor:pointer"':''}>
     <div class="sw-head" ${n>0||isOpen?'data-act="toggleSplit" style="cursor:pointer"':''}>
       <div class="ic">${splitIcon}</div>
       <div style="flex:1">
         <div class="sw-title">Split Payment ${n===0&&!isOpen?'<span class="neon-tag">NEW</span>':n>0?' · '+(n+1)+' people':''}</div>
         ${n===0&&!isOpen?'<div class="sw-sub">Tap to split with friends</div>':''}
       </div>
       <span class="chevron">${I.chevDown}</span>
     </div>
     <div class="sw-divider"></div>
     <div class="sw-body">
       ${friendRows}
       ${addSection}
     </div>
   </div>`;

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
    ${widget}
    <div class="card"><div class="row"><b style="font-size:14px">Booking details sent to</b><span style="color:var(--red);font-size:13px;font-weight:600">Edit</span></div><div class="mut" style="color:#555;margin-top:4px">+91-98XXX XXXXX | name@example.com</div></div>
    <div class="mut" style="padding:2px 4px 8px">By proceeding, I express my consent to complete this transaction.</div>
  </div>
  <div class="bbar">
    <div><div class="mut" style="font-size:11px">${n?'Your share':'Total'}</div><div style="font-size:22px;font-weight:700;color:var(--red)">${inr(S.hostShare)}</div>${n?`<div class="mut" style="font-size:10px">of ${inr(MOVIE.total)} · +₹25 hold fee (you only)</div>`:`<div class="mut" style="font-size:10px">+₹25 hold fee (refundable)</div>`}</div>
    <button class="btn" style="flex:1;max-width:210px" data-act="${n?'goPaySplit':'goPaySingle'}">${n?'Pay & send requests':'Continue'}</button>
  </div>`;
}
function suggestions(){
  const q=S.query.trim().toLowerCase();const digits=q.replace(/\D/g,'');
  const have=new Set(S.friends.map(f=>f.phone.replace(/\D/g,'')));
  let list=CONTACTS.filter(c=>!have.has(c.phone.replace(/\D/g,''))&&(!q||c.name.toLowerCase().includes(q)||(digits&&c.phone.replace(/\D/g,'').includes(digits))));
  let out='';
  if(S.friends.length>=MOVIE.n-1)return '<div style="font-size:11px;color:#999;padding:6px 0">Max reached (one per ticket).</div>';
  if(digits.length===10&&!have.has(digits)&&!/[a-z]/.test(q)){const f=digits.slice(0,5)+' '+digits.slice(5);out+=`<div class="sw-row">${av('#','lgw')}<div><div class="nm">+91 ${f}</div><div class="sm">SMS invite</div></div><button class="sw-add" data-act="addNum" data-n="${digits}">Add</button></div>`}
  out+=list.slice(0,3).map(c=>`<div class="sw-row">${av(c.name,'lgw')}<div><div class="nm">${c.name}</div><div class="sm">+91 ${c.phone}</div></div><button class="sw-add" data-act="addC" data-id="${c.id}">+ Add</button></div>`).join('');
  if(!out)out='<div style="font-size:11px;color:#999;padding:6px 0">No match. Enter a 10-digit number.</div>';
  return out;
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
      ${split?`<div class="mut" style="margin-bottom:2px">Your share. Friends get requests once this succeeds.</div>`:S.payMode==='cover'?`<div class="mut">Covering the unpaid share.</div>`:''}
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
    const canRemove=f.stage!=='paid';
    const rmBtn=canRemove?`<button class="x" data-act="rmWait" data-id="${f.id}" title="Remove">×</button>`:'';
    const covers=f.covers||[];
    const pill=covers.length?`<span class="cover-pill" data-act="openCover" data-id="${f.id}" title="Also paying for ${covers.map(id=>{const c=S.friends.find(x=>x.id===id);return c?c.name.split(' ')[0]:''}).join(', ')}">🎟 ×${1+covers.length}</span>`:'';
    const addBtn=f.stage==='prompt'?`<button class="add-cover" data-act="openCover" data-id="${f.id}" title="Let ${f.name.split(' ')[0]} pay for someone else too">+</button>`:'';
    return `<div class="prow"><div style="display:flex;align-items:center;gap:11px;flex:1;min-width:0">${av(f.name,'lg')}<div style="flex:1;min-width:0"><div class="nm">${f.name}</div><div class="sm" style="display:flex;align-items:center;gap:5px;flex-wrap:wrap">${inr(displayShare(f))}${pill}</div></div></div><div class="prow-actions">${act}<span class="chip ${c}">${lab}</span>${addBtn}${rmBtn}</div></div>`}).join('');
  return `<div class="appbar"><span style="margin-left:6px">Waiting for friends</span></div>
  <div class="scroll">
    <div class="card" style="text-align:center">
      <div style="position:relative;width:120px;height:120px;margin:0 auto" id="ringwrap">${ring(left)}<div style="position:absolute;inset:0;display:grid;place-items:center"><div><div data-timer style="font-size:28px;font-weight:700;font-variant-numeric:tabular-nums">${mmss(left)}</div><div class="mut" style="font-size:10px">seats held</div></div></div></div>
      <div style="font-weight:600;margin-top:8px;font-size:15px">${MOVIE.title} · ${MOVIE.range}</div>
      <div class="mut" style="font-size:12px">Seats held until the timer ends</div>
    </div>
    <div class="card">
      <div class="row"><b style="font-size:14px">${inr(paidAmt())} of ${inr(MOVIE.total)}</b><span class="mut">${S.friends.filter(f=>f.stage==='paid').length+1}/${S.friends.length+1} paid</span></div>
      <div class="bar" style="margin-top:8px"><i style="width:${paidAmt()/MOVIE.total*100}%"></i></div>
      <div class="prow" style="margin-top:4px">${av('Manasi Madan','lg')}<div style="flex:1"><div class="nm">You</div><div class="sm">${inr(S.hostShare)}</div></div><span class="chip g">${checkSvg}</span></div>
      ${rows}
    </div>
    <div class="info">${I.shield}<div>If someone doesn't pay in time you can cover their share or release seats for a refund.</div></div>
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
  /* save scroll position before re-render */
  const oldScroll=$('#host .scroll');
  const scrollTop=oldScroll?oldScroll.scrollTop:0;

  let h=sb(S.hostScreen==='pay'||S.hostScreen==='seats');
  if(S.hostScreen==='seats')h+=seatScreen();
  else if(S.hostScreen==='confirm'){
    let overlay='';
    if(S.dialog==='confirmNum')overlay=`<div class="scrim" style="z-index:29"></div><div class="dialog"><div style="font-size:28px;margin-bottom:4px">🤔</div><h4>Not in your contacts</h4><p>+91 ${S.pendingNum?S.pendingNum.slice(0,5)+' '+S.pendingNum.slice(5):''} doesn't seem to be in your contacts. Are you sure it's the right person?</p><button class="btn block" data-act="confirmAddNum">Yes, add them</button><button class="btn grey block" style="margin-top:8px" data-act="cancelAddNum">Cancel</button></div>`;
    if(S.abuseInfo)overlay+=`<div class="scrim" style="z-index:29" data-act="closeAbuseInfo"></div><div class="dialog" style="text-align:left;z-index:30"><div style="display:flex;align-items:center;gap:8px;margin-bottom:10px"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#43a047" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/></svg><b style="font-size:16px">Seat Hold Policy</b></div><div style="font-size:13px;color:#444;line-height:1.6"><p style="margin-bottom:8px"><b>Hold Fee:</b> ₹25 is charged to the organiser when seats are held. It's fully refunded when the booking completes.</p><p style="margin-bottom:8px"><b>If the hold expires:</b></p><ul style="padding-left:18px;margin-bottom:8px"><li>The ₹25 fee is not refunded</li><li>A 3-hour cooldown before you can hold again</li><li>Friends who already paid are refunded automatically</li></ul><p style="margin-bottom:8px"><b>Why?</b> Held seats are unavailable to other buyers. The fee and cooldown discourage holding without intent to pay, keeping the seat map accurate for everyone.</p><p style="color:#888;font-size:11px">The hold fee is charged only to the organiser and is not split among friends.</p></div><button class="btn block" style="margin-top:12px" data-act="closeAbuseInfo">Got it</button></div>`;
    h+=`<div class="screen">${hostConfirm()}${overlay}</div>`;
  }
  else if(S.hostScreen==='pay')h+=`<div class="screen" style="background:#7a7a7a">${hostPay()}</div>`;
  else if(S.hostScreen==='waiting')h+=`<div class="screen">${hostWaiting()}${S.dialog==='release'?`<div class="scrim" style="z-index:29"></div><div class="dialog"><h4>Release the seats?</h4><p>Seats go back on sale and ${inr(paidAmt())} already paid is refunded.</p><button class="btn block" data-act="doRelease">Release &amp; refund</button><button class="btn grey block" style="margin-top:8px" data-act="closeDialog">Keep waiting</button></div>`:''}${S.coverFor?coverDialog(S.coverFor):''}${S.toast?`<div class="toast">${S.toast}</div>`:''}</div>`;
  else if(S.hostScreen==='confirmed')h+=`<div class="screen">${hostConfirmed()}</div>`;
  else if(S.hostScreen==='partialConfirmed')h+=`<div class="screen">${partialConfirmed()}</div>`;
  else h+=`<div class="screen">${hostEnded()}${S.dialog==='cooldown'?`<div class="scrim" style="z-index:29" data-act="closeCooldown"></div><div class="dialog"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--red)" stroke-width="1.8" stroke-linecap="round" style="margin-bottom:8px"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 1.5M9.5 2.5h5"/></svg><h4>Cooldown active</h4><p>You can try booking again in <b style="color:var(--red)">3 hours</b>.<br><br>Expired seat holds affect availability for everyone. The cooldown helps ensure seats are held by people ready to pay.</p><button class="btn block" data-act="reset" style="margin-top:4px">Browse other showtimes</button><button class="btn grey block" data-act="closeCooldown" style="margin-top:8px">OK</button></div>`:''}</div>`;
  $('#host').innerHTML=h;

  /* restore scroll position after re-render */
  const newScroll=$('#host .scroll');
  if(newScroll&&scrollTop)newScroll.scrollTop=scrollTop;

  const q=$('#q');if(q){q.addEventListener('input',e=>{S.query=e.target.value;$('#sugg').innerHTML=suggestions()});}
  const ae=$('.amt-edit');if(ae){ae.focus();ae.select();ae.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();act('commitAmt',{id:ae.dataset.id})}});ae.addEventListener('blur',()=>{setTimeout(()=>act('commitAmt',{id:ae.dataset.id}),100)})}
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
  return `<div class="screen home">${sb(true)}<div class="clock">4:02</div><div class="date">Thursday, 19 November</div><div class="wp-grid">${grid}</div><div class="wp-search">🔍 Search</div><div class="wp-dock">${dock}</div>${msg?`<div style="position:absolute;left:20px;right:20px;bottom:72px;background:rgba(0,0,0,.45);backdrop-filter:blur(10px);padding:11px 16px;border-radius:14px;font-size:13px;text-align:center;z-index:3;border:1px solid rgba(255,255,255,.1)">${msg}</div>`:''}</div>`;
}
function promptCard(f){
  const left=S.deadline-Date.now();
  const n=S.friends.length+1;
  return `
  <div class="prompt ${f.nudge?'nudge':''}">
    <div style="width:32px;height:4px;border-radius:4px;background:#ddd;margin:6px auto 0;flex:none"></div>
    <div class="pb">
      <div class="from-row">
        <div class="logo-sm">${I.ticket}</div>
        <div class="meta"><div class="who">Manasi Madan</div><div class="what">via BookMyShow</div></div>
        <div class="amount-lg">${inr(displayShare(f))}</div>
      </div>
      <div class="details-line">
        <b>${MOVIE.title}</b> · ${MOVIE.lang} · Thu 4:30 PM<br>
        Cinepolis, Bhandup · ${MOVIE.range} · Split ${n} ways${(f.covers&&f.covers.length)?` · includes ${f.covers.map(id=>{const c=S.friends.find(x=>x.id===id);return c?c.name.split(' ')[0]:''}).join(', ')}'s share`:''}
        <button style="color:#1a73e8;font-size:11px;font-weight:600;background:none;border:0;cursor:pointer;margin-top:2px;display:flex;align-items:center;gap:3px" data-act="fDetails">View full booking ${I.ext}</button>
      </div>
      <div class="expiry-line">${I.timer}<span>Held for <b data-timer>${mmss(left)}</b></span></div>
    </div>
    <div class="pf">
      <button class="btn block" style="padding:12px;font-size:14px" data-act="fPay">Pay with UPI</button>
      <div style="display:flex;gap:6px;margin-top:5px">
        <button class="btn grey" style="flex:1;padding:9px;font-size:12px" data-act="fDecline">Not now</button>
        <button style="padding:9px;font-size:11px;color:#aaa;background:none;border:0;cursor:pointer" data-act="fReport">Report</button>
      </div>
    </div>
  </div>`;
}
function detailsSheet(){
  const rows=[`<div class="row pr"><span>Manasi (organiser)</span><span>${inr(S.hostShare)} <span class="chip g">${checkSvg}</span></span></div>`].concat(S.friends.map(f=>{const [lab,c]=hostLabel[f.stage]||['','n'];const dispLab=lab===checkSvg?checkSvg:lab.replace('Sent','Pending');return `<div class="row pr"><span>${f.name}${f.id===S.active?' (you)':''}</span><span>${inr(f.share)} <span class="chip ${c}">${dispLab}</span></span></div>`})).join('');
  return `<div class="scrim" style="z-index:30" data-act="fCloseDetails"></div>
  <div class="det-sheet" style="z-index:31;max-height:88%">
    <div style="width:44px;height:4px;border-radius:4px;background:#ddd;margin:8px auto 4px;flex:none"></div>
    <div style="overflow-y:auto;padding:6px 16px 12px;flex:1">
      <div style="font-size:11px;color:#888;background:#f3f4f6;border-radius:8px;padding:6px 10px;margin:4px 0 10px">🔒 bookmyshow.com/split-pay/7k2q9xd</div>
      <div class="mt" style="font-size:19px">${MOVIE.title}</div>
      <div class="mut" style="color:#555;margin-top:4px;line-height:1.55">${MOVIE.lang}<br>${MOVIE.when}<br>${MOVIE.venue}<br>Seats ${MOVIE.seats.replace('PREMIUM - ','')}</div>
      <div class="hr" style="margin:12px 0"></div>
      <b style="font-size:14px">Split breakdown</b>
      <div style="margin-top:4px">${rows}</div>
      <div class="hr"></div>
      <div class="row pr" style="font-weight:700"><span>Order total</span><span>${inr(MOVIE.total)}</span></div>
    </div>
    <div style="padding:10px 16px 14px;border-top:1px solid var(--line);flex:none"><button class="btn grey block" data-act="fCloseDetails">Back</button></div>
  </div>`;
}
function chooser(f){
  const apps=[['Paytm','#1b5fd0'],['PhonePe','#6a2cb0'],['Google Pay','#2e8b57'],['BHIM','#e07b00']];
  return `<div class="scrim" style="z-index:30"></div>
  <div class="sheet" style="z-index:31">
    <div class="grab"></div>
    <div class="sh-body">
      <div class="mt" style="margin:4px 0 2px">Pay ${inr(displayShare(f))} using</div>
      <div class="mut">Choose a UPI app</div>
      ${apps.map(a=>`<button class="prow" style="width:100%;text-align:left" data-act="fApp" data-app="${a[0]}"><div class="av lg" style="background:${a[1]};border-radius:12px">${a[0][0]}</div><div class="nm">${a[0]}</div><span style="margin-left:auto;color:#aaa">›</span></button>`).join('')}
    </div>
    <div style="padding:0 16px 14px"><button class="btn grey block" data-act="fBackPrompt">Cancel</button></div>
  </div>`;
}
function upiApp(f){
  const dots=[0,1,2,3].map(i=>`<i class="${i<(f.pin||'').length?'f':''}"></i>`).join('');
  const keys=['1','2','3','4','5','6','7','8','9','','0','⌫'].map(k=>k===''?'<button disabled style="background:#fafafa"></button>':`<button data-act="${k==='⌫'?'pinDel':'pinKey'}" data-k="${k}">${k}</button>`).join('');
  if(f.stage==='processing')return `<div class="screen upiapp">${sb()}<div class="center"><span class="spinner d" style="width:44px;height:44px;border-width:5px"></span><div style="margin-top:18px;font-weight:600">Processing payment…</div><div class="mut">Don't close the app</div></div></div>`;
  if(f.stage==='failed')return `<div class="screen upiapp">${sb()}
    <div style="background:#0f2f66;color:#fff;padding:14px 16px"><div style="font-size:11px;opacity:.8">${f.app} · simulated UPI</div><div style="font-size:16px;font-weight:600;margin-top:2px">Payment to Bookmyshow</div></div>
    <div style="padding:30px 16px;text-align:center">
      <div style="width:56px;height:56px;border-radius:50%;background:#fdecea;display:grid;place-items:center;margin:0 auto"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d33" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg></div>
      <div style="font-size:20px;font-weight:700;margin-top:14px;color:#d33">Payment failed</div>
      <div class="mut" style="margin-top:6px">${f.failReason||'Transaction declined by bank. Please try again.'}</div>
      <div style="font-size:38px;font-weight:700;margin-top:18px">${inr(displayShare(f))}</div>
      <div class="mut" style="margin-top:4px">to Bookmyshow</div>
    </div>
    <div style="padding:0 16px;display:flex;flex-direction:column;gap:8px">
      <button class="btn block" data-act="fRetryPay">Retry payment</button>
      <button class="btn grey block" data-act="fBackPrompt">Use different app</button>
    </div>
  </div>`;
  return `<div class="screen upiapp">${sb()}
    <div style="background:#0f2f66;color:#fff;padding:14px 16px"><div style="font-size:11px;opacity:.8">${f.app} · simulated UPI</div><div style="font-size:16px;font-weight:600;margin-top:2px">Paying Bookmyshow <span style="color:#7fd1ff">✔</span></div><div style="font-size:11px;opacity:.8">bookmyshow@yespay</div></div>
    <div style="padding:20px 16px 6px;text-align:center"><div style="font-size:38px;font-weight:700">${inr(displayShare(f))}</div><div class="mut" style="margin-top:4px">From ${f.name.split(' ')[0]}'s account · SBI ••6704</div></div>
    <div style="text-align:center;font-size:14px;margin-top:18px;font-weight:600">Enter UPI PIN</div>
    <div class="pin">${dots}</div>
    <div class="mut" style="text-align:center;font-size:11px">Type any 4 digits</div>
    <div class="keypad">${keys}</div>
  </div>`;
}
function friendResult(f){
  const manasi='Manasi';
  if(f.stage==='paid'&&f.refund&&(S.phase==='expired'||S.phase==='released'))return `<div class="screen">${sb()}<div class="center"><div class="tick amber">${I.clock}</div><div style="font-size:20px;font-weight:700">Booking didn't go through</div><div class="mut" style="margin-top:6px">${S.phase==='expired'?'The seat hold ran out':manasi+' released the seats'}. Your ${inr(f.share)} is being refunded.</div></div></div>`;
  if(f.stage==='paid'&&!f.refund&&S.phase==='expired')return `<div class="screen">${sb()}<div class="center"><div class="tick">${I.check}</div><div style="font-size:20px;font-weight:700">Your ticket is confirmed!</div><div class="mut" style="margin:6px 0 16px">The hold ran out for some others, but your payment went through in time — ${manasi} confirmed your seat anyway.</div></div></div>`;
  if(f.stage==='paid'){
    if(f.coveredBy){
      const payer=S.friends.find(x=>x.id===f.coveredBy);
      const payerName=payer?payer.name.split(' ')[0]:'A friend';
      return `<div class="screen">${sb()}<div class="center"><div class="tick">${I.check}</div><div style="font-size:20px;font-weight:700">${payerName} paid for you too! 🎉</div><div class="mut" style="margin:6px 0 16px">Your share of ${inr(f.share)} is covered — nothing to pay.</div></div></div>`;
    }
    const amt=displayShare(f);
    const coverNote=(f.covers&&f.covers.length)?` (includes ${f.covers.map(id=>{const c=S.friends.find(x=>x.id===id);return c?c.name.split(' ')[0]:''}).join(', ')}'s share)`:'';
    if(S.phase==='confirmed')return `<div class="screen">${sb()}<div class="center"><div class="tick">${I.check}</div><div style="font-size:20px;font-weight:700">Booking confirmed</div><div class="mut" style="margin:6px 0 16px">You paid ${inr(amt)}${coverNote}. ${manasi} has the tickets.</div></div></div>`;
    const paid=S.friends.filter(x=>x.stage==='paid').length+1;
    return `<div class="screen">${sb()}<div class="center"><div class="tick">${I.check}</div><div style="font-size:20px;font-weight:700">You paid ${inr(amt)}</div><div class="mut" style="margin:6px 0 16px">${coverNote?coverNote.replace(' (','').replace(')','.')+' ':''}Waiting for others — ${paid}/${S.friends.length+1} paid</div><div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#a8680a">${I.timer}<span>Held for <b data-timer>${mmss(S.deadline-Date.now())}</b></span></div></div></div>`;
  }
  const map={declined:['red',I.xw,'Request declined',`${manasi} was told you can't pay right now.`],
    cancelled:['grey',I.xw,'Cancelled',S.phase==='confirmed'?`${manasi} covered your share.`:`${manasi} released the seats.`],
    expired:['amber',I.clock,'Not confirmed','You didn\'t pay before the hold ended — this seat was released. Any partial payment will be refunded.']};
  const m=map[f.stage];
  return `<div class="screen">${sb()}<div class="center"><div class="tick ${m[0]}">${m[1]}</div><div style="font-size:20px;font-weight:700">${m[2]}</div><div class="mut" style="margin-top:6px">${m[3]}</div></div></div>`;
}
function renderFriend(){
  const f=af();let h;
  if(!f||S.phase==='draft'||f.stage==='idle'){
    h=friendHome(S.friends.length?'Waiting for organiser to pay…':'Add friends on the left to see their view.');
  }else if(['prompt','chooser'].includes(f.stage)){
    h=friendHome()+promptCard(f)+(f.showDetails?detailsSheet():'')+(f.stage==='chooser'?chooser(f):'');
  }else if(['upi','processing','failed'].includes(f.stage)){
    h=upiApp(f);
  }else h=friendResult(f);
  $('#friend').innerHTML=h;if(f)f.nudge=false;
}
function renderTabs(){
  $('#ftabs').innerHTML=S.friends.length?S.friends.map(f=>{const st=S.phase==='draft'?'':(f.stage==='paid'?'paid':f.stage==='declined'?'declined':f.stage==='failed'?'declined':['chooser','upi','processing'].includes(f.stage)?'paying':f.stage==='prompt'?'pending':'');return `<button class="tab ${f.id===S.active?'on':''}" data-act="tab" data-id="${f.id}"><span class="dot ${st}"></span>${f.name.split(' ')[0]}</button>`}).join(''):'<span class="mut" style="font-size:12px">No friends added yet</span>';
}
function renderSide(){
  let cur=0;
  if(S.hostScreen==='seats')cur=1;
  if(S.hostScreen==='confirm')cur=S.friends.length?3:2;
  if(S.hostScreen==='pay')cur=4;
  if(S.hostScreen==='waiting'){const f=af();cur=f&&['chooser','upi','processing'].includes(f.stage)?6:5}
  if(S.phase==='confirmed'||S.hostScreen==='partialConfirmed')cur=7;
  const names=['Select seats from the seat map','Review booking, tap Split Payment','Add friends from contacts or by number','Pay your own share via UPI','Friends get a compact popup alert','Friend pays in their UPI app','All paid: booking confirmed'];
  $('#side').innerHTML=`
  <section><h3>Flow</h3><ol class="steps">${names.map((n,i)=>`<li class="${i+1<cur||cur===7?'done':i+1===cur?'cur':''}">${n}</li>`).join('')}</ol></section>
  <section><h3>Demo controls</h3><div class="demo">
    <button class="pri" data-act="reset">↺ Restart</button>
    <button data-act="othersPay" ${S.phase==='sent'?'':'disabled style="opacity:.4"'}>Other friends pay</button>
    <button data-act="othersDecline" ${S.phase==='sent'?'':'disabled style="opacity:.4"'}>Other friends decline</button>
    <button data-act="skip" ${S.phase==='sent'?'':'disabled style="opacity:.4"'}>Jump to last 10 sec</button>
  </div><div class="note">Use tabs above the friend phone to switch who you're acting as.</div></section>
  <section><h3>Design decisions</h3><ul class="pts">
    <li><b>Inline dropdown, not a sheet.</b> The split widget expands in place on the checkout page — no overlay, no context switch.</li>
    <li><b>Organiser pays first.</b> Requests go out only after their share clears.</li>
    <li><b>Compact friend popup.</b> ~4 fingers tall, sits over the lock screen wallpaper — not a full-screen takeover.</li>
    <li><b>10-min hold, no extension.</b> Keeps inventory moving.</li>
    <li><b>Editable split.</b> Equal by default; tap any friend's amount to customise. Host absorbs the remainder.</li>
    <li><b>Pay-for-a-friend.</b> While waiting, tap + next to anyone to fold a stuck friend's share into theirs — one payment covers both, no separate chase.</li>
    <li><b>Partial confirmation on expiry.</b> If the hold runs out with some — not all — friends paid, the host can choose to confirm tickets just for who paid instead of cancelling everyone; the rest flash as "Not confirmed" and their seats release.</li>
    <li><b>Theatre-side impact.</b> Held seats show as "Pending" on the seat map, keeping inventory transparent for the exhibitor. The 10-min cap + hold fee limit ghost-booking risk.</li>
  </ul></section>
  <section><h3>Why this variant</h3><div style="font-size:12px;color:#555;line-height:1.6">
    <p style="margin-bottom:6px"><b>Inline widget (this)</b> keeps everything on the checkout page — zero navigation cost, lowest friction. Trade-off: compact space limits how many friends you can see at a glance.</p>
    <p style="margin-bottom:6px"><b>Bottom drawer (Proto 2)</b> gives more room to review the split and edit amounts, but adds a layer the user has to open/close.</p>
    <p><b>WhatsApp link (Proto 3)</b> meets users where their group already lives and uses familiar payment apps. Trade-off: less control over split amounts (equal only) and the organiser can't see real-time payment progress inside BMS.</p>
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
return {ROOTS, get S(){return S}, fresh, addFriend, sendRequests, shares, endHold, checkDone, renderHost, renderFriend, friendHome, CONTACTS, MOVIE, inr};
})();
