import type {
  AnnealingConfig,
  FamilyResultRow,
  GraphGenerateRequest,
  GraphResponse,
  HpcJob,
  HpcResourcesRequest,
  HpcWorker,
  PipelineJob,
} from "../types";
import {
  generateLocalGraph,
  getLocalFamilyResults,
  getLocalPipelineStatus,
  runLocalPipeline,
} from "./localSimulator";

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "").trim().replace(/\/$/, "");
const HAS_REMOTE_API = API_BASE.length > 0;
const HPC_BRIDGE_URL = (import.meta.env.VITE_HPC_BRIDGE_URL ?? "").trim().replace(/\/$/, "");

type ApiRequestInit = RequestInit & { baseUrl?: string };

function getHpcToken(): string {
  let token = localStorage.getItem("hpc_bridge_token");
  if (!token) {
    token = window.prompt("Jeton d'accès HPC :")?.trim() ?? "";
    if (token) localStorage.setItem("hpc_bridge_token", token);
  }
  return token;
}

// Lecture seule (pas de window.prompt) : sert à décider si on peut interroger
// /api/workers en tâche de fond sans surprendre l'utilisateur avec une
// popup avant qu'il n'ait lui-même déclenché une action HPC.
export function hasHpcToken(): boolean {
  try {
    return Boolean(localStorage.getItem("hpc_bridge_token")?.trim());
  } catch {
    return false;
  }
}

async function request<T>(path: string, init?: ApiRequestInit): Promise<T> {
  const { baseUrl = API_BASE, ...requestInit } = init ?? {};
  const response = await fetch(`${baseUrl}${path}`, {
    ...requestInit,
    headers: {
      "Content-Type": "application/json",
      ...requestInit.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function generateGraph(payload: GraphGenerateRequest): Promise<GraphResponse> {
  if (!HAS_REMOTE_API) {
    return Promise.resolve(generateLocalGraph(payload));
  }

  return request<GraphResponse>("/api/graph/generate", {
    method: "POST",
    body: JSON.stringify(payload),
  }).catch(() => generateLocalGraph(payload));
}

export function runPipeline(graph: GraphResponse, annealing: AnnealingConfig): Promise<PipelineJob> {
  if (!HAS_REMOTE_API) {
    return runLocalPipeline(graph, annealing);
  }

  return request<PipelineJob>("/api/pipeline/run", {
    method: "POST",
    body: JSON.stringify({
      graph,
      annealing,
      n_roundings: annealing.n_roundings,
      seed: 1234,
    }),
  }).catch(() => runLocalPipeline(graph, annealing));
}

export function getPipelineStatus(jobId: string): Promise<PipelineJob> {
  if (!HAS_REMOTE_API) {
    return getLocalPipelineStatus(jobId);
  }

  return request<PipelineJob>(`/api/pipeline/${jobId}/status`).catch(() => getLocalPipelineStatus(jobId));
}

export function getFamilyResults(family = "all"): Promise<FamilyResultRow[]> {
  if (!HAS_REMOTE_API) {
    return getLocalFamilyResults(family);
  }

  return request<FamilyResultRow[]>(`/api/results/${family}`).catch(() => getLocalFamilyResults(family));
}

export async function runHpcPipeline(
  config: GraphGenerateRequest,
  annealing: AnnealingConfig,
  enableAnimations: boolean,
  resources?: HpcResourcesRequest,
): Promise<HpcJob> {
  return request<HpcJob>("/api/jobs", {
    baseUrl: HPC_BRIDGE_URL,
    method: "POST",
    headers: { Authorization: `Bearer ${getHpcToken()}` },
    body: JSON.stringify({
      kind: "hybrid_pipeline",
      graph: {
        family: config.family,
        n_nodes: config.n_nodes,
        density: config.density,
        weight_min: config.weight_min,
        weight_max: config.weight_max,
        seed: config.seed,
      },
      annealing,
      seed: 1234,
      enable_animations: enableAnimations,
      resources,
    }),
  });
}

export function getHpcJob(jobId: string): Promise<HpcJob> {
  return request<HpcJob>(`/api/jobs/${jobId}`, {
    baseUrl: HPC_BRIDGE_URL,
    headers: { Authorization: `Bearer ${getHpcToken()}` },
  });
}

export function cancelHpcJob(jobId: string): Promise<HpcJob> {
  return request<HpcJob>(`/api/jobs/${jobId}/cancel`, {
    baseUrl: HPC_BRIDGE_URL,
    method: "POST",
    headers: { Authorization: `Bearer ${getHpcToken()}` },
  });
}

// Réservé aux appelants qui vérifient hasHpcToken() au préalable (cf.
// usePipeline.ts, enabled: hasHpcToken()) : n'est jamais censé être appelé
// avant que l'utilisateur ait déjà fourni un jeton via une action HPC
// explicite, pour ne pas déclencher de window.prompt en tâche de fond.
export function getWorkers(): Promise<HpcWorker[]> {
  return request<HpcWorker[]>("/api/workers", {
    baseUrl: HPC_BRIDGE_URL,
    headers: { Authorization: `Bearer ${getHpcToken()}` },
  });
}
