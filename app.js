/* Page router and page renderers. All data comes from the REST API - nothing is hard-coded. */
const view = document.getElementById('view');
let unsubscribe = null;
let renderToken = 0;

const CATEGORIES = [
  ['ORDER_TRACKING', 'Order Tracking'], ['PAYMENT_ISSUE', 'Payment Issue'], ['RETURN_AND_REFUND', 'Return and Refund'],
  ['PRODUCT_INQUIRY', 'Product Inquiry'], ['DELIVERY_DELAY', 'Delivery Delay'], ['ACCOUNT_ISSUE', 'Account Issue'], ['OTHER', 'Other']
];
const catOptions = (withAll, allLabel) => (withAll ? [{ value: '', label: allLabel }] : []).concat(CATEGORIES.map(c => ({ value: c[0], label: c[1] })));
const loading = (t) => '<div class="loading">' + (t || 'Loading...') + '</div>';
const errorBox = (e) => '<div class="error-box" role="alert">' + esc(e.message || e) + '</div>';
const head = (title, sub, actions) => '<div class="page-head"><div><h1>' + esc(title) + '</h1><p>' + esc(sub || '') + '</p></div><div class="btn-row">' + (actions || '') + '</div></div>';

const pages = { dashboard: pageDashboard, queries: pageQueries, agents: pageAgents, simulator: pageSimulator, analysis: pageAnalysis, history: pageHistory, settings: pageSettings };

async function route() {
  const name = (location.hash.replace('#/', '') || 'dashboard').split('?')[0];
  const page = pages[name] ? name : 'dashboard';
  document.querySelectorAll('#nav a').forEach(a => { a.classList.toggle('active', a.dataset.page === page); a.toggleAttribute('aria-current', a.dataset.page === page); });
  if (unsubscribe) { unsubscribe(); unsubscribe = null; }
  Charts.destroyAll();
  const token = ++renderToken;
  view.innerHTML = loading();
  try { await pages[page](token); }
  catch (e) { if (token === renderToken) view.innerHTML = head('Something went wrong') + errorBox(e) + '<button class="btn" onclick="route()">Retry</button>'; }
}
window.addEventListener('hashchange', route);

/* debounce live re-rendering that is driven by simulation updates */
function liveRender(fn) {
  let pending = false;
  unsubscribe = Sim.subscribe(() => { if (pending) return; pending = true; Promise.resolve().then(async () => { pending = false; try { await fn(); } catch (e) { toast(e.message, 'error'); } }); });
}

