import { PACKS, packWords } from './packs.mjs';
import { newGame, act, remaining, parseWords, validateWords, invitation, encode, decode, DIFFICULTIES, normalizeSettings, resetClock } from './engine.mjs';
import { THEMES, THEME_HUES, THEME_LABELS, dressGhost } from './themes.mjs';

const $=id=>document.getElementById(id);
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const storage={get(k){try{return localStorage.getItem(k);}catch{return null;}},set(k,v){try{localStorage.setItem(k,v);return true;}catch{return false;}}};
const savedKey='clue-circuit:game:v1',prefsKey='clue-circuit:prefs:v1';
let g=null,guest=null,undo=[],pool=[],selected=new Set(['everyday','halloween']),availablePacks=new Set(PACKS.map(p=>p.id)),busy=false,theme='halloween',ambient=[],hoverCleanups=[],toastTimer,pendingIndex=null;
const fieldFx={canvas:null,ctx:null,dpr:1,width:0,height:0,raf:0,flows:[],sparks:[],bound:false,pointer:{x:0,y:0,active:false}};
let reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const autoReduced=reduced;
try{const pref=JSON.parse(storage.get(prefsKey));if(pref){theme=Object.hasOwn(THEMES,pref.theme)?pref.theme:theme;reduced=autoReduced||!!pref.reduced;if(Array.isArray(pref.availablePacks))availablePacks=new Set(pref.availablePacks.filter(id=>PACKS.some(p=>p.id===id)));}}catch{}
selected=new Set([...selected].filter(id=>availablePacks.has(id)));

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
function setParallax(x=innerWidth/2,y=innerHeight/2){const dx=(x/Math.max(1,innerWidth)-.5)*24,dy=(y/Math.max(1,innerHeight)-.5)*18;document.documentElement.style.setProperty('--drift-x',`${dx.toFixed(2)}px`);document.documentElement.style.setProperty('--drift-y',`${dy.toFixed(2)}px`);}
function pointerMove(event){fieldFx.pointer.x=event.clientX;fieldFx.pointer.y=event.clientY;fieldFx.pointer.active=true;setParallax(event.clientX,event.clientY);}
function pointerLeave(){fieldFx.pointer.active=false;document.documentElement.style.setProperty('--drift-x','0px');document.documentElement.style.setProperty('--drift-y','0px');}
function vectorHue(type){if(type==='red')return 10;if(type==='blue')return 192;if(type==='trap')return 276;return THEME_HUES[theme]??32;}
function resizeVectorField(){if(!fieldFx.canvas||!fieldFx.ctx)return;fieldFx.dpr=Math.min(window.devicePixelRatio||1,2);fieldFx.width=innerWidth;fieldFx.height=innerHeight;fieldFx.canvas.width=Math.round(fieldFx.width*fieldFx.dpr);fieldFx.canvas.height=Math.round(fieldFx.height*fieldFx.dpr);fieldFx.canvas.style.width=`${fieldFx.width}px`;fieldFx.canvas.style.height=`${fieldFx.height}px`;fieldFx.ctx.setTransform(fieldFx.dpr,0,0,fieldFx.dpr,0,0);}
function seedVectorFlow(){const count=Math.max(90,Math.min(220,Math.floor(innerWidth*innerHeight/14000)));fieldFx.flows=Array.from({length:count},()=>({x:Math.random()*fieldFx.width,y:Math.random()*fieldFx.height,vx:0,vy:0,life:Math.random()}));}
function addSparkBurst(x,y,hue,count=18){for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,s=.45+Math.random()*2.1;fieldFx.sparks.push({x,y,px:x,py:y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,size:.8+Math.random()*2,hue:hue+(Math.random()-.5)*18});}if(fieldFx.sparks.length>520)fieldFx.sparks.splice(0,fieldFx.sparks.length-520);}
function sparkBurstFromCard(index,type){if(reduced||!fieldFx.canvas||!fieldFx.ctx)return;const slot=$('board')?.children?.[index];if(!slot)return;const rect=slot.getBoundingClientRect();addSparkBurst(rect.left+rect.width/2,rect.top+rect.height/2,vectorHue(type),24);}
function stopVectorField(){if(fieldFx.raf){cancelAnimationFrame(fieldFx.raf);fieldFx.raf=0;}if(fieldFx.ctx)fieldFx.ctx.clearRect(0,0,fieldFx.width,fieldFx.height);}
function drawVectorField(ms){
 if(reduced||!fieldFx.ctx)return;
 const ctx=fieldFx.ctx,t=ms*.00038,hue=vectorHue();
 ctx.clearRect(0,0,fieldFx.width,fieldFx.height);
 for(const p of fieldFx.flows){
  const ox=p.x,oy=p.y,swirl=Math.sin((p.y+t*800)*.008)+Math.cos((p.x-t*860)*.0075);
  let ax=Math.cos(swirl*2.4)*.065,ay=Math.sin(swirl*2.4)*.065;
  if(fieldFx.pointer.active){const dx=fieldFx.pointer.x-p.x,dy=fieldFx.pointer.y-p.y,d=Math.hypot(dx,dy)+1,force=Math.max(0,1-d/320);ax+=dx/d*force*.12;ay+=dy/d*force*.12;if(Math.random()<force*.004)addSparkBurst(p.x,p.y,hue,2);}
  p.vx=(p.vx+ax)*.94;p.vy=(p.vy+ay)*.94;p.x+=p.vx;p.y+=p.vy;
  if(p.x<-30||p.x>fieldFx.width+30||p.y<-30||p.y>fieldFx.height+30){p.x=Math.random()*fieldFx.width;p.y=Math.random()*fieldFx.height;p.vx=0;p.vy=0;continue;}
  ctx.strokeStyle=`hsla(${hue+swirl*16},92%,74%,${.07+Math.min(.22,Math.abs(p.vx)+Math.abs(p.vy))})`;
  ctx.lineWidth=.9;ctx.beginPath();ctx.moveTo(ox,oy);ctx.lineTo(p.x,p.y);ctx.stroke();
 }
 for(let i=fieldFx.sparks.length-1;i>=0;i--){const s=fieldFx.sparks[i];s.px=s.x;s.py=s.y;s.x+=s.vx;s.y+=s.vy;s.vx*=.98;s.vy*=.98;s.life-=.024;if(s.life<=0){fieldFx.sparks.splice(i,1);continue;}ctx.strokeStyle=`hsla(${s.hue},96%,79%,${s.life*.65})`;ctx.lineWidth=Math.max(.5,s.size*s.life*.7);ctx.beginPath();ctx.moveTo(s.px,s.py);ctx.lineTo(s.x,s.y);ctx.stroke();ctx.fillStyle=`hsla(${s.hue},96%,79%,${s.life*.9})`;ctx.beginPath();ctx.arc(s.x,s.y,Math.max(.35,s.size*s.life*.45),0,Math.PI*2);ctx.fill();}
 fieldFx.raf=requestAnimationFrame(drawVectorField);
}
function startVectorField(){
 fieldFx.canvas=$('vectorField');fieldFx.ctx=fieldFx.canvas?.getContext('2d',{alpha:true});if(!fieldFx.canvas||!fieldFx.ctx)return;
 resizeVectorField();seedVectorFlow();if(!fieldFx.bound){window.addEventListener('resize',resizeVectorField);window.addEventListener('pointermove',pointerMove,{passive:true});window.addEventListener('pointerdown',pointerMove,{passive:true});window.addEventListener('pointerleave',pointerLeave);fieldFx.bound=true;}
 stopVectorField();fieldFx.raf=requestAnimationFrame(drawVectorField);
}
function nextStepText(){
 if(g?.winner)return `Round complete. ${g.teams[g.winner].name} won. Start another round or deal a fresh board.`;
 if(g?.phase==='clue')return `Next: ${possessive(g.teams[g.turn].name)} spymaster gives a one-word clue and number.`;
 if(g?.phase==='guess')return `Next: ${g.teams[g.turn].name} has ${g.left} ${g.left===1?'guess':'guesses'} left. Reveal a card or end the turn.`;
 return 'Next: continue the round.';
}
function actionUpdate(happened,next=nextStepText()){
 notify(`${happened} ${next}`);
}
function preferences(){return storage.set(prefsKey,JSON.stringify({theme,reduced,availablePacks:[...availablePacks]}));}
function setTheme(value){theme=Object.hasOwn(THEMES,value)?value:'halloween';document.documentElement.dataset.theme=theme;$('theme').value=theme;$('heroWord').textContent=THEMES[theme][0];$('artCaption').textContent=THEMES[theme][1];dressGhost(theme);preferences();atmosphere();}
function atmosphere(){
 ambient.forEach(a=>a.pause());ambient=[];stopVectorField();$('particles').replaceChildren();document.documentElement.classList.toggle('reduced',reduced);
 $('motionToggle').setAttribute('aria-pressed',String(reduced));$('motionToggle').setAttribute('aria-label',reduced?'Enable animations':'Reduce animations');$('motionToggle').title=reduced?'Enable animations':'Reduce animations';
 if(reduced){pointerLeave();return;}
 startVectorField();
 for(let i=0;i<15;i++){const p=el('span','particle',THEMES[theme][2]);p.style.left=`${(i*23+7)%100}%`;p.style.top=`${(i*17+5)%100}%`;$('particles').append(p);ambient.push(window.anime.animate(p,{translateY:[0,-30],opacity:[.08,.25],alternate:true,loop:true,duration:6000+i*270,delay:i*170,ease:'inOutSine'}));}
 ambient.push(window.anime.animate('.ghost',{translateY:[-4,5],rotate:[-3,3],alternate:true,loop:true,duration:2600,ease:'inOutSine'}));
 ambient.push(window.anime.animate('.orbit-a',{rotate:[0,360],loop:true,duration:85000,ease:'linear'}));
 ambient.push(window.anime.animate('.aurora-layer',{translateX:[-8,8],translateY:[-5,5],alternate:true,loop:true,duration:19000,ease:'inOutSine'}));
 ambient.push(window.anime.animate('.mesh-shimmer',{opacity:[.02,.13,.02],scale:[1,1.08,1],alternate:true,loop:true,duration:14500,ease:'inOutSine'}));
}
$('theme').onchange=e=>{setTheme(e.target.value);if(!reduced)window.Motion.animate('main',{opacity:[.6,1]},{duration:.4});};
$('motionToggle').onclick=()=>{reduced=!reduced;preferences();atmosphere();};
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',e=>{reduced=e.matches;preferences();atmosphere();});
function bindCardHover(){hoverCleanups.forEach(fn=>fn());hoverCleanups=[];if(reduced)return;hoverCleanups.push(window.Motion.hover('.word-card:not(:disabled)',element=>{
 const wrap=element.parentElement;window.Motion.animate(wrap,{y:-4},{type:'spring',stiffness:400,damping:22});return()=>window.Motion.animate(wrap,{y:0},{type:'spring',stiffness:400,damping:22});
}));}
function renderPacks(){
 $('packs').replaceChildren(...PACKS.filter(p=>availablePacks.has(p.id)).map(p=>{
  const button=el('button',`pack ${selected.has(p.id)?'selected':''}`);button.type='button';button.setAttribute('aria-pressed',String(selected.has(p.id)));
  const content=el('div');content.append(el('span','pack-tag',p.tag),el('h3','',p.name),el('p','',p.description),el('span','pack-count',`${packWords(p,$('difficulty').value).length} WORDS`));button.append(el('span','pack-icon',p.icon),content,el('span','pack-check',selected.has(p.id)?'✓':''));
  button.onclick=()=>{selected.has(p.id)?selected.delete(p.id):selected.add(p.id);renderPacks();updatePool();};return button;
 }));
 $('deckVisibility').textContent=`${availablePacks.size} of ${PACKS.length} decks shown`;
 $('noDecks').hidden=availablePacks.size>0;
}
function getPool(){const custom=parseWords($('customWords').value);return [...new Set([...($('customOnly').checked?[]:PACKS.filter(p=>availablePacks.has(p.id)&&selected.has(p.id)).flatMap(p=>packWords(p,$('difficulty').value))),...custom])];}
function updatePool(){const words=getPool();$('customCount').textContent=`${parseWords($('customWords').value).length} unique words`;$('poolCount').textContent=`${words.length.toLocaleString()} UNIQUE WORDS / 25 CARDS / ENDLESS CONNECTIONS`;}
$('manageDecks').onclick=()=>modal('YOUR HOME-PAGE DECKS',body=>{
 body.append(el('h2','','Manage word decks'),el('p','','Choose which decks appear on this browser’s home page. Hiding a selected deck removes it from the next word pool, not from a game already in progress. Custom words are always available.'));
 const form=el('form'),choices=el('div','deck-choices'),inputs=[];
 for(const pack of PACKS){
  const label=el('label','deck-choice'),input=el('input');input.type='checkbox';input.checked=availablePacks.has(pack.id);input.value=pack.id;
  const text=el('span');text.append(el('strong','',pack.name),el('span','small',`${pack.words.length} words · ${pack.description}`));
  label.append(input,text);choices.append(label);inputs.push(input);
 }
 const actions=el('div','modal-actions'),restore=el('button','quiet','Show all decks'),cancel=el('button','quiet','Cancel'),submit=el('button','primary','Save deck choices');
 restore.type=cancel.type='button';restore.onclick=()=>inputs.forEach(input=>input.checked=true);cancel.onclick=closeModal;
 actions.append(restore,cancel,submit);form.append(choices,actions);
 form.onsubmit=e=>{e.preventDefault();availablePacks=new Set(inputs.filter(input=>input.checked).map(input=>input.value));selected=new Set([...selected].filter(id=>availablePacks.has(id)));const saved=preferences();renderPacks();updatePool();closeModal();$('manageDecks').focus();notify(saved?'Home-page deck choices saved.':'Deck choices applied for now. Browser storage is unavailable.');};
 body.append(form);
});
$('customWords').oninput=updatePool;$('customOnly').onchange=updatePool;
$('difficulty').onchange=()=>{const preset=DIFFICULTIES[$('difficulty').value];$('clueSeconds').value=preset.clueSeconds;$('guessSeconds').value=preset.guessSeconds;renderPacks();updatePool();};
function setupSettings(){return normalizeSettings({difficulty:$('difficulty').value,clueSeconds:Number($('clueSeconds').value),guessSeconds:Number($('guessSeconds').value)});}
function teamInput(t,prefix=''){const name=$(prefix+t+'Name').value.trim().slice(0,24)||(t==='red'?'Crimson Crew':'Cyan Syndicate');return {name,master:$(prefix+t+'Master').value.trim().slice(0,40),players:parseWordsNames($(prefix+t+'Players').value)};}
function parseWordsNames(s){return [...new Set(s.split(/[,\n]+/).map(x=>x.trim().slice(0,40)).filter(Boolean))].slice(0,20);}
$('setupForm').onsubmit=e=>{e.preventDefault();try{const settings=setupSettings();pool=validateWords(getPool());const teams={red:teamInput('red'),blue:teamInput('blue')};const title=$('customOnly').checked?'Custom collection':`${PACKS.filter(p=>selected.has(p.id)).map(p=>p.name).join(' + ')}${$('customWords').value.trim()?' + custom':''}`;g=newGame(pool,teams,title.slice(0,80),settings);guest=null;undo=[];save();showGame(true);}catch(err){error('setupError',err.message);}};
function showGame(deal=false){pendingIndex=null;$('revealFeedback').replaceChildren();$('lobby').hidden=true;$('game').hidden=false;error('gameError');renderGame();tickClock();window.scrollTo({top:0,behavior:'instant'});if(deal&&!reduced)window.anime.animate('.card-wrap',{translateY:[30,0],rotate:[-5,0],opacity:[0,1],scale:[.93,1],delay:window.anime.stagger(24,{grid:[5,5],from:'center'}),duration:650,ease:'outExpo'});}
function renderGame(){
 const s=guest||g,isGuest=!!guest,master=guest?.role==='master';if(!s)return;
 $('gameLabel').textContent=`${isGuest?master?'PRIVATE SPYMASTER KEY':'OPERATOR SNAPSHOT':`HOST BOARD · ${g.settings.difficulty.toUpperCase()}`} / CASE ${s.id.toUpperCase()}`;
 $('gameTitle').textContent=isGuest?`${s.teams[s.team].name} · ${master?'spymaster':'operator'}`:g.winner?`${g.teams[g.winner].name} wins.`:`${g.teams[g.turn].name}, you’re up.`;
 $('viewDescription').textContent=isGuest?master?'Keep this view private. Give your clue aloud in the meeting.':'Follow the host’s shared screen for the live game.':`${s.pack} · Screen-share this tab. Answers stay hidden here; use Team links to send private spymaster keys.`;
 $('hostActions').hidden=isGuest;$('hostControls').hidden=isGuest;$('guestNotice').hidden=!isGuest;$('historyPanel').hidden=isGuest;$('timerPanel').hidden=isGuest;$('clueTracker').hidden=isGuest;$('revealFeedback').hidden=isGuest;
 for(const t of ['red','blue']){
  const team=s.teams[t];$(t+'Title').textContent=team.name;$(t+'MasterDisplay').textContent=team.master||'Choose a clue giver';
  $(t+'PlayersDisplay').replaceChildren(...(team.players.length?team.players:['Add your operators']).map(n=>el('span','',n)));
  const known=!isGuest||master;const left=known?remaining(s,t):'—';$(t+'Remaining').textContent=left;$(t+'Progress').style.width=known?`${Number(left)/9*100}%`:'0%';
  $(t+'Panel').classList.toggle('active',!isGuest&&!g.winner&&g.turn===t);$(t+'Turn').hidden=isGuest||g.winner||g.turn!==t;
 }
 $('clueLabel').textContent=isGuest?master?'CLASSIFIED · FULL KEY':'BOARD SNAPSHOT':'ON THE AIR';
 $('clueText').textContent=isGuest?master?'Connect the words. Say one clue and a number.':'Same words. Follow the shared screen.':g.winner?'Case closed. Nicely done.':g.clue?`${g.clue.word} · ${g.clue.count}`:'Waiting for the spymaster’s clue…';
 $('turnBadge').textContent=isGuest?'NOT LIVE':g.winner?'ROUND COMPLETE':g.phase==='guess'?`${g.left} GUESSES LEFT`:`TURN ${g.round}`;
 renderBoard();
 if(isGuest){$('guestNotice').replaceChildren(el('strong','',master?'Private spymaster key · no live sync':'Operator view · no live sync'),el('p','',master?'Give one word and a number aloud in the meeting. Click cards here to cross them off on your own key as the host reveals them. These marks stay on this device. Anyone with this link can see the full key.':'This is the board at the time your host copied the link. Opening it does not check you into a roster or update other browsers. Discuss guesses in the meeting; the host reveals cards.'));$('winnerBanner').hidden=true;return;}
 $('clueForm').hidden=g.phase!=='clue'||!!g.winner;$('endTurn').hidden=g.phase!=='guess'||!!g.winner;$('undo').disabled=busy||!undo.length;
 for(const control of $('clueForm').elements)control.disabled=busy||g.clock.paused;
 $('endTurn').disabled=busy||g.clock.paused;
 $('pauseTimer').disabled=busy||!!g.winner;$('pauseTimer').textContent=g.clock.paused?'Resume clock':'Pause clock';
 $('timerSettings').hidden=!!g.winner;
 $('activeClueSeconds').value=g.settings.clueSeconds;$('activeGuessSeconds').value=g.settings.guessSeconds;
 for(const t of ['red','blue']){
  $(t+'ClueTitle').textContent=g.teams[t].name;
  const clues=(g.clues||[]).filter(c=>c.team===t);
  $(t+'Clues').replaceChildren(...(clues.length?clues.map(c=>el('li','',`Turn ${c.round} · ${c.word} · ${c.count}`)):[el('li','muted','No clues yet.')]));
 }
 renderClock();
 $('history').replaceChildren(...g.history.map((h,i)=>{const li=el('li');li.append(el('span','',String(i+1).padStart(2,'0')),document.createTextNode(h.text));return li;}).reverse());$('logCount').textContent=`${g.history.length} entries`;
 $('winnerBanner').hidden=!g.winner;if(g.winner)$('winnerTitle').textContent=`${g.teams[g.winner].name} takes the win.`;
}
function renderBoard(){const s=guest||g;$('board').replaceChildren(...s.cards.map((c,i)=>card(c,i,guest?.role==='master',!!guest)));bindCardHover();}
function cancelGuess(index){pendingIndex=null;renderBoard();$('board').children[index]?.querySelector('button')?.focus();}
function card(c,index,master,isGuest){
 const wrap=el('div','card-wrap'),b=el('button',`word-card${master?' key':''}${c.revealed&&!master?' is-revealed':''}`);b.type='button';
 const face=(back)=>{const type=(master||back)?c.type:null;const f=el('div',`card-face ${back?'card-back':'card-front'} ${type||''}`);f.append(el('span','card-number',String(index+1).padStart(2,'0')),el('span','card-glyph',type==='red'?'◆':type==='blue'?'◇':type==='trap'?'×':'◈'),el('strong','card-word',c.word),el('span','card-label',type?type==='trap'?'THE TRAP':type==='neutral'?'BYSTANDER':`${type.toUpperCase()} AGENT`:'CLUE CIRCUIT'));return f;};
 b.append(face(false));if(master||c.revealed)b.append(face(true));b.setAttribute('aria-label',`${c.word}${master||c.revealed?', '+c.type:''}${c.revealed?', revealed':''}`);
 if(master){const marked=getMarks().includes(index);b.classList.toggle('marked',marked);b.setAttribute('aria-pressed',String(marked));b.onclick=()=>{const marks=new Set(getMarks());marks.has(index)?marks.delete(index):marks.add(index);storage.set(`clue-circuit:marks:${guest.id}`,JSON.stringify([...marks]));b.classList.toggle('marked',marks.has(index));b.setAttribute('aria-pressed',String(marks.has(index)));};}
 else{b.disabled=isGuest||busy||c.revealed||g.phase!=='guess'||!!g.winner||g.clock.paused;b.onclick=()=>{pendingIndex=index;renderBoard();$('board').children[index].querySelector('.confirm-cancel').focus();};}
 wrap.append(b);
 if(!isGuest&&pendingIndex===index&&!b.disabled){
  wrap.classList.add('is-confirming');b.hidden=true;
  const confirmation=el('div','card-confirm'),label=el('strong','',c.word),prompt=el('span','','Reveal this card?'),actions=el('div','confirm-actions'),yes=el('button','primary','Reveal'),cancel=el('button','confirm-cancel','Cancel');
  confirmation.setAttribute('role','group');confirmation.setAttribute('aria-label',`Confirm guess: ${c.word}`);
  yes.type=cancel.type='button';yes.setAttribute('aria-label',`Reveal ${c.word}`);cancel.setAttribute('aria-label',`Cancel ${c.word}`);
  yes.onclick=()=>perform({type:'guess',index});cancel.onclick=()=>cancelGuess(index);
  confirmation.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();cancelGuess(index);}};
  actions.append(cancel,yes);confirmation.append(label,prompt,actions);wrap.append(confirmation);
 }
 return wrap;
}
function getMarks(){try{const a=JSON.parse(storage.get(`clue-circuit:marks:${guest.id}`));return Array.isArray(a)?a.filter(x=>Number.isInteger(x)&&x>=0&&x<25):[];}catch{return [];}}
async function perform(action){
 if(busy||guest)return;
 try{const teamBefore=g.turn;const next=act(g,action);undo.push(structuredClone(g));if(undo.length>40)undo.shift();g=next;pendingIndex=null;busy=true;error('gameError');save();renderGame();
  if(action.type==='guess'&&!reduced){const b=$('board').children[action.index].firstChild;await window.Motion.animate(b,{rotateY:[0,180]},{duration:.62,ease:[.22,1,.36,1]});}
  busy=false;renderGame();if(action.type==='clue'){$('clueWord').value='';$('revealFeedback').replaceChildren();$('board').querySelector('button:not(:disabled)')?.focus();if(!reduced)window.anime.animate('.clue-bar',{scale:[.98,1],duration:500,ease:'outElastic(1,.6)'});}
  if(action.type==='clue')actionUpdate(`Clue locked: ${g.clue.word.toUpperCase()} · ${g.clue.count}.`);
  if(action.type==='guess'){
   const revealed=g.cards[action.index],correct=revealed.type===teamBefore,feedback=$('revealFeedback');
   feedback.className=`reveal-feedback ${correct?'correct':'wrong'}`;feedback.replaceChildren(el('strong','',correct?'✓ CORRECT!':'✕ WRONG!'),el('span','',`${revealed.word} → ${cardTypeLabel(revealed.type,g.teams)}. ${nextStepText()}`));
   if(!reduced){window.anime.animate(feedback,correct?{scale:[.96,1.03,1],duration:650,ease:'outBack'}:{translateX:[0,-8,8,-5,5,0],duration:450,ease:'outQuad'});if(correct)sparkBurstFromCard(action.index,revealed.type);}
   if(g.phase==='clue'&&!g.winner)$('clueWord').focus();else{const slot=$('board').children[action.index];slot.tabIndex=-1;slot.focus();}
  }
  if(action.type==='end')actionUpdate(`${g.teams[teamBefore].name} ended the turn.`);
  if(action.type==='timeout'){closeModal();notify(`Time is up! ${g.teams[teamBefore].name} passes the turn.`);$('clueWord').value='';$('clueWord').focus();}
  if(action.type==='pause'||action.type==='resume')notify(action.type==='pause'?'Clock paused. Resume to continue playing.':'Clock resumed.');
  if(action.type==='settings')notify('Time limits saved. The current phase has a fresh clock.');
  if(g.winner)celebrate(g.winner);
 }catch(err){busy=false;renderGame();error('gameError',err.message);}
}
$('clueForm').onsubmit=e=>{e.preventDefault();error('gameError');perform({type:'clue',word:$('clueWord').value,count:Number($('clueCount').value)});};
$('endTurn').onclick=()=>perform({type:'end'});
$('undo').onclick=()=>{if(busy||!undo.length)return;g=undo.pop();g.settings=normalizeSettings(g.settings);resetClock(g);pendingIndex=null;save();error('gameError');$('revealFeedback').replaceChildren();renderGame();actionUpdate('Last action undone; this phase has a fresh clock.');};
function fresh(){if(busy)return;confirmDialog('Deal a fresh board?','The current round will be replaced. Teams, difficulty, time limits, and the word pool stay the same. Send fresh spymaster links after dealing.','Deal a new board',()=>{g=newGame(pool,g.teams,g.pack,g.settings);undo=[];save();showGame(true);actionUpdate('Fresh board dealt.','Next: send new private spymaster keys. Pause the clock while setting up.');});}
$('newBoard').onclick=fresh;$('playAgain').onclick=fresh;
$('changeSetup').onclick=()=>{if(busy)return;confirmDialog('Change packs or difficulty?','Return to setup to choose a different word pool and difficulty. Your current board will remain available through Resume last game.','Open setup',()=>{
 if(!g.winner&&!g.clock.paused){tickClock();g=act(g,{type:'pause'});}
 save();pendingIndex=null;
 for(const t of ['red','blue']){$(t+'Name').value=g.teams[t].name;$(t+'Master').value=g.teams[t].master;$(t+'Players').value=g.teams[t].players.join(', ');}
 $('difficulty').value=g.settings.difficulty;$('clueSeconds').value=g.settings.clueSeconds;$('guessSeconds').value=g.settings.guessSeconds;
 $('lobby').hidden=false;$('game').hidden=true;$('resume').hidden=false;document.body.classList.remove('focus-mode');$('presentation').textContent='Focus mode';renderPacks();updatePool();$('difficulty').focus();
});};
function renderClock(){
 if(!g||guest)return;
 const ms=g.winner?0:g.clock.paused?g.clock.remainingMs:Math.max(0,g.clock.deadline-Date.now()),seconds=Math.ceil(ms/1000);
 $('timerRole').textContent=g.winner?'Round complete':`${g.phase==='clue'?'Spymaster clue':'Operator turn'}${g.clock.paused?' · PAUSED':''}`;
 $('timerReadout').textContent=`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
 $('timerReadout').classList.toggle('urgent',!g.winner&&!g.clock.paused&&seconds<=10);
}
function tickClock(){
 if(!g||guest||$('game').hidden||document.hidden)return;
 renderClock();
 if(!busy&&!g.winner&&!g.clock.paused&&Date.now()>=g.clock.deadline)perform({type:'timeout'});
}
$('pauseTimer').onclick=()=>perform({type:g.clock.paused?'resume':'pause'});
$('timerForm').onsubmit=e=>{e.preventDefault();perform({type:'settings',settings:{...g.settings,clueSeconds:Number($('activeClueSeconds').value),guessSeconds:Number($('activeGuessSeconds').value)}});};
setInterval(tickClock,250);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)tickClock();});
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
$('help').onclick=()=>modal('FIELD GUIDE',body=>{body.append(el('h2','','One word can change everything.'));const list=el('ol','rules-list');for(const text of ['Make two teams. Choose one spymaster per team; everyone else is an operator. The host enters names and controls the shared board.','The spymasters privately see the color key. On their turn they say one clue word and a number: “Space, three.” The host types that clue into the board.','Operators discuss and announce a word. Click a card to flip to its Reveal / Cancel controls. Escape cancels. CORRECT! means your team’s agent; WRONG! means a bystander, opponent, or trap. A matching agent allows more guesses, up to the clue number plus one.','A bystander or opposing agent ends the turn. Finding the trap immediately loses the round. Reveal all your team’s agents to win.','You may end a guessing turn early. Agree together on proper names, word parts, and other clue conventions. This version supports clue counts 1–9.','Each clue and guessing turn has its own time limit. Correct guesses do not reset the operator clock. Expiry passes the turn. Pause while distributing keys or taking a break; Time limits lets the host adjust either clock.','Difficulty changes the available built-in words and supplies time presets. Custom words are not filtered. Clues by team records each spoken clue, number, and turn separately from the mission log.','Share the host’s browser tab in your meeting. Private key links and operator links are snapshots; they do not sync or create online accounts. Only the host controls the live game.'])list.append(el('li','',text));body.append(list,el('p','share-notice','Made independently with original code, visual design, and word collections. Not affiliated with Czech Games Edition or the official Codenames game.'));});
$('resume').onclick=()=>{try{const s=JSON.parse(storage.get(savedKey));if(!s?.g||!Array.isArray(s.g.cards)||s.g.cards.length!==25)throw Error('Saved game is unavailable.');g=s.g;g.settings=normalizeSettings(g.settings);if(!g.clock)resetClock(g);pool=validateWords(s.pool);undo=Array.isArray(s.undo)?s.undo:[];guest=null;showGame();}catch(err){error('setupError',err.message);}};
function initialize(){
 const hash=new URLSearchParams(location.hash.slice(1));
 if(hash.has('invite')){try{guest=decode(hash.get('invite'));setTheme(guest.theme);showGame(true);}catch(err){$('lobby').hidden=false;$('game').hidden=true;error('setupError',err.message);$('setupError').scrollIntoView();}return;}
 guest=null;$('lobby').hidden=false;$('game').hidden=true;$('resume').hidden=!storage.get(savedKey);setTheme(theme);renderPacks();updatePool();
 if(!reduced){window.anime.animate('.hero-copy > *',{translateY:[18,0],opacity:[0,1],delay:window.anime.stagger(90),duration:850,ease:'outExpo'});window.Motion.animate('.hero-art',{opacity:[0,1],y:[15,0]},{duration:.9});}
}
$('theme').replaceChildren(...Object.keys(THEMES).map(id=>{const option=el('option','',THEME_LABELS[id]);option.value=id;return option;}));
for(const id of ['guidesLink','releaseNotesLink']){
 const link=$(id);
 if(location.protocol==='file:'){link.href=new URL(link.getAttribute('href'),baseURL()).href;link.textContent+=' (ONLINE)';}
 link.target='_blank';link.rel='noopener noreferrer';
}
window.addEventListener('hashchange',initialize);initialize();
