import type {
  AnnealingConfig,
  FamilyResultRow,
  GraphGenerateRequest,
  GraphResponse,
  PipelineJob,
} from "../types";
import {
  generateLocalGraph,
  getLocalFamilyResults,
  getLocalPipelineStatus,
  runLocalPipeline,
} from "./localSimulator";

const API_BASE = import.meta.env.DEV ? "" : import.meta.env.VITE_API_BASE_URL ?? "";
const HAS_REMOTE_API = API_BASE.length > 0 || import.meta.env.DEV;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    ...init,
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
  });
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
  });
}

export function getPipelineStatus(jobId: string): Promise<PipelineJob> {
  if (!HAS_REMOTE_API) {
    return getLocalPipelineStatus(jobId);
  }

  return request<PipelineJob>(`/api/pipeline/${jobId}/status`);
}

export function getFamilyResults(family = "all"): Promise<FamilyResultRow[]> {
  if (!HAS_REMOTE_API) {
    return getLocalFamilyResults(family);
  }

  return request<FamilyResultRow[]>(`/api/results/${family}`);
}
