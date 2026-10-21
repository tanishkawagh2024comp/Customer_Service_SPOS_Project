/* Gantt chart, shared UI helpers and the simulation controller (Sim) used by the Dashboard and Simulator pages. */
const PALETTE = ['#2563eb', '#db2777', '#059669', '#d97706', '#7c3aed', '#0891b2', '#dc2626', '#65a30d', '#c026d3', '#475569'];
const colorFor = (id) => PALETTE[(Number(id) - 1 + PALETTE.length * 1000) % PALETTE.length];

function esc(v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
const fmt = (v, digits = 2) => (v == null ? 'N/A' : (Number.isInteger(v) ? String(v) : Number(v).toFixed(digits)));
const badge = (status) => '<span class="badge b-' + esc(String(status).toLowerCase()) + '">' + esc(status) + '</span>';

/* ---------------------------------------------------------------- Gantt chart */
const Gantt = {
  /** Renders the timeline into `el`. Idle periods are hatched grey; the newest segment is outlined. */
  render(el, events, queryLabel) {
    if (!events || !events.length) { el.innerHTML = '<div class="empty">No execution yet. Start or step the simulation to build the timeline.</div>'; return; }
    const total = Math.max(...events.map(e => e.endTime));
    const unitPx = Math.max(26, Math.min(60, Math.floor(900 / Math.max(total, 1))));
    const width = Math.max(total * unitPx, 320);
    let segs = '';
    events.forEach((e, i) => {
      const left = (e.startTime / total) * 100, w = ((e.endTime - e.startTime) / total) * 100;
      const latest = i === events.length - 1 ? ' latest' : '';
      if (e.eventType === 'IDLE') {
        const tip = 'Idle\nTime ' + e.startTime + ' - ' + e.endTime + '\nNo query was ready';
        segs += '<div class="seg idle' + latest + '" tabindex="0" style="left:' + left + '%;width:' + w + '%" data-tip="' + esc(tip) + '" aria-label="' + esc(tip.replace(/\n/g, ', ')) + '">Idle</div>';
      } else {
        const tip = 'Query ' + e.queryLabel + '\nAgent ' + e.agentId + '\nTime ' + e.startTime + ' - ' + e.endTime +
          '\nDuration ' + e.allocatedDuration + '\nRemaining after: ' + e.remainingTimeAfterExecution +
          '\n' + (e.eventType === 'COMPLETION' ? 'Completed' : 'Requeued');
        segs += '<div class="seg' + latest + '" tabindex="0" style="left:' + left + '%;width:' + w + '%;background:' + colorFor(e.queryId) + '" data-tip="' + esc(tip) + '" aria-label="' + esc(tip.replace(/\n/g, ', ')) + '">' + esc(e.queryLabel) + '</div>';
      }
    });
    const step = total <= 30 ? 1 : (total <= 80 ? 5 : 10);
    let ticks = '';
    for (let t = 0; t <= total; t += step) ticks += '<span style="left:' + (t / total) * 100 + '%">' + t + '</span>';
    const ids = [...new Set(events.filter(e => e.queryId != null).map(e => e.queryId))].sort((a, b) => a - b);
    const legend = ids.map(id => '<span><i style="background:' + colorFor(id) + '"></i>Q' + id + '</span>').join('') + '<span><i style="background:#d1d5db"></i>Idle</span>';
    el.innerHTML = '<div class="gantt-scroll"><div style="width:' + width + 'px"><div class="gantt" role="img" aria-label="Scheduling timeline">' + segs + '</div><div class="axis">' + ticks + '</div></div></div><div class="legend">' + legend + '</div>';
  }
};

/* ---------------------------------------------------------------- shared simulation controller */
const Sim = {
  state: null, events: [], config: null,
  playing: false, busy: false, selectedQuantum: 2, listeners: new Set(), timer: null,

  subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); },
  notify() { this.listeners.forEach(fn => { try { fn(); } catch (e) { console.error(e); } }); },
  get active() { return !!this.state && ['CREATED', 'RUNNING', 'PAUSED'].includes(this.state.status); },
  get speed() { return (this.config && this.config.simulationSpeed) || 800; },

  async load() {
    this.config = await Api.config();
    this.selectedQuantum = this.config.timeQuantum;
    const cur = await Api.currentSim();
    this.state = cur;
    // After a page reload nothing is animating, so a server-side RUNNING run is shown as PAUSED.
    if (this.state && this.state.status === 'RUNNING' && !this.playing) this.state = await Api.simAction(this.state.id, 'pause');
    this.events = this.state ? await Api.simEvents(this.state.id) : [];
    if (this.state && this.active) this.selectedQuantum = this.state.timeQuantum;
    this.notify();
  },

  async refreshEvents() { this.events = this.state ? await Api.simEvents(this.state.id) : []; },

  /** Runs one API action, shows errors, keeps the UI consistent. */
  async guard(fn) {
    if (this.busy) return;
    this.busy = true; this.notify();
    try { await fn(); }
    catch (e) {
      this.stop();
      toast(e.message, 'error');
      if (this.state) { try { this.state = await Api.sim(this.state.id); await this.refreshEvents(); } catch (e2) { /* keep old state */ } }
    }
    finally { this.busy = false; this.notify(); }
  },

  stop() { this.playing = false; if (this.timer) { clearTimeout(this.timer); this.timer = null; } },

  async start() {
    await this.guard(async () => {
      const needNew = !this.state || ['COMPLETED', 'CANCELLED'].includes(this.state.status) ||
        (this.state.status === 'CREATED' && this.state.timeQuantum !== this.selectedQuantum);
      if (needNew) { this.state = await Api.createSim(this.selectedQuantum); this.events = []; }
      if (this.state.status === 'CREATED') this.state = await Api.simAction(this.state.id, 'start');
      else if (this.state.status === 'PAUSED') this.state = await Api.simAction(this.state.id, 'resume');
      await this.refreshEvents();
      this.playing = true;
    });
    if (this.playing) this.scheduleNext();
  },

  async resume() { await this.start(); },

  async pause() {
    this.stop();
    await this.guard(async () => {
      if (this.state && this.state.status === 'RUNNING') this.state = await Api.simAction(this.state.id, 'pause');
    });
  },

  async stepOnce() {
    await this.guard(async () => {
      if (!this.state) { this.state = await Api.createSim(this.selectedQuantum); this.events = []; }
      else if (['COMPLETED', 'CANCELLED'].includes(this.state.status)) throw new Error('This simulation is finished. Press Reset or Start to run a new one.');
      this.state = await Api.simAction(this.state.id, 'step');
      await this.refreshEvents();
      if (this.state.status === 'COMPLETED') { this.stop(); toast('Simulation completed.', 'success'); }
    });
  },

  scheduleNext() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(async () => {
      if (!this.playing) return;
      await this.stepOnce();
      if (this.playing && this.state && this.state.status === 'RUNNING') this.scheduleNext();
      else this.stop();
    }, this.speed);
  },

  async step() { if (!this.playing) await this.stepOnce(); },

  async reset() {
    this.stop();
    await this.guard(async () => {
      if (this.state && this.active) this.state = await Api.simAction(this.state.id, 'reset');
      else this.state = await Api.createSim(this.selectedQuantum);
      this.events = [];
      toast('Simulation reset. Completed runs stay in the history.', 'success');
    });
  },

  async loadSample(replace) {
    this.stop();
    await this.guard(async () => {
      const r = await Api.loadSample(replace);
      toast(r.message, 'success');
      this.config = await Api.config();
      this.selectedQuantum = this.config.timeQuantum;
      this.state = await Api.currentSim();
      this.events = this.state ? await Api.simEvents(this.state.id) : [];
    });
  }
};

