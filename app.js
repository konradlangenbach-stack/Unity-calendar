// Kalender-Organizer: alle Daten bleiben lokal im Browser (localStorage).
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const K='kalender-v1',A={e:'events',t:'tasks',n:'notes'},SRC=['Manuell','Kalender','Stundenplan','WhatsApp','Screenshot'];
let S;try{S=JSON.parse(localStorage.getItem(K))}catch(e){}
S=S||{events:[],tasks:[],notes:[],hidden:[]};
const save=()=>{try{localStorage.setItem(K,JSON.stringify(S))}catch(e){}};
const uid=()=>Math.random().toString(36).slice(2,10),pad=n=>String(n).padStart(2,'0');
const iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parse=s=>{const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const fmt=s=>parse(s).toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'});
const long=d=>d.toLocaleDateString('de-DE',{weekday:'long',day:'numeric',month:'long'});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(m){const t=$('#toast');t.textContent=m;t.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>t.hidden=true,3500)}
let V='month',cur=new Date(),sel=iso(new Date()),Q='',tab='ics',P=[],T='';cur.setDate(1);

/* ---------- Daten-Helfer ---------- */
const vis=x=>!S.hidden.includes(x.src);
const col=x=>x.k==='t'?(x.prio==='0'?'var(--c1)':'var(--mu)'):`var(--c${x.cat||0})`;
const dayItems=ds=>[...S.events.filter(e=>e.date===ds&&vis(e)).map(e=>({...e,k:'e'})).sort((a,b)=>(a.start||'')<(b.start||'')?-1:1),...S.tasks.filter(t=>t.date===ds&&vis(t)).map(t=>({...t,k:'t'}))];
const chips=()=>{const u=[...new Set([...S.events,...S.tasks].map(x=>x.src))];return u.length>1?`<div class="chips">${u.map(s=>`<button class="chip ${S.hidden.includes(s)?'':'on'}" data-act="chip" data-s="${s}">${s}</button>`).join('')}</div>`:''};
const row=(x,sd)=>`<div class="row"><span class="bar1" style="background:${col(x)}"></span>${x.k==='t'?`<button class="ck${x.done?' d':''}" data-act="tog" data-id="${x.id}" aria-label="Erledigt"></button>`:''}<button class="rb" data-act="edit" data-k="${x.k}" data-id="${x.id}"><span class="tm">${sd&&x.date?fmt(x.date)+' ':''}${x.k==='e'?(x.ad||!x.start?'ganztägig':x.start+(x.end?'–'+x.end:'')):(x.date&&!sd?'fällig '+fmt(x.date):'Aufgabe')}</span><strong class="${x.done?'strike':''}">${esc(x.title)}</strong>${x.place?`<small>${esc(x.place)}</small>`:''}${x.n?`<small>${esc(x.n.slice(0,80))}</small>`:''}</button><span class="src">${x.src}</span></div>`;

/* ---------- Ansichten ---------- */
function vMonth(){
 const y=cur.getFullYear(),mo=cur.getMonth(),off=(new Date(y,mo,1).getDay()+6)%7,st=new Date(y,mo,1-off),td=iso(new Date());
 let c=['Mo','Di','Mi','Do','Fr','Sa','So'].map(d=>`<div class="wd">${d}</div>`).join('');
 for(let i=0;i<42;i++){const d=new Date(st.getFullYear(),st.getMonth(),st.getDate()+i),ds=iso(d),it=dayItems(ds);
  c+=`<button class="cell${d.getMonth()!==mo?' out':''}${ds===td?' today':''}${ds===sel?' sel':''}" data-act="day" data-d="${ds}"><b>${d.getDate()}</b><span class="dots">${it.slice(0,4).map(x=>`<i style="background:${col(x)}"></i>`).join('')}</span>${it.slice(0,2).map(x=>`<em>${esc(x.title)}</em>`).join('')}</button>`}
 const it=dayItems(sel);
 return `<div class="bar"><h2>${cur.toLocaleDateString('de-DE',{month:'long',year:'numeric'})}</h2><div><button class="ib" data-act="prev" aria-label="Voriger Monat">‹</button><button class="ib" data-act="today">Heute</button><button class="ib" data-act="next" aria-label="Nächster Monat">›</button></div></div>${chips()}<div class="grid">${c}</div><h3 class="dh">${long(parse(sel))}</h3>${it.length?it.map(x=>row(x)).join(''):'<p class="empty">Keine Einträge an diesem Tag. Tippe auf +, um etwas hinzuzufügen.</p>'}<p><button class="sec" data-act="open">Tagesansicht öffnen</button></p>`}
