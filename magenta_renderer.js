/* Draw the commanded source pulse last, so it is never hidden by chart rendering. */
function finalSourcePulse(id,isLine){
  if(isLine||!sim||sim.p.mode!=='pulse')return;
  const canvas=$(id),r=canvas.getBoundingClientRect(),ctx=canvas.getContext('2d'),pad={l:48,r:12,t:12,b:28},w=r.width,h=r.height,gw=w-pad.l-pad.r,gh=h-pad.t-pad.b;
  let lo,hi;
  if(typeof sharedYLimits==='function')[lo,hi]=sharedYLimits();
  else {const v=[];for(let i=0;i<=400;i++){const t=sim.p.duration*i/400;v.push(voltage(0,t),voltage(.5,t),voltage(1,t),sim.p.vs)}lo=Math.min(-.5,...v)*1.12;hi=Math.max(5.5,...v)*1.12}
  const view=(typeof chartViews!=='undefined'&&chartViews[id])||{a:0,b:sim.p.duration};
  const X=x=>pad.l+(x-view.a)/(view.b-view.a)*gw,Y=y=>pad.t+(hi-y)/(hi-lo)*gh;
  const period=1000/Math.max(.001,sim.p.frequencyMHz),width=period*Math.max(1,Math.min(99,sim.p.dutyPercent))/100,input=t=>(t%period)<width?sim.p.vs:0;
  ctx.save();ctx.strokeStyle='rgba(255,30,220,.38)';ctx.lineWidth=.8;ctx.beginPath();for(let i=0;i<=1200;i++){const x=view.a+(view.b-view.a)*i/1200,y=input(x);if(i===0)ctx.moveTo(X(x),Y(y));else{const px=view.a+(view.b-view.a)*(i-1)/1200;ctx.lineTo(X(x),Y(input(px)));ctx.lineTo(X(x),Y(y))}}ctx.stroke();ctx.fillStyle='rgba(255,72,220,.72)';ctx.font='11px Segoe UI';ctx.fillText('Vs input pulse',pad.l+5,pad.t+12);ctx.restore();
}
const basePlotWithSource=plot;
plot=function(id,position,isLine=false){basePlotWithSource(id,position,isLine);finalSourcePulse(id,isLine)};
draw();
