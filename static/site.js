'use strict';
const $ = id => document.getElementById(id);
const p = PROJECT;
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
text('blind-caption', `Preselected E within ${f(p.regret)} ${ci(p.regretCI)} points of the best; ${p.budgetMs} ms budget predicted = measured. X-WAM blind test: ${p.blindTasks} tasks × ${p.blindInitialStates} initial states per cell. Circles: preselected E. Squares: measured best.`);
text('families-caption', `Re-matching E after acceleration, across five policy families. Choices fixed before target asynchronous runs. Episodes per cell: ACT ${p.familyEpisodes.ACT}, GR00T ${p.familyEpisodes.GR00T}, π₀.₅ ${p.familyEpisodes.pi05}, X-WAM ${p.familyEpisodes.XWAM}, SmolVLA ${p.familyEpisodes.SmolVLA}. ACT includes ${p.actCheckpoints} checkpoints; π₀.₅ uses LIBERO-${p.liberoTasks}; SmolVLA uses LIBERO-goal (source: LIBERO-${p.liberoTasks}, d = ${p.smolSourceDelay}). Horizontal axes show calls per ${p.callsPerSteps} control steps; their ranges differ.`);
text('deployment-caption', `One batch-one FIFO inference process serves all robots. Service time is padded to the device latency; the fast run has a ${p.gpuGB} GB cap. Solid lines mark the largest tested runs that keep success and never wait; dashed lines mark those that never wait. Each cell has ${p.deploymentEpisodes} episodes: ${p.deploymentTasks} tasks × ${p.deploymentInitialStates} initial states. Open marks: one robot; filled marks: the largest no-wait run.`);
p.deployment.forEach(row => {
  const tr = document.createElement('tr');
  const label = row.requestedRobots ? `${row.requestedRobots} robots @ ${row.serviceMs} ms` : `${row.serviceMs} ms`;
  const values = row.memoryExceeded
    ? ['Not measured', `Exceeds ${p.gpuGB} GB cap`, 'Not measured']
    : [String(row.neverWait), String(row.successKept), `${signed(row.delta)} ${ci(row.ci)} points`];
  tr.innerHTML = `<th scope="row"><strong>${label}</strong><small>E = ${row.execution}</small></th>` + values.map((v,i) => `<td data-label="${['Robots that never wait','Robots with success kept','Δ vs one robot'][i]}"><span>${v}</span></td>`).join('');
  $('deployment-rows').append(tr);
});
text('throughput', `${f(p.throughput)}× successful tasks per GPU-hour at ${p.robots} robots`);
text('te-delta', `${f(p.teDelta)} ${ci(p.teCI)} points`);
text('te-saving', `${p.gpuSavingPercent}%`);
[
  'Simulation only. These results do not establish performance on physical robots.',
  `Service latencies are injected. The 4090-class service is emulated on H200 by padding to ${p.serviceMs} ms per call.`,
  `${p.deploymentEpisodes} episodes per deployment cell; intervals reflect the tested tasks and initial states.`,
  'Slow-device execution lengths were chosen from single-robot runs, not by the planner. Their single-robot baselines ran on a second machine.'
].forEach(value => {const li = document.createElement('li'); li.textContent = value; $('limitations-list').append(li);});
text('bibtex-code', `@misc{tbd${p.year}matching,
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
  const over=end>p.horizon, color=over?'#c94436':'#2478d4', group=$('window-overlay');
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
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { $('teaser-video').autoplay=false; $('teaser-video').pause(); }