function vDay(){
 const d=parse(sel),it=dayItems(sel),tm=s=>+s.slice(0,2)*60+ +s.slice(3,5),PX=60;
 const ev=it.filter(x=>x.k==='e'&&!x.ad&&x.start).sort((a,b)=>a.start<b.start?-1:1),rest=it.filter(x=>!ev.includes(x)),cols=[];
 ev.forEach(x=>{x._s=tm(x.start);x._e=Math.min(1440,Math.max(x._s+30,x.end?tm(x.end):x._s+60));let c=cols.findIndex(t=>t<=x._s);if(c<0){c=cols.length;cols.push(0)}cols[c]=x._e;x._c=c});
 const n=cols.length||1,H0=Math.min(7,...ev.map(x=>x._s/60|0)),H1=Math.max(21,...ev.map(x=>Math.ceil(x._e/60)));
 let g='';for(let h=H0;h<=H1;h++)g+=`<div class="hr" style="top:${(h-H0)*PX}px"><span>${pad(h%24)}:00</span></div>`;
 const b=ev.map(x=>`<button class="blk" style="top:${(x._s-H0*60)/60*PX}px;height:${Math.max(28,(x._e-x._s)/60*PX-2)}px;left:${x._c*100/n}%;width:calc(${100/n}% - 4px);--k:${col(x)}" data-act="edit" data-k="e" data-id="${x.id}"><small>${x.start}${x.end?'–'+x.end:''}</small><strong>${esc(x.title)}</strong>${x.place?`<small>${esc(x.place)}</small>`:''}</button>`).join('');
 const now=new Date(),nt=(now.getHours()*60+now.getMinutes()-H0*60)/60*PX,nl=sel===iso(now)&&nt>=0&&nt<=(H1-H0)*PX?`<div class="nowl" style="top:${nt}px"></div>`:'';
 return `<div class="bar"><h2>${long(d)}</h2><div><button class="ib" data-act="dprev" aria-label="Vorheriger Tag">‹</button><button class="ib" data-act="today">Heute</button><button class="ib" data-act="dnext" aria-label="Nächster Tag">›</button></div></div>${chips()}${rest.map(x=>row(x)).join('')}<div class="tl" style="height:${(H1-H0)*PX}px">${g}${nl}${b}</div>${it.length?'':'<p class="empty">Für diesen Tag ist nichts eingetragen. Tippe auf +, um einen Termin anzulegen.</p>'}`}
function vAgenda(){
 let h='<div class="bar"><h2>Agenda</h2></div>'+chips(),n=0;const t0=new Date();t0.setHours(0,0,0,0);
 for(let i=0;i<60;i++){const d=new Date(t0);d.setDate(d.getDate()+i);const it=dayItems(iso(d));if(it.length){n++;h+=`<h3 class="dh">${i===0?'Heute':i===1?'Morgen':long(d)}</h3>`+it.map(x=>row(x)).join('')}}
 return h+(n?'':'<p class="empty">In den nächsten 60 Tagen steht nichts an. Tippe auf +, um einen Termin anzulegen.</p>')}
function vTasks(){
 const L=S.tasks.filter(vis).map(t=>({...t,k:'t'})),o=L.filter(t=>!t.done).sort((a,b)=>(a.date||'9')<(b.date||'9')?-1:1),d=L.filter(t=>t.done);
 return '<div class="bar"><h2>Aufgaben</h2></div>'+chips()+(o.length?o.map(x=>row(x)).join(''):'<p class="empty">Keine offenen Aufgaben. Tippe auf +, um eine anzulegen.</p>')+(d.length?`<h3 class="dh">Erledigt (${d.length})</h3>`+d.map(x=>row(x)).join(''):'')}
