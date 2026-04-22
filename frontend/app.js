const state = {
  status: {},
  kind: "smooth_graph",
  data: null,
};

const experimentMeta = {
  benchmark: {
    title: "Benchmark proxy Rydberg",
    subtitle: "Ratios et erreurs de mapping en fonction de n",
  },
  smooth_grid: {
    title: "Grid search smooth",
    subtitle: "Classement des paramètres de séquence",
  },
  smooth_graph: {
    title: "Étude smooth multi-graphes",
    subtitle: "Robustesse sur graphes aléatoires à n=4",
  },
};

function fmt(value, digits = 3) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return "—";
  const number = Number(value);
  if (Math.abs(number) > 0 && Math.abs(number) < 0.001) return number.toExponential(2);
  return number.toFixed(digits);
}

async function api(path) {
  const response = await fetch(path);
  const payload = await response.json();
  if (!response.ok || payload.error) throw new Error(payload.error || response.statusText);
  return payload;
}

function setStatus(text) {
  document.getElementById("statusBadge").textContent = text;
}

function renderExperiments() {
  const root = document.getElementById("experiments");
  root.innerHTML = "";

  for (const [kind, meta] of Object.entries(state.status)) {
    const button = document.createElement("button");
    button.className = `experiment ${kind === state.kind ? "active" : ""} ${meta.ready ? "" : "missing"}`;
    button.innerHTML = `<strong>${meta.label}</strong><small>${meta.ready ? "résultats disponibles" : "aucun résultat trouvé"}</small>`;
    button.addEventListener("click", () => selectExperiment(kind));
    root.appendChild(button);
  }
}

async function selectExperiment(kind) {
  state.kind = kind;
  renderExperiments();
  document.getElementById("outputList").innerHTML = "";
  await loadData();
}

async function loadData() {
  const meta = experimentMeta[state.kind];
  document.getElementById("title").textContent = meta.title;
  setStatus("Chargement");

  try {
    state.data = await api(`/api/data?kind=${encodeURIComponent(state.kind)}`);
    setStatus(meta.subtitle);
    renderDashboard();
  } catch (error) {
    setStatus("Erreur");
    document.getElementById("primaryPlot").innerHTML = `<p>${error.message}</p>`;
  }
}

function renderDashboard() {
  if (state.kind === "benchmark") renderBenchmark();
  if (state.kind === "smooth_grid") renderSmoothGrid();
  if (state.kind === "smooth_graph") renderSmoothGraph();
}

function metric(label, value) {
  return `<div class="metric"><span>${label}</span><strong>${value}</strong></div>`;
}

function renderMetrics(items) {
  document.getElementById("metrics").innerHTML = items.map(([label, value]) => metric(label, value)).join("");
}

