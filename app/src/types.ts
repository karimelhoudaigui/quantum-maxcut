export type GraphFamily = "path" | "cycle" | "star" | "complete" | "random";

export interface Edge {
  i: number;
  j: number;
  w: number;
}

export interface Position {
  id: number;
  x: number;
  y: number;
}

export interface GraphResponse {
  family: GraphFamily;
  n_nodes: number;
  edges: Edge[];
  positions: Position[];
  mapping_error: number | null;
  descriptors: Record<string, number | string>;
}

export interface GraphGenerateRequest {
  family: GraphFamily;
  n_nodes: number;
  density: number;
  weight_min: number;
  weight_max: number;
  seed: number;
  optimize_geometry: boolean;
}

export interface AnnealingConfig {
  omega_peak_mhz: number;
  rise_duration: number;
  hold_duration: number;
  fall_duration: number;
  delta_start_pi: number;
  delta_hold_pi: number;
  delta_end_pi: number;
  sampling_rate: number;
  n_roundings: number;
}

export interface PipelineRunRequest {
  graph: GraphResponse;
  annealing: AnnealingConfig;
  n_roundings: number;
  seed: number;
}

export type StepStatus = "pending" | "running" | "completed" | "failed";
export type JobStatus = "queued" | "running" | "completed" | "failed";

export interface PipelineStep {
  id: "setup" | "geometry" | "pulser" | "sdp" | "rounding";
  label: string;
  status: StepStatus;
  metric_label: string | null;
  metric_value: number | string | null;
  duration_seconds?: number;
}

export interface PipelineJob {
  job_id: string;
  status: JobStatus;
  progress: number;
  steps: PipelineStep[];
  result: Record<string, unknown> | null;
  error: string | null;
}

export type HpcJobStatus =
  | "queued"
  | "waiting_for_worker"
  | "dispatched"
  | "submitting"
  | "queued_slurm"
  | "running"
  | "cancelling"
  | "done"
  | "error"
  | "cancelled";

export interface HpcPhaseUpdate {
  phase: "setup" | "positions" | "pulser" | "sdp" | "rounding";
  completed_at: number;
  /** Pour "pulser" : inclut le temps de calcul du ground state (np.linalg.eigh × 2, négligeable en
   *  pratique) en plus de la simulation qutip elle-même — cf. hybrid_graph_study.py, notify("pulser"). */
  duration_seconds: number;
  magnetization_series?: { times: number[]; magnetization: number[][] } | null;
  rounding_trials_series?: { seed: number; ratio_product: number }[] | null;
}

export interface HpcRoundingProgress {
  phase: "rounding";
  done: number;
  total: number;
}

export interface HpcJobProgress {
  phases: HpcPhaseUpdate[];
  current?: HpcRoundingProgress | null;
}

export interface HpcJobResources {
  cpus_per_task: number;
  nodes: number;
  partition?: string | null;
}

export interface HpcJob {
  job_id: string;
  status: HpcJobStatus;
  payload?: Record<string, unknown>;
  slurm_job_id?: string;
  result?: Record<string, unknown> | null;
  error?: string | null;
  created_at?: string;
  finished_at?: string | null;
  progress?: HpcJobProgress | null;
  resources?: HpcJobResources | null;
  /** Position du job dans la file d'attente de sa partition (1 = le prochain à démarrer) et
   *  nombre total de jobs PENDING dans cette partition, tant que le job est "queued_slurm".
   *  Calculé côté worker (cf. hpc_worker.py, get_queue_position) — remplace une estimation par
   *  squeue --start abandonnée car inexploitable sur la partition preemptible de curta (N/A en
   *  continu, le scheduler backfill ne peut rien garantir sur une partition préemptible). */
  queue_position?: number | null;
  queue_total?: number | null;
}

export interface HpcWorker {
  worker_id: string;
  hostname: string;
  connected_at: string;
}

export interface FamilyResultRow {
  family: string;
  metrics: Record<string, number | string>;
}