function vNotes(){
 return '<div class="bar"><h2>Notizen</h2></div>'+(S.notes.length?`<div class="notes">${S.notes.slice().reverse().map(n=>`<button class="note" data-act="edit" data-k="n" data-id="${n.id}"><strong>${esc(n.title)}</strong><p>${esc((n.n||'').slice(0,160))}</p></button>`).join('')}</div>`:'<p class="empty">Noch keine Notizen. Tippe auf +, um eine anzulegen.</p>')}
function vSearch(){
 const m=x=>(x.title+' '+(x.n||'')+' '+(x.place||'')).toLowerCase().includes(Q);
 const r=[...S.events.filter(m).map(e=>({...e,k:'e'})),...S.tasks.filter(m).map(e=>({...e,k:'t'}))].sort((a,b)=>(a.date||'')<(b.date||'')?-1:1),n=S.notes.filter(m);
 return `<div class="bar"><h2>Suche</h2></div>${r.map(x=>row(x,1)).join('')}${n.map(x=>`<div class="row"><span class="bar1" style="background:var(--mu)"></span><button class="rb" data-act="edit" data-k="n" data-id="${x.id}"><span class="tm">Notiz</span><strong>${esc(x.title)}</strong></button></div>`).join('')}${r.length+n.length?'':'<p class="empty">Nichts gefunden.</p>'}`}
function vImport(){
 const tabs=[['ics','Kalender-Datei'],['text','Text und WhatsApp'],['ocr','Screenshot'],['plan','Stundenplan']];
 const wd=[[1,'Montag'],[2,'Dienstag'],[3,'Mittwoch'],[4,'Donnerstag'],[5,'Freitag'],[6,'Samstag'],[0,'Sonntag']],u=new Date();u.setDate(u.getDate()+112);
 const B={
 ics:`<p class="hint">Datei (.ics) oder Abo-Link aus Google Kalender, Apple Kalender, Outlook oder WebUntis.</p><label>Quelle<select id="isrc"><option>Kalender</option><option>Stundenplan</option></select></label><label>Datei<input type="file" id="fileics" accept=".ics,text/calendar"></label><label>Oder Link<span class="inl"><input id="url" placeholder="https://"><button class="sec" data-act="url">Laden</button></span></label>`,
 text:`<p class="hint">Füge Nachrichten ein, zum Beispiel „Training Donnerstag 18 Uhr Halle 2“. Zeilen mit Datum werden erkannt.</p><textarea id="txt" rows="6">${esc(T)}</textarea><button class="pri" data-act="parse">Termine erkennen</button>`,
 ocr:`<p class="hint">Lade einen Screenshot hoch. Der Text wird im Browser gelesen, das Bild verlässt dein Gerät nicht.</p><input type="file" id="fileocr" accept="image/*">`,
 plan:`<p class="hint">Trage eine Stunde ein. Sie wird wöchentlich bis zum Enddatum wiederholt.</p><div class="two"><label>Wochentag<select id="pw">${wd.map(w=>`<option value="${w[0]}">${w[1]}</option>`).join('')}</select></label><label>Fach<input id="pt"></label><label>Beginn<input type="time" id="ps"></label><label>Ende<input type="time" id="pe"></label><label>Raum<input id="pp"></label><label>Bis<input type="date" id="pu" value="${iso(u)}"></label></div><button class="pri" data-act="plan">Vorschau erstellen</button>`};
 const pv=P.length?`<section class="card"><h3>${P.length} Einträge gefunden</h3>${P.map((x,i)=>`<div class="prow"><input type="checkbox" data-pi="${i}" data-f="on" ${x.on?'checked':''} aria-label="Übernehmen"><input data-pi="${i}" data-f="title" value="${esc(x.title)}"><input type="date" data-pi="${i}" data-f="date" value="${x.date}"><input type="time" data-pi="${i}" data-f="start" value="${x.start}">${x.dup?'<small>Schon vorhanden</small>':''}</div>`).join('')}<button class="pri" data-act="commit">${P.filter(x=>x.on).length} übernehmen</button></section>`:'';
 return `<div class="bar"><h2>Import</h2></div><div class="chips">${tabs.map(t=>`<button class="chip ${tab===t[0]?'on':''}" data-act="tab" data-t="${t[0]}">${t[1]}</button>`).join('')}</div><section class="card">${B[tab]}</section>${pv}<section class="card"><h3>Datensicherung</h3><div class="inl"><button class="sec" data-act="exp">Als JSON exportieren</button></div><label>Sicherung einlesen<input type="file" id="filejson" accept=".json"></label></section>`}
