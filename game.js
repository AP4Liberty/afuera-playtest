const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const W = canvas.width, H = canvas.height;
const BUILD='0.9.0-playtest.48';
const floorTop=()=>state.level===1?([478,455,440,460][state.scene]??460):state.level===2?405:state.level===3?430:390;
const floorBottom=()=>515;
const query=new URLSearchParams(location.search);
const requestedLevel=Number(query.get('level'));
const playtestMode=query.get('playtest')==='1';
const requestedSeed=Number(query.get('seed'));let activeSeed=Number.isFinite(requestedSeed)&&query.has('seed')?requestedSeed>>>0:playtestMode?Date.now()>>>0:null;
function setRandomSeed(seed){activeSeed=seed>>>0;let seedState=activeSeed;Math.random=()=>{seedState+=0x6D2B79F5;let value=seedState;value=Math.imul(value^value>>>15,value|1);value^=value+Math.imul(value^value>>>7,value|61);return((value^value>>>14)>>>0)/4294967296}}
if(activeSeed!==null)setRandomSeed(activeSeed);
const initialLevel=[1,2,3,4].includes(requestedLevel)?requestedLevel:1;
let selectedLevel=initialLevel;
let runContinues=2;
let selectedDifficulty='libertad';
let bossPractice=false;
let dailyChallenge=false;
const keys = new Set();
const pressed = new Set();
const touchPointers=new Set();
let currentPad=null,padHeld=[];
const assetNames = ['milei','milei_walk_1','milei_walk_2','milei_walk_3','milei_walk_4','milei_attack','milei_heavy','milei_dodge','milei_special','riot','riot_walk','bureaucrat','bureaucrat_walk','tax','tax_walk','professor','professor_walk','heavy','heavy_walk','gremialista','gremialista_charge','gremialista_attack','peron','evita','alphabet','alphabet_walk','mecha_fdr','mecha_fdr_attack','che_bike','che_bike_idle','che_bike_attack','kremlin_tech','kremlin_tech_walk','stalin_form1','stalin_exo','stalin_mecha'];
const images = Object.fromEntries(assetNames.map(n => [n, load(`assets/${n}.png?v=${BUILD}`)]));
const backgrounds = [1,2,3,4].map(n=>load(`assets/calle-corrientes-${n}.jpg`));
const ministryBackground=load('assets/ministry.jpg');
const universityBackground=load('assets/university.jpg');
const kremlinBackground=load('assets/kremlin.jpg');
const freshStats=()=>({damageTaken:0,perfectDodges:0,maxMultiplier:1,maxCombo:0,enemiesDefeated:0,pesosCollected:0,pesosLost:0,soundMoneyPickups:0,hazardsDestroyed:0,objectivesCompleted:0,objectivesOffered:0});
const freshPerf=()=>({fps:60,frames:0,sampleTime:0,worstMs:0,droppedFrames:0,lowPower:false,slowSamples:0,fastSamples:0});
const state = { running:false,paused:false,muted:false,runId:0,level:1,time:0,hitStop:0,camera:0, wave:0, wavePending:false,waveDelay:0,waveStartTime:0,waveStartHp:100,waveStartDodges:0,waveMaxCombo:0,waveObjective:null,waveGrade:'',waveGradeTime:0,tip:'',tipTime:0, scene:0,sceneFade:0,phaseFlash:0,musicNext:0,musicNote:0,score:0,multiplier:1, pesos:0, meter:0, shake:0, banner:'CALLE CORRIENTES', bannerTime:3,bossQuote:'',bossQuoteTime:0,bossMove:'',bossMoveTime:0,enemies:[], pickups:[], particles:[], projectiles:[],popups:[],props:[],hazards:[],stats:freshStats(),perf:freshPerf(), boss:false, victory:false };
const profile = loadProfile();
profile.unlockedScenes=Array.isArray(profile.unlockedScenes)?profile.unlockedScenes:[];
profile.honors=Array.isArray(profile.honors)?profile.honors:[];
profile.compactControls=profile.compactControls!==false;document.querySelector('#shell').classList.toggle('compact-controls',profile.compactControls);
state.muted=!!profile.muted;
for(const [key,cap] of [['damage',3],['health',3],['meter',3],['dodge',2],['magnet',3],['speed',2],['heavy',2],['interest',2]])profile[key]=Math.max(0,Math.min(cap,Number(profile[key])||0));
let shopPurchase=null;
let shopInterestApplied=false;
let shopVisitPurchases=0;
function loadProfile(){try{return Object.assign({dollars:0,damage:0,health:0,meter:0,dodge:0,magnet:0,speed:0,heavy:0,interest:0,highScore:0,unlockedLevel:1,completed:false,muted:false,music:true,sfx:true,reducedMotion:false,screenShake:true,haptics:true,scores:[]},JSON.parse(localStorage.getItem('afuera-profile')||'{}'))}catch{return {dollars:0,damage:0,health:0,meter:0,dodge:0,magnet:0,speed:0,heavy:0,interest:0,highScore:0,unlockedLevel:1,completed:false,muted:false,music:true,sfx:true,reducedMotion:false,screenShake:true,haptics:true,scores:[]}}}
function storageWarning(){state.tip='LOCAL SAVE UNAVAILABLE · THIS SESSION CAN CONTINUE';state.tipTime=5}
function saveProfile(){try{localStorage.setItem('afuera-profile',JSON.stringify(profile));return true}catch{storageWarning();return false}}
function loadRunCheckpoint(){try{const checkpoint=JSON.parse(localStorage.getItem('afuera-checkpoint')||'null');if(checkpoint&&checkpoint.build===BUILD&&Number.isFinite(checkpoint.savedAt)&&Date.now()-checkpoint.savedAt<604800000)return checkpoint;if(checkpoint)clearRunCheckpoint();return null}catch{clearRunCheckpoint();return null}}
function saveRunCheckpoint(wave=state.wave){if(!state.running||state.victory)return false;try{localStorage.setItem('afuera-checkpoint',JSON.stringify({build:BUILD,savedAt:Date.now(),level:state.level,wave,scene:state.scene,time:state.time,score:state.score,pesos:state.pesos,stats:state.stats,continues:runContinues,difficulty:selectedDifficulty,daily:dailyChallenge,seed:activeSeed}));return true}catch{storageWarning();return false}}
function clearRunCheckpoint(){try{localStorage.removeItem('afuera-checkpoint');return true}catch{storageWarning();return false}}
function renderLevelSelect(){const names=['CORRIENTES','MINISTRY','UNIVERSITY','KREMLIN'],bosses=['PERÓN','MECHA-FDR','CHE GHOST','SUPER STALIN'],el=document.querySelector('#levelSelect');el.innerHTML=names.map((name,i)=>{const level=i+1,available=playtestMode||level<=profile.unlockedLevel||level===requestedLevel;return `<button data-level="${level}" ${available?'':'disabled'} class="${level===selectedLevel?'selected':''}">L${level} · ${name}<small>${available?bosses[i]:'LOCKED'}</small></button>`}).join('');el.querySelectorAll('[data-level]:not(:disabled)').forEach(b=>b.onclick=()=>{selectedLevel=Number(b.dataset.level);renderLevelSelect()});const difficulties=[['primer','PRIMER PASO'],['libertad','LIBERTAD'],['motosierra','MOTOSIERRA']],de=document.querySelector('#difficultySelect');de.innerHTML=difficulties.map(([key,name])=>`<button data-difficulty="${key}" ${key==='motosierra'&&!profile.completed&&!playtestMode?'disabled':''} class="${key===selectedDifficulty?'selected':''}">${name}</button>`).join('');de.querySelectorAll('[data-difficulty]:not(:disabled)').forEach(b=>b.onclick=()=>{selectedDifficulty=b.dataset.difficulty;renderLevelSelect()});document.querySelector('#startButton').textContent=`${playtestMode?'PLAYTEST':selectedLevel===profile.unlockedLevel&&selectedLevel>1?'CONTINUE':'START'} LEVEL ${selectedLevel}`}
const renderStandardLevelSelect=renderLevelSelect;
renderLevelSelect=function(){renderStandardLevelSelect();if(bossPractice)document.querySelector('#startButton').textContent=`PRACTICE LEVEL ${selectedLevel} BOSS`};
function difficultyDamage(){return selectedDifficulty==='primer' ? .8 : selectedDifficulty==='motosierra' ? 1.2 : 1}
function difficultySpeed(){return selectedDifficulty==='motosierra'?1.14:1}
function difficultyTell(){return selectedDifficulty==='primer' ? .83 : selectedDifficulty==='motosierra' ? 1.18 : 1}
function showStart(){state.running=false;state.paused=false;document.querySelector('#pauseMenu').classList.add('hidden');document.querySelector('#message').classList.add('hidden');document.querySelector('#start').classList.remove('hidden');document.querySelector('#pauseButton').textContent='Ⅱ';const checkpoint=loadRunCheckpoint(),button=document.querySelector('#continueButton');button.hidden=!checkpoint;if(checkpoint)button.textContent=`RESUME LEVEL ${checkpoint.level} · ENCOUNTER ${checkpoint.wave+1}`;renderLevelSelect()}
const showCampaignStart=showStart;showStart=function(){showCampaignStart();document.querySelector('#archivesButton').hidden=!profile.unlockedScenes.length};
function earnedBadges(scores){const cleared=new Set(scores.map(s=>s.level));return [
  {icon:'⚙',name:'FIRST CUT',earned:scores.length>0,hint:'Clear one mission'},
  {icon:'◇',name:'CLEAN HANDS',earned:scores.some(s=>s.damageTaken===0),hint:'Clear without damage'},
  {icon:'↯',name:'GHOST PROTOCOL',earned:scores.some(s=>s.perfectDodges>=5),hint:'Five perfect dodges'},
  {icon:'$',name:'PESO RESCUE',earned:scores.some(s=>s.pesosCollected>=100),hint:'Recover 100 pesos'},
  {icon:'×4',name:'FREE MARKET FURY',earned:scores.some(s=>s.maxMultiplier>=4),hint:'Reach a ×4 multiplier'},
  {icon:'✓',name:'BONUS MANDATE',earned:scores.some(s=>s.objectivesOffered>=5&&s.objectivesCompleted===s.objectivesOffered),hint:'Sweep every mission objective'},
  {icon:'☠',name:'HARD MONEY',earned:scores.some(s=>s.level===4&&s.difficulty==='motosierra'),hint:'Clear Kremlin on Motosierra'},
  {icon:'S',name:'SOVEREIGN SWEEP',earned:[1,2,3,4].every(level=>scores.some(s=>s.level===level&&s.rank==='S RANK')),hint:'Earn S rank on every level'},
  {icon:'★',name:'HISTORY RESTORED',earned:[1,2,3,4].every(level=>cleared.has(level)),hint:'Clear all four missions'}
]}
const coreBadges=earnedBadges;earnedBadges=function(scores){const badges=coreBadges(scores),dailyDays=new Set(scores.filter(s=>s.daily&&Number.isFinite(s.dailyDay)).map(s=>s.dailyDay));badges.splice(5,0,{icon:'¢',name:'SOUND MONEY',earned:scores.some(s=>s.soundMoneyPickups>=20),hint:'Collect 20 fresh pesos'},{icon:'0',name:'INFLATION HAWK',earned:scores.some(s=>s.pesosCollected>=100&&s.pesosLost<5),hint:'Save 100 pesos with minimal loss'},{icon:'✂',name:'DEREGULATOR',earned:scores.some(s=>s.hazardsDestroyed>=3),hint:'Destroy three stage hazards'},{icon:'D',name:'DAILY LIBERTY',earned:dailyDays.size>=1,hint:'Clear one Daily Challenge'},{icon:'3',name:'THREE-DAY MARKET',earned:dailyDays.size>=3,hint:'Clear three different dailies'},{icon:'S',name:'DAILY SOVEREIGN',earned:scores.some(s=>s.daily&&s.rank==='S RANK'),hint:'S-rank a Daily Challenge'});const archived=new Set(profile.honors);for(const badge of badges)badge.earned=badge.earned||archived.has(badge.name);return badges};
function showLeaderboard(){
  const el=document.querySelector('#message'),names=['','CORRIENTES','MINISTRY','UNIVERSITY','KREMLIN'],scores=Array.isArray(profile.scores)?profile.scores:[],best=[1,2,3,4].map(level=>scores.filter(s=>s.level===level).sort((a,b)=>b.score-a.score)[0]),badges=earnedBadges(scores);
  const records=best.map((s,i)=>s?`<div class="record-card"><small>LEVEL ${i+1}</small><strong>${names[i+1]}</strong><b>${Number(s.score).toLocaleString()}</b><span>${s.rank||'CLEARED'} · ${(s.difficulty||'libertad').toUpperCase()}</span><em>${Number.isFinite(s.time)?`${Math.floor(s.time/60)}:${Math.floor(s.time%60).toString().padStart(2,'0')} · ${Math.round(s.damageTaken||0)} DMG`: 'LEGACY RECORD'}</em></div>`:`<div class="record-card locked"><small>LEVEL ${i+1}</small><strong>${names[i+1]}</strong><b>—</b><span>NO CLEAR YET</span></div>`).join('');
  const medals=badges.map(b=>`<div class="hall-badge ${b.earned?'earned':'locked'}"><b>${b.icon}</b><span>${b.name}<small>${b.earned?'UNLOCKED':b.hint}</small></span></div>`).join('');
  el.innerHTML=`<p class="eyebrow">LOCAL CAREER</p><h1>HALL OF LIBERTY</h1><div class="record-grid">${records}</div><div class="badge-grid">${medals}</div><p class="hall-summary">${badges.filter(b=>b.earned).length}/${badges.length} HONORS · ${scores.length} MISSIONS CLEARED · BEST ${Number(profile.highScore||0).toLocaleString()}</p><button data-return>RETURN TO CAMPAIGN</button>`;
  document.querySelector('#start').classList.add('hidden');el.classList.remove('hidden');el.querySelector('[data-return]').onclick=showStart
}
function showArchives(){const el=document.querySelector('#message'),available=profile.unlockedScenes.filter(key=>CUTSCENES[key]);el.innerHTML=`<p class="eyebrow">UNLOCKED STORY</p><h1>ARCHIVES</h1><div class="archive-grid">${available.map(key=>{const panel=CUTSCENES[key][0];return `<button data-scene="${key}"><img src="${panel.image}" alt=""><span>${panel.title}<small>${CUTSCENES[key].length} PANEL${CUTSCENES[key].length===1?'':'S'}</small></span></button>`}).join('')}</div><button data-return>RETURN TO CAMPAIGN</button>`;document.querySelector('#start').classList.add('hidden');el.classList.remove('hidden');el.querySelectorAll('[data-scene]').forEach(button=>button.onclick=()=>{seenScenes.delete(button.dataset.scene);presentCutscene(button.dataset.scene,showArchives)});el.querySelector('[data-return]').onclick=showStart}
function showOptions(){const el=document.querySelector('#message');const render=()=>{const options=[['muted','MASTER AUDIO',!profile.muted],['music','MUSIC',profile.music],['sfx','COMBAT SFX',profile.sfx],['compactControls','COMPACT TOUCH',profile.compactControls],['reducedMotion','AMBIENT MOTION',!profile.reducedMotion],['screenShake','SCREEN SHAKE',profile.screenShake],['haptics','HAPTICS',profile.haptics]];el.innerHTML=`<p class="eyebrow">PLAYER SETTINGS</p><h1>OPTIONS</h1><div class="options">${options.map(([key,label,on])=>`<button data-option="${key}" class="${on?'on':''}">${label}<small>${on?'ON':'OFF'}</small></button>`).join('')}</div><button data-return>RETURN TO CAMPAIGN</button>`;document.querySelector('#start').classList.add('hidden');el.classList.remove('hidden');el.querySelectorAll('[data-option]').forEach(b=>b.onclick=()=>{const key=b.dataset.option;profile[key]=!profile[key];if(key==='muted')state.muted=profile.muted;if(key==='compactControls')document.querySelector('#shell').classList.toggle('compact-controls',profile.compactControls);saveProfile();render()});el.querySelector('[data-return]').onclick=showStart};render()}
let audio;
function tone(freq,duration=.08,type='square',volume=.035,channel='sfx'){if(!audio||state.muted||profile[channel]===false)return;const now=audio.currentTime,o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(freq,now);if(channel!=='music')o.frequency.exponentialRampToValueAtTime(Math.max(40,freq*.65),now+duration);g.gain.setValueAtTime(volume,now);if(channel==='music')g.gain.setValueAtTime(volume,now+duration*.72);g.gain.exponentialRampToValueAtTime(.001,now+duration);o.connect(g).connect(audio.destination);o.start(now);o.stop(now+duration)}
function chipNoise(volume=.012,duration=.045){if(!audio||state.muted||profile.music===false)return;const length=Math.max(1,Math.floor(audio.sampleRate*duration)),buffer=audio.createBuffer(1,length,audio.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*(1-i/length);const source=audio.createBufferSource(),filter=audio.createBiquadFilter(),gain=audio.createGain();filter.type='highpass';filter.frequency.value=1700;gain.gain.setValueAtTime(volume,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);source.buffer=buffer;source.connect(filter).connect(gain).connect(audio.destination);source.start()}
function chainsawSound(heavy=false,duration=heavy?.32:.16){if(!audio||state.muted||profile.sfx===false)return;const now=audio.currentTime,filter=audio.createBiquadFilter(),gain=audio.createGain();filter.type='bandpass';filter.frequency.setValueAtTime(heavy?420:560,now);filter.Q.value=.8;gain.gain.setValueAtTime(heavy?.045:.028,now);gain.gain.exponentialRampToValueAtTime(.001,now+duration);filter.connect(gain).connect(audio.destination);for(const [ratio,detune]of[[1,-8],[1.47,11]]){const oscillator=audio.createOscillator();oscillator.type='sawtooth';oscillator.frequency.setValueAtTime((heavy?72:94)*ratio,now);oscillator.frequency.linearRampToValueAtTime((heavy?118:146)*ratio,now+duration*.65);oscillator.detune.value=detune;oscillator.connect(filter);oscillator.start(now);oscillator.stop(now+duration)}}
function rumble(strength=.4,duration=60){if(!profile.haptics)return;navigator.vibrate?.(Math.round(duration));const actuator=currentPad?.vibrationActuator;if(actuator?.playEffect)actuator.playEffect('dual-rumble',{duration,strongMagnitude:strength,weakMagnitude:strength*.65}).catch(()=>{})}
const MUSIC={
  1:{step:.13,lead:[69,72,76,72,79,76,72,67,69,72,81,79,76,72,74,76],harmony:[57,null,60,null,64,null,60,null,57,null,64,null,62,null,64,null],bass:[45,null,45,null,48,null,43,null,45,null,41,null,43,null,40,null]},
  2:{step:.14,lead:[67,70,74,70,75,74,70,65,67,70,77,75,74,70,72,74],harmony:[55,null,58,null,62,null,58,null,55,null,62,null,60,null,62,null],bass:[43,null,43,null,46,null,41,null,43,null,39,null,41,null,38,null]},
  3:{step:.125,lead:[72,75,79,82,79,75,74,70,72,75,84,82,79,77,75,74],harmony:[60,null,63,null,67,null,62,null,60,null,67,null,65,null,63,null],bass:[48,null,46,null,43,null,46,null,48,null,41,null,43,null,46,null]},
  4:{step:.145,lead:[64,67,71,64,72,71,67,62,64,67,76,72,71,67,66,62],harmony:[52,null,55,null,59,null,55,null,52,null,59,null,57,null,55,null],bass:[40,null,40,null,43,null,38,null,40,null,36,null,38,null,35,null]}
};
const midiHz=note=>440*Math.pow(2,(note-69)/12);
function playMusicStep(){const track=MUSIC[state.level],step=state.musicNote++,index=step%track.lead.length,boss=state.enemies.some(e=>TYPES[e.type].boss),lead=track.lead[index],harmony=track.harmony[index],bass=track.bass[index],speed=boss?.82:1;if(lead!=null)tone(midiHz(lead+(boss&&index%4===3?12:0)),track.step*.78,'square',.012,'music');if(harmony!=null)tone(midiHz(harmony),track.step*.7,index%4?'square':'sawtooth',.006,'music');if(bass!=null)tone(midiHz(bass),track.step*1.35,'triangle',.018,'music');if(index%4===0||index%4===2)chipNoise(index%4===0?.014:.009,index%4===0?.05:.025);state.musicNext=state.time+track.step*speed}
const SHOP={damage:{name:'CHAIN TEETH',prices:[5,10,18],effect:'+8% damage'},meter:{name:'FREE-MARKET FLYWHEEL',prices:[6,12,20],effect:'+10% LIBERTAD gain'},health:{name:'FISCAL RESPONSIBILITY',prices:[6,12,20],effect:'+10 max health'},dodge:{name:'DEREGULATED DODGE',prices:[5,11],effect:'+2 invulnerability frames'},magnet:{name:'SOUND MONEY MAGNET',prices:[4,8,14],effect:'+20px pickup radius'},speed:{name:'CAPITAL MOBILITY',prices:[5,10],effect:'+6% movement speed'},heavy:{name:'CREATIVE DESTRUCTION',prices:[9,18],effect:'Heavy armor break / shockwave'},interest:{name:'COMPOUND INTEREST',prices:[8,16],effect:'+10% shop-entry dollars'}};

function load(src){ const im=new Image(); im.src=src; return im; }
function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
function approach(value,target,amount){return value<target?Math.min(target,value+amount):Math.max(target,value-amount)}
function dist(a,b){ return Math.hypot(a.x-b.x,(a.y-b.y)*1.8); }
function hit(a,b,r){ return dist(a,b)<r; }
function once(code){ if(pressed.has(code)) return false; pressed.add(code); return true; }
function clearOnce(code){ pressed.delete(code); }
function gamepad(){return [...(navigator.getGamepads?.()||[])].find(Boolean)||null}
function padDown(index){return !!currentPad?.buttons[index]?.pressed}
function padOnce(index){return padDown(index)&&!padHeld[index]}

const hero = {x:180,y:405,vx:0,vy:0,walkPhase:0,hp:100,maxHp:100,face:1,state:'idle',timer:0,invuln:0,dodgeWindow:0,combo:0,hits:0,comboTime:0,stepCd:0,goldTimer:0,handTimer:0,attackBuffer:null,attackHit:null,dodgeBuffer:0};

const TYPES = {
  riot:{hp:36,speed:62,damage:8,value:18,scale:.62,range:50,color:'#377dc4'},
  bureaucrat:{hp:52,speed:42,damage:7,value:24,scale:.58,range:62,color:'#697182',block:true},
  tax:{hp:28,speed:78,damage:5,value:32,scale:.59,range:48,color:'#59456b',thief:true},
  professor:{hp:32,speed:48,damage:6,value:26,scale:.60,range:125,color:'#594b8a',buffer:true},
  heavy:{hp:90,speed:31,damage:16,value:45,scale:.68,range:64,color:'#9d3e35'},
  gremialista:{hp:260,speed:52,damage:18,value:150,scale:.78,range:78,color:'#b42f32',boss:true},
  evita:{hp:320,speed:47,damage:15,value:190,scale:.74,range:120,color:'#72b9d3',boss:true},
  peron:{hp:440,speed:39,damage:20,value:260,scale:.78,range:76,color:'#243e76',boss:true},
  alphabet:{hp:58,speed:50,damage:9,value:30,scale:.62,range:58,color:'#6f8498'},
  mecha_fdr:{hp:520,speed:34,damage:22,value:320,scale:.78,range:145,color:'#5c4353',boss:true},
  che_bike:{hp:560,speed:86,damage:23,value:350,scale:.72,range:82,color:'#4baeb8',boss:true},
  kremlin_tech:{hp:66,speed:54,damage:11,value:38,scale:.64,range:62,color:'#217b87'},
  super_stalin:{hp:780,speed:42,damage:26,value:500,scale:.78,range:110,color:'#a52f35',boss:true},
};

const CUTSCENES={
  theft:[
    {image:'assets/cs-calm-night-v2.jpg',kicker:'CASA ROSADA · 11:47 P.M.',title:'ONE QUIET HOUR',text:'The city finally goes quiet. Five mastiffs crowd the balcony. Milei allows himself one breath.',motion:'pan-right',accent:'blue',cue:'calm'},
    {image:'assets/cs-dog-theft-v2.jpg',kicker:'11:48 P.M. · AIRSPACE BREACH',title:'THE SKY OPENS',speaker:'MILEI',text:'CONAN! MURRAY! MILTON!',motion:'shake',accent:'red',cue:'alarm'},
    {image:'assets/cs-dogs-reactor-v2.jpg',kicker:'ALL PALACE SCREENS · HIJACKED',title:'FIVE HOURS',speaker:'UNKNOWN TRANSMISSION',text:'Come to 1951. Come alone. Watch the century burn if you are late.',motion:'push',accent:'red',cue:'threat'},
    {image:'assets/cs-milei-cockpit.jpg',kicker:'ENCRYPTED AUDIO · NO VIDEO',title:'A VOICE IN THE STATIC',speaker:'H. HOPPE // REMOTE SIGNAL',text:'I found the road: Buenos Aires, 1951. I cannot stand beside you. I can keep the door open.',motion:'pan-left',accent:'blue',cue:'signal'},
    {image:'assets/cs-milei-cockpit.jpg',overlay:'assets/milei_heavy.png',kicker:'THE BÖHM-BAWERK · LAUNCH BAY',title:'START THE SAW',speaker:'MILEI',text:'They took my dogs. I am taking back the century.',motion:'snap',accent:'red',cue:'saw'}
  ],
  rand:[
    {image:'assets/cs-rand.jpg',kicker:'ENCRYPTED TRANSMISSION · SOURCE UNKNOWN',title:'A DEAD WOMAN CALLS',speaker:'DISTORTED VOICE',text:'Javier Milei. You are chasing kidnappers. Start chasing the man who sold them the road.',motion:'snap',accent:'blue',cue:'signal'},
    {image:'assets/cs-milei-cockpit.jpg',kicker:'THE BÖHM-BAWERK · BLACK BOX',title:'A FLIGHT PLAN FROM YESTERDAY',speaker:'AYN RAND // ARCHIVAL GHOST',text:'Your route was filed before the dogs were taken. The enemy did not find you. Someone invited him in.',motion:'push',accent:'red',cue:'reveal'}
  ],
  liveDogs:[
    {image:'assets/cs-dogs-reactor-v2.jpg',kicker:'HIJACKED CAMPUS SIGNAL',title:'FIVE HEARTBEATS',speaker:'HOPPE // REMOTE SIGNAL',text:'All five are alive. Listen carefully.',motion:'push',accent:'red',cue:'heartbeat'},
    {image:'assets/cs-dogs-reactor-v2.jpg',kicker:'REACTOR FEED · TEMPERATURE RISING',title:'THE CLOCK TAKES AN HOUR',speaker:'HOPPE // REMOTE SIGNAL',text:'The machine is feeding on the century. Javier—whatever you hit next, hit it faster.',motion:'shake',accent:'red',cue:'alarm'}
  ],
  betrayal:[
    {image:'assets/cs-rand.jpg',kicker:'SIGNATURE VERIFIED',title:'THE VOICE WAS THE KEY',speaker:'AYN RAND // DEAD CHANNEL',text:'Every stolen coordinate carries Hoppe’s authorization mark. He did not lose the route. He sold it.',motion:'shake',accent:'blue',cue:'reveal'},
    {image:'assets/cs-stalin-statue.jpg',kicker:'MOSCOW · SECURE CHANNEL',title:'THE TRAP NEEDED A HERO',speaker:'STALIN',text:'Hoppe opened the road. You supplied the rage. History supplied the trap.',motion:'drop',accent:'red',cue:'threat'},
    {image:'assets/cs-milei-cockpit.jpg',kicker:'ENCRYPTED AUDIO · ORIGIN MASKED',title:'THE VOICE RETURNS',speaker:'HOPPE // REMOTE SIGNAL',text:'I needed a man history could not ignore. Save the dogs, Javier. Then decide whether to save me.',motion:'snap',accent:'blue',cue:'signal'}
  ],
  kennel:[
    {image:'assets/cs-dogs-reactor-v2.jpg',kicker:'ABOVE THE CORE · LOCKDOWN',title:'FIVE PAWS HIT THE GLASS',speaker:'MILEI',text:'Conan sees him first. Then Murray. Then all five are on their feet.',motion:'push',accent:'red',cue:'heartbeat'},
    {image:'assets/cs-dogs-reactor-v2.jpg',kicker:'CORE FAILURE · FOUR MINUTES',title:'NO MORE SPEECHES',speaker:'MILEI',text:'I am here. Hold on. Papa brought the saw.',motion:'snap',accent:'red',cue:'saw'}
  ],
  marx:[
    {image:'assets/cs-marx-dissolves.jpg',kicker:'THE REACTOR OPENS',title:'THE STATUE BLEEDS LIGHT',speaker:'REACTOR',text:'IDEOLOGICAL MASS ACCEPTED.',motion:'drop',accent:'red',cue:'reveal'},
    {image:'assets/cs-stalin-statue.jpg',kicker:'FINAL FORM · INITIALIZING',title:'THE MACHINE NEEDS A GHOST',speaker:'SUPER STALIN',text:'Steel remembers what flesh forgets.',motion:'shake',accent:'red',cue:'threat'}
  ],
  smith:[
    {image:'assets/cs-smith.jpg',kicker:'THE FREE PORT · BETWEEN YEARS',title:'A DOOR WITH NO COUNTRY',speaker:'ADAM SMITH',text:'Every empire has a border. Trade has a door.',motion:'pan-left',accent:'blue',cue:'shop'},
    {image:'assets/cs-smith.jpg',kicker:'COUNTER OPEN · PESOS FALLING',title:'MAKE THE LOSS USEFUL',speaker:'ADAM SMITH',text:'Spend what you saved. Save what matters. Never hold a melting peso.',motion:'push',accent:'blue',cue:'shop'}
  ],
  homecoming:[
    {image:'assets/cs-homecoming-v2.jpg',kicker:'CASA ROSADA · SUNRISE',title:'FIVE SHADOWS AT THE DOOR',text:'For one terrible second, the palace is completely still.',motion:'pan-right',accent:'blue',cue:'calm'},
    {image:'assets/cs-homecoming-v2.jpg',kicker:'THEN · THUNDER',title:'THEY KNOW HIS FOOTSTEPS',speaker:'MILEI',text:'Easy—easy! I missed you too.',motion:'snap',accent:'blue',cue:'victory'},
    {image:'assets/cs-homecoming-v2.jpg',kicker:'THE CENTURY · RETURNED',title:'SOME THINGS ARE NOT FOR SALE',speaker:'MILEI',text:'A country can be rebuilt. A family comes home.',motion:'push',accent:'red',cue:'victory'}
  ],
  postCredits:[
    {image:'assets/cs-musk-news.jpg',kicker:'BREAKING NEWS · SIGNAL OVERRIDE',title:'ANOTHER HOSTAGE',speaker:'NEWS ANCHOR',text:'A second temporal breach has opened. This time, the hostage has rockets.',motion:'snap',accent:'red',cue:'alarm'},
    {image:'assets/cs-trump-call.jpg',kicker:'SECURE LINE · MAR-A-LAGO',title:'ONE MORE JOB',speaker:'PRESIDENT TRUMP',text:'Javier, tremendous chainsaw. We have a situation.',motion:'pan-left',accent:'blue',cue:'signal'},
    {image:'assets/cs-new-adventure.jpg',kicker:'FREEDOM ARCADE',title:'TO BE CONTINUED',speaker:'THE BÖHM-BAWERK',text:'New coordinates locked. The engine turns toward the rift.',motion:'push',accent:'red',cue:'saw'}
  ]
};
const seenScenes=new Set();
const seenTips=new Set();
let cinematicActive=false;
function cinematicSting(cue){if(!audio||state.muted||profile.sfx===false)return;const patterns={calm:[[220,0,'triangle'],[330,.09,'triangle']],alarm:[[110,0,'square'],[82,.08,'sawtooth'],[55,.16,'square']],threat:[[73,0,'sawtooth'],[55,.12,'square']],signal:[[660,0,'square'],[880,.06,'square'],[440,.13,'square']],saw:[[82,0,'sawtooth'],[123,.08,'sawtooth'],[165,.16,'square']],heartbeat:[[72,0,'square'],[72,.16,'square']],reveal:[[740,0,'square'],[370,.08,'sawtooth'],[92,.18,'square']],shop:[[440,0,'square'],[554,.08,'square'],[660,.16,'square']],victory:[[440,0,'square'],[660,.08,'square'],[880,.16,'square']]};for(const [frequency,delay,type] of patterns[cue]||patterns.signal)setTimeout(()=>tone(frequency,.1,type,.028),delay*1000)}
function playCutscene(key,onDone){const panels=CUTSCENES[key];if(!panels||seenScenes.has(key)){onDone?.();return}seenScenes.add(key);const wasPaused=state.paused;cinematicActive=true;state.paused=true;let index=0,typeTimer=null,revealText=null;const el=document.querySelector('#message');const stopTyping=()=>{clearInterval(typeTimer);typeTimer=null;if(revealText){revealText();revealText=null}};const render=()=>{stopTyping();const p=panels[index],motion=p.motion||'push',accent=p.accent||'blue',dots=panels.map((_,i)=>`<i class="${i===index?'active':''}"></i>`).join('');el.innerHTML=`<div class="cinema motion-${motion} accent-${accent}"><div class="cinema-frame"><img src="${p.image}" alt="${p.title}"><div class="cinema-accent"></div>${p.overlay?`<img class="cinema-overlay" src="${p.overlay}" alt="">`:''}</div><div class="cinema-copy"><p class="eyebrow">${p.kicker}</p><h1>${p.title}</h1>${p.speaker?`<p class="cinema-speaker">${p.speaker}</p>`:''}<p data-cinema-text></p><div><button data-next>${index===panels.length-1?'CONTINUE':'NEXT'}</button><button data-skip>SKIP</button></div></div><div class="cinema-progress">${dots}</div><div class="cinema-cut"></div></div>`;el.classList.remove('hidden');cinematicSting(p.cue);const copy=el.querySelector('[data-cinema-text]'),reduced=profile.reducedMotion||matchMedia('(prefers-reduced-motion:reduce)').matches;if(reduced)copy.textContent=p.text;else{let cursor=0;revealText=()=>{copy.textContent=p.text;cursor=p.text.length};typeTimer=setInterval(()=>{copy.textContent=p.text.slice(0,++cursor);if(cursor>=p.text.length){clearInterval(typeTimer);typeTimer=null;revealText=null}},18)}el.querySelector('[data-next]').onclick=()=>{if(typeTimer){stopTyping();return}if(++index<panels.length)render();else finish()};el.querySelector('[data-skip]').onclick=finish};const finish=()=>{stopTyping();el.classList.add('hidden');cinematicActive=false;state.paused=wasPaused;onDone?.()};render()}
const presentCutscene=playCutscene;playCutscene=function(key,onDone){if(CUTSCENES[key]&&!profile.unlockedScenes.includes(key)){profile.unlockedScenes.push(key);saveProfile()}presentCutscene(key,onDone)};
function showTip(key,text){if(seenTips.has(key))return;seenTips.add(key);state.tip=text;state.tipTime=5}

function reset(level=state.level,resume=null){
  state.runId++;
  const levelNames={1:'CALLE CORRIENTES · 1951',2:'MINISTRY OF BUREAUCRACY · 1935',3:'UNIVERSITY OF MARX · 1968',4:'KREMLIN REACTOR · 1952'};Object.assign(state,{running:true,paused:false,level,time:resume?.time||0,hitStop:0,camera:0,wave:resume?.wave||0,wavePending:false,waveDelay:0,waveStartTime:0,waveStartHp:100,waveStartDodges:0,waveMaxCombo:0,waveObjective:null,waveGrade:'',waveGradeTime:0,tip:'',tipTime:0,scene:resume?.scene||0,sceneFade:0,phaseFlash:0,musicNext:0,musicNote:0,score:resume?.score||0,multiplier:1,pesos:resume?.pesos||0,meter:0,shake:0,banner:resume?'CHECKPOINT':levelNames[level],bannerTime:3,bossQuote:'',bossQuoteTime:0,bossMove:'',bossMoveTime:0,enemies:[],pickups:[],particles:[],projectiles:[],popups:[],props:[],hazards:[],stats:resume?(resume.stats||state.stats):freshStats(),perf:freshPerf(),resultsShown:false,boss:false,victory:false});
  state.stats.objectivesCompleted=Number(state.stats.objectivesCompleted)||0;state.stats.objectivesOffered=Number(state.stats.objectivesOffered)||0;
  state.stats.pesosLost=Number(state.stats.pesosLost)||0;state.stats.soundMoneyPickups=Number(state.stats.soundMoneyPickups)||0;
  state.stats.hazardsDestroyed=Number(state.stats.hazardsDestroyed)||0;
  if(dailyChallenge)state.stats.dailyDay=dailyNumber;
  document.querySelector('#pauseButton').textContent='Ⅱ';
  const maxHp=100+profile.health*10;Object.assign(hero,{x:180,y:floorBottom()-22,vx:0,vy:0,walkPhase:0,hp:maxHp,maxHp,face:1,state:'idle',timer:0,invuln:0,dodgeWindow:0,combo:0,hits:0,comboTime:0,stepCd:0,goldTimer:0,handTimer:0,attackBuffer:null,attackHit:null,dodgeBuffer:0});state.stats.lastHp=maxHp;
  spawnWave();
}

function spawn(type,x,y){
  const t=TYPES[type],healthScale=selectedDifficulty==='primer'?.88:selectedDifficulty==='motosierra'?1.2:1,elite=!t.boss&&state.wave>=3&&!state.enemies.some(enemy=>enemy.elite)&&(selectedDifficulty==='motosierra'||Math.random()<.32),maxHp=Math.round(t.hp*healthScale*(elite?1.45:1));
  state.enemies.push({type,x,y:clamp(y,floorTop(),floorBottom()),vx:0,vy:0,walkPhase:Math.random()*4,hp:maxHp,maxHp,elite,phase:1,face:-1,state:'walk',timer:0,hit:0,attackCd:.5,telegraph:0,attackKind:'strike',charge:0,summonCd:6,flee:0,stolen:0,entrance:.42,seed:Math.random()*10});
  if(elite){popup(x,y-115,'ELITE','#ffd15a');burst(x,y-45,'#ffd15a',12)}
}
function spawnProps(){state.props=[{x:520,y:floorBottom()-28,hp:42,type:'crate'},{x:650,y:floorTop()+22,hp:34,type:'barrel'}].filter((_,i)=>(state.wave+i)%2===0)}
function spawnHazards(){state.hazards=[];if(state.level===2&&state.wave>=2)state.hazards.push({type:'redtape',x:state.wave%2?580:410,y:465,r:72});if(state.level===3&&state.wave>=3)state.hazards.push({type:'pamphlets',x:560,y:470,r:66,phase:Math.random()*3,damageCd:0});if(state.level===4&&state.wave>=2){state.hazards.push({type:'vent',x:420,y:455,r:62,phase:0,damageCd:0});if(state.wave>=4)state.hazards.push({type:'vent',x:690,y:475,r:62,phase:1.4,damageCd:0})}}
function spawnWave(){
  state.wavePending=false;
  state.wave++;
  state.waveStartTime=state.time;state.waveStartHp=hero.hp;state.waveStartDodges=state.stats.perfectDodges;state.waveMaxCombo=0;state.waveObjective=null;state.waveGrade='';state.waveGradeTime=0;
  state.scene=Math.min(3,Math.floor((state.wave-1)/2));state.sceneFade=1;
  const level1=[
    [['riot',760,390],['riot',865,430],['tax',925,360]],
    [['bureaucrat',760,390],['professor',870,350],['riot',930,440],['tax',1010,405]],
    [['gremialista',850,400]],
    [['heavy',800,410],['bureaucrat',910,365],['riot',1010,440],['professor',1080,380]],
    [['evita',850,390],['bureaucrat',970,430]],
    [['peron',850,400],['heavy',1000,430]],
  ];
  const level2=[
    [['alphabet',760,390],['alphabet',870,440],['bureaucrat',960,355]],
    [['alphabet',760,350],['heavy',875,430],['professor',990,390]],
    [['alphabet',750,390],['alphabet',860,350],['tax',960,440],['bureaucrat',1040,405]],
    [['heavy',780,420],['alphabet',900,360],['alphabet',1010,430]],
    [['mecha_fdr',850,400],['alphabet',1010,440]],
  ];
  const level3=[
    [['professor',760,390],['riot',870,450],['riot',980,410]],
    [['professor',760,440],['heavy',880,400],['tax',990,460]],
    [['riot',750,390],['riot',850,450],['professor',960,410],['heavy',1060,470]],
    [['professor',760,390],['professor',860,450],['heavy',980,420]],
    [['che_bike',850,440],['riot',1030,460]],
  ];
  const level4=[
    [['kremlin_tech',760,410],['kremlin_tech',870,470],['heavy',990,440]],
    [['kremlin_tech',740,460],['alphabet',850,410],['heavy',970,480]],
    [['kremlin_tech',730,400],['kremlin_tech',840,470],['professor',950,430],['heavy',1060,480]],
    [['heavy',760,430],['alphabet',880,470],['kremlin_tech',1000,410]],
    [['super_stalin',850,440],['kremlin_tech',1040,480]],
  ];
  const waves=state.level===1?level1:state.level===2?level2:state.level===3?level3:level4;
  const wave=waves[state.wave-1];
  if(!wave){ win(); return; }
  state.waveObjective=objectiveForWave(state.wave);state.stats.objectivesOffered++;
  wave.forEach(([t,x,y])=>spawn(t,x,y));
  spawnProps();
  spawnHazards();
  if(state.wave===2){const kinds=['gold','hand','mate','gold'];state.pickups.push({x:W*.54,y:floorBottom()-42,power:kinds[state.level-1],age:0})}
  state.boss=wave.some(([type])=>TYPES[type].boss);
  const bossName={gremialista:'EL GREMIALISTA',evita:'EVITA',peron:'JUAN PERÓN',mecha_fdr:'MECHA-FDR',che_bike:"CHE GUEVARA'S GHOST",super_stalin:'SUPER STALIN'};
  const featured=wave.find(([type])=>bossName[type]);
  state.banner=featured?bossName[featured[0]]:'WAVE '+state.wave;
  if(featured){const quotes={gremialista:'THE STREET BELONGS TO THE UNION!',evita:'A LITTLE THEATER KEEPS THE PEOPLE LOYAL.',peron:'YOU CANNOT CUT THROUGH HISTORY.',mecha_fdr:'WELCOME TO THE PERMANENT EMERGENCY.',che_bike:'THE REVOLUTION HAS RIGHT OF WAY!',super_stalin:'HISTORY OBEYS THE FIVE-YEAR ENGINE!'};state.bossQuote=quotes[featured[0]];state.bossQuoteTime=3}
  if(state.level===2&&state.wave===3)playCutscene('rand');
  if(state.level===3&&state.wave===5)playCutscene('liveDogs');
  if(state.level===4&&state.wave===3)playCutscene('kennel');
  const tipKey=`${state.level}-${state.wave}`,tips={
    '1-1':'TAP SAW FOR A 3-HIT CHAIN · HEAVY BREAKS GUARDS · DODGE THROUGH ATTACKS',
    '1-2':'CLIPBOARDS BLOCK FRONTAL SAW HITS. CIRCLE BEHIND OR USE HEAVY.',
    '1-4':'PROFESSORS BUFF THE CROWD. TAX COLLECTORS STEAL PESOS AND RUN.',
    '2-1':'WATCH THE FLOOR AND THE WARNING LABELS. MISSILES COMMIT TO THEIR PATH.',
    '2-2':'RED TAPE SLOWS MOVEMENT. A HEAVY SAW ATTACK CUTS IT FOR A SCORE BONUS.',
    '2-5':'MECHA-FDR CREATES NEW AGENCIES. CLEAR MINIONS BEFORE THEY BOX YOU IN.',
    '3-3':'PROPAGANDA FIELDS PULSE BEFORE THEY HIT. CROSS THEM BETWEEN BROADCASTS.',
    '3-5':'THE MOTORCYCLE CHARGE HAS A SHORT TELL. DODGE ACROSS IT, NOT AWAY.',
    '4-1':'SAVE A FULL LIBERTAD METER FOR THE REACTOR GAUNTLET.',
    '4-2':'REACTOR VENTS GLOW GOLD, THEN DISCHARGE BLUE. MOVE ON THE COLOR CHANGE.',
    '4-5':'THREE FORMS. LEARN THE TELL, PUNISH THE RECOVERY, KEEP MOVING.'
  };if(tips[tipKey])showTip(tipKey,tips[tipKey]);
  state.bannerTime=2;
}

function playerAttack(kind){
  if(hero.hp<=0)return;
  if(hero.timer>0){hero.attackBuffer={kind,life:.22};return}
  const heavy=kind==='heavy',finisher=!heavy&&hero.combo===2;
  hero.state=heavy?'heavy':'attack'; hero.timer=heavy?.55:.28;
  hero.vx=hero.face*(heavy?88:58);
  chainsawSound(heavy);
  hero.combo=heavy?0:(hero.combo%3)+1; hero.comboTime=.8;
  hero.attackHit={life:heavy?.26:.12,heavy,finisher,runId:state.runId};
}

function resolvePlayerHit({heavy,finisher,runId}){
    if(!state.running||state.runId!==runId||hero.hp<=0) return;
    let connected=false;
    const struck=new Set();for(const e of state.enemies){
      const ahead=(e.x-hero.x)*hero.face>0;
      if(ahead&&Math.abs(e.x-hero.x)<(heavy?112:86)&&Math.abs(e.y-hero.y)<52){
        const t=TYPES[e.type];
        let damage=(heavy?30:14+hero.combo*2+(finisher?7:0))*(1+profile.damage*.08)*(hero.goldTimer>0?2:1)*(heavy&&profile.heavy>=1?1.2:1);
        if(t.block&&!heavy&&e.face===-hero.face){damage=3;popup(e.x,e.y-112,'BLOCKED','#73c8e8');state.hitStop=.055;tone(150,.08,'square',.035)}
        e.hp-=damage; e.hit=finisher?.3:.18; e.x+=hero.face*(heavy?55:finisher?48:22);struck.add(e); connected=true;hero.hits++;state.waveMaxCombo=Math.max(state.waveMaxCombo,hero.hits);state.stats.maxCombo=Math.max(state.stats.maxCombo||0,hero.hits);hero.comboTime=1.15;state.hitStop=heavy?.075:finisher?.065:.038;popup(e.x,e.y-90,finisher?'COMBO FINISH':Math.round(damage),heavy||finisher?'#ffd15a':'#f1e2bd');if(heavy||finisher)rumble(heavy?.45:.28,heavy?55:38);
        state.multiplier=clamp(Math.max(state.multiplier,1+Math.floor(hero.hits/5)*.5),1,4);state.stats.maxMultiplier=Math.max(state.stats.maxMultiplier,state.multiplier);state.meter=clamp(state.meter+(heavy?11:7)*(1+profile.meter*.1),0,100); state.score+=Math.round(damage*10*state.multiplier);
        burst(e.x,e.y-40,heavy||finisher?'#ffd15a':'#f5eee0',heavy?12:finisher?10:6);
      }
    }
    if(heavy&&profile.heavy>=2){const shock=12*(1+profile.damage*.08);for(const e of state.enemies){if(struck.has(e)||dist(e,hero)>155)continue;e.hp-=shock;e.hit=.14;e.x+=(e.x>hero.x?1:-1)*28;popup(e.x,e.y-85,Math.round(shock),'#73c8e8');burst(e.x,e.y-30,'#73c8e8',7);connected=true}state.particles.push(...Array.from({length:22},(_,i)=>({x:hero.x,y:hero.y-12,vx:Math.cos(i/22*Math.PI*2)*250,vy:Math.sin(i/22*Math.PI*2)*90,life:.28,color:'#73c8e8'})))}
    for(const p of state.props){const ahead=(p.x-hero.x)*hero.face>0;if(ahead&&Math.abs(p.x-hero.x)<(heavy?120:88)&&Math.abs(p.y-hero.y)<58){p.hp-=heavy?35:18;p.hit=.15;connected=true;burst(p.x,p.y-30,'#d8a05b',9)}}
    if(heavy)for(const hazard of state.hazards){if(hazard.type==='redtape'&&!hazard.dead&&dist(hazard,hero)<145){hazard.dead=true;state.stats.hazardsDestroyed++;connected=true;state.score+=500;popup(hazard.x,hazard.y-75,'DEREGULATED +500','#73c8e8');burst(hazard.x,hazard.y-20,'#c62f37',18);tone(190,.18,'sawtooth',.045)}}
    if(connected) state.shake=heavy?8:3;
}

function special(){
  if(state.meter<100||hero.timer>0) return;
  state.meter=0; hero.state='special'; hero.timer=1; state.shake=18; state.banner='¡AFUERA!'; state.bannerTime=1.2;rumble(1,180);
  chainsawSound(true,.75);
  state.enemies.forEach(e=>{e.hp-=70*(1+profile.damage*.08);e.hit=.6;burst(e.x,e.y-40,'#e0ad3b',18)});tone(110,.65,'sawtooth',.08);
  for(const hazard of state.hazards){if(hazard.type==='pamphlets'&&!hazard.dead){hazard.dead=true;state.stats.hazardsDestroyed++;state.score+=750;popup(hazard.x,hazard.y-80,'BROADCAST CANCELED','#ffd15a');burst(hazard.x,hazard.y-20,'#f1e2bd',24)}}
}

function dodge(){if(hero.timer>0){hero.dodgeBuffer=.2;return}hero.dodgeBuffer=0;hero.attackBuffer=null;hero.state='dodge';hero.timer=.32;hero.invuln=.42+profile.dodge*(2/60);hero.dodgeWindow=.15+profile.dodge*(1/60);hero.vx=hero.face*360}
function perfectDodge(x=hero.x,y=hero.y-35){if(hero.dodgeWindow<=0)return false;hero.dodgeWindow=0;state.multiplier=clamp(state.multiplier+.5,1,4);state.stats.perfectDodges++;state.stats.maxMultiplier=Math.max(state.stats.maxMultiplier,state.multiplier);state.meter=clamp(state.meter+14*(1+profile.meter*.1),0,100);state.score+=Math.round(750*state.multiplier);state.hitStop=.075;state.shake=4;popup(hero.x,hero.y-110,`PERFECT DODGE · ×${state.multiplier.toFixed(1)}`,'#73c8e8');burst(x,y,'#73c8e8',16);tone(880,.16,'square',.045);rumble(.3,45);return true}
function breakMultiplier(){if(state.multiplier>1)popup(hero.x,hero.y-115,'MULTIPLIER LOST','#ff6b68');state.multiplier=1;hero.hits=0;hero.comboTime=0}
function callBossMove(name){state.bossMove=name;state.bossMoveTime=1.15;tone(210,.07,'square',.025)}

function update(dt){
  if(!state.running||state.paused) return;
  if(hero.hp<state.stats.lastHp)state.stats.damageTaken+=state.stats.lastHp-hero.hp;state.stats.lastHp=hero.hp;
  if(state.hitStop>0){state.hitStop-=dt;return}
  state.time+=dt; state.bannerTime-=dt;state.bossQuoteTime-=dt;state.bossMoveTime-=dt;state.waveGradeTime-=dt;state.tipTime-=dt;state.sceneFade=Math.max(0,state.sceneFade-dt*1.8);state.phaseFlash=Math.max(0,state.phaseFlash-dt);state.shake=Math.max(0,state.shake-dt*25);
  if(audio&&state.time>=state.musicNext)playMusicStep()
  hero.timer=Math.max(0,hero.timer-dt); hero.invuln=Math.max(0,hero.invuln-dt);hero.dodgeWindow=Math.max(0,hero.dodgeWindow-dt);hero.goldTimer=Math.max(0,hero.goldTimer-dt);hero.handTimer=Math.max(0,hero.handTimer-dt);if(hero.handTimer>0)hero.invuln=Math.max(hero.invuln,.08); hero.comboTime-=dt;hero.stepCd-=dt;
  if(hero.attackHit){hero.attackHit.life-=dt;if(hero.attackHit.life<=0){const pendingHit=hero.attackHit;hero.attackHit=null;resolvePlayerHit(pendingHit)}}
  if(hero.dodgeBuffer>0){hero.dodgeBuffer-=dt;if(hero.timer<=0)dodge()}
  if(hero.attackBuffer){hero.attackBuffer.life-=dt;if(hero.attackBuffer.life<=0)hero.attackBuffer=null;else if(hero.timer<=0){const buffered=hero.attackBuffer.kind;hero.attackBuffer=null;playerAttack(buffered)}}
  if(hero.comboTime<=0){hero.combo=0;hero.hits=0}
  const locked=hero.timer>0&&hero.state!=='dodge';
  let dx=0,dy=0;
  if(!locked){const axisX=Math.abs(currentPad?.axes[0]||0)>.22?currentPad.axes[0]:0,axisY=Math.abs(currentPad?.axes[1]||0)>.22?currentPad.axes[1]:0,padX=Number(padDown(15))-Number(padDown(14)),padY=Number(padDown(13))-Number(padDown(12));dx=axisX||padX||((keys.has('ArrowRight')||keys.has('KeyD'))-(keys.has('ArrowLeft')||keys.has('KeyA')));dy=axisY||padY||((keys.has('ArrowDown')||keys.has('KeyS'))-(keys.has('ArrowUp')||keys.has('KeyW')))}
  if(dx) hero.face=Math.sign(dx);
  const inTape=state.hazards.some(h=>h.type==='redtape'&&dist(h,hero)<h.r),terrainSpeed=inTape ? .62 : 1;
  const moveBoost=1+profile.speed*.06;if(hero.state!=='dodge'||hero.timer<=0){hero.vx=approach(hero.vx,dx*175*terrainSpeed*moveBoost,(dx?1150:1550)*dt);hero.vy=approach(hero.vy,dy*118*terrainSpeed*moveBoost,(dy?900:1300)*dt)}
  hero.x=clamp(hero.x+hero.vx*dt,45,W-45); hero.y=clamp(hero.y+hero.vy*dt,floorTop(),floorBottom());
  const travel=Math.hypot(hero.vx,hero.vy);if(travel>8)hero.walkPhase+=travel*dt/19;
  if(hero.timer<=0) hero.state=(dx||dy)?'walk':'idle';
  if((dx||dy)&&hero.state==='walk'&&hero.stepCd<=0){hero.stepCd=clamp(34/Math.max(80,travel),.19,.34);tone(78,.035,'square',.009);for(let i=0;i<3;i++)state.particles.push({x:hero.x-hero.face*8+(Math.random()-.5)*14,y:hero.y+2,vx:-hero.vx*.08+(Math.random()-.5)*24,vy:-12-Math.random()*16,life:.16+Math.random()*.1,color:'#c9a875'})}
  if(keys.has('KeyJ')&&once('KeyJ')) playerAttack('light');
  if(keys.has('KeyK')&&once('KeyK')) playerAttack('heavy');
  if(keys.has('Space')&&once('Space')) dodge();
  if(keys.has('KeyL')&&once('KeyL')) special();
  if(padOnce(0))playerAttack('light');
  if(padOnce(2))playerAttack('heavy');
  if(padOnce(1))dodge();
  if(padOnce(3)||padOnce(5))special();
  updateEnemies(dt); updatePickups(dt); updateParticles(dt);updateProjectiles(dt);updatePopups(dt);updateProps(dt);updateHazards(dt);
  state.enemies=state.enemies.filter(e=>{
    if(e.hp>0) return true;
    state.stats.enemiesDefeated=(state.stats.enemiesDefeated||0)+1;dropPeso(e);burst(e.x,e.y-45,'#ffd15a',TYPES[e.type].boss?34:e.elite?24:16);popup(e.x,e.y-105,TYPES[e.type].boss?'BOSS DOWN':e.elite?'ELITE AFUERA':'AFUERA','#ffd15a');state.shake=TYPES[e.type].boss?14:e.elite?9:6;state.score+=Math.round((TYPES[e.type].boss?5000:e.elite?1250:500)*state.multiplier); return false;
  });
  if(state.wavePending){state.waveDelay-=dt;if(state.waveDelay<=0){if(!state.enemies.length)spawnWave();else state.wavePending=false}}
  else if(!state.enemies.length&&!state.victory){state.wavePending=true;state.waveDelay=1.5;awardWave()}
}

function objectiveForWave(wave){return [
  {label:'BONUS · TAKE NO DAMAGE',test:()=>hero.hp>=state.waveStartHp-1},
  {label:'BONUS · CLEAR UNDER 24 SECONDS',test:()=>state.time-state.waveStartTime<24},
  {label:'BONUS · LAND A PERFECT DODGE',test:()=>state.stats.perfectDodges>state.waveStartDodges},
  {label:'BONUS · REACH A 6-HIT COMBO',test:()=>state.waveMaxCombo>=6}
][(wave-1)%4]}
function awardWave(){
  const elapsed=state.time-state.waveStartTime,hurt=hero.hp<state.waveStartHp-1,objectiveWon=!!state.waveObjective?.test();let bonus=250,grade='C';
  if(!hurt&&elapsed<22){bonus=1500;grade='S'}else if(!hurt){bonus=1000;grade='A'}else if(elapsed<25){bonus=650;grade='B'}
  bonus=Math.round(bonus*state.multiplier);state.score+=bonus;
  if(objectiveWon){const objectiveBonus=Math.round(1000*state.multiplier);state.score+=objectiveBonus;state.meter=clamp(state.meter+20,0,100);state.stats.objectivesCompleted++;state.waveGrade=`${grade} RANK · BONUS +${objectiveBonus}`;popup(hero.x,hero.y-125,'OBJECTIVE COMPLETE','#73c8e8');tone(880,.18,'square',.04);setTimeout(()=>tone(1175,.2,'square',.035),110)}else state.waveGrade=`${grade} RANK · +${bonus}`;
  state.waveGradeTime=1.45;state.banner=objectiveWon?'BONUS COMPLETE':'WAVE CLEAR';state.bannerTime=1.35;tone(440,.14,'square',.04);setTimeout(()=>tone(660,.18,'square',.035),120)
}
const awardWaveGrade=awardWave;awardWave=function(){awardWaveGrade();saveRunCheckpoint()};

function canEnemyAttack(candidate){const cap=selectedDifficulty==='primer'?1:selectedDifficulty==='motosierra'?3:2,active=state.enemies.filter(e=>e!==candidate&&!TYPES[e.type].boss&&(e.timer>0||e.telegraph>0||e.charge>0)).length;return active<cap}
function circleHero(e,dt){const side=(Math.floor(e.seed*10)%2?1:-1),targetY=clamp(hero.y+side*70,floorTop(),floorBottom());e.vy=approach(e.vy,Math.sign(targetY-e.y)*TYPES[e.type].speed*.42,260*dt);e.vx=approach(e.vx,Math.sign(hero.x-e.x)*TYPES[e.type].speed*.18,220*dt);e.x+=e.vx*dt;e.y+=e.vy*dt;e.walkPhase+=Math.hypot(e.vx,e.vy)*dt/18;e.state='walk'}

function updateEnemies(dt){
  const professorAlive=state.enemies.some(e=>e.type==='professor'&&e.hp>0);
  for(const e of state.enemies){
    const t=TYPES[e.type]; e.timer-=dt;e.hit-=dt;e.attackCd-=dt;e.summonCd-=dt;e.flee=Math.max(0,(e.flee||0)-dt);e.entrance=Math.max(0,(e.entrance||0)-dt);e.face=e.x>hero.x?-1:1;
    if(e.entrance>0){e.state='walk';e.walkPhase+=dt*9;continue}
    if(t.boss){const next=e.hp/e.maxHp<=.33?3:e.hp/e.maxHp<=.66?2:1;if(next>e.phase){e.phase=next;e.attackCd=0;state.phaseFlash=.8;state.shake=16;rumble(.9,150);state.banner=`${e.type==='gremialista'?'GREMIALISTA':e.type.toUpperCase()} · PHASE ${next}`;state.bannerTime=1.4;burst(e.x,e.y-55,next===3?'#c62f37':'#e0ad3b',34);tone(82,.35,'sawtooth',.06);if(e.type==='super_stalin'&&next===3)playCutscene('marx')}}
    if(e.hit>0) continue;
    // Hold the attack pose through its recovery window. This keeps strikes readable,
    // prevents enemies from gliding immediately after contact, and creates a fair punish beat.
    if(e.timer>0){e.state='attack';e.vx=approach(e.vx,0,900*dt);e.vy=approach(e.vy,0,900*dt);continue}
    if(e.flee>0){e.state='walk';const escape=Math.sign(e.x-hero.x)||1;e.vx=approach(e.vx,escape*t.speed*1.9,650*dt);e.vy=approach(e.vy,Math.sign(e.y-(floorTop()+floorBottom())/2)*t.speed*.35,350*dt);e.x=clamp(e.x+e.vx*dt,25,W-25);e.y=clamp(e.y+e.vy*dt,floorTop(),floorBottom());e.walkPhase+=Math.hypot(e.vx,e.vy)*dt/18;continue}
    if(e.charge>0){e.charge-=dt;e.state='charge';e.x+=e.face*(e.type==='che_bike'?470:310)*dt;if(dist(e,hero)<65){enemyStrike(e,t);e.charge=0}continue;}
    if(e.telegraph>0){e.telegraph-=dt*difficultyTell();e.state='telegraph';if(e.telegraph<=0){if(e.attackKind==='charge'){e.charge=.65;e.attackCd=1.5;tone(58,.28,'sawtooth',.06)}else enemyStrike(e,t)}continue;}
    if(e.type==='peron'&&e.summonCd<=0&&state.enemies.length<4){e.summonCd=e.phase===3?3.8:7;spawn(e.phase===3?'heavy':'bureaucrat',clamp(e.x+e.face*-120,80,W-80),clamp(e.y+45,floorTop(),floorBottom()));callBossMove('LOYALTY PROGRAM');continue;}
    if(e.type==='mecha_fdr'&&e.summonCd<=0&&e.phase>=2&&state.enemies.length<4){e.summonCd=e.phase===3?3.2:5.5;spawn('alphabet',clamp(e.x-130,80,W-80),clamp(e.y+40,floorTop(),floorBottom()));callBossMove('ALPHABET SOUP');continue;}
    if(e.type==='super_stalin'&&e.summonCd<=0&&e.phase===3&&state.enemies.length<4){e.summonCd=4;spawn('kremlin_tech',clamp(e.x-140,80,W-80),clamp(e.y+35,floorTop(),floorBottom()));state.banner='FIVE-YEAR REINFORCEMENTS';state.bannerTime=.8;continue;}
    const d=dist(e,hero);
    if(e.type==='super_stalin'&&e.phase===1&&d<340&&d>100){if(e.attackCd<=0){e.attackCd=1.15;callBossMove('FIVE-YEAR SHOCK PLAN');spawnProjectile(e,'lightning',t.damage*.8);tone(180,.2,'sawtooth',.05)}
    }else if(e.type==='super_stalin'&&e.phase===2&&d>125&&e.attackCd<=0){e.attackKind='charge';e.telegraph=.52;callBossMove('IRON CURTAIN CALL');tone(70,.24,'sawtooth',.06);
    }else if(e.type==='super_stalin'&&e.phase===3&&d<360&&d>100){if(e.attackCd<=0){e.attackCd=.72;callBossMove('MISSILE GAP');spawnProjectile(e,'missile',t.damage);spawnProjectile({...e,y:e.y+65},'missile',t.damage*.75);tone(80,.2,'sawtooth',.06)}
    }else if(e.type==='che_bike'&&d>120&&e.attackCd<=0){e.attackKind='charge';e.telegraph=Math.max(.32,.58-(e.phase-1)*.1);callBossMove('REVOLUTIONARY ROAD');tone(145,.18,'sawtooth',.05);
    }else if(e.type==='mecha_fdr'&&d<340&&d>110){if(e.attackCd<=0){e.attackCd=Math.max(.55,1.4-(e.phase-1)*.28);callBossMove(e.phase===1?'NEW DEAL DELIVERY':e.phase===2?'RELIEF PACKAGE':'DEFICIT SPENDING');spawnProjectile(e,'missile',t.damage);if(e.phase===3)spawnProjectile({...e,y:e.y+70},'missile',t.damage*.75);tone(105,.18,'sawtooth',.05)}
    }else if(e.type==='gremialista'&&e.phase>=2&&d>135&&e.attackCd<=0){e.attackKind='charge';e.telegraph=.65;callBossMove('GENERAL STRIKE');tone(90,.18,'sawtooth',.045);
    }else if(e.type==='evita'&&d<280&&d>95){
      e.y+=Math.sin(state.time*2+e.seed)*24*dt;
      if(e.attackCd<=0){e.attackCd=Math.max(.55,1.35-(e.phase-1)*.24);callBossMove('RADIO FREE EVITA');spawnProjectile(e,'speech',t.damage);tone(330,.12,'triangle',.035)}
    } else if(d>t.range){
      const boost=(professorAlive&&!t.buffer?1.18:1)*(t.boss?1+(e.phase-1)*.22:1)*(e.elite?1.14:1)*difficultySpeed();
      e.vx=approach(e.vx,Math.sign(hero.x-e.x)*t.speed*boost,420*dt);
      e.vy=approach(e.vy,Math.sign(hero.y-e.y)*t.speed*.52*boost,310*dt);
      e.x+=e.vx*dt;e.y+=e.vy*dt;e.walkPhase+=Math.hypot(e.vx,e.vy)*dt/18;
      e.state='walk';
    } else {e.vx=approach(e.vx,0,620*dt);e.vy=approach(e.vy,0,620*dt);if(e.attackCd<=0){if(t.boss){e.telegraph=e.type==='peron'?.7:.48;callBossMove(e.type==='peron'?'EXECUTIVE DECREE':e.type==='gremialista'?'COLLECTIVE BARGAINING':e.type==='mecha_fdr'?'FIRESIDE SMACK':'DIRECT ACTION');tone(95,.14,'sawtooth',.045)}else if(canEnemyAttack(e)){e.attackKind='strike';e.telegraph=.28;tone(165,.055,'square',.018)}else circleHero(e,dt)}}
    e.x=clamp(e.x,25,W-25);e.y=clamp(e.y,floorTop(),floorBottom());
  }
  for(let i=0;i<state.enemies.length;i++)for(let j=i+1;j<state.enemies.length;j++){const a=state.enemies[i],b=state.enemies[j],dx=b.x-a.x,dy=(b.y-a.y)*1.5,d=Math.hypot(dx,dy);if(d>0&&d<58){const push=(58-d)*.035;a.x-=dx/d*push;b.x+=dx/d*push;a.y-=dy/d*push*.3;b.y+=dy/d*push*.3}}
}
function enemyStrike(e,t){e.state='attack';e.vx=0;e.vy=0;e.timer=.35;e.attackKind='strike';e.attackCd=(t.boss?Math.max(.42,.9-(e.phase-1)*.17):1.05+Math.random()*.55)/(selectedDifficulty==='motosierra'?1.12:1);let landed=false;if(e.type==='peron'&&e.phase>=2)spawnProjectile(e,'decree',t.damage*.7);const inRange=dist(e,hero)<t.range+28;if(inRange&&hero.invuln>0)perfectDodge(e.x,e.y-40);else if(inRange){landed=true;const damage=t.damage*(t.boss?1+(e.phase-1)*.16:1)*(e.elite?1.2:1)*difficultyDamage();hero.hp-=damage;breakMultiplier();rumble(t.boss ? .7 : .42,t.boss ? 110 : 65);popup(hero.x,hero.y-85,`-${Math.round(damage)}`,'#ff6b68');hero.invuln=.5;hero.x+=e.face*30;state.shake=6;burst(hero.x,hero.y-35,'#c62f37',8);tone(70,.13,'square',.05)}if(t.thief&&landed&&state.pesos>0){const stolen=Math.min(20,state.pesos);state.pesos-=stolen;e.stolen=(e.stolen||0)+stolen;e.flee=2.7;e.x+=e.face*-55;popup(e.x,e.y-105,`STOLE $${Math.floor(stolen)}`,'#ffd15a');state.banner='TAX COLLECTOR ESCAPING';state.bannerTime=.8}if(hero.hp<=0)lose()}

function spawnProjectile(e,kind,damage){const dx=hero.x-e.x,dy=(hero.y-35)-(e.y-45),d=Math.hypot(dx,dy)||1,speed=kind==='decree'?235:kind==='missile'?270:kind==='lightning'?310:190;state.projectiles.push({x:e.x,y:e.y-45,vx:dx/d*speed,vy:dy/d*speed,damage,kind,life:3})}
function updateProjectiles(dt){state.projectiles.forEach(p=>{p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;const collision=Math.hypot(p.x-hero.x,p.y-(hero.y-35))<30;if(collision&&hero.invuln>0){perfectDodge(p.x,p.y);p.life=0}else if(collision){const damage=p.damage*difficultyDamage();hero.hp-=damage;breakMultiplier();hero.invuln=.55;p.life=0;state.shake=5;rumble(.55,75);popup(hero.x,hero.y-85,`-${Math.round(damage)}`,'#ff6b68');burst(hero.x,hero.y-35,p.kind==='decree'?'#e0ad3b':'#73c8e8',9);tone(72,.12);if(hero.hp<=0)lose()}});state.projectiles=state.projectiles.filter(p=>p.life>0&&p.x>-40&&p.x<W+40&&p.y>240&&p.y<H+40)}
function popup(x,y,text,color){state.popups.push({x,y,text,color,life:.75})}
function updatePopups(dt){state.popups.forEach(p=>{p.life-=dt;p.y-=42*dt});state.popups=state.popups.filter(p=>p.life>0)}

function dropPeso(e){
  const total=TYPES[e.type].value*(e.elite?1.6:1)+(e.stolen||0), count=TYPES[e.type].boss?8:Math.max(1,Math.ceil(total/12));
  for(let i=0;i<count;i++) state.pickups.push({x:e.x+(Math.random()-.5)*55,y:e.y+(Math.random()-.5)*35,value:total/count,age:0});
}
function updatePickups(dt){
  state.pickups.forEach(p=>{
    p.age+=dt;if(p.power){if(hit(p,hero,38+profile.magnet*20)){if(p.power==='gold'){hero.goldTimer=10;popup(hero.x,hero.y-100,'DOUBLE DAMAGE','#ffd15a')}else if(p.power==='hand'){hero.handTimer=6;popup(hero.x,hero.y-100,'INVISIBLE HAND','#73c8e8')}else{hero.hp=Math.min(hero.maxHp,hero.hp+35);popup(hero.x,hero.y-100,'MATE +35','#78bd70')}p.dead=true;state.banner=p.power==='gold'?'GOLDEN CHAINSAW':p.power==='hand'?'INVISIBLE HAND':'MATE BREAK';state.bannerTime=1;tone(760,.2,'square',.045)}return}
    p.originalValue??=p.value;const before=p.value,decay=selectedDifficulty==='primer'?.75:selectedDifficulty==='motosierra'?1.15:1;p.value=Math.max(.25,p.value*(1-dt*.055*decay));state.stats.pesosLost+=(before-p.value);
    if(hit(p,hero,34+profile.magnet*20)){state.pesos+=p.value;state.stats.pesosCollected+=p.value;if(p.age<3){state.stats.soundMoneyPickups++;state.score+=Math.round(p.value*30);if(state.stats.soundMoneyPickups%5===0)popup(hero.x,hero.y-115,`SOUND MONEY ×${state.stats.soundMoneyPickups}`,'#78bd70')}else state.score+=Math.round(p.value*20);p.dead=true;tone(620,.05,'square',.025)}
  });
  state.pickups=state.pickups.filter(p=>!p.dead&&p.age<18);
}
function updateProps(dt){state.props.forEach(p=>{p.hit=Math.max(0,(p.hit||0)-dt);if(p.hp<=0&&!p.dead){p.dead=true;for(let i=0;i<3;i++)state.pickups.push({x:p.x+(i-1)*17,y:p.y+(Math.random()-.5)*20,value:7,age:0});const powerRoll=Math.random();if(hero.hp/hero.maxHp<.45&&powerRoll<.42)state.pickups.push({x:p.x,y:p.y-18,power:'mate',age:0});else if(powerRoll<.14)state.pickups.push({x:p.x,y:p.y-18,power:state.level%2?'gold':'hand',age:0});popup(p.x,p.y-85,'PROPERTY RIGHTS','#ffd15a');state.score+=250;burst(p.x,p.y-25,'#d8a05b',16);tone(120,.12,'square',.05)}});state.props=state.props.filter(p=>!p.dead)}
function hazardState(h){const cycle=h.type==='vent'?3:h.type==='pamphlets'?4:0,phase=cycle?(state.time+h.phase)%cycle:0,start=h.type==='vent'?2.15:h.type==='pamphlets'?3.25:Infinity;return {active:phase>start,warning:phase>start-.4&&phase<=start}}
function updateHazards(dt){for(const h of state.hazards){if(h.dead)continue;h.damageCd=Math.max(0,(h.damageCd||0)-dt);const {active}=hazardState(h);if(active&&h.damageCd<=0&&hero.invuln<=0&&dist(h,hero)<h.r){const damage=h.type==='vent'?12:7;hero.hp-=damage;breakMultiplier();hero.invuln=.65;h.damageCd=.8;state.shake=5;popup(hero.x,hero.y-85,`-${damage}`,h.type==='vent'?'#73c8e8':'#c62f37');burst(hero.x,hero.y-20,h.type==='vent'?'#73c8e8':'#c62f37',10);tone(h.type==='vent'?150:90,.16,'sawtooth',.05);if(hero.hp<=0)lose()}}state.hazards=state.hazards.filter(h=>!h.dead)}
function burst(x,y,color,n){if(state.perf.lowPower)n=Math.max(3,Math.ceil(n*.55));for(let i=0;i<n;i++)state.particles.push({x,y,vx:(Math.random()-.5)*220,vy:(Math.random()-.7)*180,life:.3+Math.random()*.35,color});}
function updateParticles(dt){state.particles.forEach(p=>{p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=280*dt});state.particles=state.particles.filter(p=>p.life>0);const cap=state.perf.lowPower?90:180;if(state.particles.length>cap)state.particles.splice(0,state.particles.length-cap)}

function lose(){if(!state.running)return;state.running=false;rumble(1,220);const el=document.querySelector('#message'),canContinue=runContinues>0,retryLabel=bossPractice?'RETRY BOSS':'RETRY LEVEL';if(!canContinue)clearRunCheckpoint();el.innerHTML=`<p class="eyebrow">${canContinue?'ENCOUNTER LOST':'RUN ENDED'}</p><h1>${canContinue?'CONTINUE?':'GAME OVER'}</h1><p>${canContinue?'Restart this encounter with upgrades intact. Unbanked pesos lose 20% of their remaining value.':'The state added one form too many.'}</p><p>SCORE ${state.score.toLocaleString()} · PESOS $${Math.floor(state.pesos)} · CONTINUES ${runContinues}</p><div>${canContinue?'<button data-continue>SPEND CONTINUE</button>':`<button data-newrun>${retryLabel}</button>`}<button data-endrun class="secondary">CAMPAIGN MENU</button></div>`;el.classList.remove('hidden');if(canContinue)el.querySelector('[data-continue]').onclick=()=>{runContinues--;const resume={wave:Math.max(0,state.wave-1),scene:state.scene,time:state.time,score:state.score,pesos:state.pesos*.8};el.classList.add('hidden');reset(state.level,resume);saveRunCheckpoint(Math.max(0,state.wave-1))};else el.querySelector('[data-newrun]').onclick=()=>{clearRunCheckpoint();runContinues=2;el.classList.add('hidden');reset(state.level,bossPractice?{wave:state.level===1?5:4,score:0,pesos:0,stats:freshStats()}:null)};el.querySelector('[data-endrun]').onclick=()=>{clearRunCheckpoint();showStart()}}
function win(){state.victory=true;state.running=false;shopPurchase=null;shopInterestApplied=false;state.score=Math.round((state.score+state.pesos*100)*(selectedDifficulty==='motosierra' ? 1.25 : selectedDifficulty==='primer' ? .85 : 1));profile.dollars+=Math.max(1,Math.floor(state.pesos/50));profile.highScore=Math.max(profile.highScore,state.score);if(!dailyChallenge){profile.unlockedLevel=Math.max(profile.unlockedLevel,Math.min(4,state.level+1));if(state.level===4)profile.completed=true}profile.scores=Array.isArray(profile.scores)?profile.scores:[];const rank=state.score>=30000?'S RANK':state.score>=20000?'A RANK':state.score>=12000?'B RANK':'C RANK';profile.scores.push({level:state.level,score:state.score,rank,difficulty:selectedDifficulty,at:Date.now()});profile.scores.sort((a,b)=>b.score-a.score);profile.scores=profile.scores.slice(0,20);saveProfile();showOutro();}
const finishMission=win;win=function(){clearRunCheckpoint();if(bossPractice){state.victory=true;state.running=false;const el=document.querySelector('#message');el.innerHTML=`<p class="eyebrow">BOSS PRACTICE</p><h1>TARGET DEFEATED</h1><p>SCORE ${state.score.toLocaleString()} · DAMAGE ${Math.round(state.stats.damageTaken)} · PERFECT DODGES ${state.stats.perfectDodges}</p><div><button data-rematch>REMATCH</button><button data-practice-menu class="secondary">LEVEL SELECT</button></div>`;el.classList.remove('hidden');el.querySelector('[data-rematch]').onclick=()=>{el.classList.add('hidden');reset(state.level,{wave:(state.level===1?5:4),score:0,pesos:0,stats:freshStats()})};el.querySelector('[data-practice-menu]').onclick=showStart;return}if(dailyChallenge)state.score=Math.round(state.score*1.15);finishMission()};
function showOutro(){if(state.level===3&&!seenScenes.has('betrayal')){playCutscene('betrayal',showOutro);return}const el=document.querySelector('#message');const outros={1:{img:'peron.png',alt:'Defeated Perón',eyebrow:'BUENOS AIRES SECURED',title:'THE MACHINE IS DOWN.',copy:"Perón's presses stop. The surviving pesos immediately become collector's items.",line:'MILEI: “One ministry down. History still has three more mistakes.”'},2:{img:'mecha_fdr.png',alt:'Defeated Mecha-FDR',eyebrow:'MINISTRY LIBERATED',title:'THE NEW DEAL EXPIRED.',copy:'The Alphabet Agencies scatter. A temporal route opens toward the University of Marx.',line:'MILEI: “Your emergency lasted ninety years too long.”'},3:{img:'che_bike_idle.png',alt:"Defeated Che's Ghost",eyebrow:'CAMPUS CLEARED',title:'THE REVOLUTION MISSED ITS EXIT.',copy:"Che's motorcycle dissolves into blue smoke. The route to Moscow and the Five-Year Engine opens.",line:'MILEI: “Ideas have consequences. Motorcycles have brakes.”'},4:{img:'stalin_mecha.png',alt:'Defeated Super Stalin',eyebrow:'HISTORY RESTORED',title:'THE FIVE-YEAR ENGINE IS FINISHED.',copy:'The reactor collapses, the stolen dogs are freed, and the rewritten timeline snaps back into place.',line:'MILEI: “Liberty is not a checkpoint. It is the road home.”'}};const o=outros[state.level],final=state.level===4;el.innerHTML=`<div class="cutscene"><img src="assets/${o.img}" alt="${o.alt}"><div><p class="eyebrow">${o.eyebrow}</p><h1>${o.title}</h1><p>${o.copy}</p><p class="dialogue">${o.line}</p><button>${final?'VIVA LA LIBERTAD':'ENTER THE DOLLARIZATION SHOP'}</button></div></div>`;el.classList.remove('hidden');el.querySelector('button').onclick=final?showEnding:showShop}
const cinematicOutro=showOutro;
showOutro=function(){if(state.resultsShown){(dailyChallenge?showLeaderboard:cinematicOutro)();return}state.resultsShown=true;state.paused=false;document.querySelector('#pauseMenu').classList.add('hidden');document.querySelector('#pauseButton').textContent='Ⅱ';const minutes=Math.floor(state.time/60),seconds=Math.floor(state.time%60).toString().padStart(2,'0'),stats={...state.stats,time:state.time,daily:dailyChallenge},latest=profile.scores?.reduce((a,b)=>!a||b.at>a.at?b:a,null);if(latest)Object.assign(latest,stats);profile.honors=[...new Set([...profile.honors,...earnedBadges(profile.scores||[]).filter(badge=>badge.earned).map(badge=>badge.name)])];saveProfile();const el=document.querySelector('#message');el.innerHTML=`<p class="eyebrow">${dailyChallenge?'DAILY CHALLENGE':'MISSION '+state.level} COMPLETE</p><h1>FIELD REPORT</h1><div class="mission-stats"><span><strong>${minutes}:${seconds}</strong>COMBAT TIME</span><span><strong>${Math.round(state.stats.damageTaken)}</strong>DAMAGE TAKEN</span><span><strong>${state.stats.enemiesDefeated||0}</strong>ENEMIES CLEARED</span><span><strong>${state.stats.maxCombo||0}</strong>LONGEST COMBO</span><span><strong>${state.stats.perfectDodges}</strong>PERFECT DODGES</span><span><strong>×${state.stats.maxMultiplier.toFixed(1)}</strong>PEAK MULTIPLIER</span><span><strong>$${Math.floor(state.stats.pesosCollected)}</strong>PESOS RECOVERED</span><span><strong>$${Math.floor(state.stats.pesosLost)}</strong>LOST TO INFLATION</span><span><strong>${state.stats.soundMoneyPickups}</strong>FAST COLLECTIONS</span><span><strong>${state.stats.objectivesCompleted}/${state.stats.objectivesOffered}</strong>BONUS OBJECTIVES</span><span><strong>${state.score.toLocaleString()}</strong>FINAL SCORE</span></div><button>CONTINUE</button>`;el.classList.remove('hidden');el.querySelector('button').onclick=dailyChallenge?showLeaderboard:cinematicOutro};
const showFieldReport=showOutro;showOutro=function(){showFieldReport();const el=document.querySelector('#message'),stats=el.querySelector('.mission-stats'),continueButton=stats?.nextElementSibling;if(!stats||el.querySelector('[data-share-result]')||!continueButton)return;continueButton.insertAdjacentHTML('beforebegin','<button data-share-result class="secondary">COPY RESULT</button>');el.querySelector('[data-share-result]').onclick=async event=>{const rank=state.score>=30000?'S RANK':state.score>=20000?'A RANK':state.score>=12000?'B RANK':'C RANK',text=`¡AFUERA! ${dailyChallenge?'Daily Challenge':`Level ${state.level}`} · ${rank} · ${state.score.toLocaleString()} points · ${state.stats.objectivesCompleted}/${state.stats.objectivesOffered} bonus objectives · ¡Viva la libertad!`;try{await navigator.clipboard.writeText(text);event.currentTarget.textContent='RESULT COPIED'}catch{event.currentTarget.textContent='COPY BLOCKED'}setTimeout(()=>event.currentTarget.textContent='COPY RESULT',1500)}};
function showEnding(){if(!seenScenes.has('homecoming')){playCutscene('homecoming',showEnding);return}const el=document.querySelector('#message');el.innerHTML=`<p class="eyebrow">MISSION COMPLETE</p><h1>¡VIVA LA LIBERTAD!</h1><p>The dogs are home. The timeline is intact. Somewhere, another government printer starts warming up.</p><p class="dialogue">A phone rings aboard the Böhm-Bawerk...</p><button>POST-CREDITS</button>`;el.classList.remove('hidden');el.querySelector('button').onclick=()=>playCutscene('postCredits',showLeaderboard)}
function showShop(){if(!seenScenes.has('smith')){shopVisitPurchases=0;playCutscene('smith',showShop);return}let interest=0;if(!shopInterestApplied){shopInterestApplied=true;interest=Math.min(8,Math.floor(profile.dollars*.1*profile.interest));profile.dollars+=interest;if(interest)saveProfile()}const el=document.querySelector('#message'),next=state.level+1,hasNext=next<=4,available=Object.entries(SHOP).filter(([,item])=>profile[item===SHOP.damage?'damage':Object.keys(SHOP).find(k=>SHOP[k]===item)]<item.prices.length),recommended=available.sort(([a],[b])=>profile[a]-profile[b])[0]?.[0];const cards=Object.entries(SHOP).map(([key,item])=>{const tier=profile[key],max=tier>=item.prices.length,cost=item.prices[tier],nextTier=Math.min(tier+1,item.prices.length);return `<button class="shop-card ${key===recommended?'recommended':''}" data-up="${key}" ${max?'disabled':''}><span>${key===recommended&&!max?'SMITH’S PICK':'UPGRADE'}</span><b>${item.name}</b><small>${max?'MASTERED':`TIER ${tier} → ${nextTier} · ${item.effect}`}</small><em>${max?'MAX':`$${cost}`}</em></button>`}).join(''),smithLine=shopPurchase?`A good exchange: ${SHOP[shopPurchase.key].name.toLowerCase()} for a stronger chance of bringing them home.`:interest?`Your restraint earned $${interest}. Even here, patience compounds.`:shopVisitPurchases?'Capital should move. So should you.':'The pesos died outside. What survived belongs to your next decision.';el.innerHTML=`<div class="free-port"><div class="shop-scene"><div><p class="eyebrow">THE FREE PORT · BETWEEN YEARS</p><h1>DOLLARIZATION</h1><p class="smith-line"><b>ADAM SMITH:</b> “${smithLine}”</p></div><div class="shop-wallet"><span>STABLE MONEY</span><strong>$${profile.dollars}</strong><small>FIELD SCORE ${state.score.toLocaleString()}</small></div></div><div class="shop-route"><span class="done">1 · ARRIVE</span><span class="active">2 · INVEST</span><span>3 · LAUNCH</span></div><div class="shop">${cards}</div><div class="shop-depart">${shopPurchase?'<button data-refund class="secondary">UNDO LAST TRADE</button>':''}${hasNext?`<button data-next>LAUNCH FOR LEVEL ${next}</button>`:''}<button data-replay class="secondary">RETURN TO LEVEL ${state.level}</button></div></div>`;el.classList.remove('hidden');el.querySelectorAll('[data-up]:not(:disabled)').forEach(b=>b.onclick=()=>{const key=b.dataset.up,item=SHOP[key],cost=item.prices[profile[key]];if(profile.dollars>=cost){profile.dollars-=cost;profile[key]++;shopVisitPurchases++;shopPurchase={key,cost};saveProfile();tone(660,.16,'square',.04);setTimeout(()=>tone(880,.12,'square',.025),70);showShop()}else{tone(55,.12);b.animate([{transform:'translateX(-5px)'},{transform:'translateX(5px)'},{transform:'none'}],{duration:180})}});el.querySelector('[data-refund]')?.addEventListener('click',()=>{profile[shopPurchase.key]--;profile.dollars+=shopPurchase.cost;shopPurchase=null;shopVisitPurchases=Math.max(0,shopVisitPurchases-1);saveProfile();tone(330,.12,'square',.03);showShop()});if(hasNext)el.querySelector('[data-next]').onclick=()=>{shopPurchase=null;shopVisitPurchases=0;el.classList.add('hidden');showIntro(next)};el.querySelector('[data-replay]').onclick=()=>{shopPurchase=null;shopVisitPurchases=0;el.classList.add('hidden');showIntro(state.level)}}
function showMessage(title,copy,button,action){const el=document.querySelector('#message');el.innerHTML=`<h1>${title}</h1><p>${copy}</p><p>SCORE ${state.score.toLocaleString()} · $${Math.floor(state.pesos)}</p><button>${button}</button>`;el.classList.remove('hidden');el.querySelector('button').onclick=()=>{el.classList.add('hidden');action()};}
function showIntro(level=1){if(level===1&&!seenScenes.has('theft')){playCutscene('theft',()=>showIntro(1));return}const el=document.querySelector('#message');const intros={1:`<p class="eyebrow">BUENOS AIRES · 1951</p><h1>FOLLOW THE MONEY.</h1><p>The ransom trail begins on Calle Corrientes. Every dropped peso is dying in real time—and every enforcer between Milei and the printing press knows who bought the dogs.</p>`,2:`<p class="eyebrow">WASHINGTON · 1935</p><h1>THE EMERGENCY NEVER ENDED.</h1><p>The Ministry has spent ninety years adding floors. Tear through the agencies, reach the roof, and cancel Mecha-FDR's permanent crisis.</p>`,3:`<p class="eyebrow">PARIS · 1968</p><h1>THE REVOLUTION HAS THE KEYS.</h1><p>The final Moscow route is buried inside an occupied university. The professors command the mob. Che's ghost guards the exit.</p>`,4:`<p class="eyebrow">MOSCOW · 1952</p><h1>FIVE HOURS BECAME FIVE MINUTES.</h1><p>The dogs are above the core. Stalin is inside the machine. Break the reactor before the countdown reaches zero.</p>`};el.innerHTML=`${intros[level]}<button>¡AFUERA!</button>`;el.classList.remove('hidden');el.querySelector('button').onclick=()=>{el.classList.add('hidden');tone(220,.16,'square',.04);reset(level)}}

function draw(){
  ctx.save(); const shake=profile.screenShake?state.shake:0,sx=shake?(Math.random()-.5)*shake:0, sy=shake?(Math.random()-.5)*shake:0;ctx.translate(sx,sy);
  drawWorld(); drawEntities(); drawFx(); ctx.restore(); drawHud();
  requestAnimationFrame(frame);
}
function drawWorld(){
  const background=state.level===1?backgrounds[state.scene]:state.level===2?ministryBackground:state.level===3?universityBackground:kremlinBackground;if(background?.complete){const zoom=1.045,bw=W*zoom,bh=H*zoom,parallax=profile.reducedMotion?0:(hero.x-W/2)*.035;ctx.drawImage(background,-(bw-W)/2-parallax,-(bh-H)/2,bw,bh)}else{ctx.fillStyle='#a66d39';ctx.fillRect(0,0,W,H)}
  const top=floorTop();ctx.fillStyle='#07172d55';ctx.fillRect(0,0,W,top-20);ctx.fillStyle='#1a122455';ctx.fillRect(0,top-10,W,H-top+10);
  ctx.strokeStyle='#f1e2bd22';for(let y=top;y<H;y+=28){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
  drawAmbient();
  state.hazards.forEach(drawHazard);
}
function drawAmbient(){if(profile.reducedMotion)return;ctx.save();for(let i=0;i<14;i++){const seed=i*97.3,drift=(state.time*(state.level===4?75:22)+seed)%(W+100)-50,y=95+((seed*3.7+state.time*(10+i%3*4))%(H-150));if(state.level===1){ctx.globalAlpha=.16;ctx.fillStyle='#e0ad3b';ctx.fillRect(drift,y,3,3)}else if(state.level===2){ctx.save();ctx.globalAlpha=.18;ctx.fillStyle='#f1e2bd';ctx.translate(drift,y);ctx.rotate(Math.sin(state.time+i)*.4);ctx.fillRect(-5,-3,10,6);ctx.restore()}else if(state.level===3){ctx.save();ctx.globalAlpha=.2;ctx.fillStyle=i%2?'#c62f37':'#f1e2bd';ctx.translate(drift,y);ctx.rotate(state.time*.3+i);ctx.fillRect(-6,-4,12,8);ctx.restore()}else{ctx.globalAlpha=.28;ctx.strokeStyle='#73c8e8';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(drift,y);ctx.lineTo(drift-7,y+10);ctx.stroke()}}ctx.restore();ctx.globalAlpha=1}
function drawHazard(h){const {active,warning}=hazardState(h),pulse=.5+Math.sin(state.time*8+h.x)*.18;ctx.save();ctx.translate(h.x,h.y);ctx.globalAlpha=active?.8:warning?.95:pulse;if(h.type==='redtape'){ctx.fillStyle='#c62f3766';ctx.strokeStyle='#f1e2bd';ctx.lineWidth=3;ctx.rotate(-.08);for(let y=-38;y<=38;y+=18){ctx.fillRect(-h.r,y,h.r*2,10);ctx.strokeRect(-h.r,y,h.r*2,10)}ctx.fillStyle='#f1e2bd';ctx.font='bold 10px Arial';ctx.textAlign='center';ctx.fillText('FORM 27-B',0,4)}else if(h.type==='pamphlets'){ctx.strokeStyle=active?'#c62f37':warning?'#ffd15a':'#e0ad3b';ctx.lineWidth=warning?7:4;ctx.beginPath();ctx.arc(0,0,h.r,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#f1e2bd';for(let i=0;i<7;i++){ctx.save();ctx.rotate(i*.9+state.time*.15);ctx.fillRect(18+i*5,-4,20,8);ctx.restore()}}else{ctx.fillStyle='#07172d';ctx.strokeStyle=active?'#73c8e8':warning?'#ffd15a':'#e0ad3b';ctx.lineWidth=warning?8:5;ctx.beginPath();ctx.ellipse(0,0,h.r,22,0,0,Math.PI*2);ctx.fill();ctx.stroke();if(active){ctx.strokeStyle='#73c8e8';ctx.lineWidth=6;for(let i=-35;i<=35;i+=23){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i+10,-38);ctx.lineTo(i-4,-65);ctx.stroke()}}else{ctx.fillStyle=warning?'#ffd15a':'#e0ad3b';ctx.font=`bold ${warning?18:12}px Arial`;ctx.textAlign='center';ctx.fillText(warning?'!':'VENT',0,4)}}ctx.restore();ctx.globalAlpha=1}
function drawEntities(){
  const all=[...state.pickups.map(p=>({...p,kind:'pickup'})),...state.props.map(p=>({...p,kind:'prop'})),...state.enemies.map(e=>({...e,kind:'enemy'})),{...hero,kind:'hero'}].sort((a,b)=>a.y-b.y);
  for(const o of all){if(o.kind==='pickup')(o.power?drawPowerup(o):drawPeso(o));else if(o.kind==='prop')drawProp(o);else drawFighter(o,o.kind==='hero');}
}
function drawFighter(o,isHero){
  const heroArt={attack:'milei_attack',heavy:'milei_heavy',dodge:'milei_dodge',special:'milei_special'};
  const walkFrame=`milei_walk_${1+Math.floor(o.walkPhase||0)%4}`;
  const enemyWalk=['riot','bureaucrat','tax','professor','heavy','alphabet','kremlin_tech'].includes(o.type)&&o.state==='walk'&&Math.floor(o.walkPhase||0)%2?`${o.type}_walk`:o.type;
  const enemyArt=o.type==='super_stalin'?(o.phase===1?'stalin_form1':o.phase===2?'stalin_exo':'stalin_mecha'):o.type==='gremialista'?(o.state==='charge'?'gremialista_charge':o.state==='attack'?'gremialista_attack':'gremialista'):o.type==='mecha_fdr'&&o.state==='attack'?'mecha_fdr_attack':o.type==='che_bike'?(o.state==='charge'||o.state==='attack'?'che_bike_attack':o.state==='walk'?'che_bike':'che_bike_idle'):enemyWalk;
  const name=isHero?(o.state==='walk'?walkFrame:(heroArt[o.state]||'milei')):enemyArt, im=images[name], t=isHero?{scale:.68}:TYPES[o.type];
  const top=floorTop(),bottom=floorBottom(),stride=Math.sin((o.walkPhase||0)*Math.PI/2),strideLoad=Math.abs(stride);const bob=o.state==='walk'?-strideLoad*2.6:0,arrival=!isHero?clamp(1-(o.entrance||0)/.42,0,1):1;let scale=t.scale*(.86+((o.y-top)/(bottom-top))*.14)*(.84+arrival*.16);
  if(!isHero&&arrival<1)ctx.globalAlpha=.2+arrival*.8;
  if(isHero&&hero.dodgeWindow>0){ctx.strokeStyle='#73c8e8';ctx.lineWidth=4;ctx.globalAlpha=.65;ctx.beginPath();ctx.arc(o.x,o.y-42,44,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1}
  if(o.hit>0)ctx.globalAlpha=.55+Math.sin(state.time*55)*.35;
  if(!isHero&&TYPES[o.type].boss&&o.phase>1){ctx.strokeStyle=o.phase===3?'#c62f37':'#e0ad3b';ctx.lineWidth=3;ctx.globalAlpha=.55;ctx.beginPath();ctx.arc(o.x,o.y-48,42+Math.sin(state.time*8)*5,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1}
  if(!isHero&&o.type==='professor'){ctx.strokeStyle='#9d6fe8';ctx.lineWidth=3;ctx.globalAlpha=.45+Math.sin(state.time*6)*.18;ctx.beginPath();ctx.arc(o.x,o.y-42,55+Math.sin(state.time*5)*6,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1}
  if(!isHero&&o.type!=='professor'&&state.enemies.some(e=>e.type==='professor'&&e.hp>0)){ctx.strokeStyle='#9d6fe899';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(o.x,o.y+2,34*scale,10*scale,0,0,Math.PI*2);ctx.stroke()}
  if(!isHero&&o.elite){ctx.strokeStyle='#ffd15a';ctx.lineWidth=3;ctx.globalAlpha=.6+Math.sin(state.time*7)*.18;ctx.beginPath();ctx.ellipse(o.x,o.y+1,40*scale,13*scale,0,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1}
  ctx.fillStyle='#0008';ctx.beginPath();ctx.ellipse(o.x,o.y+4,32*scale,9*scale,0,0,Math.PI*2);ctx.fill();
  const charging=!isHero&&o.state==='charge',dodging=isHero&&o.state==='dodge',attacking=o.state==='attack'||o.state==='heavy',stretchX=charging?1.17:dodging?1.19:attacking?1.08:1+strideLoad*.025,stretchY=charging?.86:dodging?.84:attacking?.93:1-strideLoad*.018;
  const paintSprite=(alpha=1,trail=0)=>{ctx.save();ctx.globalAlpha*=alpha;ctx.translate(o.x-trail*(o.face||1),o.y+bob);if(!isHero&&o.state==='attack')ctx.rotate((o.face||1)*-.1);else if(o.state==='walk')ctx.rotate(clamp(o.vx||0,-180,180)/5200);ctx.scale((o.face||1)*scale*stretchX,scale*stretchY);if(im?.complete){const h=im.height,w=im.width;ctx.drawImage(im,-w/2,-h,w,h)}else{ctx.fillStyle=isHero?'#73c8e8':t.color;ctx.fillRect(-25,-80,50,80)}ctx.restore()};
  if(dodging||charging){paintSprite(.12,34);paintSprite(.22,18)}paintSprite();ctx.globalAlpha=1;
  if(isHero&&attacking){const sweep=hero.attackTimer||.08;ctx.save();ctx.globalAlpha=clamp(sweep*4,0,.75);ctx.strokeStyle=o.state==='heavy'?'#ffd15a':'#73c8e8';ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=12;ctx.lineWidth=o.state==='heavy'?10:6;ctx.beginPath();const facing=o.face||1;ctx.arc(o.x+facing*12,o.y-47,o.state==='heavy'?58:46,facing>0?-.95:Math.PI-.95,facing>0?.75:Math.PI+.75);ctx.stroke();ctx.restore()}
  if(!isHero&&(TYPES[o.type].boss||o.hit>0)){ctx.fillStyle='#250b12';ctx.fillRect(o.x-35,o.y-105,70,7);ctx.fillStyle='#c62f37';ctx.fillRect(o.x-35,o.y-105,70*clamp(o.hp/o.maxHp,0,1),7)}
  if(!isHero&&o.type==='tax'&&(o.stolen||0)>0){ctx.fillStyle='#ffd15a';ctx.strokeStyle='#07172d';ctx.lineWidth=3;ctx.font='bold 13px Chakra Petch';ctx.textAlign='center';ctx.strokeText(`$${Math.floor(o.stolen)}`,o.x,o.y-115);ctx.fillText(`$${Math.floor(o.stolen)}`,o.x,o.y-115);ctx.textAlign='left'}
  if(!isHero&&o.telegraph>0){const warning=o.attackKind==='charge'?'CHARGE!':o.type==='peron'?'DECREE!':o.type==='mecha_fdr'||o.type==='super_stalin'?'MISSILES!':'STRIKE!';ctx.strokeStyle='#ffd15a';ctx.lineWidth=5;ctx.beginPath();ctx.arc(o.x,o.y-50,48+Math.sin(state.time*22)*7,0,Math.PI*2);ctx.stroke();ctx.textAlign='center';ctx.fillStyle='#ffd15a';ctx.strokeStyle='#07172d';ctx.lineWidth=4;ctx.font='16px Bungee';ctx.strokeText(warning,o.x,o.y-125);ctx.fillText(warning,o.x,o.y-125);ctx.textAlign='left'}
}
function drawProp(p){ctx.save();ctx.translate(p.x,p.y);if(p.hit>0)ctx.translate((Math.random()-.5)*5,0);ctx.fillStyle=p.type==='crate'?'#8a512d':'#6f2f35';if(p.type==='crate'){ctx.fillRect(-28,-47,56,47);ctx.strokeStyle='#d8a05b';ctx.lineWidth=6;ctx.strokeRect(-25,-44,50,41);ctx.beginPath();ctx.moveTo(-22,-40);ctx.lineTo(22,-5);ctx.moveTo(22,-40);ctx.lineTo(-22,-5);ctx.stroke()}else{ctx.fillRect(-23,-54,46,54);ctx.fillStyle='#d8a05b';ctx.fillRect(-26,-49,52,7);ctx.fillRect(-26,-10,52,7)}ctx.restore()}
function drawPeso(p){const decay=clamp(1-p.age/18,.2,1),urgent=p.age>11;ctx.save();ctx.globalAlpha=decay;ctx.translate(p.x,p.y);ctx.rotate(state.time*2+p.x);ctx.fillStyle=urgent?'#c62f37':p.age>6?'#e0ad3b':'#78bd70';ctx.fillRect(-12,-7,24,14);ctx.fillStyle='#07172d';ctx.font='bold 7px Arial';ctx.textAlign='center';ctx.fillText(`$${Math.max(1,Math.floor(p.value))}`,0,3);ctx.restore();}
function drawPowerup(p){ctx.save();ctx.translate(p.x,p.y-20-Math.sin(state.time*4)*5);const color=p.power==='gold'?'#ffd15a':p.power==='hand'?'#73c8e8':'#78bd70';ctx.shadowColor=color;ctx.shadowBlur=18;ctx.fillStyle='#07172d';ctx.strokeStyle=color;ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,24,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle=color;ctx.textAlign='center';ctx.font='bold 13px Arial';ctx.fillText(p.power==='gold'?'2X':p.power==='hand'?'HAND':'MATE',0,5);ctx.restore()}
function drawFx(){for(const p of state.projectiles){ctx.save();const speed=Math.hypot(p.vx,p.vy)||1,tx=-p.vx/speed,ty=-p.vy/speed;ctx.strokeStyle=p.kind==='missile'?'#ffd15a88':p.kind==='decree'?'#f1e2bd66':'#73c8e888';ctx.lineWidth=p.kind==='lightning'?7:4;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+tx*(p.kind==='missile'?42:26),p.y+ty*(p.kind==='missile'?42:26));ctx.stroke();ctx.translate(p.x,p.y);ctx.rotate(Math.atan2(p.vy,p.vx));ctx.fillStyle=p.kind==='decree'?'#f1e2bd':p.kind==='missile'?'#c62f37':'#73c8e8';if(p.kind==='decree'){ctx.fillRect(-17,-12,34,24);ctx.strokeStyle='#c62f37';ctx.lineWidth=3;ctx.strokeRect(-17,-12,34,24);ctx.fillStyle='#07172d';ctx.font='bold 8px Arial';ctx.textAlign='center';ctx.fillText('DECREE',0,3)}else if(p.kind==='missile'){ctx.fillRect(-18,-6,28,12);ctx.fillStyle='#ffd15a';ctx.beginPath();ctx.moveTo(14,-8);ctx.lineTo(28,0);ctx.lineTo(14,8);ctx.fill()}else if(p.kind==='lightning'){ctx.strokeStyle='#73c8e8';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(-18,-10);ctx.lineTo(-5,7);ctx.lineTo(5,-8);ctx.lineTo(18,10);ctx.stroke()}else{ctx.beginPath();ctx.arc(0,0,12,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#f1e2bd';ctx.lineWidth=3;ctx.stroke()}ctx.restore()}for(const p of state.particles){ctx.globalAlpha=clamp(p.life*3,0,1);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,5,5)}ctx.globalAlpha=1;for(const p of state.popups){ctx.globalAlpha=clamp(p.life*2,0,1);ctx.fillStyle=p.color;ctx.strokeStyle='#07172d';ctx.lineWidth=4;ctx.font='bold 22px Arial';ctx.textAlign='center';ctx.strokeText(p.text,p.x,p.y);ctx.fillText(p.text,p.x,p.y)}ctx.textAlign='left';ctx.globalAlpha=1;}
function bar(x,y,w,h,value,color){ctx.fillStyle='#050b14dd';ctx.fillRect(x,y,w,h);ctx.fillStyle=color;ctx.fillRect(x+3,y+3,(w-6)*clamp(value,0,1),h-6);ctx.strokeStyle='#f1e2bd';ctx.lineWidth=2;ctx.strokeRect(x,y,w,h);}
function drawStageProgress(){const total=state.level===1?6:5,current=clamp(state.wave,1,total);ctx.fillStyle='#07172dcc';ctx.fillRect(18,78,224,47);ctx.fillStyle='#73c8e8';ctx.font='9px Bungee';ctx.fillText(`LEVEL ${state.level} · ENCOUNTER ${current}/${total}`,26,91);for(let i=0;i<total;i++){ctx.fillStyle=i<current-1?'#e0ad3b':i===current-1?'#c62f37':'#31445c';ctx.fillRect(26+i*(194/total),98,Math.max(12,178/total),7)}if(state.waveObjective){ctx.fillStyle='#f1e2bd';ctx.font='bold 9px Chakra Petch';ctx.fillText(state.waveObjective.label,26,118)}}
function drawHud(){
  ctx.fillStyle='#07172de8';ctx.fillRect(0,0,W,72);ctx.fillStyle='#f1e2bd';ctx.font='18px Bungee';ctx.fillText('MILEI',22,24);bar(20,34,230,22,hero.hp/hero.maxHp,'#c62f37');
  if(hero.hp/hero.maxHp<.3){ctx.globalAlpha=.35+Math.sin(state.time*8)*.22;ctx.strokeStyle='#ff403f';ctx.lineWidth=5;ctx.strokeRect(14,29,242,32);ctx.fillStyle='#ff6b68';ctx.font='bold 10px Arial';ctx.fillText('DANGER',205,24);ctx.globalAlpha=1}
  ctx.fillStyle='#f1e2bd';ctx.fillText('LIBERTAD',275,24);bar(274,34,210,22,state.meter/100,state.meter>=100?'#ffd15a':'#73c8e8');
  ctx.textAlign='right';ctx.fillStyle='#e0ad3b';ctx.font='18px Bungee';ctx.fillText(`PESOS $${Math.floor(state.pesos)}`,W-22,27);ctx.fillStyle='#f1e2bd';ctx.font='bold 17px Chakra Petch';ctx.fillText(`SCORE ${state.score.toString().padStart(7,'0')}`,W-22,54);ctx.textAlign='left';
  const loosePesos=state.pickups.filter(p=>!p.power).reduce((sum,p)=>sum+p.value,0);if(loosePesos>0){ctx.textAlign='right';ctx.fillStyle=state.pickups.some(p=>!p.power&&p.age>10)?'#ff6b68':'#78bd70';ctx.font='bold 9px Arial';ctx.fillText(`LOOSE $${Math.floor(loosePesos)} · VALUE FALLING`,W-22,68);ctx.textAlign='left'}
  if(state.multiplier>1){ctx.fillStyle='#ffd15a';ctx.font='20px Bungee';ctx.fillText(`×${state.multiplier.toFixed(1)}`,500,53)}
  ctx.fillStyle='#73c8e8';ctx.font='bold 13px Arial';ctx.fillText(`${dailyChallenge?'DAILY · ':''}CONTINUES ${runContinues} · ${selectedDifficulty.toUpperCase()}`,505,24);
  drawStageProgress();
  const boss=state.enemies.find(e=>TYPES[e.type].boss);if(boss){const names={gremialista:'EL GREMIALISTA',evita:'EVITA',peron:'JUAN PERÓN',mecha_fdr:'MECHA-FDR',che_bike:'CHE GHOST',super_stalin:'SUPER STALIN'};ctx.fillStyle='#07172de8';ctx.fillRect(260,78,440,42);ctx.textAlign='center';ctx.fillStyle='#f1e2bd';ctx.font='14px Bungee';ctx.fillText(`${names[boss.type]} · PHASE ${boss.phase}`,480,94);bar(285,101,390,14,boss.hp/boss.maxHp,'#c62f37');ctx.textAlign='left'}
  if(state.bossMoveTime>0){ctx.globalAlpha=clamp(state.bossMoveTime*2,0,1);ctx.fillStyle='#07172dea';ctx.fillRect(325,124,310,30);ctx.strokeStyle='#ffd15a';ctx.lineWidth=2;ctx.strokeRect(325,124,310,30);ctx.textAlign='center';ctx.fillStyle='#ffd15a';ctx.font='17px Bungee';ctx.fillText(state.bossMove,480,146);ctx.textAlign='left';ctx.globalAlpha=1}
  if(state.bannerTime>0){ctx.globalAlpha=clamp(state.bannerTime,0,1);ctx.fillStyle='#07172ddd';ctx.fillRect(0,225,W,84);ctx.textAlign='center';ctx.fillStyle='#e0ad3b';ctx.font='40px Bungee';ctx.fillText(state.banner,W/2,279);ctx.textAlign='left';ctx.globalAlpha=1;}
  if(hero.hits>1&&hero.comboTime>0){ctx.textAlign='center';ctx.fillStyle='#ffd15a';ctx.strokeStyle='#07172d';ctx.lineWidth=5;ctx.font='29px Bungee';ctx.strokeText(`${hero.hits} HIT COMBO`,hero.x,hero.y-125);ctx.fillText(`${hero.hits} HIT COMBO`,hero.x,hero.y-125);ctx.fillStyle='#07172dcc';ctx.fillRect(hero.x-62,hero.y-113,124,7);ctx.fillStyle='#ffd15a';ctx.fillRect(hero.x-60,hero.y-111,120*clamp(hero.comboTime/1.15,0,1),3);ctx.textAlign='left'}
  if(state.waveGradeTime>0){ctx.globalAlpha=clamp(state.waveGradeTime,0,1);ctx.textAlign='center';ctx.fillStyle='#f1e2bd';ctx.strokeStyle='#07172d';ctx.lineWidth=6;ctx.font='25px Bungee';ctx.strokeText(state.waveGrade,W/2,335);ctx.fillText(state.waveGrade,W/2,335);ctx.textAlign='left';ctx.globalAlpha=1}
  if(state.tipTime>0){const tipY=matchMedia('(pointer:coarse), (max-width:800px)').matches?130:H-92;ctx.globalAlpha=clamp(state.tipTime,0,1);ctx.fillStyle='#07172dea';ctx.fillRect(160,tipY,W-320,50);ctx.strokeStyle='#73c8e8';ctx.lineWidth=2;ctx.strokeRect(160,tipY,W-320,50);ctx.fillStyle='#73c8e8';ctx.font='bold 12px Arial';ctx.fillText('LIBERTY INTEL',175,tipY+20);ctx.fillStyle='#f1e2bd';ctx.font='bold 13px Arial';ctx.fillText(state.tip,175,tipY+39);ctx.globalAlpha=1}
  if(hero.goldTimer>0||hero.handTimer>0){ctx.textAlign='center';ctx.font='bold 15px Arial';let bx=W/2;if(hero.goldTimer>0){ctx.fillStyle='#ffd15a';ctx.fillText(`GOLDEN CHAINSAW ${hero.goldTimer.toFixed(1)}s`,bx,143);bx+=170}if(hero.handTimer>0){ctx.fillStyle='#73c8e8';ctx.fillText(`INVISIBLE HAND ${hero.handTimer.toFixed(1)}s`,bx,143)}ctx.textAlign='left'}
  if(state.bossQuoteTime>0){ctx.globalAlpha=clamp(state.bossQuoteTime,0,1);ctx.fillStyle='#07172de8';ctx.fillRect(135,H-78,W-270,48);ctx.strokeStyle='#e0ad3b';ctx.strokeRect(135,H-78,W-270,48);ctx.textAlign='center';ctx.fillStyle='#f1e2bd';ctx.font='bold 18px Arial';ctx.fillText(state.bossQuote,W/2,H-48);ctx.textAlign='left';ctx.globalAlpha=1}
  if(state.phaseFlash>0){ctx.globalAlpha=clamp(Math.sin(state.phaseFlash*22)*.08+state.phaseFlash*.12,0,.22);ctx.fillStyle='#c62f37';ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;ctx.strokeStyle='#ffd15a';ctx.lineWidth=10*state.phaseFlash;ctx.strokeRect(5,5,W-10,H-10)}
  if(state.sceneFade>0){ctx.globalAlpha=state.sceneFade;ctx.fillStyle='#050b14';ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;}
  if(state.paused){ctx.fillStyle='#07172ddd';ctx.fillRect(0,0,W,H);ctx.textAlign='center';ctx.fillStyle='#e0ad3b';ctx.font='50px Bungee';ctx.fillText('PAUSED',W/2,H/2);ctx.textAlign='left'}
}

let last=performance.now();function frame(now){currentPad=gamepad();if(currentPad?.buttons[9]?.pressed&&!padHeld[9])togglePause();const raw=(now-last)/1000,dt=Math.min(.033,raw);last=now;if(state.running&&!state.paused&&raw<.5){state.perf.frames++;state.perf.sampleTime+=raw;state.perf.worstMs=Math.max(state.perf.worstMs,raw*1000);if(raw>.05)state.perf.droppedFrames++;if(state.perf.sampleTime>=2){state.perf.fps=Math.round(state.perf.frames/state.perf.sampleTime);if(state.perf.fps<43){state.perf.slowSamples++;state.perf.fastSamples=0}else if(state.perf.fps>52){state.perf.fastSamples++;state.perf.slowSamples=0}else{state.perf.slowSamples=0;state.perf.fastSamples=0}if(state.perf.slowSamples>=2)state.perf.lowPower=true;if(state.perf.fastSamples>=3)state.perf.lowPower=false;state.perf.frames=0;state.perf.sampleTime=0}}update(dt);draw();padHeld=currentPad?currentPad.buttons.map(b=>b.pressed):[];}
function togglePause(force){if(!state.running||cinematicActive)return;state.paused=typeof force==='boolean'?force:!state.paused;document.querySelector('#pauseButton').textContent=state.paused?'▶':'Ⅱ';const menu=document.querySelector('#pauseMenu');menu.classList.toggle('hidden',!state.paused);if(state.paused){const total=state.level===1?6:5;menu.querySelector('#pauseStatus').textContent=`LEVEL ${state.level} · ENCOUNTER ${Math.min(state.wave,total)}/${total} · SCORE ${state.score.toLocaleString()} · PESOS $${Math.floor(state.pesos)}`}}
function toggleMute(){state.muted=!state.muted;profile.muted=state.muted;saveProfile();document.querySelector('#muteButton').textContent=state.muted?'×':'♪'}
async function toggleFullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else{await document.querySelector('#shell').requestFullscreen();await screen.orientation?.lock?.('landscape').catch(()=>{})}}catch{} }
function playtestReport(){const elapsed=`${Math.floor(state.time/60)}:${Math.floor(state.time%60).toString().padStart(2,'0')}`,repro=`${location.origin}${location.pathname}?playtest=1&level=${state.level}&seed=${activeSeed}`,input=currentPad?`GAMEPAD · ${currentPad.id||'STANDARD MAPPING'}`:'KEYBOARD / TOUCH';return [`¡AFUERA! PLAYTEST REPORT`, `Build: ${BUILD}`,`Level: ${state.level} · Encounter: ${state.wave} · Difficulty: ${selectedDifficulty.toUpperCase()}`,`Seed: ${activeSeed} · Repro: ${repro}`,`Time: ${elapsed} · Score: ${state.score} · Health: ${Math.max(0,Math.round(hero.hp))}/${hero.maxHp}`,`Input: ${input}`,`Performance: ${state.perf.fps} FPS · Worst frame: ${Math.round(state.perf.worstMs)}ms · Drops: ${state.perf.droppedFrames} · Adaptive mode: ${state.perf.lowPower?'ON':'OFF'}`,`Viewport: ${innerWidth}×${innerHeight} · Pixel ratio: ${devicePixelRatio}`,`Browser: ${navigator.userAgent}`,``,`What happened:`,``,`What did you expect:`].join('\n')}
addEventListener('keydown',e=>{if(e.code==='KeyP'&&!e.repeat)togglePause();if(e.code==='KeyM'&&!e.repeat)toggleMute();keys.add(e.code);if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault()});
addEventListener('keyup',e=>{keys.delete(e.code);clearOnce(e.code)});
addEventListener('blur',()=>{keys.clear();pressed.clear();touchPointers.clear();padHeld=[];document.querySelector('#touch').classList.remove('active')});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.running&&!state.paused&&!cinematicActive)togglePause(true)});
document.querySelectorAll('[data-key]').forEach(b=>{const code=b.dataset.key;const down=e=>{e.preventDefault();touchPointers.add(e.pointerId);document.querySelector('#touch').classList.add('active');keys.add(code)};const up=e=>{e.preventDefault();touchPointers.delete(e.pointerId);if(!touchPointers.size)document.querySelector('#touch').classList.remove('active');keys.delete(code);clearOnce(code)};b.addEventListener('pointerdown',down);b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('pointerleave',up)});
showStart();
const bossPracticeButton=document.querySelector('#bossPracticeButton');bossPracticeButton.hidden=!playtestMode;bossPracticeButton.onclick=()=>{bossPractice=!bossPractice;bossPracticeButton.textContent=`BOSS PRACTICE: ${bossPractice?'ON':'OFF'}`;bossPracticeButton.setAttribute('aria-pressed',String(bossPractice));bossPracticeButton.classList.toggle('selected',bossPractice);document.querySelector('#startButton').textContent=bossPractice?`PRACTICE LEVEL ${selectedLevel} BOSS`:`PLAYTEST LEVEL ${selectedLevel}`};
const dailyButton=document.querySelector('#dailyButton'),dailyNumber=Math.floor(Date.now()/86400000),dailyLevel=1+(dailyNumber%Math.max(1,profile.unlockedLevel));dailyButton.hidden=false;dailyButton.disabled=true;dailyButton.textContent=`DAILY CHALLENGE · LEVEL ${dailyLevel}`;dailyButton.onclick=()=>{audio??=new AudioContext();clearRunCheckpoint();bossPractice=false;dailyChallenge=true;selectedDifficulty='libertad';selectedLevel=dailyLevel;runContinues=1;setRandomSeed(dailyNumber);document.querySelector('#start').classList.add('hidden');showIntro(dailyLevel)};
document.querySelector('#startButton').onclick=()=>{audio??=new AudioContext();clearRunCheckpoint();dailyChallenge=false;runContinues=2;document.querySelector('#start').classList.add('hidden');if(bossPractice)reset(selectedLevel,{wave:selectedLevel===1?5:4,score:0,pesos:0,stats:freshStats()});else showIntro(selectedLevel)};
document.querySelector('#continueButton').onclick=()=>{const checkpoint=loadRunCheckpoint();if(!checkpoint)return;audio??=new AudioContext();bossPractice=false;dailyChallenge=!!checkpoint.daily;if(checkpoint.seed!==null&&checkpoint.seed!==undefined)setRandomSeed(checkpoint.seed);selectedDifficulty=checkpoint.difficulty||'libertad';runContinues=checkpoint.continues??2;document.querySelector('#start').classList.add('hidden');reset(checkpoint.level,checkpoint)};
document.querySelector('#hallButton').onclick=showLeaderboard;
document.querySelector('#archivesButton').onclick=showArchives;
document.querySelector('#optionsButton').onclick=showOptions;
document.querySelector('#pauseButton').onclick=togglePause;document.querySelector('#muteButton').onclick=toggleMute;document.querySelector('#fullscreenButton').onclick=toggleFullscreen;
document.addEventListener('fullscreenchange',()=>document.querySelector('#fullscreenButton').textContent=document.fullscreenElement?'×':'⛶');
document.querySelector('#muteButton').textContent=state.muted?'×':'♪';
document.querySelector('[data-resume]').addEventListener('click',e=>{e.preventDefault();togglePause(false)});
document.querySelector('[data-restart]').addEventListener('click',e=>{e.preventDefault();clearRunCheckpoint();document.querySelector('#pauseMenu').classList.add('hidden');state.paused=false;reset(state.level)});
const reportButton=document.querySelector('[data-report]');reportButton.hidden=!playtestMode;reportButton.addEventListener('click',async()=>{const text=playtestReport();try{await navigator.clipboard.writeText(text);reportButton.textContent='REPORT COPIED';tone(660,.12,'square',.03)}catch{reportButton.textContent='COPY BLOCKED';tone(55,.12)}setTimeout(()=>reportButton.textContent='COPY TEST REPORT',1500)});
const skipEncounterButton=document.querySelector('[data-skip-encounter]');skipEncounterButton.hidden=!playtestMode;skipEncounterButton.addEventListener('click',()=>{for(const enemy of state.enemies)enemy.hp=0;togglePause(false)});
document.querySelector('[data-campaign]').addEventListener('click',e=>{e.preventDefault();e.stopPropagation();showStart()});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.running&&!state.paused)togglePause(true)});
addEventListener('gamepadconnected',e=>{state.tip=`CONTROLLER CONNECTED · A SAW · X HEAVY · B DODGE · Y SPECIAL · MENU PAUSE`;state.tipTime=5});
addEventListener('gamepaddisconnected',e=>{const active=currentPad?.index===e.gamepad.index;if(active){currentPad=null;padHeld=[];if(state.running&&!state.paused&&!cinematicActive)togglePause(true)}state.tip=`CONTROLLER DISCONNECTED · ${active&&state.paused?'GAME PAUSED · ':''}KEYBOARD / TOUCH READY`;state.tipTime=5});
let installPrompt=null,assetsReady=false,offlineReady=!!navigator.serviceWorker?.controller;const installButton=document.querySelector('#installButton'),networkStatus=document.querySelector('#networkStatus');function updateNetworkStatus(){if(!assetsReady)return;const connection=navigator.onLine?(offlineReady?'OFFLINE PLAY READY':'ONLINE · PREPARING OFFLINE PLAY'):'OFFLINE MODE · PROGRESS SAVES LOCALLY',errors=failedAssets?` · ${failedAssets} ASSET ERRORS`:'';networkStatus.textContent=playtestMode?`${BUILD} · ALL LEVELS UNLOCKED · ${connection}${errors}`:`${connection}${errors}`}addEventListener('online',()=>{updateNetworkStatus();state.tip='CONNECTION RESTORED';state.tipTime=3});addEventListener('offline',()=>{updateNetworkStatus();state.tip='OFFLINE MODE · THE CAMPAIGN REMAINS PLAYABLE';state.tipTime=4});addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;installButton.hidden=false});installButton.onclick=async()=>{if(!installPrompt)return;installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;installButton.hidden=true};addEventListener('appinstalled',()=>{installPrompt=null;installButton.hidden=true;offlineReady=true;updateNetworkStatus()});
const criticalAssets=[...Object.values(images),...backgrounds,ministryBackground,universityBackground,kremlinBackground],startButton=document.querySelector('#startButton'),continueButton=document.querySelector('#continueButton');startButton.disabled=true;continueButton.disabled=true;dailyButton.disabled=true;let loadedAssets=0,failedAssets=0;networkStatus.textContent=`LOADING GAME · 0/${criticalAssets.length}`;Promise.all(criticalAssets.map(image=>new Promise(resolve=>{const done=failed=>{loadedAssets++;if(failed)failedAssets++;networkStatus.textContent=`LOADING GAME · ${loadedAssets}/${criticalAssets.length}`;resolve()};if(image.complete)done(!image.naturalWidth);else{image.addEventListener('load',()=>done(false),{once:true});image.addEventListener('error',()=>done(true),{once:true})}}))).then(()=>{assetsReady=true;startButton.disabled=false;continueButton.disabled=false;dailyButton.disabled=false;updateNetworkStatus()});
if('serviceWorker'in navigator)addEventListener('load',async()=>{try{const registration=await navigator.serviceWorker.register('./sw.js'),updateButton=document.querySelector('#updateButton');navigator.serviceWorker.ready.then(()=>{offlineReady=true;updateNetworkStatus()});let reloading=false,activationFallback=null;updateButton.addEventListener('click',async()=>{updateButton.hidden=true;updateButton.textContent='...';const current=await navigator.serviceWorker.getRegistration(),worker=current?.waiting||registration.waiting;worker?.postMessage({type:'SKIP_WAITING'});clearTimeout(activationFallback);activationFallback=setTimeout(async()=>{const stuck=await navigator.serviceWorker.getRegistration();if(stuck){updateButton.hidden=false;updateButton.textContent='REPAIR';await stuck.unregister()}location.reload()},1800)});const offerUpdate=worker=>{if(worker?.state==='installed'&&registration.waiting===worker)updateButton.hidden=false};if(registration.waiting)offerUpdate(registration.waiting);registration.addEventListener('updatefound',()=>{const worker=registration.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)offerUpdate(worker)})});navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloading)return;reloading=true;clearTimeout(activationFallback);location.reload()});registration.update()}catch{}});
draw();
