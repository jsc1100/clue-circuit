export const THEMES={
 halloween:['PHANTOM','A LITTLE MISCHIEF IS IN SEASON.','☾'],
 tech:['SIGNAL','NEON STREETS. CLEAN GETAWAYS.','⌘'],
 winter:['WONDER','GOOD COMPANY. A LITTLE WINTER MAGIC.','✧'],
 arcade:['BONUS','PRESS START. BUILD A STREAK.','▣'],
 dungeon:['RELIC','TORCHLIGHT, TRAPS, AND TREASURE.','⚔'],
 space:['ORBIT','STARS ABOVE. STATIC BELOW.','✶'],
 noir:['ALIBI','RAIN, SHADOWS, AND BAD DECISIONS.','◬'],
 heist:['VAULT','BLUEPRINTS READY. TIMERS RUNNING.','⬢'],
 western:['OUTLAW','DUST, SUNSET, AND SHOWDOWNS.','✷'],
 pirate:['COMPASS','MAPS, STORMS, AND MUTINY.','☠'],
 kaiju:['COLOSSAL','CITY LIGHTS. MONSTER SHADOWS.','◉'],
 jungle:['CANOPY','VINES, DRUMS, SECRET PATHS.','✿'],
 spy:['DEAD DROP','CODE PHRASES. QUIET FOOTSTEPS.','⌖'],
 diwali:['RADIANCE','LIGHTS, LAUGHTER, AND BRIGHT CONNECTIONS.','✦'],
 thanksgiving:['GATHER','GOOD COMPANY. PLENTY TO BE THANKFUL FOR.','❧'],
 christmas:['MERRY','A LITTLE JOY. A LOT OF TOGETHERNESS.','✵'],
 hanukkah:['SHINE','EIGHT NIGHTS. MANY BRIGHT CONNECTIONS.','✡'],
 kwanzaa:['UNITY','CELEBRATE COMMUNITY. CONNECT WITH PURPOSE.','✺'],
 lunar:['FORTUNE','NEW BEGINNINGS. BRIGHT POSSIBILITIES.','❀'],
 eid:['DELIGHT','SHARE THE JOY. MAKE ROOM FOR EVERYONE.','☾']
};

export const THEME_HUES={halloween:28,tech:164,winter:192,arcade:308,dungeon:42,space:220,noir:334,heist:142,western:26,pirate:196,kaiju:98,jungle:140,spy:176,diwali:38,thanksgiving:24,christmas:148,hanukkah:215,kwanzaa:14,lunar:354,eid:162};

export const THEME_LABELS={
 halloween:'☾ Halloween',tech:'⌘ Neon noir',winter:'✧ Winter holiday',
 arcade:'▣ Arcade rush',dungeon:'⚔ Dungeon crawl',space:'✶ Space opera',
 noir:'◬ Midnight noir',heist:'⬢ Heist mode',western:'✷ Frontier dusk',
 pirate:'☠ Pirate tide',kaiju:'◉ Kaiju panic',jungle:'✿ Jungle pulse',
 spy:'⌖ Spy thriller',diwali:'✦ Diwali',thanksgiving:'❧ Thanksgiving',
 christmas:'✵ Christmas',hanukkah:'✡ Hanukkah',kwanzaa:'✺ Kwanzaa',
 lunar:'❀ Lunar New Year',eid:'☾ Eid'
};

const SVG_NS='http://www.w3.org/2000/svg';

