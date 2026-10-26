'use strict';
const $ = id => document.getElementById(id);
const p = PROJECT;
const research = p.research, budget = research.budget, BLUE = '#2a78d6', GRAY = '#8b94a1';
const compact = value => Number.isInteger(value) ? String(value) : f(value);
const f = value => value.toFixed(1).replace('-', '−');
const signed = value => value > 0 ? `+${f(value)}` : f(value);
const ci = values => `[${values.map(f).join(', ')}]`;
const text = (id, value) => { $(id).textContent = value; };
document.querySelectorAll('[data-asset-href]').forEach(el => el.href = p.assets[el.dataset.assetHref]);
document.querySelectorAll('[data-asset-src]').forEach(el => el.src = p.assets[el.dataset.assetSrc]);
document.querySelectorAll('[data-asset-poster]').forEach(el => el.poster = p.assets[el.dataset.assetPoster]);
text('paper-title', p.title); text('authors', p.authors);
text('teaser-caption', `One ${p.gpuGB} GB GPU drives ${p.robots} simulated robots in real time. Each robot runs at ${p.hz} Hz and never waits for a plan, because the planner's execution length E sets how often each robot calls the GPU.`);
const takeaways = [
  `Faster inference changes which actions a robot actually executes: with the same execution length, an ${p.speedup}× faster X-WAM drops from ${f(p.anomaly[0].value)}% to ${f(p.anomaly[1].value)}% on button tasks.`,
  'A training-free planner picks the execution length E and a latency budget from a synchronous success curve plus one asynchronous run.',
  'Matching E lets one GPU serve many robots and tells you how slow a device can be.'
];
takeaways.forEach(value => {const li = document.createElement('li'); li.textContent = value; $('takeaways').append(li);});
p.anomaly.forEach(({name, value}) => {const item = document.createElement('div'); item.className = 'stat'; item.innerHTML = `<strong>${f(value)}%</strong><span>${name}</span>`; $('anomaly-stats').append(item);});
text('window-intro', `A policy predicts a ${p.horizon}-step plan at time t. It arrives d steps later. The robot executes the window [d, d + E). Move the sliders to see what changes.`);
text('blind-caption', `X-WAM blind test: ${p.blindTasks} tasks × ${p.blindInitialStates} initial states per cell. Cell values are success percentages; blank cells were not tested. Both tied best choices are marked.`);
text('families-caption', `Choices fixed before target asynchronous runs. Episode counts per cell are shown with each family. ACT includes ${p.actCheckpoints} checkpoints; π₀.₅ uses LIBERO-${p.liberoTasks}; SmolVLA uses LIBERO-goal (source: LIBERO-${p.liberoTasks}, d = ${p.smolSourceDelay}). Labels give execution length E and success; calls scale as source E / planner's E.`);
const episodeCounts = research.deployment.flatMap(line => line.points.map(row => row.n));
text('deployment-caption', `Icons show the largest tested run for each service latency. Faded icons are past the success-kept boundary. One batch-one FIFO inference process serves all robots; service latency is injected. Deployment cells contain ${Math.min(...episodeCounts)}–${Math.max(...episodeCounts)} episodes; whiskers show ${p.confidenceLevel}% task-cluster intervals.`);
text('success-definition', `“Success kept” means success is not significantly more than δ = ${budget.delta_pp} points below one robot on the same device (the planner's tolerance): no waiting, and the paired interval's upper end is at least −${budget.delta_pp} points. It is not proof of equal success. A memory-limited run has no measured success comparison.`);
text('throughput', `${f(p.throughput)}× successful tasks per GPU-hour at ${p.robots} robots`);
text('te-delta', `${f(p.teDelta)} ${ci(p.teCI)} points`);
text('te-saving', `${p.gpuSavingPercent}%`);
[
  'Simulation only. These results do not establish performance on physical robots.',
  `Service latencies are injected. The 4090-class service is emulated on H200 by padding to ${p.serviceMs} ms per call.`,
  `${Math.min(...episodeCounts)}–${Math.max(...episodeCounts)} episodes per deployment cell; intervals reflect the tested tasks and initial states.`,
  'Slow-device execution lengths were chosen from single-robot runs, not by the planner. Their single-robot baselines ran on a second machine.'
].forEach(value => {const li = document.createElement('li'); li.textContent = value; $('limitations-list').append(li);});
text('bibtex-code', `@misc{tbd${p.year}fit,
  title  = {${p.title}},
  author = {${p.bibAuthor}},
  year   = {${p.year}},
  note   = {Manuscript}
}`);
$('copy-bibtex').addEventListener('click', async () => {
  const value = $('bibtex-code').textContent;
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
  } else {
    const field = document.createElement('textarea'); field.value = value;
    field.style.position = 'fixed'; field.style.opacity = '0'; document.body.append(field);
    field.select(); document.execCommand('copy'); field.remove();
  }
  text('copy-status', 'BibTeX copied.'); text('copy-bibtex', 'Copied');
});
const ns = 'http://www.w3.org/2000/svg';
function node(tag, attrs, parent, content) {const el = document.createElementNS(ns,tag); Object.entries(attrs).forEach(([key,val]) => el.setAttribute(key,val)); if(content !== undefined) el.textContent=content; parent.append(el); return el;}
const x0=40, cell=18, y=69, h=42;
for (let i=0; i<p.horizon; i++) node('rect',{x:x0+i*cell,y,width:cell-1,height:h,rx:2,fill:'#e4eaf2'},$('plan-cells'));
for (let i=0; i<=p.horizon; i+=4) node('text',{x:x0+i*cell,y:139,'text-anchor':'middle'},$('plan-cells'),i);
node('text',{x:x0,y:181},$('plan-cells'),'Plan step →');
for (const [id,range,value] of [['delay',p.delayRange,p.initialDelay],['execution',p.executionRange,p.initialExecution]]) {const input=$(id); input.min=range[0];input.max=range[1];input.value=value;input.addEventListener('input',drawWindow);}
function drawWindow() {
  const d=Number($('delay').value), e=Number($('execution').value), end=d+e;
  const over=end>p.horizon, color=over?'#c94436':BLUE, group=$('window-overlay');
  group.replaceChildren();
  node('rect',{x:x0+d*cell,y:y-4,width:e*cell-1,height:h+8,rx:4,fill:color,'fill-opacity':'.18',stroke:color,'stroke-width':2},group);
  if(over) node('rect',{x:x0+p.horizon*cell,y:y-4,width:(end-p.horizon)*cell-1,height:h+8,fill:'url(#overrun-pattern)'},group);
  node('line',{x1:x0,y1:34,x2:x0,y2:y-9,stroke:'#657080','stroke-width':1.5},group);
  node('text',{x:x0,y:24},group,'Request at t');
  node('line',{x1:x0+d*cell,y1:y+h+8,x2:x0+d*cell,y2:158,stroke:color,'stroke-width':1.5},group);
  const label=node('text',{x:x0+d*cell+8,y:160},group,`Arrives at t + ${d}`);label.style.fill=color;
  const endLabel=node('text',{x:x0+(d+e/2)*cell,y:y+27,'text-anchor':'middle','font-weight':650},group,`[${d}, ${end})`);endLabel.style.fill=color;
  node('line',{x1:x0+p.horizon*cell,y1:y-10,x2:x0+p.horizon*cell,y2:y+h+10,stroke:'#657080','stroke-dasharray':'4 4'},group);
  text('delay-value',`${d} steps · ${d*1000/p.hz} ms`); text('execution-value',`${e} steps`);
  text('window-result',over?`[${d}, ${end}) exceeds the ${p.horizon}-step plan: robot must wait.`:`Executes [${d}, ${end}) · ${e} actions per plan · ${(p.hz/e).toFixed(2)} calls/s per robot.`);
  $('window-result').classList.toggle('overrun',over);
  $('window-desc').textContent=$('window-result').textContent;
}
drawWindow();