/* ================================================================ DASHBOARD */
async function pageDashboard(token) {
  await Sim.load();
  const draw = async () => {
    const d = await Api.dashboard();
    if (token !== renderToken) return;
    const m = d.metrics || {};
    const sim = d.simulation;
    const card = (l, v, s) => '<div class="card"><div class="label">' + l + '</div><div class="value">' + v + '</div>' + (s ? '<div class="sub">' + s + '</div>' : '') + '</div>';
    const noData = d.totalQueries === 0 && d.totalAgents === 0;
    view.innerHTML = head('Dashboard', 'Live overview of the customer service queue and the Round Robin simulation') +
      (noData ? '<div class="info-box">No data yet. Add queries and agents, or <button class="btn btn-sm" id="dashSample">load the sample dataset</button>.</div>' : '') +
      (sim && sim.message ? '<div class="warn-box" role="alert">' + esc(sim.message) + '</div>' : '') +
      '<div class="cards">' +
      card('Total queries', d.totalQueries) + card('Waiting queries', d.waitingQueries, 'in the ready queue') +
      card('Executing now', d.currentQueryId != null ? 'Q' + d.currentQueryId : 'None', d.currentQueryId != null ? 'latest slice' : '') +
      card('Completed', d.completedQueries) + card('Available agents', d.availableAgents, 'of ' + d.totalAgents + ' (' + d.busyAgents + ' busy, ' + d.offlineAgents + ' offline)') +
      card('Avg waiting time', fmt(m.avgWaitingTime)) + card('Avg turnaround', fmt(m.avgTurnaroundTime)) +
      card('Avg response time', fmt(m.avgResponseTime)) + card('Agent utilization', m.utilization == null ? 'N/A' : fmt(m.utilization) + ' %') +
      card('Context switches', m.contextSwitches != null ? m.contextSwitches : 'N/A') + card('Time quantum', sim ? sim.timeQuantum : Sim.config.timeQuantum) +
      card('Simulation', sim ? badge(sim.status) : 'None', sim ? 'time ' + sim.simulatedTime : '') + '</div>' +
      '<div class="panel"><h2>Simulation control</h2>' + controlsHtml() + '<p class="hint">Full detail on the <a href="#/simulator">Scheduler Simulator</a> page.</p></div>' +
      '<div class="grid-2"><div class="panel"><h2>Query status distribution</h2><div class="chart-box"><canvas id="statusChart"></canvas></div></div>' +
      '<div class="panel"><h2>Ready queue (FIFO)</h2><div class="queue" id="dashQueue"></div>' +
      '<h2 style="margin-top:18px">Service agents</h2><div class="agent-list">' + (d.agents.length ? d.agents.map(a =>
        '<div class="agent-row"><div><b>' + esc(a.name) + '</b> <small>Agent ' + a.id + ' - ' + esc(a.skillLabel) + '</small></div>' + badge(a.currentStatus) + '</div>').join('') : '<div class="empty">No agents yet.</div>') + '</div></div></div>' +
      '<div class="panel"><h2>Execution timeline</h2><div id="dashGantt"></div></div>' +
      '<div class="panel"><h2>Recent scheduling events</h2><div class="table-wrap" id="dashEvents"></div></div>';
    const sb = document.getElementById('dashSample');
    if (sb) sb.onclick = async () => { await Sim.loadSample(false); };
    Charts.statusChart('statusChart', d.statusCounts);
    renderQueue(document.getElementById('dashQueue'), sim ? sim.readyQueue : []);
    Gantt.render(document.getElementById('dashGantt'), Sim.events);
    document.getElementById('dashEvents').innerHTML = d.recentEvents.length ? '<table><thead><tr><th>Query</th><th>Agent</th><th>Type</th><th>Start</th><th>End</th><th>Duration</th><th>Remaining</th></tr></thead><tbody>' +
      d.recentEvents.map(e => '<tr><td>' + esc(e.queryLabel || '-') + '</td><td>' + (e.agentId != null ? e.agentId : '-') + '</td><td>' + esc(e.eventType) + '</td><td>' + e.startTime + '</td><td>' + e.endTime + '</td><td>' + e.allocatedDuration + '</td><td>' + fmt(e.remainingTimeAfterExecution) + '</td></tr>').join('') + '</tbody></table>' :
      '<div class="empty">No events yet.</div>';
    bindControls(view);
  };
  await draw();
  liveRender(draw);
}

