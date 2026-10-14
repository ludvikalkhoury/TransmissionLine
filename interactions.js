/* Canvas chart navigation: wheel zoom, drag pan, double click reset. */
const sizingStyle=document.createElement('style');
sizingStyle.textContent='.controls{min-width:0}.controls select{min-width:0!important;width:100%;max-width:100%;text-overflow:ellipsis;overflow:hidden;white-space:nowrap}.controls label{min-width:0}';
document.head.append(sizingStyle);
// A two-way transit is the useful initial viewing window; preserve settings loaded later.
if ($('duration').value==='48') { $('duration').value=2*number('td'); restart(); }
// Named playback choices make the intentionally slow teaching speed discoverable.
const speedChoice=document.createElement('select');
speedChoice.id='speedChoice';
speedChoice.setAttribute('aria-label','Animation speed');
[['0.1','Very slow'],['0.3','Slow'],['1','Medium'],['3','Fast'],['8','Very fast']].forEach(([v,label])=>{const o=document.createElement('option');o.value=v;o.textContent=label;speedChoice.append(o)});
$('speed').min=.1;
$('speed').max=20;
$('speed').step=.1;
$('speed').value=1;
speedChoice.value='1';
$('speed').insertAdjacentElement('afterend',speedChoice);
speedChoice.addEventListener('change',()=>{ $('speed').value=speedChoice.value; });
// Play always begins a fresh demonstration from t = 0.
$('play').onclick=()=>{ time=0; $('timeline').value=0; draw(); playing=true; };

