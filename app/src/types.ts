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

/** Seuls statuts finaux (cf. sl_server.py TERMINAL_STATUSES) — tout le reste est "actif"
 *  (job encore suivi côté hpc-bridge, à annuler avant d'en soumettre un autre). Dérivé en
 *  négatif plutôt qu'énuméré positivement : une liste positive dupliquée (HPC_ACTIVE_STATUSES)
 *  a par le passé oublié "queued_slurm" et "cancelling", laissant "Restart HPC" soumettre un
 *  nouveau job sans annuler celui encore en file SLURM. */
export const HPC_TERMINAL_STATUSES: readonly HpcJobStatus[] = ["done", "error", "cancelled"];

export function isHpcJobActive(status: HpcJobStatus): boolean {
  return !HPC_TERMINAL_STATUSES.includes(status);
}

export interface HpcPhaseUpdate {
  // string plutôt que le seul union MaxCut ("setup"|"positions"|...) : les
  // phases ald_pipeline (validate/molecule/scf/active_space/mapping/vqe/
  // comparison, cf. run_ald_job.py et quantum_ald/experiment.py) partagent
  // la même forme de progress.json/job_update (cf. hpc_worker.py,
  // poll_and_relay_progress, générique quel que soit le job kind) sans
  // avoir de type dédié — élargir ce champ évite un type HpcPhaseUpdate
  // dupliqué juste pour ça. Les valeurs MaxCut restent des string valides.
  phase: string;
  status?: "completed" | "failed";
  completed_at: number;
  /** Pour "pulser" : inclut le temps de calcul du ground state (np.linalg.eigh × 2, négligeable en
   *  pratique) en plus de la simulation qutip elle-même — cf. hybrid_graph_study.py, notify("pulser").
   *  null (pas seulement absent) pour une phase ald_pipeline qui passe directement à "completed" sans
   *  "running" préalable (validate/comparison) — run_ald_job.py ne peut alors pas calculer de durée. */
  duration_seconds?: number | null;
  magnetization_series?: { times: number[]; magnetization: number[][] } | null;
  rounding_trials_series?: { seed: number; ratio_product: number }[] | null;
  /** Métrique propre à chaque phase, connue dès qu'elle se termine (pas seulement au résultat final). */
  mapping_error?: number;
  ratio_pulser?: number;
  sdp_status?: string;
  ratio_hybrid?: number;
  /** Champs propres à ald_pipeline (cf. quantum_ald/experiment.py, _emit_progress) — passthrough
   *  générique, pas de schéma figé ici (même philosophie que JOB_UPDATE_RESERVED_KEYS côté sl_server.py). */
  message?: string;
  progress?: number;
  active_space_index?: number;
  total_active_spaces?: number;
  completed_active_spaces?: number;
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
  mem_gb?: number | null;
  time_min_minutes?: number | null;
  time_max?: string | null;
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
   *  Calculé côté worker (cf. hpc_worker.py, get_queue_position) — toujours disponible, contrairement
   *  à estimated_start ci-dessous. */
  queue_position?: number | null;
  queue_total?: number | null;
  /** Heure de démarrage estimée par le scheduler backfill SLURM (ISO, cf. hpc_worker.py
   *  get_estimated_start), ou null si pas encore disponible. Une fois obtenue, le worker ne la
   *  réinitialise plus jamais à null (squeue --start peut redevenir N/A transitoirement) — ne
   *  disparaît donc jamais côté front une fois apparue. estimated_start_pending distingue "pas
   *  encore tenté" (true) de "tenté, resterait indisponible" (false, estimated_start toujours null). */
  estimated_start?: string | null;
  estimated_start_pending?: boolean;
  /** Depuis quand le job est en file SLURM (ISO, fixé une fois par le worker au moment où il
   *  commence à suivre le job) — repère indépendant de estimated_start pour mesurer une attente
   *  anormalement longue même si aucune estimation de démarrage n'a jamais pu être obtenue. */
  queued_since?: string | null;
}

export interface HpcPartitionInfo {
  max_time_minutes: number | null;
  max_time_raw: string;
}

/** Ce que le worker propose (cf. hpc_worker.py WorkerConfig/register) — sert à peupler le menu
 *  de paramétrage du run côté client, borné côté worker quoi que le client envoie ensuite. */
export interface HpcWorkerCapabilities {
  partitions: Record<string, HpcPartitionInfo>;
  default_partition?: string | null;
  max_cpus: number;
  default_cpus_per_task: number;
  max_mem_gb: number;
  default_time_min_minutes: number;
}

export interface HpcWorker {
  worker_id: string;
  hostname: string;
  connected_at: string;
  capabilities?: HpcWorkerCapabilities;
}

/** Choix du client pour le run (menu déroulant, replié par défaut) — tous champs optionnels,
 *  absents -> défauts du worker (cf. HpcWorkerCapabilities). time_min_minutes seul est ajustable
 *  pour la durée : le --time (max) réellement soumis vient toujours du MaxTime de la partition
 *  choisie, jamais d'un choix client (cf. hpc_worker.py, resolve_job_resources). */
export interface HpcResourcesRequest {
  partition?: string;
  cpus?: number;
  mem_gb?: number;
  time_min_minutes?: number;
}

export interface FamilyResultRow {
  family: string;
  metrics: Record<string, number | string>;
}

/** Requête quantum-ald-simulation (quantum_ald.experiment.ExperimentConfig),
 *  relayée telle quelle à hpc-bridge (kind "ald_pipeline", champ "experiment")
 *  puis à ExperimentConfig.from_dict côté run_ald_job.py — cf.
 *  results/experiments/h2/request.json dans ce dépôt pour un gabarit réel. */
export type AldMoleculePreset = "h2" | "lih" | "h2o";
export type AldMethod = "hf" | "casci" | "fci" | "vqe";

export interface AldAtomSpec {
  symbol: string;
  x: number;
  y: number;
  z: number;
}

export interface AldMoleculeSpec {
  name?: string;
  atoms: AldAtomSpec[];
  charge: number;
  spin: number;
  basis: string;
  unit: "angstrom" | "bohr";
}

export interface AldActiveSpaceConfig {
  n_active_electrons: number;
  n_active_orbitals: number;
  orbital_indices?: number[];
  // "canonical" (pas "auto" : nom imposé par ActiveSpaceConfig.__post_init__
  // côté quantum_ald/active_space.py, qui rejette toute autre valeur) laisse
  // orbital_indices vide et le backend choisit les orbitales canoniques.
  selection_mode?: "manual" | "canonical";
}

export interface AldAnsatzConfig {
  ansatz_type: "uccsd";
  reps: number;
  preserve_spin: boolean;
  generalized: boolean;
  initialization: "zeros" | "random";
}

export interface AldSolverConfig {
  optimizer: "slsqp";
  maxiter: number;
  tolerance: number;
  initialization: "ansatz_default" | "random";
  random_seeds: number[];
  random_scale: number;
  execution_mode: "exact_statevector";
}

export interface AldExperimentConfig {
  schema_version: "1";
  molecule: AldMoleculeSpec;
  active_spaces: AldActiveSpaceConfig[];
  methods: AldMethod[];
  mapping: "jordan-wigner";
  ansatz: AldAnsatzConfig | null;
  solver: AldSolverConfig | null;
  execution_mode: "exact_statevector";
  chemical_accuracy_hartree: number;
}