/* ================================================================ QUERIES */
async function pageQueries(token) {
  const f = { id: '', name: '', category: '', status: '' };
  const draw = async () => {
    let rows;
    try { rows = await Api.queries(f); } catch (e) { view.querySelector('#qTable').innerHTML = errorBox(e); return; }
    if (token !== renderToken) return;
    view.querySelector('#qTable').innerHTML = rows.length ? '<div class="table-wrap"><table><thead><tr><th>ID</th><th>Customer</th><th>Email</th><th>Category</th><th>Description</th><th>Arrival</th><th>Burst</th><th>Remaining</th><th>Status</th><th>Actions</th></tr></thead><tbody>' +
      rows.map(q => '<tr><td>' + esc(q.label) + '</td><td>' + esc(q.customerName) + '</td><td>' + esc(q.customerEmail) + '</td><td>' + esc(q.categoryLabel) + '</td><td>' + esc(q.description) + '</td><td>' + q.arrivalTime + '</td><td>' + q.burstTime + '</td><td>' +
        '<div>' + q.remainingTime + '</div><div class="progress" aria-hidden="true"><div style="width:' + (q.burstTime ? (100 * (q.burstTime - q.remainingTime) / q.burstTime) : 0) + '%"></div></div></td><td>' + badge(q.status) + '</td><td class="btn-row">' +
        '<button class="btn btn-sm" data-edit="' + q.id + '">Edit</button><button class="btn btn-sm" data-del="' + q.id + '">Delete</button></td></tr>').join('') + '</tbody></table></div>' :
      '<div class="empty">No queries match. Add a query or load the sample dataset in Settings.</div>';
    view.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => editQuery(rows.find(r => r.id == b.dataset.edit)));
    view.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
      const q = rows.find(r => r.id == b.dataset.del);
      if (!(await confirmDialog('Delete ' + q.label + '?', 'Delete the query from ' + q.customerName + '. Existing simulation history is not affected.', 'Delete'))) return;
      try { await Api.deleteQuery(q.id); toast('Query deleted.', 'success'); draw(); } catch (e) { toast(e.message, 'error'); }
    });
  };
  const queryFields = (q) => [
    { name: 'customerName', label: 'Customer name', required: true, value: q ? q.customerName : '' },
    { name: 'customerEmail', label: 'Customer email', required: true, type: 'email', value: q ? q.customerEmail : '' },
    { name: 'category', label: 'Category', type: 'select', options: catOptions(false), value: q ? q.category : 'OTHER' },
    { name: 'description', label: 'Description', type: 'textarea', required: true, value: q ? q.description : '' },
    { name: 'arrivalTime', label: 'Arrival time (simulated minutes)', type: 'number', min: 0, required: true, value: q ? q.arrivalTime : 0 },
    { name: 'burstTime', label: 'Burst time (estimated handling time)', type: 'number', min: 1, required: true, value: q ? q.burstTime : 1 }
  ].concat(q ? [{ name: 'cancelled', label: 'Cancelled (excluded from scheduling)', type: 'checkbox', value: q.status === 'CANCELLED' }] : []);
  const payload = (v) => {
    if (!v.customerName.trim()) throw new Error('Customer name is required.');
    if (!v.description.trim()) throw new Error('Query description is required.');
    const a = Number(v.arrivalTime), b = Number(v.burstTime);
    if (v.arrivalTime === '' || !Number.isInteger(a) || a < 0) throw new Error('Arrival time must be a non-negative whole number.');
    if (v.burstTime === '' || !Number.isInteger(b) || b < 1) throw new Error('Burst time must be a positive whole number.');
    return { customerName: v.customerName, customerEmail: v.customerEmail, category: v.category, description: v.description, arrivalTime: a, burstTime: b };
  };
  const addQuery = () => formDialog('Add customer query', queryFields(null), async (v) => { await Api.createQuery(payload(v)); toast('Query added.', 'success'); draw(); });
  const editQuery = (q) => formDialog('Edit ' + q.label, queryFields(q), async (v) => {
    const body = payload(v);
    if (v.cancelled && q.status !== 'CANCELLED') body.status = 'CANCELLED';
    else if (!v.cancelled && q.status === 'CANCELLED') body.status = 'NEW';
    await Api.updateQuery(q.id, body); toast('Query updated.', 'success'); draw();
  });
  view.innerHTML = head('Customer Queries', 'Each query is a process: arrival time and burst time drive the scheduler', '<button class="btn btn-primary" id="addQ">Add query</button>') +
    '<div class="panel"><div class="filters">' +
    '<label class="field">ID<input id="fId" type="number" min="1" style="width:80px"></label>' +
    '<label class="field">Customer name<input id="fName" type="search"></label>' +
    '<label class="field">Category<select id="fCat">' + catOptions(true, 'All').map(o => '<option value="' + o.value + '">' + esc(o.label) + '</option>').join('') + '</select></label>' +
    '<label class="field">Status<select id="fStatus"><option value="">All</option>' + ['NEW', 'WAITING', 'RUNNING', 'COMPLETED', 'CANCELLED'].map(s => '<option>' + s + '</option>').join('') + '</select></label>' +
    '</div><div id="qTable">' + loading() + '</div></div>';
  document.getElementById('addQ').onclick = addQuery;
  const bind = (id, key, ev) => document.getElementById(id).addEventListener(ev, e => { f[key] = e.target.value; draw(); });
  bind('fId', 'id', 'input'); bind('fName', 'name', 'input'); bind('fCat', 'category', 'change'); bind('fStatus', 'status', 'change');
  await draw();
}

