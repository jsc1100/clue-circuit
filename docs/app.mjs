import { PACKS } from './packs.mjs';
import { newGame, act, remaining, parseWords, validateWords, invitation, encode, decode } from './engine.mjs';

const $=id=>document.getElementById(id);
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const storage={get(k){try{return localStorage.getItem(k);}catch{return null;}},set(k,v){try{localStorage.setItem(k,v);return true;}catch{return false;}}};
const THEMES={halloween:['PHANTOM','A LITTLE MISCHIEF IS IN SEASON.','☾'],tech:['SIGNAL','MAKE CONTACT. FIND THE CONNECTION.','+'],winter:['WONDER','GOOD COMPANY. A LITTLE WINTER MAGIC.','✧']};
const savedKey='clue-circuit:game:v1',prefsKey='clue-circuit:prefs:v1';
let g=null,guest=null,undo=[],pool=[],selected=new Set(['everyday','halloween']),busy=false,theme='halloween',ambient=[],hoverCleanups=[],toastTimer;
let reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const autoReduced=reduced;
try{const pref=JSON.parse(storage.get(prefsKey));if(pref){theme=THEMES[pref.theme]?pref.theme:theme;reduced=autoReduced||!!pref.reduced;}}catch{}

function notify(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,3500);}
function error(id,message=''){$(id).textContent=message;$(id).hidden=!message;}
function cardTypeLabel(type,teams){return type==='trap'?'THE TRAP':type==='neutral'?'BYSTANDER':`${teams[type].name.toUpperCase()} AGENT`;}
function possessive(name){return /s$/i.test(name)?`${name}'`:`${name}'s`;}
function save(){if(!guest&&g&&!storage.set(savedKey,JSON.stringify({g,undo:undo.slice(-40),pool})))notify('Browser storage unavailable. Keep this tab open.');}
function modal(title,build){$('modalEyebrow').textContent=title;$('modalBody').replaceChildren();build($('modalBody'));if(!$('modal').open)$('modal').showModal();if(!reduced)window.Motion.animate($('modal'),{opacity:[0,1],y:[12,0],scale:[.98,1]},{duration:.25});}
function closeModal(){$('modal').close();}
$('closeModal').onclick=closeModal;
$('modal').addEventListener('click',e=>{if(e.target===$('modal')){const r=$('modal').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal();}});
function confirmDialog(title,text,label,callback){modal('YOUR CALL',body=>{body.append(el('h2','',title),el('p','',text));const actions=el('div','modal-actions'),cancel=el('button','quiet','Cancel'),ok=el('button','primary',label);cancel.onclick=closeModal;ok.onclick=()=>{closeModal();callback();};actions.append(cancel,ok);body.append(actions);});}
function preferences(){storage.set(prefsKey,JSON.stringify({theme,reduced}));}
function setTheme(value){theme=THEMES[value]?value:'halloween';document.documentElement.dataset.theme=theme;$('theme').value=theme;$('heroWord').textContent=THEMES[theme][0];$('artCaption').textContent=THEMES[theme][1];preferences();atmosphere();}
function atmosphere(){
 ambient.forEach(a=>a.pause());ambient=[];$('particles').replaceChildren();document.documentElement.classList.toggle('reduced',reduced);
 $('motionToggle').setAttribute('aria-pressed',String(reduced));$('motionToggle').setAttribute('aria-label',reduced?'Enable animations':'Reduce animations');$('motionToggle').title=reduced?'Enable animations':'Reduce animations';
 if(reduced)return;
 for(let i=0;i<15;i++){const p=el('span','particle',THEMES[theme][2]);p.style.left=`${(i*23+7)%100}%`;p.style.top=`${(i*17+5)%100}%`;$('particles').append(p);ambient.push(window.anime.animate(p,{translateY:[0,-30],opacity:[.08,.25],alternate:true,loop:true,duration:6000+i*270,delay:i*170,ease:'inOutSine'}));}
 ambient.push(window.anime.animate('.ghost',{translateY:[-4,5],rotate:[-3,3],alternate:true,loop:true,duration:2600,ease:'inOutSine'}));
 ambient.push(window.anime.animate('.orbit-a',{rotate:[0,360],loop:true,duration:85000,ease:'linear'}));
}
$('theme').onchange=e=>{setTheme(e.target.value);if(!reduced)window.Motion.animate('main',{opacity:[.6,1]},{duration:.4});};
$('motionToggle').onclick=()=>{reduced=!reduced;preferences();atmosphere();};
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',e=>{reduced=e.matches;preferences();atmosphere();});
function bindCardHover(){hoverCleanups.forEach(fn=>fn());hoverCleanups=[];if(reduced)return;hoverCleanups.push(window.Motion.hover('.word-card:not(:disabled)',element=>{
 const wrap=element.parentElement;window.Motion.animate(wrap,{y:-4},{type:'spring',stiffness:400,damping:22});return()=>window.Motion.animate(wrap,{y:0},{type:'spring',stiffness:400,damping:22});
}));}
function renderPacks(){
 $('packs').replaceChildren(...PACKS.map(p=>{
  const button=el('button',`pack ${selected.has(p.id)?'selected':''}`);button.type='button';button.setAttribute('aria-pressed',String(selected.has(p.id)));
  const content=el('div');content.append(el('span','pack-tag',p.tag),el('h3','',p.name),el('p','',p.description),el('span','pack-count',`${p.words.length} WORDS`));button.append(el('span','pack-icon',p.icon),content,el('span','pack-check',selected.has(p.id)?'✓':''));
  button.onclick=()=>{selected.has(p.id)?selected.delete(p.id):selected.add(p.id);renderPacks();updatePool();};return button;
 }));
}
function getPool(){const custom=parseWords($('customWords').value);return [...new Set([...($('customOnly').checked?[]:PACKS.filter(p=>selected.has(p.id)).flatMap(p=>p.words)),...custom])];}
function updatePool(){const words=getPool();$('customCount').textContent=`${parseWords($('customWords').value).length} unique words`;$('poolCount').textContent=`${words.length.toLocaleString()} UNIQUE WORDS / 25 CARDS / ENDLESS CONNECTIONS`;}
$('customWords').oninput=updatePool;$('customOnly').onchange=updatePool;
function teamInput(t,prefix=''){const name=$(prefix+t+'Name').value.trim().slice(0,24)||(t==='red'?'Crimson Crew':'Cyan Syndicate');return {name,master:$(prefix+t+'Master').value.trim().slice(0,40),players:parseWordsNames($(prefix+t+'Players').value)};}
function parseWordsNames(s){return [...new Set(s.split(/[,\n]+/).map(x=>x.trim().slice(0,40)).filter(Boolean))].slice(0,20);}
$('setupForm').onsubmit=e=>{e.preventDefault();try{pool=validateWords(getPool());const teams={red:teamInput('red'),blue:teamInput('blue')};const title=$('customOnly').checked?'Custom collection':`${PACKS.filter(p=>selected.has(p.id)).map(p=>p.name).join(' + ')}${$('customWords').value.trim()?' + custom':''}`;g=newGame(pool,teams,title.slice(0,80));guest=null;undo=[];save();showGame(true);}catch(err){error('setupError',err.message);}};
function showGame(deal=false){$('lobby').hidden=true;$('game').hidden=false;error('gameError');renderGame();window.scrollTo({top:0,behavior:'instant'});if(deal&&!reduced)window.anime.animate('.card-wrap',{translateY:[30,0],rotate:[-5,0],opacity:[0,1],scale:[.93,1],delay:window.anime.stagger(24,{grid:[5,5],from:'center'}),duration:650,ease:'outExpo'});}
function renderGame(){
 const s=guest||g,isGuest=!!guest,master=guest?.role==='master';if(!s)return;
 $('gameLabel').textContent=`${isGuest?master?'PRIVATE SPYMASTER KEY':'OPERATOR SNAPSHOT':'HOST BOARD'} / CASE ${s.id.toUpperCase()}`;
 $('gameTitle').textContent=isGuest?`${s.teams[s.team].name} · ${master?'spymaster':'operator'}`:g.winner?`${g.teams[g.winner].name} wins.`:`${g.teams[g.turn].name}, you’re up.`;
 $('viewDescription').textContent=isGuest?master?'Keep this view private. Give your clue aloud in the meeting.':'Follow the host’s shared screen for the live game.':`${s.pack} · Screen-share this tab. Answers stay hidden here; use Team links to send private spymaster keys.`;
 $('hostActions').hidden=isGuest;$('hostControls').hidden=isGuest;$('guestNotice').hidden=!isGuest;$('historyPanel').hidden=isGuest;
 for(const t of ['red','blue']){
  const team=s.teams[t];$(t+'Title').textContent=team.name;$(t+'MasterDisplay').textContent=team.master||'Choose a clue giver';
  $(t+'PlayersDisplay').replaceChildren(...(team.players.length?team.players:['Add your operators']).map(n=>el('span','',n)));
  const known=!isGuest||master;const left=known?remaining(s,t):'—';$(t+'Remaining').textContent=left;$(t+'Progress').style.width=known?`${Number(left)/9*100}%`:'0%';
  $(t+'Panel').classList.toggle('active',!isGuest&&!g.winner&&g.turn===t);$(t+'Turn').hidden=isGuest||g.winner||g.turn!==t;
 }
 $('clueLabel').textContent=isGuest?master?'CLASSIFIED · FULL KEY':'BOARD SNAPSHOT':'ON THE AIR';
 $('clueText').textContent=isGuest?master?'Connect the words. Say one clue and a number.':'Same words. Follow the shared screen.':g.winner?'Case closed. Nicely done.':g.clue?`${g.clue.word} · ${g.clue.count}`:'Waiting for the spymaster’s clue…';
 $('turnBadge').textContent=isGuest?'NOT LIVE':g.winner?'ROUND COMPLETE':g.phase==='guess'?`${g.left} GUESSES LEFT`:`TURN ${g.round}`;
 $('board').replaceChildren(...s.cards.map((c,i)=>card(c,i,master,isGuest)));
 bindCardHover();
 if(isGuest){$('guestNotice').replaceChildren(el('strong','',master?'Private spymaster key · no live sync':'Operator view · no live sync'),el('p','',master?'Give one word and a number aloud in the meeting. Click cards here to cross them off on your own key as the host reveals them. These marks stay on this device. Anyone with this link can see the full key.':'This is the board at the time your host copied the link. Opening it does not check you into a roster or update other browsers. Discuss guesses in the meeting; the host reveals cards.'));$('winnerBanner').hidden=true;return;}
 $('clueForm').hidden=g.phase!=='clue'||!!g.winner;$('endTurn').hidden=g.phase!=='guess'||!!g.winner;$('undo').disabled=busy||!undo.length;
 $('history').replaceChildren(...g.history.map((h,i)=>{const li=el('li');li.append(el('span','',String(i+1).padStart(2,'0')),document.createTextNode(h.text));return li;}).reverse());$('logCount').textContent=`${g.history.length} entries`;
 $('winnerBanner').hidden=!g.winner;if(g.winner)$('winnerTitle').textContent=`${g.teams[g.winner].name} takes the win.`;
}
function card(c,index,master,isGuest){
 const wrap=el('div','card-wrap'),b=el('button',`word-card${master?' key':''}${c.revealed&&!master?' is-revealed':''}`);b.type='button';
 const face=(back)=>{const type=(master||back)?c.type:null;const f=el('div',`card-face ${back?'card-back':'card-front'} ${type||''}`);f.append(el('span','card-number',String(index+1).padStart(2,'0')),el('span','card-glyph',type==='red'?'◆':type==='blue'?'◇':type==='trap'?'×':'◈'),el('strong','card-word',c.word),el('span','card-label',type?type==='trap'?'THE TRAP':type==='neutral'?'BYSTANDER':`${type.toUpperCase()} AGENT`:'CLUE CIRCUIT'));return f;};
 b.append(face(false),face(true));b.setAttribute('aria-label',`${c.word}${master||c.revealed?', '+c.type:''}${c.revealed?', revealed':''}`);
 if(master){const marked=getMarks().includes(index);b.classList.toggle('marked',marked);b.setAttribute('aria-pressed',String(marked));b.onclick=()=>{const marks=new Set(getMarks());marks.has(index)?marks.delete(index):marks.add(index);storage.set(`clue-circuit:marks:${guest.id}`,JSON.stringify([...marks]));b.classList.toggle('marked',marks.has(index));b.setAttribute('aria-pressed',String(marks.has(index)));};}
 else{b.disabled=isGuest||busy||c.revealed||g.phase!=='guess'||!!g.winner;b.onclick=()=>modal('CONFIRM YOUR TEAM’S GUESS',body=>{body.append(el('h2','',`Reveal this card?`),el('p','confirm-word',c.word),el('p','',`This is ${possessive(g.teams[g.turn].name)} guess. The reveal will be visible to everyone watching.`));const actions=el('div','modal-actions'),cancel=el('button','quiet','Keep thinking'),yes=el('button','primary','Reveal card ↗');cancel.onclick=closeModal;yes.onclick=()=>{closeModal();perform({type:'guess',index});};actions.append(cancel,yes);body.append(actions);});}
 wrap.append(b);return wrap;
}
function getMarks(){try{const a=JSON.parse(storage.get(`clue-circuit:marks:${guest.id}`));return Array.isArray(a)?a.filter(x=>Number.isInteger(x)&&x>=0&&x<25):[];}catch{return [];}}
async function perform(action){
 if(busy||guest)return;
 try{const teamBefore=g.turn;const next=act(g,action);undo.push(structuredClone(g));if(undo.length>40)undo.shift();g=next;busy=true;save();renderGame();
  if(action.type==='guess'&&!reduced){const b=$('board').children[action.index].firstChild;await window.Motion.animate(b,{rotateY:[0,180]},{duration:.62,ease:[.22,1,.36,1]});}
  busy=false;renderGame();if(action.type==='clue'){$('clueWord').value='';if(!reduced)window.anime.animate('.clue-bar',{scale:[.98,1],duration:500,ease:'outElastic(1,.6)'});}
    if(action.type==='guess'){const revealed=g.cards[action.index],outcome=cardTypeLabel(revealed.type,g.teams),correct=revealed.type===teamBefore,summary=revealed.type==='trap'?'Round lost on the trap.':correct?`${g.teams[teamBefore].name} can keep guessing.`:`Turn passes to ${g.teams[g.turn].name}.`;notify(`${revealed.word} → ${outcome}. ${summary}`);}
  if(g.winner)celebrate(g.winner);
 }catch(err){busy=false;error('gameError',err.message);}
}
$('clueForm').onsubmit=e=>{e.preventDefault();error('gameError');perform({type:'clue',word:$('clueWord').value,count:Number($('clueCount').value)});};
$('endTurn').onclick=()=>perform({type:'end'});
$('undo').onclick=()=>{if(busy||!undo.length)return;g=undo.pop();save();error('gameError');renderGame();notify('Last action undone.');};
function fresh(){if(busy)return;confirmDialog('Deal a fresh board?','The current round will be replaced. Team names and the word pool stay the same. Send fresh spymaster links after dealing.','Deal a new board',()=>{g=newGame(pool,g.teams,g.pack);undo=[];save();showGame(true);});}
$('newBoard').onclick=fresh;$('playAgain').onclick=fresh;
$('presentation').onclick=()=>{document.body.classList.toggle('focus-mode');$('presentation').textContent=document.body.classList.contains('focus-mode')?'Exit focus':'Focus mode';};
function celebrate(team){if(reduced)return;$('confetti').replaceChildren();const colors=[getComputedStyle(document.documentElement).getPropertyValue('--'+team),'#e8b572','#f4efe7'];for(let i=0;i<60;i++){const p=el('i','confetto');p.style.background=colors[i%3];$('confetti').append(p);window.anime.animate(p,{translateX:[0,(Math.random()-.5)*innerWidth*1.5],translateY:[0,-150-Math.random()*180,innerHeight*.7],rotate:[0,Math.random()*720],opacity:[1,1,0],duration:1800+Math.random()*700,delay:Math.random()*250,ease:'outQuad',onComplete:()=>p.remove()});}}
function baseURL(){const current=new URL(location.href);current.hash='';current.search='';if(['localhost','127.0.0.1',''].includes(location.hostname))return storage.get('clue-circuit:public-url')||'https://jsc1100.github.io/clue-circuit/';return current.href;}
function linkFor(role,team,base){const url=new URL(base);if(!['https:','http:'].includes(url.protocol)||url.username||url.password)throw Error('Enter a normal HTTPS game URL.');url.hash='invite='+encode(invitation(g,role,team,theme));return url.href;}
async function copyText(text,status,role){
 try{
  await navigator.clipboard.writeText(text);
  status.textContent=role==='master'?'Copied. Send this private key only to that spymaster.':'Copied. Optional operator snapshot ready to share.';
 }catch{status.textContent='Clipboard unavailable. Select and copy the link below.';}
}
$('share').onclick=()=>modal('INVITE YOUR PEOPLE',body=>{
 body.append(el('h2','','Private keys for spymasters.'),el('p','','Spymaster links are required. Operator snapshot links are optional helper views for remote teammates. No GitHub accounts required.'));
 const label=el('label','small','Public game URL'),base=el('input');base.value=baseURL();base.type='url';base.className='invite-output';base.style.minHeight='42px';base.setAttribute('aria-label','Public game URL');body.append(label,base);
 if(['localhost','127.0.0.1',''].includes(location.hostname))body.append(el('p','share-notice','You’re hosting locally. Remote teammates can only open links from a reachable public URL (for example GitHub Pages). Until then, download private spymaster key images and send those privately.'));
 for(const t of ['red','blue']){const section=el('section',`share-group ${t}-team`);section.append(el('h3','',g.teams[t].name));const buttons=el('div','share-buttons');
  for(const role of ['master','operator']){const b=el('button',role==='master'?'primary':'',role==='master'?'Copy private spymaster key link ↗':'Copy optional operator snapshot ↗');b.onclick=async()=>{try{const link=linkFor(role,t,base.value);storage.set('clue-circuit:public-url',base.value);output.value=link;output.hidden=false;await copyText(link,status,role);}catch(err){status.textContent=err.message;}};buttons.append(b);}
  const download=el('button','','Download private spymaster key ↓');download.onclick=()=>downloadKey(t);buttons.append(download);section.append(buttons);body.append(section);
 }
 const output=el('textarea','invite-output');output.readOnly=true;output.hidden=true;output.setAttribute('aria-label','Invite link to copy');output.onclick=()=>output.select();const status=el('p','copy-status');status.setAttribute('role','status');body.append(output,status,el('p','share-notice','Keep private spymaster key links private: anyone holding one can see the answers. Links are snapshots, not live rooms. Operator links are optional and also non-live. New board = new links.'));
});
function downloadKey(team){
 const canvas=document.createElement('canvas');canvas.width=1500;canvas.height=1100;const c=canvas.getContext('2d');c.fillStyle='#131217';c.fillRect(0,0,1500,1100);c.fillStyle='#f4efe7';c.font='bold 35px system-ui';c.fillText(`CLUE CIRCUIT / ${g.teams[team].name}`,50,65);c.font='22px system-ui';c.fillText(`PRIVATE KEY · Case ${g.id.toUpperCase()} · ${g.teams[g.turn].name} to play`,50,110);
 const colors={red:'#e99c91',blue:'#8ccbd3',neutral:'#c5bfae',trap:'#51376b'};
 g.cards.forEach((card,i)=>{const x=50+(i%5)*282,y=150+Math.floor(i/5)*166;c.fillStyle=colors[card.type];c.fillRect(x,y,270,152);c.fillStyle=card.type==='trap'?'#ffffff':'#201d25';c.font='16px system-ui';c.fillText(`${String(i+1).padStart(2,'0')} · ${card.type.toUpperCase()}${card.revealed?' · REVEALED':''}`,x+13,y+30);let size=26;c.font=`bold ${size}px system-ui`;while(c.measureText(card.word).width>245&&size>10)c.font=`bold ${--size}px system-ui`;c.fillText(card.word,x+135-c.measureText(card.word).width/2,y+90);});c.fillStyle='#c1b5ca';c.font='19px system-ui';c.fillText('Say one word + a number. Follow the host’s shared screen. Keep this key private.',50,1030);canvas.toBlob(blob=>{downloadBlob(blob,`clue-circuit-${g.id}-${team}-PRIVATE-key.png`);notify('Private spymaster key downloaded. Send it only to that spymaster.');},'image/png');
}
function downloadBlob(blob,name){const a=el('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000);}
$('roster').onclick=()=>modal('THE PEOPLE BEHIND THE CLUES',body=>{
 body.append(el('h2','','Make it your team.'),el('p','','Changes apply on this host device. Existing invite links keep their original names; copy new links to share updates.'));
 const form=el('form'),grid=el('div','modal-team');for(const t of ['red','blue']){const section=el('section',t+'-team');section.append(el('h3','',t.toUpperCase()+' TEAM'));for(const [part,labelText,val]of [['Name','Team name',g.teams[t].name],['Master','Spymaster',g.teams[t].master],['Players','Operators (comma-separated)',g.teams[t].players.join(', ')]]){const label=el('label','',labelText),input=el(part==='Players'?'textarea':'input');input.id='edit'+t+part;input.value=val;input.maxLength=part==='Players'?800:part==='Name'?24:40;label.htmlFor=input.id;section.append(label,input);}grid.append(section);}const actions=el('div','modal-actions'),submit=el('button','primary','Save teams');actions.append(submit);form.append(grid,actions);form.onsubmit=e=>{e.preventDefault();g.teams={red:teamInput('red','edit'),blue:teamInput('blue','edit')};undo=[];save();renderGame();closeModal();};body.append(form);
});
$('help').onclick=()=>modal('FIELD GUIDE',body=>{body.append(el('h2','','One word can change everything.'));const list=el('ol','rules-list');for(const text of ['Make two teams. Choose one spymaster per team; everyone else is an operator. The host enters names and controls the shared board.','The spymasters privately see the color key. On their turn they say one clue word and a number: “Space, three.” The host types that clue into the board.','Operators discuss and announce a word. The host clicks it and confirms the reveal. A matching agent lets the team keep guessing, up to the clue number plus one.','A bystander or opposing agent ends the turn. Finding the trap immediately loses the round. Reveal all your team’s agents to win.','You may end a guessing turn early. Agree together on proper names, word parts, and other clue conventions. This version supports clue counts 1–9.','Share the host’s browser tab in your meeting. Private key links and operator links are snapshots; they do not sync or create online accounts. Only the host controls the live game.'])list.append(el('li','',text));body.append(list,el('p','share-notice','Made independently with original code, visual design, and word collections. Not affiliated with Czech Games Edition or the official Codenames game.'));});
$('resume').onclick=()=>{try{const s=JSON.parse(storage.get(savedKey));if(!s?.g||!Array.isArray(s.g.cards)||s.g.cards.length!==25)throw Error('Saved game is unavailable.');g=s.g;pool=validateWords(s.pool);undo=Array.isArray(s.undo)?s.undo:[];guest=null;showGame();}catch(err){error('setupError',err.message);}};
function initialize(){
 const hash=new URLSearchParams(location.hash.slice(1));
 if(hash.has('invite')){try{guest=decode(hash.get('invite'));setTheme(guest.theme);showGame(true);}catch(err){$('lobby').hidden=false;$('game').hidden=true;error('setupError',err.message);$('setupError').scrollIntoView();}return;}
 guest=null;$('lobby').hidden=false;$('game').hidden=true;$('resume').hidden=!storage.get(savedKey);setTheme(theme);renderPacks();updatePool();
 if(!reduced){window.anime.animate('.hero-copy > *',{translateY:[18,0],opacity:[0,1],delay:window.anime.stagger(90),duration:850,ease:'outExpo'});window.Motion.animate('.hero-art',{opacity:[0,1],y:[15,0]},{duration:.9});}
}
window.addEventListener('hashchange',initialize);initialize();