// Accessories are separate from the original ghost, so changing outfits never
// replaces its face or accumulates decorations.
export function dressGhost(theme){
 const svg=document.querySelector('.ghost svg');
 if(!svg)return;
 svg.querySelectorAll('[data-theme-costume]').forEach(node=>node.remove());
 const outfit=Object.hasOwn(THEMES,theme)?theme:'halloween';
 const group=document.createElementNS(SVG_NS,'g');
 group.setAttribute('data-theme-costume',outfit);
 group.setAttribute('aria-hidden','true');
 group.setAttribute('stroke-linecap','round');
 group.setAttribute('stroke-linejoin','round');
 group.setAttribute('pointer-events','none');
 const add=(tag,attrs)=>{
  const node=document.createElementNS(SVG_NS,tag);
  for(const [key,value] of Object.entries(attrs))node.setAttribute(key,String(value));
  group.append(node);
  return node;
 };
 const path=(d,fill='none',stroke='none',width=2)=>add('path',{d,fill,stroke,'stroke-width':width});
 const rect=(x,y,width,height,fill,rx=2,stroke='none')=>add('rect',{x,y,width,height,rx,fill,stroke,'stroke-width':2});
 const circle=(cx,cy,r,fill,stroke='none')=>add('circle',{cx,cy,r,fill,stroke,'stroke-width':2});
 const gold='#f6cc70',ink='#263044',cream='#fff3d8';
 const star=(x,y,color=gold)=>path(`M${x} ${y-6}l2 4 5 2-5 2-2 5-2-5-5-2 5-2z`,color);
 const scarf=(color,trim=cream)=>{
  path('M24 81q36 15 72 0v12q-36 14-72 0z',color);
  path('M72 92l-2 25 15-3-1-24z',color);
  path('M73 106l10-2M72 111l11-2','none',trim,2);
 };
 const lantern=(x,y,color)=>{
  path(`M${x-5} ${y}q5-12 10 0`,'none',gold);
  rect(x-10,y,20,25,color,7,gold);
  path(`M${x} ${y+2}v21M${x-7} ${y+5}h14M${x-7} ${y+20}h14M${x} ${y+25}v8`,'none',gold,1.5);
 };
 switch(outfit){
  case 'halloween':
   path('M28 32L47 2l12 16 21 15z','#7047a0',ink);
   path('M21 32q40-14 75 1l-5 9q-36-9-69 0z','#3f285b',ink);
   path('M36 23l40 7-4 7-40-7z','#e89d42');
   rect(52,26,11,8,gold,1);
   path('M17 92q-7-10-11-2l2 23q11 9 22-1l1-21q-6-10-14 1z','#e7883e',ink);
   path('M12 91q8-13 14 0','none',ink);
   path('M12 101l4-3 3 4m3-3 4 4m-12 3q5 6 11 0','none',ink);
   break;
  case 'tech':
   path('M24 54V36q36-40 72 0v18','none',ink,7);
   path('M24 43V34q36-35 72 0v9','none','#63f3d5',3);
   rect(15,43,15,23,ink,5,'#63f3d5');
   rect(90,43,15,23,ink,5,'#63f3d5');
   path('M98 65v12H80','none',ink,4);
   circle(78,77,3,'#63f3d5');
   path('M33 94l12 8 16-9 16 8 12-7','none',ink,3);
   break;
  case 'winter':
   path('M27 33q2-29 34-28 30 2 33 28z','#548aab',ink);
   rect(24,28,73,13,cream,5);
   circle(60,7,7,cream);
   path('M45 12v13m15-15v15m15-12v12','none',cream,2);
   scarf('#548aab');
   star(14,66,cream);
   break;
  case 'arcade':
   rect(27,28,65,11,'#573681',4);
   path('M28 32h64','none','#ff73d6',3);
   path('M31 87q-11 0-14 26-1 8 8 4l14-10h40l15 10q8 4 8-5-4-25-15-25z','#513b82',ink);
   path('M35 91v12m-6-6h12','none','#79f5ef',4);
   circle(81,95,3,'#ff73d6');
   circle(90,102,3,gold);
   rect(52,96,16,4,cream,1);
   break;
  case 'dungeon':
   path('M27 38V26q30-34 64 0v12l-13-7H41z','#a2acb0',ink);
   path('M57 7h9v29h-9z','#d7e1e1',ink);
   path('M66 7q20-8 27 9l-24 2z','#b75d50',ink);
   path('M18 80l19 6v18l-19 13-13-13V86z','#986d3f',ink);
   path('M19 89v18m-7-11h16','none',gold,3);
   path('M104 108V65l7-10 5 10-7 43z','#d7e1e1',ink);
   path('M99 101l17 3M106 108l-1 9','none',gold,4);
   break;
  case 'space':
   add('ellipse',{cx:60,cy:47,rx:48,ry:43,fill:'none',stroke:cream,'stroke-width':5});
   path('M24 34q10-18 26-19','none','#92ceff',4);
   rect(9,42,9,23,ink,3,'#92ceff');
   rect(102,42,9,23,ink,3,'#92ceff');
   path('M29 84q31 16 62 0v13H29z',cream,ink);
   rect(40,92,39,16,ink,4);
   circle(50,100,3,'#94e8cb');
   rect(60,97,12,5,'#92ceff',1);
   break;
  case 'noir':
   path('M32 31l4-22 19 4L76 9l12 24z','#544752',ink);
   path('M21 31q39 9 80 0l-4 9q-35 5-72 0z','#544752',ink);
   path('M34 27h49','none','#d9b6a1',5);
   path('M25 83l26 9 9 20-30-7zm70 0-26 9-9 20 30-7z','#766150',ink);
   path('M43 89l-5 12 12 2m27-14 5 12-12 2','none',gold,1.5);
   break;
  case 'heist':
   path('M27 35q-2-33 34-32 32 1 32 32z',ink);
   rect(26,28,68,13,'#41635a',4,ink);
   path('M38 33h9m8 0h9m8 0h9','none','#99e4ac',2);
   path('M27 87l67 14m-67-4 64 14','none',ink,5);
   path('M87 86l-2-10 17 1-3 10q16 23-5 29-22-1-7-30z','#41635a',ink);
   path('M85 86h16','none',gold,3);
   circle(94,101,6,gold);
   break;
  case 'western':
   path('M31 32l6-24q12-5 24 6 11-11 23-7l6 25z','#94613e',ink);
   path('M10 26q14 18 27 7h48q17 9 24-9l-1 17q-49 18-97 0z','#bf8d59',ink);
   path('M35 29h51','none',ink,5);
   path('M25 83l34 13 36-13-18 30-18-9-16 8z','#ac4d43',ink);
   star(60,95,cream);
   break;
  case 'pirate':
   path('M12 39l12-23 24 7L61 6l16 18 25-10 9 26q-45-10-99-1z',ink,gold);
   path('M15 38q47-12 93 0','none',gold,3);
   path('M53 19l15 12m0-12L53 31','none',cream,3);
   path('M24 72l70-26','none',ink,3);
   path('M64 45h20v11q-10 15-20 0z',ink);
   circle(99,68,6,'none',gold);
   scarf('#af5149',gold);
   break;
  case 'kaiju':
   path('M29 31L18 14l20 7L44 3l14 16L71 2l7 20 24-9-12 24z','#4d814a',ink);
   path('M94 77q14 30 22 17-1 25-24 17l-8-10z','#4d814a',ink);
   path('M106 90l8-8 1 14m-13 12 9 7','none',gold,4);
   path('M27 89l9 8 10-7 12 9 12-9 12 7 10-8','none','#4d814a',7);
   rect(48,96,25,10,'#d3e7a1',5);
   break;
  case 'jungle':
   path('M31 31q0-28 31-28 28 0 28 28z','#aa9965',ink);
   path('M20 31q40-10 82 0v9H20z','#d5c38a',ink);
   path('M58 7v21','none','#796b44',3);
   path('M85 24q7-20 21-16-2 16-21 16z','#3e8055',ink);
   path('M29 77l23 22m40-22-23 22','none',ink,3);
   rect(42,90,15,23,ink,4);
   rect(65,90,15,23,ink,4);
   rect(54,95,13,7,ink);
   circle(49,107,4,'#92c5ba');
   circle(72,107,4,'#92c5ba');
   break;
  case 'spy':
   path('M25 84l21 8 14 20 14-20 21-8-4 21H29z',ink);
   path('M44 85l16 6-8 9zm32 0-16 6 8 9z',cream);
   path('M49 84l11 5 11-5v11l-11-5-11 5z',ink);
   rect(33,45,23,14,ink,5);
   rect(66,45,23,14,ink,5);
   path('M54 48h14m-35 0-9-4m65 4 8-4','none',ink,3);
   path('M38 49h10m24 0h10','none','#88c4d0',2);
   break;
  case 'diwali':
   path('M25 81q34 32 70 0','none','#c47030',8);
   for(let i=0;i<9;i++)circle(27+i*8,83+Math.sin(i*Math.PI/8)*17,5,i%2?'#f6cc70':'#f49545');
   path('M80 104q14 25 30 0z','#a55658',gold);
   path('M95 104q-11-8 0-22 11 14 0 22z',gold);
   path('M95 101q-4-4 0-10 4 6 0 10z',cream);
   star(16,31);
   star(101,26);
   break;
  case 'thanksgiving':
   path('M26 34q35-16 67 0','none','#92633e',4);
   for(const [x,y,angle,color] of [[31,27,-40,'#c6753d'],[46,20,-15,gold],[64,20,20,'#b44e45'],[81,26,40,'#dc974e']]){
    const leaf=path(`M${x} ${y+10}q-14-8 0-20 14 12 0 20z`,color,ink,1);
    leaf.setAttribute('transform',`rotate(${angle} ${x} ${y})`);
   }
   scarf('#a9563e',gold);
   path('M7 99h29l-4 18H12z','#b98550',ink);
   path('M10 101q9-28 22 0M10 107h24M17 101v14m10-14v14','none',gold,2);
   circle(16,99,5,'#c87837');
   circle(27,98,5,'#ac5145');
   break;
  case 'christmas':
   path('M26 34q12-36 43-29 25 3 33 27L84 29 68 18 80 34z','#b6434b',ink);
   rect(23,29,66,13,cream,6);
   circle(101,31,8,cream);
   scarf('#b6434b');
   path('M30 85l-11-12-3 13-13 5 14 6z','#3a7653',ink);
   circle(26,91,4,'#c64d55');
   circle(32,87,4,'#c64d55');
   break;
  case 'hanukkah':
   scarf('#426cac',cream);
   path('M29 85l-2 19m8-17-2 20','none',cream,2);
   path('M74 109h36M92 88v27m-8 0h16','none',gold,2);
   for(let i=0;i<9;i++){
    const x=76+i*4,y=i===4?89:97;
    path(`M${x} ${y+4}v9q0 3 ${92-x} 3`,'none',gold,1.5);
    rect(x-1,y-5,2,9,'#c8e5ff',0);
    path(`M${x} ${y-7}q-3-3 0-7 3 4 0 7z`,gold);
   }
   star(19,32,cream);
   break;
  case 'kwanzaa':
   path('M28 77l58 26-7 10-55-24z','#326849',ink);
   path('M28 79l57 26','none','#bd4e49',5);
   path('M26 86l55 25','none',ink,3);
   for(let i=0;i<4;i++)path(`M${35+i*12} ${86+i*5}l5 2-3 4-5-2z`,gold);
   path('M69 116h44M91 108v8M72 107h38','none','#bc8d51',3);
   for(let i=0;i<7;i++){
    const x=73+i*6,y=i===3?87:93;
    rect(x-2,y,4,107-y,i<3?'#d65353':i===3?'#202027':'#4a9f65',1,gold);
    path(`M${x} ${y-2}q-3-4 0-8 3 4 0 8z`,gold);
   }
   break;
  case 'lunar':
   path('M26 82l24 9h20l24-9-4 25H30z','#b83e4b',gold);
   path('M50 86l10 7 10-7m-10 7v17','none',gold,2);
   path('M54 98h12m-12 6h12','none',gold,2);
   lantern(103,69,'#b83e4b');
   path('M95 68l-3-8','none',gold);
   star(21,31);
   break;
  case 'eid':
   path('M27 80l24 9-18 20-11-4zm66 0-23 9 18 20 10-4z','#317e6d',gold);
   path('M46 89q14 9 29 0','none',gold,3);
   circle(61,96,7,gold);
   circle(64,93,5,'#317e6d');
   lantern(105,33,'#317e6d');
   star(105,45,cream);
   star(16,27);
   break;
 }
 svg.append(group);
}