function updateExplanation(){
  const paragraphs=document.querySelectorAll('.readouts aside p');
  if(!sim||paragraphs.length<2)return;
  const gl=sim.gl, gs=sim.gs;
  let text;
  if(Math.abs(gl)<1e-9) text='This load is matched to the line impedance. The incident step reaches C and is absorbed: no reflected wave is created, so the voltage settles after one one-way propagation delay.';
  else if(gl>0.999) text='This is an open-ended load. The arriving voltage step reflects with the same polarity (ΓL = +1), doubling the load-end voltage. A matched source absorbs the returning wave; a mismatched source sends another bounce.';
  else if(gl<-0.999) text='This is a short-circuited load. The arriving step reflects with opposite polarity (ΓL = −1), so voltage at C remains zero while the negative reflected step travels back toward A.';
  else text=`This resistive load is mismatched (ΓL = ${gl.toFixed(3)}), so part of each incident step reflects and the rest changes the load voltage. The source reflection coefficient is ΓS = ${gs.toFixed(3)}; nonzero values create repeated bounces.`;
  paragraphs[0].textContent=text;
  paragraphs[1].textContent=$('preset').value==='RF 50 Ω antenna'?'The RF antenna preset is an idealized 50 Ω resistive antenna input, not a full electromagnetic radiation simulation.':'Use the timeline or graph markers to follow each front as it reaches A, B, and C.';
}
['preset','vs','rs','z0','td','load','rl','duration'].forEach(id=>$(id).addEventListener('change',()=>setTimeout(updateExplanation,0)));
updateExplanation();
const chartViews = {};
function sourceCommand(t){
  if(sim.p.mode!=='pulse') return t>=0?sim.p.vs:0;
  const period=1000/Math.max(.001,sim.p.frequencyMHz), width=period*Math.max(1,Math.min(99,sim.p.dutyPercent))/100;
  return (t%period)<width?sim.p.vs:0;
}
function sharedYLimits(){
  const values=[];
  for(let i=0;i<=500;i++){const t=sim.p.duration*i/500;values.push(voltage(0,t),voltage(.5,t),voltage(1,t),sourceCommand(t));}
  const low=Math.min(-.5,...values), high=Math.max(5.5,...values), pad=Math.max(.25,(high-low)*.12);
  return [low-pad,high+pad];
}
function resetView(id) { delete chartViews[id]; draw(); }
function interactivePlot(id, position, isLine=false) {
  const [ctx,w,h]=resize($(id)), pad={l:48,r:12,t:12,b:28}, gw=w-pad.l-pad.r, gh=h-pad.t-pad.b;
  const total=isLine?1:sim.p.duration, view=chartViews[id]||{a:0,b:total};
  const count=800, data=[];
  for(let i=0;i<count;i++){const u=i/(count-1), x=view.a+u*(view.b-view.a);data.push([x,isLine?voltage(x,time):voltage(position,x)])}
  let [lo,hi]=sharedYLimits();
  const X=x=>pad.l+(x-view.a)/(view.b-view.a)*gw, Y=y=>pad.t+(hi-y)/(hi-lo)*gh;
  ctx.clearRect(0,0,w,h);ctx.font='11px Segoe UI';ctx.strokeStyle='#40505f';ctx.fillStyle='#a9b8c5';
  [0,2.5,5].filter(y=>y>=lo&&y<=hi).forEach(y=>{ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(pad.l,Y(y));ctx.lineTo(w-pad.r,Y(y));ctx.stroke();ctx.setLineDash([]);ctx.fillText(y+' V',4,Y(y)+4)});
  ctx.strokeStyle='#11bfd2';ctx.lineWidth=2;ctx.beginPath();data.forEach(([x,y],i)=>{if(!i)ctx.moveTo(X(x),Y(y));else{ctx.lineTo(X(x),Y(data[i-1][1]));ctx.lineTo(X(x),Y(y))}});ctx.stroke();
  if(!isLine){ctx.strokeStyle='rgba(255,65,225,.22)';ctx.lineWidth=.7;ctx.beginPath();data.forEach(([x],i)=>{const y=sourceCommand(x);if(!i)ctx.moveTo(X(x),Y(y));else{const previous=sourceCommand(data[i-1][0]);ctx.lineTo(X(x),Y(previous));ctx.lineTo(X(x),Y(y))}});ctx.stroke();ctx.fillStyle='rgba(255,105,232,.75)';ctx.fillText('magenta: source input',pad.l+5,pad.t+11)}
  if(!isLine&&time>=view.a&&time<=view.b){ctx.fillStyle='#ffd54f';ctx.beginPath();ctx.arc(X(time),Y(voltage(position,time)),4,0,7);ctx.fill()}
  ctx.fillStyle='#a9b8c5';ctx.fillText(`${isLine?'Position':'Time (ns)'} →  Scroll: zoom · drag: pan · double-click: reset`,w/2-110,h-7);
}
plot=interactivePlot;
document.querySelectorAll('.plot').forEach(canvas=>{
  let drag=null;
  canvas.addEventListener('wheel',e=>{e.preventDefault();let id=canvas.id,total=id==='plotLine'?1:sim.p.duration,v=chartViews[id]||{a:0,b:total},r=canvas.getBoundingClientRect(),u=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),span=v.b-v.a, next=Math.max(total/10000,Math.min(total,span*(e.deltaY>0?1.25:.8))),at=v.a+u*span;chartViews[id]={a:Math.max(0,Math.min(total-next,at-u*next)),b:0};chartViews[id].b=chartViews[id].a+next;draw()},{passive:false});
  canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);drag={x:e.clientX,v:{...(chartViews[canvas.id]||{a:0,b:canvas.id==='plotLine'?1:sim.p.duration})}});
  canvas.addEventListener('pointermove',e=>{if(!drag)return;let r=canvas.getBoundingClientRect(),total=canvas.id==='plotLine'?1:sim.p.duration,span=drag.v.b-drag.v.a,shift=(e.clientX-drag.x)/r.width*span,a=Math.max(0,Math.min(total-span,drag.v.a-shift));chartViews[canvas.id]={a,b:a+span};draw()});
  canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('dblclick',()=>resetView(canvas.id));
});