function render(){$$('.nv').forEach(b=>b.classList.toggle('on',!Q&&b.dataset.v===V));$('#main').innerHTML=Q?vSearch():({month:vMonth,day:vDay,agenda:vAgenda,tasks:vTasks,notes:vNotes,import:vImport})[V]()}

/* ---------- Import: Parser ---------- */
const key=e=>(e.title+'|'+e.date+'|'+(e.start||'')).toLowerCase();
function setP(l){const k=new Set(S.events.map(key));P=l.map(x=>{const d=k.has(key(x));k.add(key(x));return{...x,dup:d,on:!d}});if(!P.length)toast('Keine Termine erkannt.');render()}
function icsParse(txt,src){
 const out=[],L=txt.replace(/\r/g,'').replace(/\n[ \t]/g,'').split('\n');let v=null;
 const dt=s=>{const m=(s||'').match(/(\d{4})(\d\d)(\d\d)(?:T(\d\d)(\d\d))?(Z)?/);if(!m)return null;const[,y,mo,d,h,mi,z]=m;return{d:m[4]?(z?new Date(Date.UTC(y,mo-1,d,h,mi)):new Date(y,mo-1,d,h,mi)):new Date(y,mo-1,d),t:!!m[4]}};
 const u=s=>(s||'').replace(/\\n/gi,' ').replace(/\\([,;\\])/g,'$1').trim(),hm=d=>pad(d.getHours())+':'+pad(d.getMinutes());
 for(const l of L){
  if(l==='BEGIN:VEVENT')v={};
  else if(l==='END:VEVENT'&&v){
   const a=dt(v.DTSTART);
   if(a){const b=dt(v.DTEND),R=v.RRULE||'',f=(R.match(/FREQ=(\w+)/)||[])[1],cnt=+(R.match(/COUNT=(\d+)/)||[])[1]||200,un=dt((R.match(/UNTIL=([\dTZ]+)/)||[])[1]),lim=new Date(Date.now()+370*864e5),dur=b?b.d-a.d:0;let s=a.d,n=0;
    do{out.push({title:u(v.SUMMARY)||'Ohne Titel',date:iso(s),start:a.t?hm(s):'',end:a.t&&b?hm(new Date(+s+dur)):'',ad:!a.t,place:u(v.LOCATION),n:u(v.DESCRIPTION).slice(0,300),src,cat:src==='Stundenplan'?0:3});
     n++;if(!f)break;s=new Date(s);if(f==='DAILY')s.setDate(s.getDate()+1);else if(f==='WEEKLY')s.setDate(s.getDate()+7);else if(f==='MONTHLY')s.setMonth(s.getMonth()+1);else if(f==='YEARLY')s.setFullYear(s.getFullYear()+1);else break}
    while(n<cnt&&s<=lim&&(!un||s<=un.d))}
   v=null}
  else if(v){const i=l.indexOf(':');if(i>0){const k=l.slice(0,i).split(';')[0];if(!(k in v))v[k]=l.slice(i+1)}}}
 return out}
