/* Chart.js wrappers (Chart.js is bundled in js/vendor, so the app works offline). */
const Charts = (() => {
  const registry = {};
  function make(id, config) {
    const canvas = document.getElementById(id);
    if (!canvas || typeof Chart === 'undefined') return;
    if (registry[id]) registry[id].destroy();
    registry[id] = new Chart(canvas, config);
  }
  function destroyAll() { Object.keys(registry).forEach(k => { registry[k].destroy(); delete registry[k]; }); }
  const STATUS_COLORS = { NEW: '#6b7280', WAITING: '#f59e0b', RUNNING: '#2563eb', COMPLETED: '#16a34a', CANCELLED: '#dc2626' };

  function statusChart(id, counts) {
    const labels = Object.keys(counts);
    make(id, {
      type: 'doughnut',
      data: { labels, datasets: [{ data: labels.map(l => counts[l]), backgroundColor: labels.map(l => STATUS_COLORS[l]) }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
    });
  }
  function barChart(id, labels, datasets, yTitle) {
    make(id, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: { x: { title: { display: true, text: 'Time quantum' } }, y: { beginAtZero: true, title: { display: true, text: yTitle } } }
      }
    });
  }
  return { statusChart, barChart, destroyAll };
})();