function svgBarLine({ rows, barKey, lineKey, xKey, target, title, barColor = "#2057a8" }) {
  const width = 760;
  const height = 330;
  const margin = { top: 18, right: 24, bottom: 42, left: 50 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const barValues = rows.map((r) => Number(r[barKey]));
  const lineValues = lineKey ? rows.map((r) => Number(r[lineKey])) : [];
  const maxY = Math.max(1, ...barValues, ...lineValues) * 1.08;
  const minY = 0;
  const xStep = innerW / rows.length;
  const barW = Math.max(8, xStep * 0.62);
  const y = (v) => margin.top + innerH - ((v - minY) / (maxY - minY)) * innerH;
  const x = (i) => margin.left + i * xStep + xStep / 2;

  const grid = [0, 0.25, 0.5, 0.75, 1].map((tick) => {
    const yy = y(tick * maxY);
    return `<line class="grid" x1="${margin.left}" y1="${yy}" x2="${width - margin.right}" y2="${yy}"/><text class="label" x="10" y="${yy + 4}">${fmt(tick * maxY, 2)}</text>`;
  }).join("");

  const bars = rows.map((row, i) => {
    const value = Number(row[barKey]);
    const h = margin.top + innerH - y(value);
    return `<rect x="${x(i) - barW / 2}" y="${y(value)}" width="${barW}" height="${h}" rx="3" fill="${barColor}" opacity="0.88"><title>${barKey}: ${fmt(value)}</title></rect>`;
  }).join("");

  const line = lineKey
    ? `<polyline points="${rows.map((row, i) => `${x(i)},${y(Number(row[lineKey]))}`).join(" ")}" fill="none" stroke="#111827" stroke-width="2.4"/>`
      + rows.map((row, i) => `<circle cx="${x(i)}" cy="${y(Number(row[lineKey]))}" r="4" fill="#111827"><title>${lineKey}: ${fmt(row[lineKey])}</title></circle>`).join("")
    : "";

  const targetLine = target
    ? `<line x1="${margin.left}" y1="${y(target)}" x2="${width - margin.right}" y2="${y(target)}" stroke="#b3261e" stroke-dasharray="6 5" stroke-width="2"><title>moyenne: ${fmt(target)}</title></line>`
    : "";

  const labels = rows.map((row, i) => {
    const label = row[xKey] ?? i;
    return `<text class="label" x="${x(i)}" y="${height - 14}" text-anchor="middle">${label}</text>`;
  }).join("");

  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${title}">
    ${grid}
    <line class="axis" x1="${margin.left}" y1="${margin.top + innerH}" x2="${width - margin.right}" y2="${margin.top + innerH}"/>
    <line class="axis" x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + innerH}"/>
    ${targetLine}
    ${bars}
    ${line}
    ${labels}
  </svg>`;
}

function svgScatter({ rows, xKey, yKey, colorKey }) {
  const width = 500;
  const height = 260;
  const margin = { top: 18, right: 22, bottom: 42, left: 58 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const xs = rows.map((r) => Number(r[xKey]));
  const ys = rows.map((r) => Number(r[yKey]));
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const x = (v) => margin.left + ((v - minX) / Math.max(maxX - minX, 1e-12)) * innerW;
  const y = (v) => margin.top + innerH - ((v - minY) / Math.max(maxY - minY, 1e-12)) * innerH;

  const points = rows.map((row) => {
    const c = colorKey && Number(row[colorKey]) > 0.5 ? "#147d64" : "#2057a8";
    return `<circle cx="${x(Number(row[xKey]))}" cy="${y(Number(row[yKey]))}" r="5" fill="${c}" opacity="0.82"><title>${xKey}: ${fmt(row[xKey])}, ${yKey}: ${fmt(row[yKey])}</title></circle>`;
  }).join("");

  return `<svg viewBox="0 0 ${width} ${height}">
    <line class="axis" x1="${margin.left}" y1="${margin.top + innerH}" x2="${width - margin.right}" y2="${margin.top + innerH}"/>
    <line class="axis" x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + innerH}"/>
    <text class="label" x="${width / 2}" y="${height - 10}" text-anchor="middle">${xKey}</text>
    <text class="label" x="14" y="${height / 2}" transform="rotate(-90 14 ${height / 2})" text-anchor="middle">${yKey}</text>
    ${points}
  </svg>`;
}

function renderTable(rows, columns) {
  const head = `<thead><tr>${columns.map((c) => `<th>${c.label}</th>`).join("")}</tr></thead>`;
  const body = rows.slice(0, 80).map((row) => `<tr>${columns.map((c) => {
    const value = row[c.key];
    return `<td>${typeof value === "number" ? fmt(value, c.digits ?? 4) : value ?? "—"}</td>`;
  }).join("")}</tr>`).join("");
  document.getElementById("dataTable").innerHTML = `${head}<tbody>${body}</tbody>`;
  document.getElementById("tableHint").textContent = `${Math.min(rows.length, 80)} / ${rows.length} lignes`;
}

function renderBenchmark() {
  const rows = state.data.rows || [];
  const byN = {};
  rows.forEach((r) => {
    byN[r.n] ||= [];
    byN[r.n].push(r);
  });
  const grouped = Object.entries(byN).map(([n, vals]) => ({
    n,
    ratio: vals.reduce((s, r) => s + Number(r.ratio), 0) / vals.length,
    mapping_error: vals.reduce((s, r) => s + Number(r.mapping_error), 0) / vals.length,
  }));

  renderMetrics([
    ["Instances", rows.length],
    ["n min/max", rows.length ? `${Math.min(...rows.map((r) => r.n))}–${Math.max(...rows.map((r) => r.n))}` : "—"],
    ["Ratio moyen", fmt(rows.reduce((s, r) => s + Number(r.ratio || 0), 0) / Math.max(rows.length, 1))],
    ["Mapping moyen", fmt(rows.reduce((s, r) => s + Number(r.mapping_error || 0), 0) / Math.max(rows.length, 1))],
  ]);
  document.getElementById("primaryPlotTitle").textContent = "Ratio moyen par taille";
  document.getElementById("primaryPlotHint").textContent = "benchmark_summary.csv";
  document.getElementById("primaryPlot").innerHTML = svgBarLine({ rows: grouped, barKey: "ratio", lineKey: null, xKey: "n", title: "benchmark", barColor: "#2057a8" });
  document.getElementById("secondaryPlotTitle").textContent = "Ratio vs mapping";
  document.getElementById("secondaryPlot").innerHTML = svgScatter({ rows, xKey: "mapping_error", yKey: "ratio" });
  renderTable(rows, [
    { key: "n", label: "n" },
    { key: "instance_id", label: "instance" },
    { key: "mapping_error", label: "mapping" },
    { key: "ratio", label: "ratio" },
  ]);
}

function renderSmoothGrid() {
  const rows = (state.data.rows || []).slice().sort((a, b) => Number(b.ratio_pulser) - Number(a.ratio_pulser));
  const best = state.data.best || rows[0];
  const top = rows.slice(0, 20).map((r, i) => ({ ...r, rank: i + 1 }));
  renderMetrics([
    ["Essais", rows.length],
    ["Meilleur ratio", fmt(best?.ratio_pulser)],
    ["Overlap best", fmt(best?.overlap_proxy)],
    ["Fall duration", best?.fall_duration ?? "—"],
  ]);
  document.getElementById("primaryPlotTitle").textContent = "Top 20 ratios Pulser";
  document.getElementById("primaryPlotHint").textContent = "grid search smooth";
  document.getElementById("primaryPlot").innerHTML = svgBarLine({ rows: top, barKey: "ratio_pulser", lineKey: "overlap_proxy", xKey: "rank", target: best?.ratio_pulser, title: "smooth grid", barColor: "#7c3aed" });
  document.getElementById("secondaryPlotTitle").textContent = "Ratio vs overlap";
  document.getElementById("secondaryPlot").innerHTML = svgScatter({ rows, xKey: "overlap_proxy", yKey: "ratio_pulser" });
  renderTable(top, [
    { key: "rank", label: "#" },
    { key: "ratio_pulser", label: "ratio" },
    { key: "overlap_proxy", label: "overlap" },
    { key: "omega_peak", label: "omega" },
    { key: "rise_duration", label: "rise", digits: 0 },
    { key: "hold_duration", label: "hold", digits: 0 },
    { key: "fall_duration", label: "fall", digits: 0 },
  ]);
}

function renderSmoothGraph() {
  const rows = state.data.rows || [];
  const summary = state.data.summary || {};
  renderMetrics([
    ["Graphes", rows.length],
    ["Ratio moyen", fmt(summary.ratio_pulser_mean)],
    ["Min / max", `${fmt(summary.ratio_pulser_min)} / ${fmt(summary.ratio_pulser_max)}`],
    ["Mapping max", fmt(summary.mapping_error_max)],
  ]);
  document.getElementById("primaryPlotTitle").textContent = "Robustesse par graphe";
  document.getElementById("primaryPlotHint").textContent = "barres: Pulser, ligne: proxy exact";
  document.getElementById("primaryPlot").innerHTML = svgBarLine({ rows, barKey: "ratio_pulser", lineKey: "ratio_proxy_exact", xKey: "graph_id", target: summary.ratio_pulser_mean, title: "smooth graph", barColor: "#147d64" });
  document.getElementById("secondaryPlotTitle").textContent = "Mapping vs ratio";
  document.getElementById("secondaryPlot").innerHTML = svgScatter({ rows, xKey: "mapping_error", yKey: "ratio_pulser" });
  renderTable(rows, [
    { key: "graph_id", label: "graphe" },
    { key: "ratio_pulser", label: "ratio" },
    { key: "overlap_proxy", label: "overlap" },
    { key: "ratio_proxy_exact", label: "proxy exact" },
    { key: "mapping_error", label: "mapping" },
  ]);
}

async function generatePng() {
  const root = document.getElementById("outputList");
  root.textContent = "Génération...";
  try {
    const payload = await api(`/api/plot?kind=${encodeURIComponent(state.kind)}`);
    root.innerHTML = payload.outputs.map((file) => `<div><a href="/${file}" target="_blank">${file}</a></div>`).join("");
  } catch (error) {
    root.textContent = error.message;
  }
}

async function init() {
  state.status = await api("/api/status");
  const firstReady = Object.entries(state.status).find(([, meta]) => meta.ready);
  if (firstReady) state.kind = firstReady[0];
  renderExperiments();
  document.getElementById("generatePng").addEventListener("click", generatePng);
  await loadData();
}

init().catch((error) => {
  setStatus("Erreur");
  document.getElementById("primaryPlot").innerHTML = `<p>${error.message}</p>`;
});