function txtParse(t,src){
 const td=new Date();td.setHours(0,0,0,0);const out=[],W=['sonntag','montag','dienstag','mittwoch','donnerstag','freitag','samstag'];
 for(let s of t.split('\n')){
  s=s.replace(/^\[?\d{1,2}\.\d{1,2}\.\d{2,4},?\s+\d{1,2}:\d{2}(:\d{2})?\]?\s*-?\s*[^:]{1,40}:\s*/,'');let d=null,m;
  if(m=s.match(/(?<!\d)(\d{1,2})\.(\d{1,2})\.(\d{4}|\d{2})?(?!\d)/)){let y=m[3]?+m[3]:td.getFullYear();if(y<100)y+=2000;d=new Date(y,m[2]-1,m[1]);if(!m[3]&&d<td)d.setFullYear(y+1);s=s.replace(m[0],' ')}
  else if(m=s.match(/(?<![\wäöü])(übermorgen|morgen|heute)(?![\wäöü])/i)){d=new Date(td);d.setDate(d.getDate()+({heute:0,morgen:1,übermorgen:2})[m[1].toLowerCase()]);s=s.replace(m[0],' ')}
  else if(m=s.match(new RegExp('(?<![\\wäöü])('+W.join('|')+')(?![\\wäöü])','i'))){d=new Date(td);d.setDate(d.getDate()+(W.indexOf(m[1].toLowerCase())-td.getDay()+7)%7);s=s.replace(m[0],' ')}
  if(!d)continue;
  let st='';if(m=s.match(/(?<!\d)(\d{1,2})(?::(\d{2}))?\s*(?:uhr|h)(?![\wäöü])/i)||s.match(/(?<!\d)(\d{1,2}):(\d{2})(?!\d)/)){st=pad(+m[1])+':'+(m[2]||'00');s=s.replace(m[0],' ')}
  s=s.replace(/(?<![\wäöü])(am|um|ab|gegen|den)(?![\wäöü])/gi,' ').replace(/\s+/g,' ').replace(/^[\s,:;\-–]+|[\s,:;\-–]+$/g,'');
  out.push({title:s||'Termin',date:iso(d),start:st,end:'',ad:!st,place:'',n:'',src,cat:3})}
 return out}