/* ================================================================ AGENTS */
async function pageAgents(token) {
  const draw = async () => {
    let rows;
    try { rows = await Api.agents(); } catch (e) { view.querySelector('#aTable').innerHTML = errorBox(e); return; }
    if (token !== renderToken) return;
    view.querySelector('#aTable').innerHTML = rows.length ? '<div class="table-wrap"><table><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Skill category</th><th>Active</th><th>Status</th><th>Slices served</th><th>Service time</th><th>Actions</th></tr></thead><tbody>' +
      rows.map(a => '<tr><td>' + a.id + '</td><td>' + esc(a.name) + '</td><td>' + esc(a.email) + '</td><td>' + esc(a.skillLabel) + '</td><td>' + (a.active ? 'Yes' : 'No') + '</td><td>' + badge(a.currentStatus) + '</td><td>' + a.assignedSlices + '</td><td>' + a.totalServiceTime + '</td><td class="btn-row">' +
        '<button class="btn btn-sm" data-edit="' + a.id + '">Edit</button>' +
        (a.active ? '<button class="btn btn-sm" data-off="' + a.id + '">Deactivate</button>' : '<button class="btn btn-sm" data-on="' + a.id + '">Activate</button>') + '</td></tr>').join('') + '</tbody></table></div>' :
      '<div class="empty">No agents yet. Add an agent or load the sample dataset in Settings.</div>';
    view.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => form(rows.find(r => r.id == b.dataset.edit)));
    view.querySelectorAll('[data-off]').forEach(b => b.onclick = async () => {
      const a = rows.find(r => r.id == b.dataset.off);
      if (!(await confirmDialog('Deactivate ' + a.name + '?', 'The agent stops receiving slices. History stays intact. A running simulation pauses if no agent is left.', 'Deactivate'))) return;
      try { await Api.deactivateAgent(a.id); toast('Agent deactivated.', 'success'); draw(); } catch (e) { toast(e.message, 'error'); }
    });
    view.querySelectorAll('[data-on]').forEach(b => b.onclick = async () => {
      const a = rows.find(r => r.id == b.dataset.on);
      try { await Api.updateAgent(a.id, { name: a.name, email: a.email, skillCategory: a.skillCategory, active: true }); toast('Agent activated.', 'success'); draw(); } catch (e) { toast(e.message, 'error'); }
    });
  };
  const form = (a) => formDialog(a ? 'Edit agent' : 'Add agent', [
    { name: 'name', label: 'Name', required: true, value: a ? a.name : '' },
    { name: 'email', label: 'Email', type: 'email', required: true, value: a ? a.email : '' },
    { name: 'skill', label: 'Skill category', type: 'select', options: catOptions(true, 'All categories'), value: a && a.skillCategory ? a.skillCategory : '' },
    { name: 'active', label: 'Active', type: 'checkbox', value: a ? a.active : true }
  ], async (v) => {
    if (!v.name.trim()) throw new Error('Agent name is required.');
    const body = { name: v.name, email: v.email, skillCategory: v.skill || null, active: v.active };
    if (a) await Api.updateAgent(a.id, body); else await Api.createAgent(body);
    toast(a ? 'Agent updated.' : 'Agent added.', 'success'); draw();
  });
  view.innerHTML = head('Service Agents', 'Agents serve one slice at a time; the lowest-ID active and available agent is chosen', '<button class="btn btn-primary" id="addA">Add agent</button>') +
    '<div class="info-box">Skill category is informational: this simulation assigns agents by availability only.</div><div class="panel" id="aTable">' + loading() + '</div>';
  document.getElementById('addA').onclick = () => form(null);
  await draw();
}

