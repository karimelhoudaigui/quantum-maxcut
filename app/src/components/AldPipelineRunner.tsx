import { Check, Cloud, Loader2, Square, X } from "lucide-react";
import { useMemo, useRef } from "react";

import { useAldPipelineRunner } from "../hooks/useAldPipeline";
import { aldStepsFromProgress } from "../lib/aldPhases";
import { useAldStore } from "../stores/aldStore";
import { isHpcJobActive } from "../types";
import type { AldMethod, AldMoleculePreset, HpcJobStatus } from "../types";
import { AldAdvancedConfig } from "./AldAdvancedConfig";
import { HpcResourceSettings, HpcWorkersStatus } from "./HpcResourceSettings";
import { StepCard, STEP_STATUS_STYLES, STEP_STATUS_TEXT_STYLES } from "./PhaseSteps";
import { QueuePosition } from "./QueuePosition";

const HPC_STATUS_LABELS: Partial<Record<string, string>> = {
  queued_slurm: "queued on SLURM",
};

const MOLECULE_OPTIONS: { value: AldMoleculePreset; label: string }[] = [
  { value: "h2", label: "H2" },
  { value: "lih", label: "LiH" },
  { value: "h2o", label: "H2O" },
];

const METHOD_OPTIONS: { value: AldMethod; label: string; description: string }[] = [
  { value: "hf", label: "HF", description: "Hartree-Fock reference" },
  { value: "casci", label: "CASCI", description: "Active-space solver reference" },
  { value: "fci", label: "FCI", description: "Full-space reference (when feasible)" },
  { value: "vqe", label: "VQE", description: "UCCSD ansatz, SLSQP optimizer" },
];

function hpcJobToBoxStatus(status: HpcJobStatus | undefined, hasError: boolean): "pending" | "running" | "completed" | "failed" {
  if (!status) return hasError ? "failed" : "pending";
  if (status === "done") return "completed";
  if (status === "error" || status === "cancelled") return "failed";
  return "running";
}

const HPC_SPINNING_STATUSES = new Set<HpcJobStatus>([
  "queued",
  "waiting_for_worker",
  "dispatched",
  "submitting",
  "queued_slurm",
  "cancelling",
]);

function hpcBoxIcon(jobStatus: HpcJobStatus | undefined, submissionFailed: boolean) {
  if (!jobStatus) return submissionFailed ? <X size={16} /> : <Cloud size={16} />;
  if (jobStatus === "done") return <Check size={16} />;
  if (jobStatus === "error" || jobStatus === "cancelled") return <X size={16} />;
  if (HPC_SPINNING_STATUSES.has(jobStatus)) return <Loader2 className="animate-spin" size={16} />;
  return <Cloud size={16} />;
}