/* ---------------------------------------------------------------- control panel (used on two pages) */
function controlsHtml() {
  return '<div class="btn-row" role="group" aria-label="Simulation controls">' +
    '<button class="btn btn-primary" data-sim="start">Start</button>' +
    '<button class="btn" data-sim="pause">Pause</button>' +
    '<button class="btn" data-sim="resume">Resume</button>' +
    '<button class="btn" data-sim="step">Execute One Step</button>' +
    '<button class="btn" data-sim="reset">Reset</button></div>';
}
function bindControls(root) {
  root.querySelectorAll('[data-sim]').forEach(b => b.addEventListener('click', async () => {
    const a = b.dataset.sim;
    if (a === 'reset') {
      const progressed = Sim.state && Sim.state.stepsExecuted > 0 && Sim.active;
      if (progressed && !(await confirmDialog('Reset the simulation?', 'The current run is restored to its initial state. Completed runs stay in the history.'))) return;
    }
    await Sim[a]();
  }));
  updateControls(root);
}
function updateControls(root) {
  const s = Sim.state ? Sim.state.status : null;
  const set = (a, enabled) => { const b = root.querySelector('[data-sim="' + a + '"]'); if (b) b.disabled = !enabled || Sim.busy; };
  set('start', !Sim.playing && s !== 'PAUSED' && s !== 'RUNNING');
  set('pause', Sim.playing || s === 'RUNNING');
  set('resume', !Sim.playing && s === 'PAUSED');
  set('step', !Sim.playing && s !== 'COMPLETED' && s !== 'CANCELLED');
  set('reset', true);
}