/* ================================================================ SIMULATOR */
async function pageSimulator(token) {
  await Sim.load();
  const draw = () => {
    if (token !== renderToken) return;
    const s = Sim.state;
    const q = s ? s.queries : [];
    const last = s ? s.lastStep : null;
    const cfg = Sim.config;
    const presets = cfg.quantumPresets;
    const locked = Sim.active && s.stepsExecuted > 0;
    view.innerHTML = head('Scheduler Simulator', 'Step through Round Robin one time slice at a time', '') +
      '<div class="info-box">This simulation shows fair allocation of service time; it is not a model of agents working in parallel. ' +
      'Time is simulated minutes. A <b>context switch</b> is counted when a slice serves a different query than the previous slice (the first dispatch is not counted). ' +
      'Utilization = execution time / elapsed time, so idle periods lower it.</div>' +
      (s && s.message ? '<div class="warn-box" role="alert">' + esc(s.message) + '</div>' : '') +
      '<div class="panel"><div class="filters">' +
      '<label class="field">Time quantum<select id="simQ"' + (locked ? ' disabled' : '') + '>' + presets.map(p => '<option' + (p == Sim.selectedQuantum ? ' selected' : '') + '>' + p + '</option>').join('') + (presets.includes(Sim.selectedQuantum) ? '' : '<option selected>' + Sim.selectedQuantum + '</option>') + '</select></label>' +
      '<label class="field">Playback speed (ms per step)<input id="simSpeed" type="range" min="100" max="3000" step="100" value="' + Sim.speed + '"><span class="hint" id="simSpeedV">' + Sim.speed + ' ms</span></label>' +
      '<div>' + (s ? badge(s.status) : badge('NONE')) + ' <b>Time ' + (s ? s.simulatedTime : 0) + '</b> &nbsp; ' + (s ? s.completedQueries + '/' + s.totalQueries + ' completed' : '') + '</div></div>' +
      controlsHtml() + (q.length === 0 && !s ? '<p class="hint">No simulation yet. Load data in Settings, then press Start.</p>' : '') + '</div>' +
      '<div class="grid-2"><div class="panel"><h2>Ready queue (front &rarr; end)</h2><div class="queue" id="simQueue"></div>' +
      '<p class="hint">Arrivals during a slice join the queue before the preempted query is requeued.</p></div>' +
      '<div class="panel"><h2>Latest scheduling step</h2>' + stepHtml(last) + '</div></div>' +
      '<div class="panel"><h2>Execution timeline (Gantt chart)</h2><div id="simGantt"></div></div>' +
      '<div class="panel"><h2>Queries in this run</h2>' + queryStateTable(q, last) + '</div>' +
      '<div class="panel"><h2>Scheduling event log</h2><div class="table-wrap">' + eventTable(Sim.events) + '</div></div>' +
      (s && s.status === 'COMPLETED' ? '<div class="panel"><h2>Final metrics</h2>' + metricsCards(s.metrics) + '<p class="hint">See Performance Analysis for per-query results and quantum comparison.</p></div>' : '');
    renderQueue(document.getElementById('simQueue'), s ? s.readyQueue : []);
    Gantt.render(document.getElementById('simGantt'), Sim.events);
    document.getElementById('simQ').onchange = (e) => { Sim.selectedQuantum = Number(e.target.value); };
    const sp = document.getElementById('simSpeed');
    sp.oninput = () => { cfg.simulationSpeed = Number(sp.value); document.getElementById('simSpeedV').textContent = sp.value + ' ms'; };
    bindControls(view);
  };
  draw();
  liveRender(draw);
}
function stepHtml(st) {
  if (!st) return '<div class="empty">No step executed yet.</div>';
  const cell = (l, v) => '<div><span>' + l + '</span><b>' + v + '</b></div>';
  return '<p>' + esc(st.message || '') + '</p><div class="step-detail">' +
    cell('Outcome', st.outcome) + cell('Query', st.queryId != null ? 'Q' + st.queryId : '-') + cell('Agent', st.agentId != null ? st.agentId : '-') +
    cell('Time', st.timeBefore + ' &rarr; ' + st.timeAfter) + cell('Quantum', st.quantum) + cell('Slice', st.sliceDuration) +
    cell('Remaining before', fmt(st.remainingBefore)) + cell('Remaining after', fmt(st.remainingAfter)) + '</div>';
}
function queryStateTable(q, last) {
  if (!q.length) return '<div class="empty">No queries in the dataset.</div>';
  return '<div class="table-wrap"><table><thead><tr><th>Query</th><th>Customer</th><th>Arrival</th><th>Burst</th><th>Remaining</th><th>Status</th><th>First start</th><th>Completion</th><th>Waiting</th><th>Turnaround</th><th>Response</th></tr></thead><tbody>' +
    q.map(x => '<tr class="' + (last && last.queryId === x.queryId ? 'highlight' : '') + '"><td>' + esc(x.label) + '</td><td>' + esc(x.customerName) + '</td><td>' + x.arrivalTime + '</td><td>' + x.burstTime + '</td><td><div>' + x.remainingTime + '</div><div class="progress" aria-hidden="true"><div style="width:' + (100 * (x.burstTime - x.remainingTime) / x.burstTime) + '%"></div></div></td><td>' + badge(x.status) + '</td><td>' + fmt(x.firstStartTime) + '</td><td>' + fmt(x.completionTime) + '</td><td>' + fmt(x.waitingTime) + '</td><td>' + fmt(x.turnaroundTime) + '</td><td>' + fmt(x.responseTime) + '</td></tr>').join('') + '</tbody></table></div>';
}
function eventTable(ev) {
  if (!ev || !ev.length) return '<div class="empty">No events yet.</div>';
  return '<table><thead><tr><th>#</th><th>Type</th><th>Query</th><th>Agent</th><th>Start</th><th>End</th><th>Duration</th><th>Remaining after</th></tr></thead><tbody>' +
    ev.map((e, i) => '<tr><td>' + (i + 1) + '</td><td>' + esc(e.eventType) + '</td><td>' + esc(e.queryLabel || '-') + '</td><td>' + (e.agentId != null ? e.agentId : '-') + '</td><td>' + e.startTime + '</td><td>' + e.endTime + '</td><td>' + e.allocatedDuration + '</td><td>' + fmt(e.remainingTimeAfterExecution) + '</td></tr>').join('') + '</tbody></table>';
}
function metricsCards(m) {
  const c = (l, v) => '<div class="card"><div class="label">' + l + '</div><div class="value">' + v + '</div></div>';
  return '<div class="cards">' + c('Avg waiting time', fmt(m.avgWaitingTime)) + c('Avg turnaround time', fmt(m.avgTurnaroundTime)) + c('Avg response time', fmt(m.avgResponseTime)) +
    c('Agent utilization', m.utilization == null ? 'N/A' : fmt(m.utilization) + ' %') + c('Context switches', m.contextSwitches) + c('Elapsed time', m.elapsedTime) + '</div>';
}