async function ocr(f){
 toast('Text wird erkannt …');
 try{if(!window.Tesseract)await new Promise((ok,no)=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.1/tesseract.min.js';s.onload=ok;s.onerror=no;document.head.appendChild(s)});
  T=(await Tesseract.recognize(f,'deu')).data.text;const l=txtParse(T,'Screenshot');l.length?setP(l):toast('Keine Termine erkannt. Der gelesene Text steht im Reiter „Text und WhatsApp“.')}
 catch(e){toast('Texterkennung nicht möglich. Dafür wird einmalig Internet benötigt.')}}

/* ---------- Dialog ---------- */
let D={};
function setTy(t){D.ty=t;$$('[data-for]').forEach(el=>el.hidden=!el.dataset.for.split(' ').includes(t));$$('#seg button').forEach(b=>b.classList.toggle('on',b.dataset.ty===t))}
function openDlg(ty,o,date){D={o};setTy(ty);$('#seg').hidden=!!o;
 $('#ft').value=o?.title||'';$('#fd').value=o?o.date||'':date||sel;$('#fs').value=o?.start||'';$('#fe').value=o?.end||'';$('#fa').checked=!!o?.ad;$('#fp').value=o?.place||'';$('#fc').value=o?.cat??0;$('#fr').value=o?.prio||'1';$('#fn').value=o?.n||'';$('#del').hidden=!o;$('#dlg').showModal()}
$('#seg').onclick=e=>{const b=e.target.closest('[data-ty]');if(b)setTy(b.dataset.ty)};
$('#cx').onclick=()=>$('#dlg').close();
$('#del').onclick=()=>{const a=A[D.ty];S[a]=S[a].filter(x=>x!==D.o);save();$('#dlg').close();render()};
$('#f').onsubmit=e=>{e.preventDefault();const ty=D.ty,o=D.o||{id:uid(),src:'Manuell'};o.title=$('#ft').value.trim();o.n=$('#fn').value.trim();
 if(ty==='e'){o.date=$('#fd').value||sel;o.ad=$('#fa').checked||!$('#fs').value;o.start=$('#fs').value;o.end=$('#fe').value;o.place=$('#fp').value.trim();o.cat=+$('#fc').value}
 if(ty==='t'){o.date=$('#fd').value;o.prio=$('#fr').value;o.done=!!o.done}
 if(ty==='n')o.ts=Date.now();
 if(!D.o)S[A[ty]].push(o);save();$('#dlg').close();if(o.date&&ty!=='n')sel=o.date;render()};

/* ---------- Ereignisse ---------- */
document.addEventListener('click',async e=>{
 const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act,d=b.dataset;
 if(a==='prev'||a==='next')cur.setMonth(cur.getMonth()+(a==='next'?1:-1));
 else if(a==='today'){cur=new Date();cur.setDate(1);sel=iso(new Date())}
 else if(a==='day')sel=d.d;
 else if(a==='dprev'||a==='dnext'){const x=parse(sel);x.setDate(x.getDate()+(a==='dnext'?1:-1));sel=iso(x);cur=new Date(x);cur.setDate(1)}
 else if(a==='open')V='day';
 else if(a==='chip'){S.hidden=S.hidden.includes(d.s)?S.hidden.filter(x=>x!==d.s):[...S.hidden,d.s];save()}
 else if(a==='tog'){const t=S.tasks.find(x=>x.id===d.id);t.done=!t.done;save()}
 else if(a==='edit')return openDlg(d.k,S[A[d.k]].find(x=>x.id===d.id));
 else if(a==='add')return openDlg(V==='tasks'?'t':V==='notes'?'n':'e');
 else if(a==='tab')tab=d.t;
 else if(a==='parse'){T=$('#txt').value;return setP(txtParse(T,'WhatsApp'))}
 else if(a==='url'){try{setP(icsParse(await(await fetch($('#url').value)).text(),$('#isrc').value));return}catch(x){return toast('Link konnte nicht geladen werden. Lade die Datei stattdessen herunter und wähle sie oben aus.')}}
 else if(a==='plan'){const w=+$('#pw').value,u=$('#pu').value;if(!u)return toast('Bitte ein Enddatum wählen.');const out=[];for(let x=new Date(new Date().setHours(0,0,0,0));out.length<80&&iso(x)<=u;x.setDate(x.getDate()+7)){if(!out.length)x.setDate(x.getDate()+(w-x.getDay()+7)%7);if(iso(x)>u)break;out.push({title:$('#pt').value||'Unterricht',date:iso(x),start:$('#ps').value,end:$('#pe').value,ad:!$('#ps').value,place:$('#pp').value,n:'',src:'Stundenplan',cat:0})}return setP(out)}
 else if(a==='commit'){const l=P.filter(x=>x.on);l.forEach(x=>S.events.push({id:uid(),title:x.title,date:x.date,start:x.start||'',end:x.end||'',ad:!x.start,place:x.place||'',n:x.n||'',cat:x.cat||0,src:x.src}));P=[];save();if(l.length)sel=l[0].date;toast(l.length+' Einträge übernommen.');V='agenda'}
 else if(a==='exp'){const x=document.createElement('a');x.href=URL.createObjectURL(new Blob([JSON.stringify(S,null,1)],{type:'application/json'}));x.download='kalender-sicherung.json';x.click();return}
 render()});
document.addEventListener('input',e=>{const el=e.target;if(el.id==='q'){Q=el.value.trim().toLowerCase();return render()}
 if(el.id==='txt')T=el.value;
 if(el.dataset.pi!==undefined){P[+el.dataset.pi][el.dataset.f]=el.type==='checkbox'?el.checked:el.value;if(el.dataset.f==='start')P[+el.dataset.pi].ad=!el.value;const c=$('[data-act=commit]');if(c)c.textContent=P.filter(x=>x.on).length+' übernehmen'}});
document.addEventListener('change',async e=>{const el=e.target,f=el.files&&el.files[0];if(!f)return;
 if(el.id==='fileics')setP(icsParse(await f.text(),$('#isrc').value));
 else if(el.id==='fileocr')ocr(f);
 else if(el.id==='filejson'&&confirm('Alle aktuellen Daten durch die Sicherung ersetzen?')){try{const j=JSON.parse(await f.text());S={events:j.events||[],tasks:j.tasks||[],notes:j.notes||[],hidden:j.hidden||[]};save();render();toast('Sicherung eingelesen.')}catch(x){toast('Die Datei konnte nicht gelesen werden.')}}});
$('.nav').onclick=e=>{const b=e.target.closest('[data-v]');if(b){V=b.dataset.v;Q='';$('#q').value='';render()}};
render();
if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});
