/* Event-based lossless transmission-line simulator. Times are nanoseconds. */
const $=id=>document.getElementById(id), inputs=['vs','rs','z0','td','load','rl','duration','maxRef'];
const presets={
 'CMOS source termination':[3.3,50,50,6,Infinity,12], 'Open line':[5,50,50,6,Infinity,12], 'Shorted line':[5,50,50,6,0,12], 'Matched 50 Ω load':[5,50,50,6,50,12], 'Source mismatch':[5,10,50,6,Infinity,12], 'Custom 100 Ω load':[5,50,50,6,100,12], 'RF 50 Ω antenna':[1,50,50,6,50,12]};
for(const k in presets){let o=document.createElement('option');o.textContent=k;$('preset').append(o)}
let sim,time=0,playing=false,last=performance.now(),activePlot='plotA';
function number(id){return +$(id).value}
function params(){let type=$('load').value,z0=number('z0'),rl=type==='Open'?Infinity:type==='Short'?0:type==='Matched'?z0:number('rl');return {vs:number('vs'),rs:number('rs'),z0,td:number('td'),rl,duration:number('duration'),max:+$('maxRef').value}}
function build(){let p=params(); if(p.rs<0||p.z0<=0||p.td<=0||p.duration<=0){return} let gl=Number.isFinite(p.rl)?(p.rl-p.z0)/(p.rl+p.z0):1,gs=(p.rs-p.z0)/(p.rs+p.z0), waves=[{a:p.vs*p.z0/(p.rs+p.z0),d:1,s:0,g:0}],q=[waves[0]];
 while(q.length&&waves.length<=p.max){let w=q.shift(),arrival=w.s+p.td;if(arrival>p.duration)continue;let a=w.a*(w.d===1?gl:gs);if(Math.abs(a)<1e-6)continue;let r={a,d:-w.d,s:arrival,g:w.g+1};waves.push(r);q.push(r)} return {p,gl,gs,waves}}
function voltage(x,t){return sim.waves.reduce((v,w)=>v+(t>=w.s+(w.d===1?x:1-x)*sim.p.td?w.a:0),0)}
function current(x,t){return sim.waves.reduce((v,w)=>v+(t>=w.s+(w.d===1?x:1-x)*sim.p.td?(w.d*w.a/sim.p.z0):0),0)}
function active(){return sim.waves.map(w=>{let a=(time-w.s)/sim.p.td;return {...w,x:w.d===1?a:1-a}}).filter(w=>w.x>=0&&w.x<=1)}
function resize(c){let r=c.getBoundingClientRect(),d=devicePixelRatio;c.width=r.width*d;c.height=r.height*d;let x=c.getContext('2d');x.setTransform(d,0,0,d,0,0);return [x,r.width,r.height]}
function schematic(){let [c,w,h]=resize($('circuit')),L=170,R=w-135,y=h*.56;c.clearRect(0,0,w,h); c.strokeStyle='#b8c4cf';c.fillStyle='#dfe9f1';c.lineWidth=2;
 c.beginPath();c.arc(65,y,28,0,7);c.stroke();c.fillText('Vs',56,y+5);c.beginPath();c.moveTo(93,y);c.lineTo(120,y);for(let i=0;i<5;i++)c.lineTo(128+i*12,y+(i%2?-13:13));c.lineTo(L,y);c.stroke();c.fillText('Rs',125,y-25);
 c.fillStyle='#607d8b';c.fillRect(L,y-22,R-L,44);for(let i=0;i<220;i++){let x=i/219,v=voltage(x,time),m=Math.min(1,Math.abs(v)/Math.max(1,Math.abs(sim.p.vs)));c.fillStyle=v>=0?`rgba(235,74,74,${.12+.5*m})`:`rgba(70,140,255,${.12+.5*m})`;c.fillRect(L+x*(R-L),y-19,(R-L)/219+1,38)}c.strokeStyle='#cbd6df';c.strokeRect(L,y-22,R-L,44);c.fillStyle='#dfe9f1';c.fillText('Transmission line',L+(R-L)/2-52,y-32);c.beginPath();c.moveTo(R,y);c.lineTo(R+20,y);c.moveTo(R+20,y-30);c.lineTo(R+20,y+30);c.stroke();c.fillText('Load',R+28,y+5);
 [['A',L],['B',(L+R)/2],['C',R]].forEach(([n,x])=>{c.fillStyle='#12c8da';c.beginPath();c.arc(x,y,6,0,7);c.fill();c.fillStyle='#e8eef5';c.fillText(n,x-4,y+50)});active().forEach(q=>{c.strokeStyle=q.d===1?'#ffd54f':'#c277ee';c.setLineDash([7,5]);c.beginPath();c.moveTo(L+q.x*(R-L),y-32);c.lineTo(L+q.x*(R-L),y+32);c.stroke();c.setLineDash([])});c.fillStyle='#aebdca';c.fillText(`t = ${time.toFixed(2)} ns`,15,23)}