/* ================================================================ ANALYSIS */
async function pageAnalysis(token) {
  const cur = await Api.currentSim();
  const results = cur ? await Api.simResults(cur.id) : [];
  const cfg = await Api.config();
  if (token !== renderToken) return;
  const presets = cfg.quantumPresets;
  view.innerHTML = head('Performance Analysis', cur ? 'Run #' + cur.id + ' (' + cur.status + ', quantum ' + cur.timeQuantum + ')' : 'No simulation yet') +
    (cur ? metricsCards(cur.metrics) : '<div class="info-box">Run a simulation first to see its metrics.</div>') +
    '<div class="panel"><h2>Per-query results' + (cur && cur.status !== 'COMPLETED' ? ' (completed queries so far)' : '') + '</h2><div class="table-wrap">' + resultTable(results) + '</div>' +
    '<p class="hint">Waiting = turnaround - burst. Turnaround = completion - arrival. Response = first start - arrival.</p></div>' +
    '<div class="panel"><h2>Compare time quantum values</h2><p class="hint">Runs independent what-if simulations on the current dataset. Nothing is saved and the history is not changed.</p>' +
    '<div class="filters">' + presets.map(p => '<label><input type="checkbox" class="cq" value="' + p + '" checked> ' + p + '</label>').join(' ') +
    '<label class="field">Custom<input id="cqCustom" type="number" min="1" style="width:90px"></label><button class="btn btn-primary" id="runCmp">Run comparison</button></div>' +
    '<div id="cmpOut"></div></div>';
  document.getElementById('runCmp').onclick = async () => {
    const qs = [...document.querySelectorAll('.cq:checked')].map(c => Number(c.value));
    const custom = document.getElementById('cqCustom').value;
    if (custom !== '') { const n = Number(custom); if (!Number.isInteger(n) || n < 1) { toast('Custom quantum must be a positive whole number.', 'error'); return; } qs.push(n); }
    const uniq = [...new Set(qs)].sort((a, b) => a - b);
    if (!uniq.length) { toast('Select at least one quantum value.', 'error'); return; }
    const out = document.getElementById('cmpOut');
    out.innerHTML = loading('Running simulations...');
    try {
      const rows = await Api.compare(uniq);
      out.innerHTML = '<div class="table-wrap"><table><thead><tr><th>Quantum</th><th>Avg waiting</th><th>Avg turnaround</th><th>Avg response</th><th>Context switches</th><th>Utilization</th></tr></thead><tbody>' +
        rows.map(r => '<tr><td>' + r.timeQuantum + '</td><td>' + fmt(r.metrics.avgWaitingTime) + '</td><td>' + fmt(r.metrics.avgTurnaroundTime) + '</td><td>' + fmt(r.metrics.avgResponseTime) + '</td><td>' + r.metrics.contextSwitches + '</td><td>' + fmt(r.metrics.utilization) + ' %</td></tr>').join('') + '</tbody></table></div>' +
        '<div class="grid-2" style="margin-top:14px"><div class="chart-box"><canvas id="cmpA"></canvas></div><div class="chart-box"><canvas id="cmpB"></canvas></div></div>' +
        '<p class="hint">A smaller quantum improves response time but causes more context switches; a very large quantum behaves like first-come-first-served.</p>';
      const labels = rows.map(r => String(r.timeQuantum));
      Charts.barChart('cmpA', labels, [{ label: 'Avg waiting', data: rows.map(r => r.metrics.avgWaitingTime), backgroundColor: '#f59e0b' }, { label: 'Avg turnaround', data: rows.map(r => r.metrics.avgTurnaroundTime), backgroundColor: '#2563eb' }, { label: 'Avg response', data: rows.map(r => r.metrics.avgResponseTime), backgroundColor: '#16a34a' }], 'Time units');
      Charts.barChart('cmpB', labels, [{ label: 'Context switches', data: rows.map(r => r.metrics.contextSwitches), backgroundColor: '#7c3aed' }], 'Count');
    } catch (e) { out.innerHTML = errorBox(e); }
  };
}
function resultTable(rows) {
  if (!rows.length) return '<div class="empty">No completed queries yet.</div>';
  return '<table><thead><tr><th>Query</th><th>Customer</th><th>Arrival</th><th>Burst</th><th>First start</th><th>Completion</th><th>Waiting</th><th>Turnaround</th><th>Response</th></tr></thead><tbody>' +
    rows.map(r => '<tr><td>' + esc(r.label) + '</td><td>' + esc(r.customerName) + '</td><td>' + r.arrivalTime + '</td><td>' + r.burstTime + '</td><td>' + r.firstStartTime + '</td><td>' + r.completionTime + '</td><td>' + r.waitingTime + '</td><td>' + r.turnaroundTime + '</td><td>' + r.responseTime + '</td></tr>').join('') + '</tbody></table>';
}

