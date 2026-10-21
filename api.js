/* Thin fetch wrapper. Every call returns parsed JSON (or null for 204) and throws ApiError with a readable message. */
class ApiError extends Error {
  constructor(message, status, body) { super(message); this.status = status; this.body = body; }
}

const Api = (() => {
  async function request(method, url, body) {
    let res;
    try {
      res = await fetch(url, {
        method,
        headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
        body: body !== undefined ? JSON.stringify(body) : undefined
      });
    } catch (e) {
      throw new ApiError('Cannot reach the server. Is the application running?', 0);
    }
    if (res.status === 204) return null;
    const text = await res.text();
    let data = null;
    if (text) { try { data = JSON.parse(text); } catch (e) { data = null; } }
    if (!res.ok) throw new ApiError((data && data.message) || ('Request failed (' + res.status + ')'), res.status, data);
    return data;
  }
  const qs = (o) => {
    const p = Object.entries(o || {}).filter(([, v]) => v !== '' && v != null).map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v));
    return p.length ? '?' + p.join('&') : '';
  };
  return {
    dashboard: () => request('GET', '/api/dashboard/summary'),
    queries: (f) => request('GET', '/api/queries' + qs(f)),
    createQuery: (b) => request('POST', '/api/queries', b),
    updateQuery: (id, b) => request('PUT', '/api/queries/' + id, b),
    deleteQuery: (id) => request('DELETE', '/api/queries/' + id),
    agents: () => request('GET', '/api/agents'),
    createAgent: (b) => request('POST', '/api/agents', b),
    updateAgent: (id, b) => request('PUT', '/api/agents/' + id, b),
    deactivateAgent: (id) => request('DELETE', '/api/agents/' + id),
    config: () => request('GET', '/api/config'),
    saveConfig: (b) => request('PUT', '/api/config', b),
    loadSample: (replace) => request('POST', '/api/sample-data?replace=' + (replace ? 'true' : 'false')),
    currentSim: () => request('GET', '/api/simulations/current'),
    createSim: (quantum) => request('POST', '/api/simulations', { timeQuantum: quantum }),
    simAction: (id, action) => request('POST', '/api/simulations/' + id + '/' + action),
    sim: (id) => request('GET', '/api/simulations/' + id),
    simEvents: (id) => request('GET', '/api/simulations/' + id + '/events'),
    simResults: (id) => request('GET', '/api/simulations/' + id + '/results'),
    history: () => request('GET', '/api/simulations/history'),
    compare: (quanta) => request('GET', '/api/simulations/compare?quanta=' + quanta.join(','))
  };
})();