function plot(id,position,isLine=false){let [c,w,h]=resize($(id)),ctx=c;ctx.clearRect(0,0,w,h);let pad={l:48,r:12,t:12,b:28},gw=w-pad.l-pad.r,gh=h-pad.t-pad.b;let values=[],n=500;for(let i=0;i<n;i++){let u=i/(n-1);values.push(isLine?voltage(u,time):voltage(position,u*sim.p.duration))}let lo=Math.min(-.5,...values)*1.12,hi=Math.max(5.5,...values)*1.12;if(hi-lo<1)hi=lo+1;let X=u=>pad.l+u*gw,Y=v=>pad.t+(hi-v)/(hi-lo)*gh;ctx.font='11px Segoe UI';ctx.strokeStyle='#40505f';ctx.fillStyle='#a9b8c5';ctx.lineWidth=1;[0,2.5,5].filter(v=>v>=lo&&v<=hi).forEach(v=>{ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(pad.l,Y(v));ctx.lineTo(w-pad.r,Y(v));ctx.stroke();ctx.setLineDash([]);ctx.fillText(v+' V',4,Y(v)+4)});ctx.strokeStyle='#11bfd2';ctx.lineWidth=2;ctx.beginPath();values.forEach((v,i)=>{let u=i/(n-1);i?ctx.lineTo(X(u),Y(v)):ctx.moveTo(X(u),Y(v))});ctx.stroke();if(!isLine){let u=time/sim.p.duration,v=voltage(position,time);ctx.fillStyle='#ffd54f';ctx.beginPath();ctx.arc(X(u),Y(v),4,0,7);ctx.fill()}ctx.fillStyle='#a9b8c5';ctx.fillText(isLine?'Position →':'Time (ns) →',w/2-30,h-7)}
function readout(){let p=sim.p, pts=[['A',0],['B',.5],['C',1]],m=[['Incident V⁺',sim.waves[0].a+' V'],['Γ load',sim.gl.toFixed(4)],['Γ source',sim.gs.toFixed(4)],['Reflections',sim.waves.length-1]];pts.forEach(([n,x])=>m.push([n,`${voltage(x,time).toFixed(4)} V · ${current(x,time).toFixed(4)} A`]));$('readout').innerHTML='<div class="metrics">'+m.map(q=>`<div class="metric">${q[0]}<b>${q[1]}</b></div>`).join('')+'</div>'}
function draw(){if(!sim)return;schematic();plot('plotA',0);plot('plotB',.5);plot('plotC',1);plot('plotLine',0,true);readout();$('timeline').value=Math.round(1000*time/sim.p.duration)}
function restart(){sim=build();time=0;playing=false;draw()}
function tick(now){if(playing){time=Math.min(sim.p.duration,time+(now-last)*number('speed')/620);if(time>=sim.p.duration)playing=false;draw()}last=now;requestAnimationFrame(tick)}
inputs.forEach(id=>$(id).addEventListener('change',restart));$('load').addEventListener('change',()=>{$('rl').disabled=$('load').value!=='Custom';restart()});$('play').onclick=()=>playing=true;$('pause').onclick=()=>playing=false;$('reset').onclick=restart;$('forward').onclick=()=>{playing=false;time=Math.min(sim.p.duration,time+.5);draw()};$('back').onclick=()=>{playing=false;time=Math.max(0,time-.5);draw()};$('timeline').oninput=e=>{playing=false;time=sim.p.duration*e.target.value/1000;draw()};$('preset').onchange=e=>{let [vs,rs,z0,td,rl,d]=presets[e.target.value];$('vs').value=vs;$('rs').value=rs;$('z0').value=z0;$('td').value=td;$('duration').value=d;$('load').value=rl===Infinity?'Open':rl===0?'Short':rl===z0?'Matched':'Custom';$('rl').value=rl===Infinity?50:rl;$('rl').disabled=$('load').value!=='Custom';restart()};$('theme').onclick=()=>{document.body.classList.toggle('light');$('theme').textContent=document.body.classList.contains('light')?'◐ Dark theme':'☀ Light theme';draw()};
function download(name,text,type){let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();URL.revokeObjectURL(a.href)}$('csv').onclick=()=>{let lines=['time_ns,voltage_A_V,voltage_B_V,voltage_C_V'];for(let i=0;i<=1600;i++){let t=sim.p.duration*i/1600;lines.push([t,voltage(0,t),voltage(.5,t),voltage(1,t)].join(','))}download('transmission-line-traces.csv',lines.join('\n'),'text/csv')};$('png').onclick=()=>{let c=$(activePlot),a=document.createElement('a');a.href=c.toDataURL('image/png');a.download='transmission-line-plot.png';a.click()};document.querySelectorAll('.plot').forEach(c=>c.onclick=()=>activePlot=c.id);$('settingsSave').onclick=()=>download('transmission-line-settings.json',JSON.stringify(params(),(_,v)=>v===Infinity?'infinity':v,2),'application/json');$('settingsLoad').onchange=e=>{let r=new FileReader;r.onload=()=>{try{let p=JSON.parse(r.result);for(const k of ['vs','rs','z0','td','duration'])$(k).value=p[k];$('maxRef').value=p.maxRef;let rl=p.rl==='infinity'?Infinity:p.rl;$('load').value=rl===Infinity?'Open':rl===0?'Short':rl===p.z0?'Matched':'Custom';$('rl').value=rl===Infinity?50:rl;restart()}catch{alert('Invalid settings JSON')}};r.readAsText(e.target.files[0])};
function scenarioExplanation(){
  const ps=document.querySelectorAll('.readouts aside p');
  if(!sim||ps.length<2)return;
  const preset=$('preset').value;
  if(preset==='CMOS source termination') ps[0].textContent='CMOS source termination: a series resistor makes the driver impedance approximately equal to Z0. The driver launches only about half the final logic voltage; an open receiver reflects that wave and the receiver rises to the full logic level. The returning wave is absorbed at the source, preventing ringing. Use this common point-to-point digital technique when a trace has one receiver and its far end is effectively high impedance.';
  else if(preset==='Open line') ps[0].textContent='Open line: an unloaded or unterminated trace cannot accept line current, so the voltage step reflects with the same polarity (ΓL = +1). The load-end voltage doubles when the wave arrives. This models a floating input, connector, stub, or unterminated digital trace, and makes it easy to see why such traces can cause overshoot and ringing.';
  else if(preset==='Shorted line') ps[0].textContent='Shorted line: the load voltage must stay at zero, so the incident voltage step reflects with opposite polarity (ΓL = −1). The forward and backward steps cancel at C. This is useful for learning boundary conditions, checking RF/cable faults, and understanding why a short is a strong reflection rather than a wave absorber.';
  else if(preset==='Matched 50 Ω load') ps[0].textContent='Matched 50 Ω load: the load equals the transmission-line impedance, so ΓL = 0. All incident power is absorbed and no wave returns from C. Matching is used in RF instruments, coaxial cable systems, antennas, and high-speed links whenever a clean response without reflections matters.';
  else if(preset==='Source mismatch') ps[0].textContent='Source mismatch: the source impedance differs from Z0, so a returning wave is only partly absorbed and partly sent back toward the load. With an open load this creates a sequence of diminishing bounces—ringing. Use this scenario to understand driver-strength problems and why source termination improves digital signal integrity.';
  else if(preset==='RF 50 Ω antenna') ps[0].textContent='RF 50 Ω antenna: this models the antenna input as an ideal 50 Ω resistor. It absorbs the wave with no reflection, which is the design goal for a transmitter, receiver, and feed line. Real antennas are frequency-dependent and radiate energy, so this is a useful impedance-matching model rather than a full electromagnetic radiation simulation.';
  else ps[0].textContent=`Custom resistive load: RL creates ΓL = ${sim.gl.toFixed(3)}, so part of every step is delivered to the load and part reflects. ΓS = ${sim.gs.toFixed(3)} describes what happens when that reflected wave reaches the driver. Use this setting to explore termination tradeoffs and select a resistance that reduces ringing.`;
  const n=sim.waves.length-1;
  const sourceEffect=Math.abs(sim.gs)<1e-9?'The returning wave is fully absorbed at the source.':Math.abs(sim.gs)>.999?'The source reflects essentially all returning wave energy.':'The source partly absorbs and partly re-reflects each returning wave.';
  ps[0].textContent+=` For these settings, ΓL = ${sim.gl.toFixed(3)} and ΓS = ${sim.gs.toFixed(3)}. The simulator has generated ${n} reflected ${n===1?'wave':'waves'} inside the selected ${sim.p.duration.toFixed(2)} ns window: each nonzero Γ at a boundary creates the next wave, while a zero Γ absorbs it. ${sourceEffect}`;
  ps[1].textContent='Read the animation from left to right: yellow fronts travel from A to C and purple fronts travel back. At each front, compare the A/B/C marker on the plots to see the same event at a different physical position.';
}
const originalDraw=draw;
draw=()=>{originalDraw();scenarioExplanation()};
const explanationLayout=document.createElement('style');
explanationLayout.textContent='.readouts h2{grid-column:1/-1}.readouts aside{grid-column:1/-1;border-left:0;border-top:1px solid var(--line);padding:12px 0 0}.readouts aside p{max-width:none}.readouts #readout{grid-column:1/-1}';
document.head.append(explanationLayout);
const explanationAside=document.querySelector('.readouts aside');
const scenarioNodes=[...explanationAside.children];
scenarioNodes.forEach(node=>node.classList.add('scenario-tab-content'));
const tabBar=document.createElement('div');
tabBar.className='explanation-tabs';
const scenarioTab=document.createElement('button');scenarioTab.textContent='This scenario';scenarioTab.className='selected';
const theoryTab=document.createElement('button');theoryTab.textContent='Understanding reflection coefficients';
tabBar.append(scenarioTab,theoryTab);explanationAside.prepend(tabBar);
const theory=document.createElement('div');theory.className='theory-tab-content';
theory.innerHTML='<strong>Why do reflection coefficients have these values?</strong><p>Every traveling wave on a lossless line has a fixed voltage-to-current ratio, Z0. At a boundary, voltage and current must satisfy the impedance connected there. The reflected wave is the adjustment required to satisfy that condition.</p><p><b>Formula:</b> Γ = (Zboundary − Z0) / (Zboundary + Z0). At C, Zboundary is RL. At A, a returning wave sees Rs because the ideal voltage source is set to zero when considering that returning wave.</p><p><b>Matched:</b> R = Z0 gives Γ = 0. The impedance asks for exactly the current carried by the incident wave, so it absorbs the wave. <b>Open:</b> R → ∞ gives Γ = +1. Current must be zero, so an equal positive voltage reflection cancels the incident current; voltage doubles. <b>Short:</b> R = 0 gives Γ = −1. Voltage must be zero, so an equal negative reflection cancels the incident voltage.</p><p>Values between −1 and +1 mean partial reflection. The sign tells whether the reflected voltage keeps or reverses polarity. Any nonzero coefficient at both ends causes repeated bounces; each bounce is multiplied by ΓL × ΓS.</p>';
explanationAside.append(theory);
function setExplanationTab(showTheory){theory.hidden=!showTheory;scenarioNodes.forEach(node=>node.hidden=showTheory);scenarioTab.classList.toggle('selected',!showTheory);theoryTab.classList.toggle('selected',showTheory)}
scenarioTab.onclick=()=>setExplanationTab(false);theoryTab.onclick=()=>setExplanationTab(true);setExplanationTab(false);
const tabStyle=document.createElement('style');tabStyle.textContent='.explanation-tabs{display:flex;gap:7px;margin-bottom:10px}.explanation-tabs button{background:transparent;border-color:var(--line)}.explanation-tabs button.selected{background:var(--btn);border-color:var(--btn)}.theory-tab-content p{margin:9px 0;line-height:1.55}';document.head.append(tabStyle);
/* Main operating modes: one launched step, or a periodic finite-width pulse train. */
let simulationMode='step';
if($('maxRef').value==='100')$('maxRef').value=1000;
$('maxRef').max=10000;
const mainTabs=document.createElement('div');mainTabs.className='main-mode-tabs';
const stepTab=document.createElement('button');stepTab.textContent='Single-step response';stepTab.className='selected';
const pulseTab=document.createElement('button');pulseTab.textContent='Pulse train';mainTabs.append(stepTab,pulseTab);document.querySelector('main').before(mainTabs);
const pulseControls=document.createElement('div');pulseControls.className='pulse-controls';
pulseControls.innerHTML='<h3>Pulse-train settings</h3><label>Frequency <input id="pulseFreq" type="number" value="50" min="0.001" step="1"> MHz</label><label>Duty cycle <input id="pulseDuty" type="number" value="50" min="1" max="99" step="1"> %</label><p>Pulse width: <b id="pulseWidth">10.00 ns</b></p>';
document.querySelector('.controls .transport').before(pulseControls);
const modeStyle=document.createElement('style');modeStyle.textContent='.main-mode-tabs{max-width:1600px;margin:16px auto 0;padding:0 18px;display:flex;gap:8px}.main-mode-tabs button{background:transparent;border-color:var(--line)}.main-mode-tabs button.selected{background:var(--btn);border-color:var(--btn)}.pulse-controls{display:none;border-top:1px solid var(--line);margin-top:14px;padding-top:12px}.pulse-controls h3{font-size:13px;margin:0 0 8px}.pulse-controls label{display:flex!important;justify-content:space-between;margin:7px 0}.pulse-controls p{margin:9px 0}.pulse-controls input{width:80px}';document.head.append(modeStyle);
function updatePulseWidth(){const period=1000/Math.max(.001,+$('pulseFreq').value),width=period*Math.max(1,Math.min(99,+$('pulseDuty').value))/100;$('pulseWidth').textContent=width.toFixed(2)+' ns';}
const basicParams=params;
params=()=>({...basicParams(),mode:simulationMode,frequencyMHz:+$('pulseFreq').value,dutyPercent:+$('pulseDuty').value});
build=function(){const p=params();if(p.rs<0||p.z0<=0||p.td<=0||p.duration<=0)return;const gl=Number.isFinite(p.rl)?(p.rl-p.z0)/(p.rl+p.z0):1,gs=(p.rs-p.z0)/(p.rs+p.z0),launch=p.vs*p.z0/(p.rs+p.z0),waves=[],q=[];let reflectionEvents=0;const add=(a,s)=>{const w={a,d:1,s,g:0};waves.push(w);q.push(w)};
  if(p.mode==='pulse'){const period=1000/Math.max(.001,p.frequencyMHz),width=period*Math.max(1,Math.min(99,p.dutyPercent))/100;for(let start=0;start<=p.duration;start+=period){add(launch,start);if(start+width<=p.duration)add(-launch,start+width)}}else add(launch,0);
  while(q.length&&reflectionEvents<p.max){const w=q.shift(),arrival=w.s+p.td;if(arrival>p.duration)continue;const a=w.a*(w.d===1?gl:gs);if(Math.abs(a)<1e-6)continue;const r={a,d:-w.d,s:arrival,g:w.g+1};waves.push(r);q.push(r);reflectionEvents++}return {p,gl,gs,waves};};
