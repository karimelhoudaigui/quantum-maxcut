import { Activity, Check, Cloud, Loader2, Square, X } from "lucide-react";
import { useMemo } from "react";

import { usePipelineRunner } from "../hooks/usePipeline";
import { usePipelineStore } from "../stores/pipelineStore";
import type { HpcPhaseUpdate, HpcRoundingProgress, PipelineStep } from "../types";

const HPC_STATUS_LABELS: Partial<Record<string, string>> = {
  queued_slurm: "queued on SLURM",
};

const HPC_PHASE_TO_STEP: Record<HpcPhaseUpdate["phase"], PipelineStep["id"]> = {
  setup: "setup",
  positions: "geometry",
  pulser: "pulser",
  sdp: "sdp",
  rounding: "rounding",
};

export function PipelineRunner() {
  const graph = usePipelineStore((state) => state.graph);
  const job = usePipelineStore((state) => state.job);
  const hpcJob = usePipelineStore((state) => state.hpcJob);
  const { run, hpcRun, hpcStop } = usePipelineRunner();
  const hpcActive = hpcJob && !["done", "error", "cancelled"].includes(hpcJob.status);
  const hpcStoppable = hpcActive && hpcJob.status !== "cancelling";

  const steps = useMemo(() => {
    if (hpcJob) {
      return hpcStepsFromProgress(
        hpcJob.progress?.phases ?? [],
        hpcJob.status,
        hpcJob.result,
        hpcJob.progress?.current,
      );
    }
    return job?.steps ?? [];
  }, [hpcJob, job?.steps]);

  return (
    <section className="rounded-md border border-border bg-muted/25 p-4 shadow-panel">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/60">Pipeline</h2>
          <p className="text-xl font-semibold">Method: Hybrid Quantum Optimizer HybQuant</p>
        </div>
        <button
          type="button"
          disabled={!graph || run.isPending || job?.status === "running" || job?.status === "queued"}
          onClick={() => run.mutate()}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {run.isPending || job?.status === "running" ? <Loader2 className="animate-spin" size={16} /> : <Activity size={16} />}
          Run
        </button>
        <div className="flex items-stretch overflow-hidden rounded-md border border-primary/60">
          <button
            type="button"
            disabled={!graph || hpcRun.isPending}
            onClick={() => hpcRun.mutate()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-45"
            title={hpcActive ? "Cancel the running HPC job and submit this configuration instead" : "Submit this configuration to hpc-bridge"}
          >
            {hpcRun.isPending || hpcActive ? <Loader2 className="animate-spin" size={16} /> : <Cloud size={16} />}
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
        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${job?.progress ?? 0}%` }} />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {(steps.length > 0 ? steps : emptySteps).map((step) => (
          <StepCard key={step.id} step={step} />
        ))}
      </div>

      {run.error || job?.error ? (
        <p className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {run.error instanceof Error ? run.error.message : job?.error}
        </p>
      ) : null}

      {hpcRun.error || hpcJob ? (
        <div className="mt-4 rounded-md border border-primary/25 bg-primary/5 p-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="font-semibold text-primary">HPC job</span>
            <span className="font-mono text-xs text-foreground/60">{hpcJob?.job_id ?? "not submitted"}</span>
          </div>
          {hpcRun.error ? <p className="mt-2 text-red-200">{hpcRun.error.message}</p> : null}
          {hpcStop.error ? <p className="mt-2 text-red-200">{hpcStop.error.message}</p> : null}
          {hpcJob ? (
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-foreground/70">
                Status: <span className="font-medium text-foreground">{HPC_STATUS_LABELS[hpcJob.status] ?? hpcJob.status}</span>
                {hpcJob.slurm_job_id ? ` · SLURM ${hpcJob.slurm_job_id}` : ""}
                {hpcJob.resources
                  ? ` · ${hpcJob.resources.nodes} node${hpcJob.resources.nodes > 1 ? "s" : ""} · ${hpcJob.resources.cpus_per_task} cores${
                      hpcJob.resources.partition ? ` · partition ${hpcJob.resources.partition}` : ""
                    }`
                  : ""}
              </p>
              {hpcJob.result ? <ResultJson result={hpcJob.result} /> : null}
            </div>
          ) : null}
          {hpcJob?.error ? <p className="mt-2 text-red-200">{hpcJob.error}</p> : null}
        </div>
      ) : null}
    </section>
  );
}

function ResultJson({ result }: { result: Record<string, unknown> }) {
  return (
    <details className="shrink-0 rounded-md border border-border bg-background/60">
      <summary className="cursor-pointer select-none px-2 py-1.5 text-xs font-medium text-foreground/60 hover:text-foreground">
        Raw result JSON
      </summary>
      <pre className="max-h-40 overflow-auto border-t border-border p-2 text-xs text-foreground/65">
        {JSON.stringify(result, null, 2)}
      </pre>
    </details>
  );
}

const emptySteps: PipelineStep[] = [
  { id: "setup", label: "Setup", status: "pending", metric_label: "Import duration", metric_value: null },
  { id: "geometry", label: "Geometry embedding", status: "pending", metric_label: "Mapping error", metric_value: null },
  { id: "pulser", label: "Pulser", status: "pending", metric_label: "Ratio Pulser", metric_value: null },
  { id: "sdp", label: "SDP", status: "pending", metric_label: "Status", metric_value: null },
  { id: "rounding", label: "Rounding", status: "pending", metric_label: "Ratio hybrid", metric_value: null },
];

const STEP_RESULT_METRIC_KEY: Record<PipelineStep["id"], string> = {
  setup: "setup_duration_seconds",
  geometry: "mapping_error",
  pulser: "ratio_pulser",
  sdp: "sdp_status",
  rounding: "ratio_hybrid",
};

function hpcStepsFromProgress(
  phases: HpcPhaseUpdate[],
  jobStatus: string,
  result: Record<string, unknown> | null | undefined,
  current?: HpcRoundingProgress | null,
): PipelineStep[] {
  const completedStepIds = new Set(phases.map((phase) => HPC_PHASE_TO_STEP[phase.phase]));
  const jobFailed = jobStatus === "error" || jobStatus === "cancelled";
  const jobRunning = jobStatus === "running";
  const jobDone = jobStatus === "done";

  // Filet de sécurité : si le job est terminé avec succès, le résultat final
  // contient les durées de toutes les phases même quand le flux de progression
  // (streamé pendant l'exécution) a raté les toutes dernières mises à jour
  // (ex. sdp/rounding relayées trop tard côté worker HPC).
  const phaseDurations = result?.["phase_durations_seconds"] as Record<string, unknown> | undefined;
  const rawDoneKeys = jobDone && phaseDurations && typeof phaseDurations === "object" ? Object.keys(phaseDurations) : [];
  const finalPhaseIds = new Set(
    rawDoneKeys.map((key) => (key === "positions" ? "geometry" : key) as PipelineStep["id"]),
  );

  return emptySteps.map((step, index) => {
    if (completedStepIds.has(step.id) || finalPhaseIds.has(step.id)) {
      const phase = phases.find((p) => HPC_PHASE_TO_STEP[p.phase] === step.id);
      const metricValue = result?.[STEP_RESULT_METRIC_KEY[step.id]];
      const durationKey = step.id === "geometry" ? "positions" : step.id;
      const fallbackDuration = !phase && phaseDurations ? phaseDurations[durationKey] : undefined;
      return {
        ...step,
        status: "completed",
        metric_value: typeof metricValue === "number" || typeof metricValue === "string" ? metricValue : null,
        duration_seconds: phase?.duration_seconds ?? (typeof fallbackDuration === "number" ? fallbackDuration : undefined),
      };
    }
    const previousCompleted = index === 0 || completedStepIds.has(emptySteps[index - 1].id) || finalPhaseIds.has(emptySteps[index - 1].id);
    if (jobFailed) {
      return { ...step, status: previousCompleted ? "failed" : "pending" };
    }
    const running = previousCompleted && jobRunning;
    // La phase rounding parallélise n_roundings essais indépendants sur les
    // cœurs du job SLURM : tant qu'elle tourne, affiche "fait/total" plutôt
    // que le libellé/valeur finaux (ratio_hybrid n'existe pas encore).
    if (running && step.id === "rounding" && current && current.total > 0) {
      return {
        ...step,
        status: "running",
        metric_label: "Rounding trials",
        metric_value: `${current.done}/${current.total}`,
      };
    }
    return { ...step, status: running ? "running" : "pending" };
  });
}

const STEP_STATUS_STYLES: Record<PipelineStep["status"], string> = {
  pending: "border-border bg-background/70",
  running: "border-primary/70 bg-primary/10 shadow-[0_0_0_1px_rgba(120,228,202,0.25)]",
  completed: "border-primary bg-primary/20",
  failed: "border-red-500/70 bg-red-500/10",
};

const STEP_STATUS_TEXT_STYLES: Record<PipelineStep["status"], string> = {
  pending: "text-foreground/50",
  running: "text-primary",
  completed: "text-primary",
  failed: "text-red-300",
};

function StepCard({ step }: { step: PipelineStep }) {
  const icon = {
    pending: <Activity size={15} />,
    running: <Loader2 className="animate-spin" size={15} />,
    completed: <Check size={15} />,
    failed: <X size={15} />,
  }[step.status];

  return (
    <article className={`min-h-28 rounded-md border p-3 transition-colors duration-500 ${STEP_STATUS_STYLES[step.status]}`}>
      <div className="mb-3 flex items-center justify-between">
        <span className={`text-xs font-medium uppercase ${STEP_STATUS_TEXT_STYLES[step.status]}`}>
          {step.status}
          {step.duration_seconds !== undefined ? ` · ${step.duration_seconds.toFixed(2)}s` : ""}
        </span>
        <span className={STEP_STATUS_TEXT_STYLES[step.status]}>{icon}</span>
      </div>
      <h3 className="text-sm font-semibold leading-tight">{step.label}</h3>
      <p className="mt-2 text-xs text-foreground/55">{step.metric_label}</p>
      <p className="mt-1 truncate font-mono text-sm text-primary">
        {typeof step.metric_value === "number" ? step.metric_value.toFixed(5) : step.metric_value ?? "—"}
      </p>
    </article>
  );
}