function svgText(svg, x, y, value, color='#657080', anchor='middle') {
  return node('text',{x,y,fill:color,'text-anchor':anchor,'font-size':12,'font-family':'inherit'},svg,value);
}
function drawSyncCurve() {
  const svg=$('sync-curve'), rows=Object.entries(budget.sync).map(([n,s])=>[Number(n),s]);
  const x=n=>30+(n-rows[0][0])/(rows.at(-1)[0]-rows[0][0])*220, y=s=>112-s;
  for(const value of [p.scoreRange[0],(p.scoreRange[0]+p.scoreRange[1])/2,p.scoreRange[1]]) {node('line',{x1:30,x2:252,y1:y(value),y2:y(value),stroke:'#e7ecf3'},svg);svgText(svg,23,y(value)+4,value,GRAY,'end');}
  node('polyline',{points:rows.map(([n,s])=>`${x(n)},${y(s)}`).join(' '),fill:'none',stroke:BLUE,'stroke-width':2.5},svg);
  rows.forEach(([n,s])=>node('circle',{cx:x(n),cy:y(s),r:3,fill:BLUE},svg));
  [rows[0],rows.at(-1)].forEach(([n])=>svgText(svg,x(n),132,`n = ${n}`));
  text('kappa-value',`κ = ${budget.kappa.bayes.toFixed(3)}`);
}
function drawPlanner() {
  const d=Number($('planner-delay').value), chosen=research.chosen.find(row=>row[0]===d), measured=research.heatmap[d];
  text('planner-delay-value',`${d} steps · ${d*1000/p.hz} ms`);
  $('score-bars').replaceChildren();
  const rows=[];
  for(let e=p.chartStep;e<=p.horizon-d;e+=p.chartStep) {
    const q=budget.sync[d+e]-budget.kappa.bayes*d*(d+e), isChosen=Boolean(chosen&&chosen[1]===e);
    const col=document.createElement('div');col.className=`score-column${isChosen?' is-chosen':''}`;
    col.dataset.e=e;col.dataset.score=q;col.dataset.chosen=isChosen;
    col.innerHTML=`<div class="score-lane"><div class="score-bar" style="height:${q}%"></div><span class="score-value" style="bottom:calc(${q}% - 24px)">${f(q)}</span>${Object.hasOwn(measured,e)?`<i class="measured-point" style="bottom:calc(${measured[e]}% - 4px)" title="Measured: ${measured[e]}%" data-value="${measured[e]}"></i>`:''}</div><span class="score-e">${e}</span>`;
    $('score-bars').append(col);rows.push(`E ${e}: predicted ${f(q)}%${Object.hasOwn(measured,e)?`, measured ${measured[e]}%`:''}`);
  }
  $('score-bars').style.gridTemplateColumns=`repeat(${$('score-bars').children.length},minmax(0,1fr))`;
  $('score-bars').setAttribute('aria-label',rows.join('; '));
  text('planner-selection',chosen?`planner's choice: E = ${chosen[1]}`:'No preselected E in the blind test at this delay.');
  text('planner-caption',`Point score only; the planner also uses a ${p.confidenceLevel}% bound and a tolerance δ = ${budget.delta_pp} points.`);
}
function drawHeatmap() {
  const grid=$('blind-heatmap'), vals=Object.values(research.heatmap).flatMap(Object.values), lo=Math.min(...vals), hi=Math.max(...vals);
  grid.innerHTML='<div class="heatmap-corner" aria-hidden="true">E ↓ / d →</div>';
  budget.latency_steps.forEach(d=>grid.insertAdjacentHTML('beforeend',`<div class="heatmap-head" role="columnheader">${d}<small>${d*1000/p.hz} ms</small></div>`));
  for(let e=p.horizon-p.chartStep;e>=p.chartStep;e-=p.chartStep) {
    grid.insertAdjacentHTML('beforeend',`<div class="heatmap-e" role="rowheader">${e}</div>`);
    budget.latency_steps.forEach(d=>{
      const value=research.heatmap[d][e], cell=document.createElement('div');cell.className='heatmap-cell';cell.setAttribute('role','cell');cell.dataset.d=d;cell.dataset.e=e;
      if(value!==undefined) {
        const t=(value-lo)/(hi-lo), chosen=research.chosen.some(row=>row[0]===d&&row[1]===e), best=research.best.some(row=>row[0]===d&&row[1]===e);
        cell.style.background=`rgb(${Math.round(239+(42-239)*t)},${Math.round(243+(120-243)*t)},${Math.round(248+(214-248)*t)})`;
        cell.classList.toggle('dark-cell',t>.6);cell.dataset.value=value;cell.dataset.chosen=chosen;cell.dataset.best=best;
        cell.innerHTML=`<span class="best-marker${best?' active':''}"><span class="chosen-marker${chosen?' active':''}">${value}</span></span>`;
        cell.title=`d=${d}, E=${e}: ${value}%${chosen?'; preselected':''}${best?'; best measured':''}`;
      } else {cell.classList.add('untested');cell.setAttribute('aria-label',`d=${d}, E=${e}: not tested`);}
      grid.append(cell);
    });
  }
  text('regret-value',`${f(p.regret)} pts`);text('regret-interval',`mean regret ${ci(p.regretCI)}`);
  text('budget-value',`${research.budget_boundaries.ours_ms} ms`);
}
const mobileCharts=window.matchMedia('(max-width: 700px)');
function chartAxis(svg, width, y) {
  const [lo,hi]=p.familySuccessRange, x=value=>38+(value-lo)/(hi-lo)*(width-76);
  for(let value=lo;value<=hi;value+=p.successTickStep) {node('line',{x1:x(value),x2:x(value),y1:20,y2:y-14,stroke:'#e7ecf3'},svg);svgText(svg,x(value),y,`${value}%`);}
  return x;
}
function drawFamilies() {
  $('family-rows').replaceChildren();
  research.acceleration.forEach((row,i)=>{
    const ratio=row.source_E/row.ours_E, percent=(ratio-1)*100, width=mobileCharts.matches?340:540;
    const wrapper=document.createElement('div');wrapper.className='family-row';wrapper.dataset.family=row.family;
    wrapper.innerHTML=`<div class="family-name"><strong>${row.family}${row.checkpoint?` · ckpt ${row.checkpoint}`:''}</strong><small>d = ${row.d} · ${row.episodes} episodes</small></div><div class="family-plot"></div><div class="calls-change">${percent>0?'+':'−'}${compact(Math.abs(percent))}% calls<small>${Number(ratio.toFixed(2))}× calls</small></div>`;
    const svg=node('svg',{viewBox:`0 0 ${width} 88`,role:'img','aria-label':`${row.family}: ${row.source_success}% at E=${row.source_E}, ${row.ours_success}% at E=${row.ours_E}`},wrapper.querySelector('.family-plot'));
    const x=chartAxis(svg,width,84), a=x(row.source_success), b=x(row.ours_success), direction=Math.sign(b-a);
    const defs=node('defs',{},svg), marker=node('marker',{id:`family-arrow-${i}`,viewBox:'0 0 10 10',refX:8,refY:5,markerWidth:5,markerHeight:5,orient:'auto-start-reverse'},defs);node('path',{d:'M0 0L10 5L0 10',fill:GRAY},marker);
    if(direction) node('line',{x1:a+direction*8,x2:b-direction*8,y1:38,y2:38,stroke:GRAY,'stroke-width':1.7,'marker-end':`url(#family-arrow-${i})`},svg);
    node('circle',{cx:a,cy:38,r:7,fill:GRAY},svg);node('circle',{cx:b,cy:38,r:5,fill:BLUE},svg);
    svgText(svg,a,14,`E${row.source_E} · ${compact(row.source_success)}%`,GRAY);svgText(svg,b,65,`E${row.ours_E} · ${compact(row.ours_success)}%`,BLUE);
    $('family-rows').append(wrapper);
  });
  const extras=research.acceleration.filter(row=>row.family==='π0.5'||row.family==='SmolVLA').map(row=>`${row.family} ${signed(row.ours_success-row.source_success)} pp${row.family==='SmolVLA'?` with ${compact(row.source_E/row.ours_E)}× calls`:''}`);
  text('family-summary',`+${f(p.familySummary.delta)} pp ${ci(p.familySummary.ci)} across ${p.familySummary.families.join('/')}; ${extras.join('; ')}.`);
}
function deviceCapacity(line) {
  const maximum=rows=>rows.reduce((a,b)=>a.R>b.R?a:b), noWait=maximum(line.points.filter(row=>row.hold===0));
  const kept=maximum(line.points.filter(row=>row.hold===0&&(row.R===1||row.delta_ci[1]*100>=-budget.delta_pp)));
  return {noWait,kept,max:maximum(line.points),single:line.points.find(row=>row.R===1)};
}
function drawDevices() {
  $('device-rows').replaceChildren();$('deployment-rows').replaceChildren();
  $('kept-legend').innerHTML=`<i class="legend-line"></i>success kept (≤ δ = ${budget.delta_pp} pts loss)`;
  research.deployment.forEach(line=>{
    const {noWait,kept,max,single}=deviceCapacity(line), cols=Math.min(max.R,p.robotColumns), width=mobileCharts.matches?340:230;
    const wrapper=document.createElement('div');wrapper.className='device-row';wrapper.dataset.service=line.service_ms;wrapper.dataset.kept=kept.R;wrapper.dataset.noWait=noWait.R;
    const waiting=line.points.filter(row=>row.hold>0).map(row=>row.R), memory=line.memory_limit!==null;
    const notes=[kept.R===noWait.R?`${kept.R} robots: kept, no wait`:`${kept.R} kept · ${noWait.R} no wait`];
    if(waiting.length) notes.push(`${Math.min(...waiting)} wait`);
    if(memory) notes.push(`${p.memoryExceededRobots} exceed ${line.memory_limit} GB`);
    wrapper.innerHTML=`<div class="device-pill"><strong>${line.service_ms} ms</strong><span>${memory?'4090-class · ':''}E = ${line.E}</span></div><div class="device-robots"><div class="robot-grid" style="grid-template-columns:repeat(${cols},minmax(0,1fr))"></div><p>${notes.join(' · ')}</p></div><div class="device-comparison"></div>`;
    const robots=wrapper.querySelector('.robot-grid');
    for(let i=1;i<=max.R;i++) {const icon=node('svg',{viewBox:'0 0 40 40',class:`robot-icon${i>kept.R?' faded':''}`,'aria-hidden':'true'},robots);node('use',{href:'#robot-arm'},icon);}
    for(const [kind,count] of [['kept',kept.R],['no-wait',noWait.R]]) {const lineMark=document.createElement('span');lineMark.className=`capacity-boundary ${kind}`;lineMark.style.left=`calc(${((count-1)%cols+1)/cols*100}% ${kind==='kept'?'- 3px':'+ 2px'})`;if(count<max.R) {lineMark.style.top=`${Math.floor((count-1)/cols)*44}px`;lineMark.style.height='40px';}robots.append(lineMark);}
    const target=wrapper.querySelector('.device-comparison'), svg=node('svg',{viewBox:`0 0 ${width} 92`,role:'img','aria-label':`Success, one robot ${f(single.success*100)}%, ${noWait.R} robots ${f(noWait.success*100)}%`},target), x=chartAxis(svg,width,88);
    node('line',{x1:x(single.success*100),x2:x(noWait.success*100),y1:48,y2:27,stroke:'#c8cfd9','stroke-width':1.5},svg);
    for(const [row,y,color,fill] of [[single,48,GRAY,'white'],[noWait,27,BLUE,BLUE]]) {node('line',{x1:x(row.success_ci[0]*100),x2:x(row.success_ci[1]*100),y1:y,y2:y,stroke:color,'stroke-width':2},svg);row.success_ci.forEach(v=>node('line',{x1:x(v*100),x2:x(v*100),y1:y-4,y2:y+4,stroke:color,'stroke-width':2},svg));node('circle',{cx:x(row.success*100),cy:y,r:5,stroke:color,'stroke-width':2,fill},svg);svgText(svg,x(row.success*100),y===27?11:69,`${f(row.success*100)}%`,color);}
    const delta=noWait.R===1?0:noWait.delta_vs_1*100, interval=noWait.R===1?[0,0]:noWait.delta_ci.map(v=>v*100), deltaText=document.createElement('p');deltaText.className=`device-delta${interval[1]<-budget.delta_pp?' capacity-loss':''}`;deltaText.textContent=`Δ ${signed(delta)} ${ci(interval)} pts`;target.append(deltaText);
    $('device-rows').append(wrapper);
    addDeploymentRow(`${line.service_ms} ms`,line.E,[noWait.R,kept.R,`${signed(delta)} ${ci(interval)} points`]);
  });
  research.deployment.filter(line=>line.memory_limit!==null).forEach(line=>addDeploymentRow(`${p.memoryExceededRobots} robots @ ${line.service_ms} ms`,line.E,['Not measured',`Exceeds ${line.memory_limit} GB cap`,'Not measured'],true));
}
function addDeploymentRow(label,e,values,memory=false) {
  const tr=document.createElement('tr');tr.dataset.memory=memory;
  tr.innerHTML=`<th scope="row"><strong>${label}</strong><small>E = ${e}</small></th>`+values.map((v,i)=>`<td data-label="${['Robots that never wait','Robots with success kept','Δ vs one robot'][i]}"><span>${v}</span></td>`).join('');$('deployment-rows').append(tr);
}
const planner=$('planner-delay');planner.min=budget.latency_steps[0];planner.max=budget.latency_steps.at(-1);planner.step=p.chartStep;planner.value=budget.latency_steps[0];planner.addEventListener('input',drawPlanner);
budget.latency_steps.forEach(d=>$('planner-ticks').insertAdjacentHTML('beforeend',`<span>${d}</span>`));
$('score-y-axis').innerHTML=[p.scoreRange[1],(p.scoreRange[0]+p.scoreRange[1])/2,p.scoreRange[0]].map(value=>`<span>${value}</span>`).join('');
drawSyncCurve();drawPlanner();drawHeatmap();drawFamilies();drawDevices();
mobileCharts.addEventListener('change',()=>{drawFamilies();drawDevices();});
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { $('teaser-video').autoplay=false; $('teaser-video').pause(); }