function selectMode(mode){simulationMode=mode;pulseControls.style.display=mode==='pulse'?'block':'none';stepTab.classList.toggle('selected',mode==='step');pulseTab.classList.toggle('selected',mode==='pulse');updatePulseWidth();restart();}
stepTab.onclick=()=>selectMode('step');pulseTab.onclick=()=>selectMode('pulse');$('pulseFreq').onchange=()=>{updatePulseWidth();restart()};$('pulseDuty').onchange=()=>{updatePulseWidth();restart()};updatePulseWidth();
restart();requestAnimationFrame(tick);
const interactionLoader=document.createElement('script');
const safetyPanel=document.createElement('div');
safetyPanel.className='data-safety';
document.querySelector('.schematic').append(safetyPanel);
const safetyStyle=document.createElement('style');
safetyStyle.textContent='.schematic{position:relative}.data-safety{position:absolute;right:28px;top:45px;width:245px;padding:10px 12px;border:1px solid var(--line);border-radius:7px;background:color-mix(in srgb,var(--panel) 90%,transparent);font-size:12px;line-height:1.35}.data-safety b{display:block;font-size:15px;margin-bottom:3px}.data-safety.safe b{color:#58d68d}.data-safety.unsafe b{color:#ff7675}.data-safety small{color:var(--muted)}@media(max-width:850px){.data-safety{position:static;width:auto;margin-top:8px}}';document.head.append(safetyStyle);
function updateDataSafety(){
  if(!sim)return;
  const p=sim.p, matched=Math.abs(sim.gl)<=.1, sourceTerminated=Math.abs(sim.gs)<=.1;
  const pulse=p.mode==='pulse', period=pulse?1000/Math.max(.001,p.frequencyMHz):Infinity, roundTrip=2*p.td;
  let safe=false, reason='';
  if(matched){safe=true;reason=`Matched load: ΓL = ${sim.gl.toFixed(2)}. Reflections are negligible, so this is the preferred termination for reliable high-speed data and RF.`}
  else if(!pulse&&sourceTerminated&&sim.gl>.9){safe=true;reason=`Source-terminated step: ΓS = ${sim.gs.toFixed(2)} absorbs the open-load return. This is suitable for a single point-to-point digital receiver after the ${roundTrip.toFixed(1)} ns round trip.`}
  else if(pulse&&sourceTerminated&&sim.gl>.9&&period>=roundTrip*1.2){safe=true;reason=`Source termination can absorb the open-end return before the next pulse (period ${period.toFixed(2)} ns; round trip ${roundTrip.toFixed(2)} ns).`}
  else if(pulse&&period<roundTrip){reason=`Pulse period (${period.toFixed(2)} ns) is shorter than the line round trip (${roundTrip.toFixed(2)} ns). Reflections overlap later symbols and can corrupt data.`}
  else reason=`Significant reflection remains (ΓL = ${sim.gl.toFixed(2)}, ΓS = ${sim.gs.toFixed(2)}). Add or adjust termination before using this for reliable data transfer.`;
  safetyPanel.className='data-safety '+(safe?'safe':'unsafe');
  safetyPanel.innerHTML=`<b>${safe?'● SAFE FOR DATA (heuristic)':'● NOT SAFE FOR DATA (heuristic)'}</b>${reason}<br><small>Educational estimate; verify eye diagram, timing, and signal-integrity limits in the real design.</small>`;
}
const drawBeforeSafety=draw;
draw=()=>{drawBeforeSafety();updateDataSafety()};
updateDataSafety();
const widerSafetyStyle=document.createElement('style');
widerSafetyStyle.textContent='.data-safety{width:390px}@media(max-width:850px){.data-safety{width:auto}}';
document.head.append(widerSafetyStyle);
const compactSafetyStyle=document.createElement('style');
compactSafetyStyle.textContent='.data-safety{width:320px!important;font-size:10px!important;line-height:1.24!important;padding:7px 9px!important}.data-safety b{font-size:12px!important;margin-bottom:2px!important}.data-safety small{font-size:9px!important}';
document.head.append(compactSafetyStyle);
interactionLoader.src='interactions.js?revision=4';
interactionLoader.onload=()=>{};
document.body.append(interactionLoader);
setTimeout(()=>{const magentaRenderer=document.createElement('script');magentaRenderer.src='magenta_renderer.js?revision=1';document.body.append(magentaRenderer)},100);
