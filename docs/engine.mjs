export const TEAMS=['red','blue'];
export const other=team=>team==='red'?'blue':'red';
export function randomInt(max){const x=new Uint32Array(1); const limit=4294967296-(4294967296%max);do{crypto.getRandomValues(x);}while(x[0]>=limit);return x[0]%max;}
export function shuffle(items){const a=[...items];for(let i=a.length-1;i>0;i--){const j=randomInt(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
export function parseWords(text){return [...new Set(text.split(/[,;\n\r]+/).map(w=>w.trim().replace(/\s+/g,' ').toUpperCase()).filter(Boolean))];}
export function validateWords(words){if(words.length<25)throw Error('Add at least 25 unique words.');if(words.length>5000)throw Error('Use at most 5,000 words.');if(words.some(w=>w.length>24 || !/^[\p{L}\p{N} '\-]+$/u.test(w)))throw Error('Each word or phrase must be 1–24 characters: letters, numbers, spaces, apostrophes or hyphens.');return words;}
export function newGame(words,teams,pack){
 validateWords(words);const turn=TEAMS[randomInt(2)],types=shuffle([...Array(9).fill(turn),...Array(8).fill(other(turn)),...Array(7).fill('neutral'),'trap']);
 return {v:1,id:crypto.randomUUID().slice(0,8),pack,teams,turn,phase:'clue',clue:null,left:0,winner:null,round:1,
 cards:shuffle(words).slice(0,25).map((word,i)=>({word,type:types[i],revealed:false})),history:[{text:`${teams[turn].name} starts. Awaiting a clue.`,team:turn}]};
}
export function remaining(g,team){return g.cards.filter(c=>c.type===team&&!c.revealed).length;}
function end(g){g.turn=other(g.turn);g.phase='clue';g.clue=null;g.left=0;g.round++;}
export function act(original,action){
 const g=structuredClone(original);if(g.winner)throw Error('This round is finished. Deal a new board.');
 const team=g.turn,name=g.teams[team].name;
 if(action.type==='clue'){
  if(g.phase!=='clue')throw Error('Finish the current turn first.');
  const word=String(action.word||'').trim().toUpperCase();
  if(!/^[\p{L}\p{N}'-]{1,30}$/u.test(word))throw Error('Enter one clue word, up to 30 characters.');
  if(g.cards.some(c=>!c.revealed&&c.word===word))throw Error('That word is still on the board. Choose a different clue.');
  if(!Number.isInteger(action.count)||action.count<1||action.count>9)throw Error('Choose a number from 1 to 9.');
  g.clue={word,count:action.count};g.left=action.count+1;g.phase='guess';g.history.push({text:`${name}: ${word} · ${action.count}`,team});
 }else if(action.type==='guess'){
  if(g.phase!=='guess')throw Error('Enter the spymaster’s clue before revealing cards.');
  const c=g.cards[action.index];if(!Number.isInteger(action.index)||!c||c.revealed)throw Error('Choose an unrevealed card.');
  c.revealed=true;g.left--;g.history.push({text:`${c.word} → ${c.type==='neutral'?'bystander':c.type==='trap'?'the trap':g.teams[c.type].name}`,team});
  if(c.type==='trap')g.winner=other(team);
  else if(!remaining(g,'red'))g.winner='red';else if(!remaining(g,'blue'))g.winner='blue';
  if(g.winner){g.phase='finished';g.history.push({text:`${g.teams[g.winner].name} wins the round!`,team:g.winner});}
  else if(c.type!==team||g.left===0)end(g);
 }else if(action.type==='end'){
  if(g.phase!=='guess')throw Error('Enter a clue first.');g.history.push({text:`${name} ends the turn.`,team});end(g);
 }else throw Error('Unknown action.');return g;
}
// Viewer invitations deliberately omit the unrevealed answers and the host's history.
export function invitation(game,role,team,theme){
 const master=role==='master';return {v:1,role,team,theme,id:game.id,pack:game.pack,teams:game.teams,turn:game.turn,
  cards:game.cards.map(c=>({word:c.word,revealed:c.revealed,type:master||c.revealed?c.type:null}))};
}
export function encode(data){const bytes=new TextEncoder().encode(JSON.stringify(data));return btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');}
export function decode(value){
 if(value.length>24000)throw Error('This invite is too large.');
 const raw=atob(value.replaceAll('-','+').replaceAll('_','/'));const data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(raw,c=>c.charCodeAt(0))));
 const str=(v,max)=>typeof v==='string'&&v.length<=max;
 if(data.v!==1||!['master','operator'].includes(data.role)||!TEAMS.includes(data.team)||!TEAMS.includes(data.turn)||!str(data.id,40)||!str(data.pack,80)||!Array.isArray(data.cards)||data.cards.length!==25)throw Error('Invalid invite. Ask the host for a new link.');
 for(const t of TEAMS){const x=data.teams?.[t];if(!x||!str(x.name,24)||!str(x.master,40)||!Array.isArray(x.players)||x.players.length>20||!x.players.every(p=>str(p,40)))throw Error('Invalid team details.');}
 if(data.cards.some(c=>!str(c.word,24)||!c.word||typeof c.revealed!=='boolean'||![null,'red','blue','neutral','trap'].includes(c.type)||(data.role==='master'&&c.type===null)))throw Error('Invalid card details.');
 // No observer gets to upgrade to a key view by changing a role: colors were never sent.
 if(data.role==='operator'&&data.cards.some(c=>!c.revealed&&c.type!==null))throw Error('Invalid operator invite.');
 return data;
}