/* ---------------------------------------------------------------- ready queue */
let previousQueue = [];
function renderQueue(el, ids) {
  if (!ids || !ids.length) { el.innerHTML = '<span class="hint">The ready queue is empty.</span>'; previousQueue = []; return; }
  const html = ids.map((id, i) => {
    const isNew = !previousQueue.includes(id) || (i === ids.length - 1 && previousQueue[previousQueue.length - 1] !== id);
    return (i ? '<span class="queue-arrow" aria-hidden="true">&rarr;</span>' : '<span class="queue-label">front</span>') +
      '<span class="chip' + (isNew ? ' enter' : '') + '" style="background:' + colorFor(id) + '">Q' + id + '</span>';
  }).join('') + '<span class="queue-label">end</span>';
  el.innerHTML = html;
  previousQueue = ids.slice();
}

/* ---------------------------------------------------------------- toast + dialogs */
function toast(message, kind) {
  const box = document.getElementById('toasts');
  const t = document.createElement('div');
  t.className = 'toast ' + (kind || '');
  t.textContent = message;
  box.appendChild(t);
  setTimeout(() => t.remove(), kind === 'error' ? 7000 : 3500);
}

function confirmDialog(title, text, okLabel) {
  return new Promise(resolve => {
    const d = document.getElementById('confirmDialog');
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmText').textContent = text;
    document.getElementById('confirmOk').textContent = okLabel || 'Confirm';
    d.returnValue = 'cancel';
    d.addEventListener('close', () => resolve(d.returnValue === 'ok'), { once: true });
    d.showModal();
  });
}

/** Generic form dialog: fields = [{name,label,type,options,value,required,hint}], onSubmit(values) may throw to show an error. */
function formDialog(title, fields, onSubmit) {
  const d = document.getElementById('formDialog');
  const form = document.getElementById('formDialogForm');
  document.getElementById('formTitle').textContent = title;
  const err = document.getElementById('formError');
  err.hidden = true;
  document.getElementById('formFields').innerHTML = '<div class="form-grid">' + fields.map(f => {
    const id = 'ff_' + f.name;
    let input;
    if (f.type === 'select') input = '<select id="' + id + '">' + f.options.map(o => '<option value="' + esc(o.value) + '"' + (String(o.value) === String(f.value) ? ' selected' : '') + '>' + esc(o.label) + '</option>').join('') + '</select>';
    else if (f.type === 'textarea') input = '<textarea id="' + id + '">' + esc(f.value) + '</textarea>';
    else if (f.type === 'checkbox') input = '<input type="checkbox" id="' + id + '"' + (f.value ? ' checked' : '') + '>';
    else input = '<input id="' + id + '" type="' + (f.type || 'text') + '" value="' + esc(f.value) + '"' + (f.min != null ? ' min="' + f.min + '"' : '') + '>';
    return '<label class="field" for="' + id + '">' + esc(f.label) + (f.required ? ' *' : '') + input + (f.hint ? '<span class="hint">' + esc(f.hint) + '</span>' : '') + '</label>';
  }).join('') + '</div>';
  form.onsubmit = async (ev) => {
    ev.preventDefault();
    const values = {};
    fields.forEach(f => {
      const el = document.getElementById('ff_' + f.name);
      values[f.name] = f.type === 'checkbox' ? el.checked : el.value;
    });
    try { await onSubmit(values); d.close(); }
    catch (e) { err.textContent = e.message; err.hidden = false; }
  };
  document.getElementById('formCancel').onclick = () => d.close();
  d.showModal();
  const first = d.querySelector('input,select,textarea');
  if (first) first.focus();
}
