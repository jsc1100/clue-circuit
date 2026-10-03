import test from 'node:test';
import assert from 'node:assert/strict';
import {PACKS} from '../docs/packs.mjs';
import {DIFFICULTIES,newGame,normalizeSettings,resetClock,act,other,invitation,encode,decode} from '../docs/engine.mjs';

const teams={red:{name:'Red',master:'R',players:['One']},blue:{name:'Blue',master:'B',players:['Two']}};
const start=1000;
const fresh=(settings={})=>newGame(PACKS[0].words,structuredClone(teams),'Test',settings,start);
const giveClue=(g,now=start+1000,count=2)=>act(g,{type:'clue',word:'UNEXPECTED',count},now);
const guess=(g,type,now)=>act(g,{type:'guess',index:g.cards.findIndex(c=>c.type===type&&!c.revealed)},now);

test('Difficulty presets and custom timer settings initialize the clue clock',()=>{
 assert.deepEqual(DIFFICULTIES,{
  easy:{label:'Easy',clueSeconds:180,guessSeconds:180},
  standard:{label:'Standard',clueSeconds:120,guessSeconds:120},
  hard:{label:'Hard',clueSeconds:60,guessSeconds:90}
 });
 assert.deepEqual(normalizeSettings(),{difficulty:'standard',clueSeconds:120,guessSeconds:120});
 for(const [difficulty,preset] of Object.entries(DIFFICULTIES)){
  const g=fresh({difficulty});
  assert.deepEqual(g.settings,{difficulty,clueSeconds:preset.clueSeconds,guessSeconds:preset.guessSeconds});
  assert.deepEqual(g.clock,{deadline:start+preset.clueSeconds*1000,paused:false,remainingMs:preset.clueSeconds*1000});
 }
 assert.deepEqual(fresh({difficulty:'hard',clueSeconds:10,guessSeconds:1800}).settings,{difficulty:'hard',clueSeconds:10,guessSeconds:1800});
 assert.deepEqual(normalizeSettings({difficulty:'hard',clueSeconds:30}),{difficulty:'hard',clueSeconds:30,guessSeconds:90});
});

test('Settings reject unknown difficulties and noninteger or out-of-range durations',()=>{
 for(const difficulty of ['expert','toString','__proto__','',null,42,['hard'],{}])assert.throws(()=>normalizeSettings({difficulty}),/difficulty/);
 for(const key of ['clueSeconds','guessSeconds']){
  for(const value of [9,1801,1.5,NaN,Infinity,'60',null,false])assert.throws(()=>normalizeSettings({[key]:value}),/whole seconds/);
 }
 for(const value of [null,[],false,'hard'])assert.throws(()=>normalizeSettings(value),/settings/);
 assert.throws(()=>fresh({guessSeconds:0}),/whole seconds/);
});

test('Expired clue and guess phases reject late actions at the exact deadline',()=>{
 for(const phase of ['clue','guess']){
  const g=phase==='clue'?fresh():giveClue(fresh());
  const before=structuredClone(g);
  for(const action of [{type:'clue',word:'UNEXPECTED',count:1},{type:'guess',index:0},{type:'end'}]){
   assert.throws(()=>act(g,action,g.clock.deadline),/Time is up/);
   assert.throws(()=>act(g,action,g.clock.deadline+100000),/Time is up/);
  }
  assert.deepEqual(g,before);
 }
 assert.equal(giveClue(fresh(),fresh().clock.deadline-1).phase,'guess');
});