/* ================================================================ HISTORY */
async function pageHistory(token) {
  const rows = await Api.history();
  if (token !== renderToken) return;
  view.innerHTML = head('Simulation History', 'Every run is kept; completed runs are never changed by later edits') +
    '<div class="panel">' + (rows.length ? '<div class="table-wrap"><table><thead><tr><th>Run</th><th>Status</th><th>Quantum</th><th>Time</th><th>Completed</th><th>Avg waiting</th><th>Avg turnaround</th><th>Avg response</th><th>Ctx switches</th><th>Utilization</th><th>Created</th><th></th></tr></thead><tbody>' +
      rows.map(r => '<tr><td>#' + r.id + '</td><td>' + badge(r.status) + '</td><td>' + r.timeQuantum + '</td><td>' + r.simulatedTime + '</td><td>' + r.completedQueries + '/' + r.totalQueries + '</td><td>' + fmt(r.metrics.avgWaitingTime) + '</td><td>' + fmt(r.metrics.avgTurnaroundTime) + '</td><td>' + fmt(r.metrics.avgResponseTime) + '</td><td>' + r.metrics.contextSwitches + '</td><td>' + (r.metrics.utilization == null ? 'N/A' : fmt(r.metrics.utilization) + ' %') + '</td><td>' + esc(new Date(r.createdAt).toLocaleString()) + '</td><td><button class="btn btn-sm" data-view="' + r.id + '">View</button></td></tr>').join('') + '</tbody></table></div>' : '<div class="empty">No simulations have been run yet.</div>') + '</div><div id="histDetail"></div>';
  view.querySelectorAll('[data-view]').forEach(b => b.onclick = async () => {
    const box = document.getElementById('histDetail');
    box.innerHTML = loading();
    try {
      const id = b.dataset.view;
      const [ev, res] = await Promise.all([Api.simEvents(id), Api.simResults(id)]);
      box.innerHTML = '<div class="panel"><h2>Run #' + id + ' timeline</h2><div id="hG"></div></div><div class="panel"><h2>Run #' + id + ' results</h2><div class="table-wrap">' + resultTable(res) + '</div></div>';
      Gantt.render(document.getElementById('hG'), ev);
      box.scrollIntoView({ behavior: 'smooth' });
    } catch (e) { box.innerHTML = errorBox(e); }
  });
}