export function AldPipelineRunner() {
  const moleculePreset = useAldStore((state) => state.moleculePreset);
  const setMoleculePreset = useAldStore((state) => state.setMoleculePreset);
  const methods = useAldStore((state) => state.methods);
  const setMethods = useAldStore((state) => state.setMethods);
  const hpcJob = useAldStore((state) => state.hpcJob);
  const hpcResources = useAldStore((state) => state.hpcResources);
  const setHpcResources = useAldStore((state) => state.setHpcResources);
  const activeSpace = useAldStore((state) => state.activeSpace);
  const setActiveSpace = useAldStore((state) => state.setActiveSpace);
  const ansatz = useAldStore((state) => state.ansatz);
  const setAnsatz = useAldStore((state) => state.setAnsatz);
  const solver = useAldStore((state) => state.solver);
  const setSolver = useAldStore((state) => state.setSolver);
  const { hpcRun, hpcStop, workers } = useAldPipelineRunner();

  const workerCount = workers.data?.length ?? 0;
  const workersKnown = workers.isSuccess;
  const clusterUnavailable = workersKnown && workerCount === 0;
  // Un seul worker attendu en pratique (POC) — même hypothèse que PipelineRunner.tsx
  // (MaxCut) : dispatch_to_worker côté SL prend le premier worker connecté sans choix.
  const workerCapabilities = workers.data?.[0]?.capabilities;
  const hpcActive = hpcJob && isHpcJobActive(hpcJob.status);
  const hpcStoppable = hpcActive && hpcJob.status !== "cancelling";
  const hpcBoxStatus = hpcJobToBoxStatus(hpcJob?.status, Boolean(hpcRun.error));
  // progress.phases peut être absent (worker pas encore à jour avec le fix
  // de run_ald_job.py qui l'écrit désormais, cf. hpc-bridge ef48643 — un
  // ancien worker renvoie encore un seul objet plat {phase, status, ...}
  // sans clé "phases") : Array.isArray() plutôt qu'un simple fallback `?? []`
  // pour ne pas planter sur .length/.map si "phases" existe mais n'est pas
  // un tableau (ce qui a fait disparaître toute la page : TypeError non
  // rattrapée -> React démonte l'arbre -> écran noir).
  const phases = Array.isArray(hpcJob?.progress?.phases) ? hpcJob.progress.phases : [];
  const steps = useMemo(
    () => aldStepsFromProgress(methods, phases, hpcJob?.status),
    [methods, phases, hpcJob?.status],
  );
  const overallProgress = phases.length > 0 ? phases[phases.length - 1].progress ?? 0 : 0;
  // Toutes les cartes de phase affichent déjà "completed" (la dernière,
  // "comparison", est émise par quantum_ald juste avant son `return` — cf.
  // experiment.py, pas de calcul restant après) alors que hpcJob.status est
  // encore "running" : le process SLURM met un peu de temps à vraiment
  // sortir de la file après la dernière phase (déchargement des libs
  // natives qiskit-aer/pyscf, écriture de result.json sur le filesystem du
  // cluster), et le worker ne relaie "done" qu'une fois squeue/sacct
  // confirment la fin réelle du job (poll toutes les 3s, cf. hpc_worker.py
  // wait_for_slurm_job). Sans ce message, cet intervalle (habituellement
  // quelques secondes à ~1 minute) ressemble à un blocage côté UI.
  const allPhasesComplete = steps.length > 0 && steps.every((step) => step.status === "completed");
  const finalizingResult = hpcJob?.status === "running" && allPhasesComplete;

  // Même verrou synchrone que "Restart HPC" côté MaxCut (cf. PipelineRunner.tsx) :
  // ferme la fenêtre entre le clic et le re-render qui désactive le bouton.
  const hpcRunLockRef = useRef(false);

  function toggleMethod(method: AldMethod) {
    if (methods.includes(method)) {
      setMethods(methods.filter((m) => m !== method));
    } else {
      setMethods([...methods, method]);
    }
  }

  return (
    <section className="rounded-md border border-border bg-muted/25 p-4 shadow-panel">
      <div className="mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/60">Pipeline</h2>
        <p className="text-xl font-semibold">Method: Quantum Chemistry (quantum-ald-simulation)</p>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-foreground/60">
          Molecule
          <select
            value={moleculePreset}
            onChange={(e) => setMoleculePreset(e.target.value as AldMoleculePreset)}
            className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground"
          >
            {MOLECULE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-1 text-xs text-foreground/60">
          Methods
          <div className="flex flex-wrap gap-2">
            {METHOD_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                title={option.description}
                onClick={() => toggleMethod(option.value)}
                className={`rounded-md border px-3 py-1 text-sm font-medium transition ${
                  methods.includes(option.value)
                    ? "border-primary bg-primary/20 text-primary"
                    : "border-border bg-background text-foreground/60 hover:bg-muted"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <AldAdvancedConfig
        moleculePreset={moleculePreset}
        methods={methods}
        activeSpace={activeSpace}
        onActiveSpaceChange={setActiveSpace}
        ansatz={ansatz}
        onAnsatzChange={setAnsatz}
        solver={solver}
        onSolverChange={setSolver}
      />
      <HpcResourceSettings capabilities={workerCapabilities} resources={hpcResources} onChange={setHpcResources} />

      <div className="mb-4 flex items-stretch gap-2">
        <div className="flex items-stretch overflow-hidden rounded-md border border-primary/60">
          <button
            type="button"
            disabled={hpcRun.isPending || clusterUnavailable || methods.length === 0}
            onClick={() => {
              if (hpcRunLockRef.current) return;
              hpcRunLockRef.current = true;
              hpcRun.mutate(undefined, { onSettled: () => (hpcRunLockRef.current = false) });
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-45"
            title={
              clusterUnavailable
                ? "No HPC worker connected to hpc-bridge — start hpc_worker.py on the cluster"
                : hpcActive
                  ? "Cancel the running HPC job and submit this configuration instead"
                  : "Submit this experiment to hpc-bridge"
            }
          >
            {hpcRun.isPending ? <Loader2 className="animate-spin" size={16} /> : <Cloud size={16} />}
            {hpcActive ? "Restart HPC" : "Run HPC"}
          </button>
          {hpcStoppable ? (
            <button
              type="button"
              disabled={hpcStop.isPending}
              onClick={() => hpcStop.mutate()}
              className="flex items-center gap-2 border-l border-primary/60 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-45"
              title="Stop the running HPC job without submitting a new one"
            >
              {hpcStop.isPending ? <Loader2 className="animate-spin" size={16} /> : <Square size={16} />}
              Stop
            </button>
          ) : null}
        </div>
      </div>

      <div className="mb-4 h-2 overflow-hidden rounded-full bg-background">
        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${overallProgress}%` }} />
      </div>
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {steps.map((step) => (
          <StepCard key={step.id} step={step} />
        ))}
      </div>

      <HpcWorkersStatus workers={workers} />

      {hpcRun.error || hpcJob ? (
        <div className={`mt-4 rounded-md border p-3 text-sm transition-colors duration-500 ${STEP_STATUS_STYLES[hpcBoxStatus]}`}>
          <div className="flex items-center justify-between gap-3">
            <span className={`flex items-center gap-2 font-semibold ${STEP_STATUS_TEXT_STYLES[hpcBoxStatus]}`}>
              {hpcBoxIcon(hpcJob?.status, Boolean(hpcRun.error))}
              HPC job
            </span>
            <span className="font-mono text-xs text-foreground/60">{hpcJob?.job_id ?? "not submitted"}</span>
          </div>
          {hpcRun.error ? <p className="mt-2 text-red-200">{hpcRun.error.message}</p> : null}
          {hpcStop.error ? <p className="mt-2 text-red-200">{hpcStop.error.message}</p> : null}
          {hpcJob ? (
            <p className="mt-2 text-foreground/70">
              Status: <span className="font-medium text-foreground">{HPC_STATUS_LABELS[hpcJob.status] ?? hpcJob.status}</span>
              {hpcJob.slurm_job_id ? ` · SLURM ${hpcJob.slurm_job_id}` : ""}
            </p>
          ) : null}
          {finalizingResult ? (
            <p className="mt-2 flex items-center gap-1.5 text-foreground/60">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              All phases completed — waiting for the SLURM job to finish and the result to come back (usually a few seconds to ~1 minute)…
            </p>
          ) : null}
          {hpcJob?.status === "queued_slurm" && hpcJob.queue_position != null ? (
            <QueuePosition
              position={hpcJob.queue_position}
              total={hpcJob.queue_total ?? null}
              estimatedStart={hpcJob.estimated_start ?? null}
              estimatedStartPending={hpcJob.estimated_start_pending ?? false}
              queuedSince={hpcJob.queued_since ?? hpcJob.created_at ?? null}
            />
          ) : null}
          {hpcJob?.error ? <p className="mt-2 text-red-200">{hpcJob.error}</p> : null}
        </div>
      ) : null}
    </section>
  );
}