test('Timeout forfeits either phase once and starts a fresh clue timer from now',()=>{
 for(const phase of ['clue','guess']){
  const g=phase==='clue'?fresh():giveClue(fresh());
  const before=structuredClone(g);
  assert.throws(()=>act(g,{type:'timeout'},g.clock.deadline-1),/not expired/);
  const now=g.clock.deadline+1000000;
  const n=act(g,{type:'timeout'},now);
  assert.equal(n.turn,other(g.turn));
  assert.equal(n.round,g.round+1);
  assert.equal(n.phase,'clue');
  assert.equal(n.clue,null);
  assert.equal(n.left,0);
  assert.equal(n.clock.deadline,now+n.settings.clueSeconds*1000);
  assert.equal(n.history.length,g.history.length+1);
  assert.match(n.history.at(-1).text,/ran out of time/);
  assert.equal(n.history.at(-1).team,g.turn);
  assert.throws(()=>act(n,{type:'timeout'},now),/not expired/);
  assert.deepEqual(g,before);
 }
 const g=fresh();
 assert.equal(act(g,{type:'timeout'},g.clock.deadline).round,2);
});

test('Correct guesses retain the original deadline until count plus one ends the turn',()=>{
 let g=giveClue(fresh({clueSeconds:30,guessSeconds:60}),2000,1);
 assert.equal(g.clock.deadline,62000);
 const team=g.turn;
 g=guess(g,team,3000);
 assert.equal(g.left,1);
 assert.equal(g.clock.deadline,62000);
 assert.equal(g.turn,team);
 g=guess(g,team,4000);
 assert.equal(g.turn,other(team));
 assert.equal(g.phase,'clue');
 assert.equal(g.clock.deadline,34000);
});

test('Incorrect guesses and voluntary end start the next team clock',()=>{
 for(const kind of ['neutral','opponent','end']){
  const g=giveClue(fresh({clueSeconds:30,guessSeconds:60}));
  const n=kind==='end'?act(g,{type:'end'},5000):guess(g,kind==='opponent'?other(g.turn):kind,5000);
  assert.equal(n.turn,other(g.turn));
  assert.equal(n.clock.deadline,35000);
  assert.equal(n.clock.remainingMs,30000);
 }
});

test('Trap, last friendly card and last opponent card stop the clock',()=>{
 for(const kind of ['trap','own','opponent']){
  const g=giveClue(fresh());
  const type=kind==='trap'?'trap':kind==='own'?g.turn:other(g.turn);
  if(kind!=='trap')g.cards.filter(c=>c.type===type).slice(1).forEach(c=>c.revealed=true);
  const n=guess(g,type,3000);
  assert.equal(n.winner,kind==='own'?g.turn:other(g.turn));
  assert.equal(n.phase,'finished');
  assert.deepEqual(n.clock,{deadline:null,paused:false,remainingMs:0});
  assert.throws(()=>act(n,{type:'timeout'},999999),/finished/);
 }
});

test('Pause freezes either role, rejects play, and resume preserves remaining time',()=>{
 for(const phase of ['clue','guess']){
  const g=phase==='clue'?fresh():giveClue(fresh());
  const n=act(g,{type:'pause'},g.clock.deadline-5000);
  assert.deepEqual(n.clock,{deadline:null,paused:true,remainingMs:5000});
  for(const type of ['clue','guess','end'])assert.throws(()=>act(n,{type},999999),/paused/);
  assert.throws(()=>act(n,{type:'timeout'},999999),/not expired/);
  assert.throws(()=>act(n,{type:'pause'},999999),/already paused/);
  const resumed=act(n,{type:'resume'},999999);
  assert.deepEqual(resumed.clock,{deadline:1004999,paused:false,remainingMs:5000});
  assert.throws(()=>act(resumed,{type:'timeout'},1004998),/not expired/);
  assert.equal(act(resumed,{type:'timeout'},1004999).turn,other(g.turn));
  assert.throws(()=>act(resumed,{type:'resume'},1000000),/not paused/);
  assert.throws(()=>act(g,{type:'pause'},g.clock.deadline),/Time is up/);
 }
});