/* ================================================================ SETTINGS */
async function pageSettings(token) {
  const cfg = await Api.config();
  if (token !== renderToken) return;
  view.innerHTML = head('Settings', 'Scheduling configuration (saved in the database)') +
    '<div class="panel"><form id="cfgForm" class="form-grid" style="max-width:420px" novalidate>' +
    '<label class="field">Default time quantum<select id="cQ">' + cfg.quantumPresets.map(p => '<option' + (p == cfg.timeQuantum ? ' selected' : '') + '>' + p + '</option>').join('') + (cfg.quantumPresets.includes(cfg.timeQuantum) ? '' : '<option selected>' + cfg.timeQuantum + '</option>') + '<option value="custom">Custom...</option></select></label>' +
    '<label class="field" id="cCustomWrap" hidden>Custom quantum<input id="cCustom" type="number" min="1"></label>' +
    '<label class="field">Simulation speed: delay between steps (ms)<input id="cSpeed" type="number" min="100" max="5000" step="100" value="' + cfg.simulationSpeed + '"><span class="hint">Only affects the animation, never the result.</span></label>' +
    '<label class="field">Scheduling mode<select id="cMode" disabled><option>ROUND_ROBIN</option></select></label>' +
    '<div class="hint">Agents: ' + cfg.activeAgents + ' active of ' + cfg.totalAgents + ' (manage them on the <a href="#/agents">Service Agents</a> page).</div>' +
    '<p class="form-error" id="cErr" hidden role="alert"></p><div><button class="btn btn-primary" type="submit">Save settings</button></div></form></div>' +
    '<div class="panel"><h2>Sample data</h2><p>Loads the demonstration dataset: 5 queries, 3 agents, quantum 2. Simulation history is kept.</p><button class="btn" id="loadSample">Load sample dataset</button></div>';
  const sel = document.getElementById('cQ');
  sel.onchange = () => { document.getElementById('cCustomWrap').hidden = sel.value !== 'custom'; };
  document.getElementById('cfgForm').onsubmit = async (ev) => {
    ev.preventDefault();
    const err = document.getElementById('cErr'); err.hidden = true;
    const q = sel.value === 'custom' ? Number(document.getElementById('cCustom').value) : Number(sel.value);
    const speed = Number(document.getElementById('cSpeed').value);
    try {
      if (!Number.isInteger(q) || q < 1) throw new Error('Time quantum must be a positive whole number.');
      if (!Number.isInteger(speed) || speed < 100 || speed > 5000) throw new Error('Speed must be between 100 and 5000 ms.');
      await Api.saveConfig({ timeQuantum: q, simulationSpeed: speed, schedulingMode: 'ROUND_ROBIN' });
      toast('Settings saved.', 'success'); pageSettings(token);
    } catch (e) { err.textContent = e.message; err.hidden = false; }
  };
  document.getElementById('loadSample').onclick = async () => {
    try {
      let replace = false;
      try { await Api.loadSample(false); toast('Sample dataset loaded.', 'success'); return; }
      catch (e) {
        if (e.status !== 409) throw e;
        if (/running or paused/.test(e.message)) throw e;
        if (!(await confirmDialog('Replace existing data?', e.message + ' Replace all current queries and agents with the sample dataset?', 'Replace'))) return;
        replace = true;
      }
      const r = await Api.loadSample(replace);
      toast(r.message, 'success');
    } catch (e) { toast(e.message, 'error'); }
  };
}

route();
