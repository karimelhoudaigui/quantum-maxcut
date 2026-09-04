import type {
  AnnealingConfig,
  Edge,
  FamilyResultRow,
  GraphGenerateRequest,
  GraphResponse,
  PipelineJob,
  Position,
} from "../types";

const localJobs = new Map<string, PipelineJob>();

export function generateLocalGraph(request: GraphGenerateRequest): GraphResponse {
  const rng = createRng(request.seed);
  const edges = buildWeightedEdges(request, rng);
  const positions = request.optimize_geometry ? layoutGraph(request.n_nodes, edges) : circularPositions(request.n_nodes);
  const descriptors = graphDescriptors(request.n_nodes, edges);

  return {
    family: request.family,
    n_nodes: request.n_nodes,
    edges,
    positions,
    mapping_error: request.optimize_geometry ? estimateMappingError(edges, positions) : null,
    descriptors,
  };
}

export async function runLocalPipeline(graph: GraphResponse, annealing: AnnealingConfig): Promise<PipelineJob> {
  await delay(260);

  const exact = solveMaxCutExactly(graph.n_nodes, graph.edges);
  const pulseComplexity = Math.log10(annealing.rise_duration + annealing.hold_duration + annealing.fall_duration + 10);
  const samplingBoost = Math.min(0.18, Math.sqrt(annealing.n_roundings) / 55);
  const detuningBalance = 1 - Math.min(0.38, Math.abs(annealing.delta_start_pi + annealing.delta_end_pi) * 0.09);
  const pulserRatio = clamp(0.54 + pulseComplexity * 0.055 + detuningBalance * 0.06, 0.42, 0.86);
  const hybridRatio = clamp(Math.max(pulserRatio + samplingBoost, 0.72 + samplingBoost), pulserRatio, 0.98);
  const pulserCut = exact.bestCut * pulserRatio;
  const hybridCut = exact.bestCut * hybridRatio;
  const jobId = `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  const job: PipelineJob = {
    job_id: jobId,
    status: "completed",
    progress: 100,
    steps: [
      {
        id: "geometry",
        label: "Geometry embedding",
        status: "completed",
        metric_label: "Mapping error",
        metric_value: graph.mapping_error,
      },
      {
        id: "pulser",
        label: "Pulser",
        status: "completed",
        metric_label: "Ratio Pulser",
        metric_value: pulserRatio,
      },
      {
        id: "sdp",
        label: "SDP",
        status: "completed",
        metric_label: "Status",
        metric_value: "browser-simulated",
      },
      {
        id: "rounding",
        label: "Rounding",
        status: "completed",
        metric_label: "Ratio hybrid",
        metric_value: hybridRatio,
      },
    ],
    result: {
      n: graph.n_nodes,
      target_edges: graph.edges,
      positions: graph.positions.map((position) => [position.x, position.y]),
      mapping_error: graph.mapping_error,
      ratio_proxy_exact: exact.bestCut > 0 ? pulserCut / exact.bestCut : 0,
      ratio_pulser: pulserRatio,
      ratio_product_best: hybridRatio,
      ratio_hybrid: hybridRatio,
      winner: "rounding",
      best_seed: 1234 + exact.bestMask,
      n_roundings: annealing.n_roundings,
      sdp_status: "browser-simulated",
      E_pulser_in_qmc: pulserCut,
      E_product_best_in_qmc: hybridCut,
      E_hybrid_in_qmc: hybridCut,
      gain_hybrid_vs_pulser: hybridRatio - pulserRatio,
      cut_value: hybridCut,
      exact_cut_value: exact.bestCut,
      best_partition: exact.partition,
      annealing,
    },
    error: null,
  };

  localJobs.set(jobId, job);
  return job;
}

export async function getLocalPipelineStatus(jobId: string): Promise<PipelineJob> {
  const job = localJobs.get(jobId);
  if (!job) {
    throw new Error("Local pipeline job not found.");
  }
  return job;
}

export async function getLocalFamilyResults(_family = "all"): Promise<FamilyResultRow[]> {
  return [];
}

function buildWeightedEdges(request: GraphGenerateRequest, rng: () => number): Edge[] {
  const weight = () => round(request.weight_min + rng() * (request.weight_max - request.weight_min));
  const edges: Edge[] = [];

  if (request.family === "path") {
    for (let i = 0; i < request.n_nodes - 1; i += 1) {
      edges.push({ i, j: i + 1, w: weight() });
    }
    return edges;
  }

  if (request.family === "cycle") {
    for (let i = 0; i < request.n_nodes; i += 1) {
      edges.push({ i, j: (i + 1) % request.n_nodes, w: weight() });
    }
    return edges;
  }

  if (request.family === "star") {
    for (let i = 1; i < request.n_nodes; i += 1) {
      edges.push({ i: 0, j: i, w: weight() });
    }
    return edges;
  }

  for (let i = 0; i < request.n_nodes; i += 1) {
    for (let j = i + 1; j < request.n_nodes; j += 1) {
      if (request.family === "complete" || rng() <= request.density) {
        edges.push({ i, j, w: weight() });
      }
    }
  }

  if (edges.length === 0) {
    edges.push({ i: 0, j: 1, w: weight() });
  }
  return edges;
}

function circularPositions(n: number): Position[] {
  const radius = 1 + n * 0.08;
  return Array.from({ length: n }, (_, id) => ({
    id,
    x: round(radius * Math.cos((2 * Math.PI * id) / n)),
    y: round(radius * Math.sin((2 * Math.PI * id) / n)),
  }));
}

function layoutGraph(n: number, edges: Edge[]): Position[] {
  const positions = circularPositions(n);
  const degree = degreeMap(n, edges);

  for (let step = 0; step < 90; step += 1) {
    const forces = Array.from({ length: n }, () => ({ x: 0, y: 0 }));

    for (let a = 0; a < n; a += 1) {
      for (let b = a + 1; b < n; b += 1) {
        const dx = positions[a].x - positions[b].x;
        const dy = positions[a].y - positions[b].y;
        const distanceSq = Math.max(dx * dx + dy * dy, 0.02);
        const force = 0.012 / distanceSq;
        forces[a].x += dx * force;
        forces[a].y += dy * force;
        forces[b].x -= dx * force;
        forces[b].y -= dy * force;
      }
    }

    for (const edge of edges) {
      const source = positions[edge.i];
      const target = positions[edge.j];
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const distance = Math.max(Math.sqrt(dx * dx + dy * dy), 0.01);
      const ideal = 1 / Math.cbrt(Math.max(edge.w, 0.01));
      const force = (distance - ideal) * 0.012;
      forces[edge.i].x += (dx / distance) * force;
      forces[edge.i].y += (dy / distance) * force;
      forces[edge.j].x -= (dx / distance) * force;
      forces[edge.j].y -= (dy / distance) * force;
    }

    for (const position of positions) {
      const anchor = 0.002 + degree[position.id] * 0.0008;
      position.x = round(position.x + forces[position.id].x - position.x * anchor);
      position.y = round(position.y + forces[position.id].y - position.y * anchor);
    }
  }

  return positions;
}

function graphDescriptors(n: number, edges: Edge[]): Record<string, number | string> {
  const degrees = degreeMap(n, edges);
  const possibleEdges = (n * (n - 1)) / 2;
  const avgDegree = degrees.reduce((sum, degree) => sum + degree, 0) / n;
  const maxDegree = Math.max(...degrees);
  const degreeVariance = degrees.reduce((sum, degree) => sum + (degree - avgDegree) ** 2, 0) / n;
  const hubThreshold = Math.max(2, Math.ceil(avgDegree + Math.sqrt(degreeVariance)));

  return {
    n,
    n_edges: edges.length,
    density: possibleEdges ? round(edges.length / possibleEdges) : 0,
    avg_degree: round(avgDegree),
    max_degree: maxDegree,
    degree_variance: round(degreeVariance),
    hub_degree_threshold: hubThreshold,
    hub_count: degrees.filter((degree) => degree >= hubThreshold).length,
    sparsity: round(1 - edges.length / possibleEdges),
    clustering_coeff_mean: round(estimateClustering(n, edges)),
    degree_centralization: round(degrees.reduce((sum, degree) => sum + (maxDegree - degree), 0) / ((n - 1) * (n - 2) || 1)),
  };
}

function solveMaxCutExactly(n: number, edges: Edge[]) {
  let bestCut = -Infinity;
  let bestMask = 0;
  const limit = 1 << n;

  for (let mask = 0; mask < limit; mask += 1) {
    let cut = 0;
    for (const edge of edges) {
      if (((mask >> edge.i) & 1) !== ((mask >> edge.j) & 1)) {
        cut += edge.w;
      }
    }
    if (cut > bestCut) {
      bestCut = cut;
      bestMask = mask;
    }
  }

  return {
    bestCut: round(bestCut),
    bestMask,
    partition: Array.from({ length: n }, (_, id) => (bestMask >> id) & 1),
  };
}

function estimateMappingError(edges: Edge[], positions: Position[]): number {
  if (edges.length === 0) {
    return 0;
  }

  const error = edges.reduce((sum, edge) => {
    const source = positions[edge.i];
    const target = positions[edge.j];
    const distance = Math.max(Math.hypot(source.x - target.x, source.y - target.y), 0.01);
    const coupling = 1 / distance ** 3;
    return sum + (coupling - edge.w) ** 2;
  }, 0);
  const norm = edges.reduce((sum, edge) => sum + edge.w ** 2, 0);
  return round(Math.sqrt(error / Math.max(norm, 0.001)));
}

function estimateClustering(n: number, edges: Edge[]): number {
  const adjacency = Array.from({ length: n }, () => new Set<number>());
  for (const edge of edges) {
    adjacency[edge.i].add(edge.j);
    adjacency[edge.j].add(edge.i);
  }

  let total = 0;
  for (let node = 0; node < n; node += 1) {
    const neighbors = Array.from(adjacency[node]);
    const possible = (neighbors.length * (neighbors.length - 1)) / 2;
    if (possible === 0) {
      continue;
    }
    let links = 0;
    for (let a = 0; a < neighbors.length; a += 1) {
      for (let b = a + 1; b < neighbors.length; b += 1) {
        if (adjacency[neighbors[a]].has(neighbors[b])) {
          links += 1;
        }
      }
    }
    total += links / possible;
  }
  return total / n;
}

function degreeMap(n: number, edges: Edge[]) {
  const degrees = Array.from({ length: n }, () => 0);
  for (const edge of edges) {
    degrees[edge.i] += 1;
    degrees[edge.j] += 1;
  }
  return degrees;
}

function createRng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function delay(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number) {
  return Number(value.toFixed(6));
}