test('Settings changes reset the current phase duration and preserve pause state',()=>{
 for(const phase of ['clue','guess']){
  for(const paused of [false,true]){
   let g=fresh({difficulty:'hard'});
   if(phase==='guess')g=giveClue(g);
   if(paused)g=act(g,{type:'pause'},3000);
   const before=structuredClone(g);
   const n=act(g,{type:'settings',settings:{clueSeconds:40,guessSeconds:50}},4000);
   const ms=phase==='guess'?50000:40000;
   assert.deepEqual(n.settings,{difficulty:'hard',clueSeconds:40,guessSeconds:50});
   assert.deepEqual(n.clock,{deadline:paused?null:4000+ms,paused,remainingMs:ms});
   assert.equal(n.turn,g.turn);
   assert.equal(n.phase,g.phase);
   assert.deepEqual(n.clues,g.clues);
   assert.deepEqual(g,before);
   if(paused)assert.equal(act(n,{type:'resume'},5000).clock.deadline,5000+ms);
  }
 }
 const g=fresh();
 for(const settings of [undefined,null,[],{difficulty:'unknown'},{clueSeconds:2},{guessSeconds:'30'}]){
  assert.throws(()=>act(g,{type:'settings',settings},2000));
 }
});

test('Reset clock mutates the game for the selected phase and stops finished games',()=>{
 const g=fresh({difficulty:'hard'});
 g.phase='guess';
 assert.equal(resetClock(g,5000),g);
 assert.equal(g.clock.deadline,95000);
 g.phase='finished';
 resetClock(g,7000);
 assert.deepEqual(g.clock,{deadline:null,paused:false,remainingMs:0});
});

test('Legacy saves receive settings, timers and structured clues without mutation',()=>{
 for(const phase of ['clue','guess']){
  const g=phase==='clue'?fresh():giveClue(fresh());
  delete g.settings;delete g.clock;delete g.clues;
  const before=structuredClone(g);
  const n=act(g,{type:'pause'},5000);
  assert.deepEqual(n.settings,normalizeSettings());
  assert.deepEqual(n.clock,{deadline:null,paused:true,remainingMs:120000});
  assert.deepEqual(n.clues,[]);
  assert.deepEqual(g,before);
 }
 const g=fresh();delete g.settings;delete g.clock;delete g.clues;
 assert.equal(giveClue(g,5000).clues.length,1);
});

test('Successful actions do not mutate any nested original state',()=>{
 const initial=fresh(),copy=structuredClone(initial);
 const g=giveClue(initial);
 assert.deepEqual(initial,copy);
 const before=structuredClone(g);
 const n=guess(g,g.turn,3000);
 assert.deepEqual(g,before);
 n.clues[0].word='CHANGED';n.settings.clueSeconds=30;n.teams.red.name='Changed';
 assert.deepEqual(g,before);
});

test('Clues retain team, round, word and count across turns and timeout',()=>{
 const original=fresh();
 let g=act(original,{type:'clue',word:'  unexpected  ',count:2},2000);
 const first={team:original.turn,round:1,word:'UNEXPECTED',count:2};
 assert.deepEqual(g.clues,[first]);
 g=act(g,{type:'end'},3000);
 assert.deepEqual(g.clues,[first]);
 const secondTeam=g.turn;
 g=giveClue(g,4000,3);
 const expected=[first,{team:secondTeam,round:2,word:'UNEXPECTED',count:3}];
 assert.deepEqual(g.clues,expected);
 g=act(g,{type:'timeout'},g.clock.deadline);
 assert.deepEqual(g.clues,expected);
 assert.equal(g.clue,null);
 assert.deepEqual(original.clues,[]);
});

test('Viewer invitations never include structured clues, history or timer settings',()=>{
 const g=giveClue(fresh());
 for(const role of ['operator','master']){
  const view=decode(encode(invitation(g,role,g.turn,'tech')));
  for(const field of ['clues','clue','history','settings','clock'])assert.equal(Object.hasOwn(view,field),false);
  assert.ok(!JSON.stringify(view).includes('UNEXPECTED'));
  if(role==='operator')assert.ok(view.cards.every(c=>c.type===null));
  else assert.deepEqual(view.cards,g.cards);
 }
});
