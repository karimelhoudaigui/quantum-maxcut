import { Activity, Check, Loader2, X } from "lucide-react";

import type { StepStatus } from "../types";

// Extrait de PipelineRunner.tsx (MaxCut) : la carte d'étape (StepCard) et ses
// styles ne dépendent que de StepStatus et d'une poignée de champs
// génériques (label/metric_label/metric_value/duration_seconds) — rien de
// propre à MaxCut. AldPipelineRunner.tsx avait fini par dupliquer
// STEP_STATUS_STYLES/STEP_STATUS_TEXT_STYLES pour sa seule carte "HPC job" ;
// il réutilise maintenant ce module, et gagne au passage l'affichage
// phase par phase (cf. lib/aldPhases.ts) que MaxCut a déjà.
export interface PhaseStep {
  id: string;
  label: string;
  status: StepStatus;
  metric_label: string | null;
  metric_value: number | string | null;
  // number | null | undefined : certaines phases ald_pipeline (validate,
  // comparison) passent directement à "completed" sans "running" préalable
  // côté quantum_ald (cf. experiment.py) — run_ald_job.py ne peut alors pas
  // calculer de durée et envoie `null`, pas juste "absent" (cf. lib/aldPhases.ts).
  duration_seconds?: number | null;
}

export const STEP_STATUS_STYLES: Record<StepStatus, string> = {
  pending: "border-border bg-background/70",
  running: "border-primary/70 bg-primary/10 shadow-[0_0_0_1px_rgba(120,228,202,0.25)]",
  completed: "border-primary bg-primary/20",
  failed: "border-red-500/70 bg-red-500/10",
};

export const STEP_STATUS_TEXT_STYLES: Record<StepStatus, string> = {
  pending: "text-foreground/50",
  running: "text-primary",
  completed: "text-primary",
  failed: "text-red-300",
};

export function statusIcon(status: StepStatus, size = 15) {
  return {
    pending: <Activity size={size} />,
    running: <Loader2 className="animate-spin" size={size} />,
    completed: <Check size={size} />,
    failed: <X size={size} />,
  }[status];
}

export function StepCard({ step }: { step: PhaseStep }) {
  const icon = statusIcon(step.status);

  return (
    <article className={`min-h-28 rounded-md border p-3 transition-colors duration-500 ${STEP_STATUS_STYLES[step.status]}`}>
      <div className="mb-3 flex items-center justify-between">
        <span className={`text-xs font-medium uppercase ${STEP_STATUS_TEXT_STYLES[step.status]}`}>
          {step.status}
          {/* != null (pas !== undefined) : attrape aussi `null`, cf. le commentaire sur
              PhaseStep.duration_seconds — un `null` qui passe ce test a fait planter
              toute la page (TypeError sur .toFixed, cf. git blame). */}
          {step.duration_seconds != null ? ` · ${step.duration_seconds.toFixed(2)}s` : ""}
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
