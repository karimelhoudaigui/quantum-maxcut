import { Activity, Check, Cloud, Loader2, X } from "lucide-react";

import { usePipelineRunner } from "../hooks/usePipeline";
import { usePipelineStore } from "../stores/pipelineStore";
import type { PipelineStep } from "../types";

export function PipelineRunner() {
  const graph = usePipelineStore((state) => state.graph);
  const job = usePipelineStore((state) => state.job);
  const hpcJob = usePipelineStore((state) => state.hpcJob);
  const { run, hpcRun } = usePipelineRunner();
  const steps = job?.steps ?? [];
  const hpcActive = hpcJob && !["done", "error", "cancelled"].includes(hpcJob.status);

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
        <button
          type="button"
          disabled={!graph || hpcRun.isPending || Boolean(hpcActive)}
          onClick={() => hpcRun.mutate()}
          className="flex items-center gap-2 rounded-md border border-primary/60 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-45"
          title="Submit this configuration to hpc-bridge"
        >
          {hpcRun.isPending || hpcActive ? <Loader2 className="animate-spin" size={16} /> : <Cloud size={16} />}
          Run HPC
        </button>
      </div>

      <div className="mb-4 h-2 overflow-hidden rounded-full bg-background">
        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${job?.progress ?? 0}%` }} />
      </div>

      <div className="grid grid-cols-4 gap-2">
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
          {hpcJob ? (
            <p className="mt-2 text-foreground/70">
              Status: <span className="font-medium text-foreground">{hpcJob.status}</span>
              {hpcJob.slurm_job_id ? ` · SLURM ${hpcJob.slurm_job_id}` : ""}
            </p>
          ) : null}
          {hpcJob?.error ? <p className="mt-2 text-red-200">{hpcJob.error}</p> : null}
          {hpcJob?.result ? <pre className="mt-2 max-h-40 overflow-auto text-xs text-foreground/65">{JSON.stringify(hpcJob.result, null, 2)}</pre> : null}
        </div>
      ) : null}
    </section>
  );
}

const emptySteps: PipelineStep[] = [
  { id: "geometry", label: "Geometry embedding", status: "pending", metric_label: "Mapping error", metric_value: null },
  { id: "pulser", label: "Pulser", status: "pending", metric_label: "Ratio Pulser", metric_value: null },
  { id: "sdp", label: "SDP", status: "pending", metric_label: "Status", metric_value: null },
  { id: "rounding", label: "Rounding", status: "pending", metric_label: "Ratio hybrid", metric_value: null },
];

function StepCard({ step }: { step: PipelineStep }) {
  const icon = {
    pending: <Activity size={15} />,
    running: <Loader2 className="animate-spin" size={15} />,
    completed: <Check size={15} />,
    failed: <X size={15} />,
  }[step.status];

  return (
    <article className="min-h-28 rounded-md border border-border bg-background/70 p-3">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium uppercase text-foreground/50">{step.status}</span>
        <span className="text-foreground/70">{icon}</span>
      </div>
      <h3 className="text-sm font-semibold leading-tight">{step.label}</h3>
      <p className="mt-2 text-xs text-foreground/55">{step.metric_label}</p>
      <p className="mt-1 truncate font-mono text-sm text-primary">
        {typeof step.metric_value === "number" ? step.metric_value.toFixed(5) : step.metric_value ?? "—"}
      </p>
    </article>
  );
}
