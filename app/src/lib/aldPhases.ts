import type { AldMethod, HpcJobStatus, HpcPhaseUpdate } from "../types";
import type { PhaseStep } from "../components/PhaseSteps";

// Dérive les cartes de phase ALD à partir de progress.phases (cf.
// run_ald_job.py côté worker, qui écrit maintenant une entrée par phase
// terminée dans le même format que run_job.py côté MaxCut) — même principe
// que hpcStepsFromProgress() dans PipelineRunner.tsx, mais pour un pipeline
// dont l'ensemble des phases dépend des méthodes demandées plutôt que fixe.
//
// Phases émises par quantum_ald (cf. experiment.py/active_space_sweep.py,
// _emit_progress) :
//   - toujours : validate, molecule
//   - "scf" (Hartree-Fock partagé) : toujours
//   - "active_space"/"mapping"/"vqe" : seulement si au moins un active space
//     est configuré, c'est-à-dire si "casci" ou "vqe" est demandé (cf.
//     aldStore.ts, experimentForPreset -> needsActiveSpace) — CASCI/VQE
//     tournent ensemble dès qu'un active space existe, ActiveSpaceSweepConfig
//     n'a pas de bascule "vqe" indépendante de "casci" côté backend.
//   - "comparison" : toujours, en dernier.
const ALD_PHASE_LABELS: Record<string, string> = {
  validate: "Validate",
  molecule: "Molecule",
  scf: "Hartree-Fock (SCF)",
  active_space: "Active space (CASCI)",
  mapping: "Jordan-Wigner mapping",
  vqe: "VQE (UCCSD)",
  comparison: "Compare",
};

export function aldPhaseOrder(methods: AldMethod[]): string[] {
  const needsActiveSpace = methods.includes("casci") || methods.includes("vqe");
  return [
    "validate",
    "molecule",
    "scf",
    ...(needsActiveSpace ? ["active_space", "mapping", "vqe"] : []),
    "comparison",
  ];
}

export function aldStepsFromProgress(
  methods: AldMethod[],
  phases: HpcPhaseUpdate[],
  jobStatus: HpcJobStatus | undefined,
): PhaseStep[] {
  // Plusieurs active spaces rejoueraient le même nom de phase
  // (active_space/mapping/vqe) plusieurs fois (cf. active_space_index dans
  // les détails) — aldStore.ts n'en envoie qu'un seul pour l'instant, donc
  // "la dernière entrée vue par phase" revient à "la seule" en pratique.
  const lastByPhase = new Map<string, HpcPhaseUpdate>();
  for (const phase of phases) {
    lastByPhase.set(phase.phase, phase);
  }

  const jobFailed = jobStatus === "error" || jobStatus === "cancelled";
  const jobRunning = jobStatus === "running";
  let previousDone = true;

  return aldPhaseOrder(methods).map((phaseId) => {
    const label = ALD_PHASE_LABELS[phaseId] ?? phaseId;
    const done = lastByPhase.get(phaseId);
    if (done) {
      previousDone = true;
      return {
        id: phaseId,
        label,
        status: done.status === "failed" ? "failed" : "completed",
        metric_label: done.message ? "Status" : null,
        metric_value: done.message ?? null,
        duration_seconds: done.duration_seconds,
      };
    }

    const isNext = previousDone;
    previousDone = false;
    if (jobFailed) {
      return { id: phaseId, label, status: isNext ? "failed" : "pending", metric_label: null, metric_value: null };
    }
    return {
      id: phaseId,
      label,
      status: isNext && jobRunning ? "running" : "pending",
      metric_label: null,
      metric_value: null,
    };
  });
}
