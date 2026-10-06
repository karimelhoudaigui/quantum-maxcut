import { Activity, Atom, Check, Cloud, Loader2, Square, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { usePipelineRunner } from "../hooks/usePipeline";
import { buildInfo, formatBuildInfoDate } from "../lib/buildInfo";
import { usePipelineStore } from "../stores/pipelineStore";
import { isHpcJobActive } from "../types";
import type { HpcJobStatus, HpcPhaseUpdate, HpcRoundingProgress, PipelineStep } from "../types";
import { formatMinutes, HpcResourceSettings, HpcWorkersStatus } from "./HpcResourceSettings";
import { StepCard, STEP_STATUS_STYLES, STEP_STATUS_TEXT_STYLES } from "./PhaseSteps";
import { QueuePosition } from "./QueuePosition";

const HPC_STATUS_LABELS: Partial<Record<string, string>> = {
  queued_slurm: "queued on SLURM",
};

// buildInfo (cf. lib/buildInfo.ts) vient de vite.config.ts, calculé une seule fois au
// démarrage du process `npm run dev` — figé sur le commit d'alors tant que ce process
// tourne, même après des dizaines de HMR reloads (peut afficher un commit vieux de
// plusieurs jours si `npm run dev` n'a pas été relancé depuis). MODULE_LOAD_TIME, lui,
// est réévalué à chaque HMR de ce module précis (PipelineRunner.tsx est justement le
// fichier modifié à chaque itération) : en dev, on l'affiche à la place de buildInfo,
// qui n'a de sens qu'en build de production (npm run build, un seul process, une seule
// exécution du module).
const MODULE_LOAD_TIME = new Date();

const HPC_PHASE_TO_STEP: Record<HpcPhaseUpdate["phase"], PipelineStep["id"]> = {
  setup: "setup",
  positions: "geometry",
  pulser: "pulser",
  sdp: "sdp",
  rounding: "rounding",
};
// Le cadre "HPC job" suit le même code couleur que les 5 cartes de phase
// ci-dessus (StepCard) : vert tant que le job est en file SLURM ou en cours
// d'exécution, vert plein une fois terminé, rouge en cas d'erreur/annulation.
// Une fois "running", le détail phase par phase prend le relais dans les
// cartes (hpcStepsFromProgress) — ce cadre ne fait que donner l'état global.
function hpcJobToStepStatus(status: HpcJobStatus): PipelineStep["status"] {
  if (status === "done") return "completed";
  if (status === "error" || status === "cancelled") return "failed";
  return "running";
}

// L'icône du cadre, elle, se distingue de statusIcon() : le spinner ne
// tourne que tant que le job est en file d'attente (SLURM pas encore
// démarré) ou en cours d'annulation — une fois réellement "running", il
// n'apparaît plus (les cartes de phase ci-dessus prennent le relais pour
// montrer une progression animée ; garder ce cadre-ci figé évite un spinner
// qui tournerait indéfiniment pendant toute la durée du calcul).
const HPC_SPINNING_STATUSES = new Set<HpcJobStatus>([
  "queued",
  "waiting_for_worker",
  "dispatched",
  "submitting",
  "queued_slurm",
  "cancelling",
]);

function hpcBoxIcon(jobStatus: HpcJobStatus | undefined, submissionFailed: boolean) {
  if (!jobStatus) return submissionFailed ? <X size={16} /> : <Activity size={16} />;
  if (jobStatus === "done") return <Check size={16} />;
  if (jobStatus === "error" || jobStatus === "cancelled") return <X size={16} />;
  if (HPC_SPINNING_STATUSES.has(jobStatus)) return <Loader2 className="animate-spin" size={16} />;
  return <Cloud size={16} />;
}

export function PipelineRunner() {
  const [qpuNoticeVisible, setQpuNoticeVisible] = useState(false);
  const graph = usePipelineStore((state) => state.graph);
  const job = usePipelineStore((state) => state.job);
  const hpcJob = usePipelineStore((state) => state.hpcJob);
  const hpcResources = usePipelineStore((state) => state.hpcResources);
  const setHpcResources = usePipelineStore((state) => state.setHpcResources);
  const { run, hpcRun, hpcStop, workers } = usePipelineRunner();
  // Un seul worker attendu en pratique (POC) — cf. dispatch_to_worker côté SL, qui prend déjà
  // le premier worker connecté sans faire de choix ; on affiche donc ses capacités telles quelles.
  const workerCapabilities = workers.data?.[0]?.capabilities;
  const hpcActive = hpcJob && isHpcJobActive(hpcJob.status);
  const hpcStoppable = hpcActive && hpcJob.status !== "cancelling";
  // Verrou synchrone, à part de hpcRun.isPending : entre le clic physique et le
  // re-render qui applique disabled={hpcRun.isPending}, React (et donc l'état React
  // Query) n'a pas encore eu la main — un second clic assez rapide peut passer avant
  // que le bouton soit visuellement/effectivement désactivé. hpcRunLockRef, lu et posé
  // de façon synchrone dans onClick (avant tout re-render), ferme cette fenêtre : deux
  // clics rapprochés sur "Restart HPC" ont par le passé soumis un second job avant que
  // l'annulation du premier ait pu être déclenchée, laissant un job orphelin sur SLURM.
  const hpcRunLockRef = useRef(false);
  const hpcBoxStatus: PipelineStep["status"] = hpcJob ? hpcJobToStepStatus(hpcJob.status) : hpcRun.error ? "failed" : "pending";

  // workers.isSuccess : on ne sait rien de la disponibilité du cluster tant
  // que /api/workers n'a jamais répondu (ex. aucun jeton HPC connu encore,
  // cf. enabled: hasHpcToken() dans usePipeline.ts) — dans ce cas on ne
  // bloque pas le bouton, on retombe sur le comportement précédent.
  const workersKnown = workers.isSuccess;
  const workerCount = workers.data?.length ?? 0;
  const clusterUnavailable = workersKnown && workerCount === 0;

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
      <div className="mb-4">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/60">Pipeline</h2>
          <p className="text-xl font-semibold">Method: Hybrid Quantum Optimizer HybQuant</p>
          <p
            className="mt-1 font-mono text-[11px] text-foreground/40"
            title={
              import.meta.env.DEV
                ? "Dev server (npm run dev) : reflects the last HMR reload of this file, not the buildInfo commit/date (frozen at dev server startup)."
                : `Build: ${formatBuildInfoDate(buildInfo.buildDate)}\nCommit: ${buildInfo.commitHash}\nCommit date: ${formatBuildInfoDate(buildInfo.commitDate)}`
            }
          >
            {import.meta.env.DEV
              ? `dev server · UI updated ${MODULE_LOAD_TIME.toLocaleString()}`
              : `build ${formatBuildInfoDate(buildInfo.buildDate)} · commit ${buildInfo.commitHash} (${formatBuildInfoDate(buildInfo.commitDate)})`}
          </p>
        </div>
        <div className="mt-4 flex flex-wrap items-stretch gap-2">
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
              disabled={!graph || hpcRun.isPending || clusterUnavailable}
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
                    : "Submit this configuration to hpc-bridge"
              }
            >
              {/* Spinner uniquement pendant la requête POST /api/jobs elle-même (avant
                  que hpcJob n'existe) : une fois le job soumis, le cadre "HPC job"
                  juste en dessous prend le relais avec son propre spinner
                  (hpcBoxIcon) tant qu'il est en file/en cours — un second spinner
                  ici tout du long serait redondant. */}
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

          <button
            type="button"
            disabled={!graph}
            onClick={() => setQpuNoticeVisible(true)}
            className="flex items-center gap-2 rounded-md border border-cyan-300/45 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200/70 hover:bg-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-40"
            title={graph ? "Prepare this configuration for quantum hardware" : "Generate a graph before preparing a QPU run"}
          >
            <Atom size={16} />
            Run QPU
          </button>
        </div>
      </div>

      <HpcWorkersStatus workers={workers} />

      <HpcResourceSettings capabilities={workerCapabilities} resources={hpcResources} onChange={setHpcResources} />

      {qpuNoticeVisible ? (
        <div
          id="qpu-integration-status"
          className="mb-4 rounded-md border border-cyan-300/30 bg-cyan-300/[0.07] p-3 text-sm"
          role="status"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <Atom className="mt-0.5 shrink-0 text-cyan-200" size={18} />
              <div>
                <p className="font-semibold text-cyan-100">QPU pipeline ready for integration</p>
                <p className="mt-1 text-foreground/65">
                  The current graph and annealing configuration will be submitted to quantum hardware once the QPU provider connector is configured.
                </p>
                <p className="mt-2 font-mono text-xs text-foreground/45">Provider: not configured · Submission: unavailable</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setQpuNoticeVisible(false)}
              className="shrink-0 rounded-md border border-cyan-300/25 p-1.5 text-cyan-100/70 transition hover:bg-cyan-300/10 hover:text-cyan-50"
              title="Close QPU status"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      ) : null}

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
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-foreground/70">
                Status: <span className="font-medium text-foreground">{HPC_STATUS_LABELS[hpcJob.status] ?? hpcJob.status}</span>
                {hpcJob.slurm_job_id ? ` · SLURM ${hpcJob.slurm_job_id}` : ""}
                {hpcJob.resources
                  ? ` · ${hpcJob.resources.nodes} node${hpcJob.resources.nodes > 1 ? "s" : ""} · ${hpcJob.resources.cpus_per_task} cores${
                      hpcJob.resources.partition ? ` · partition ${hpcJob.resources.partition}` : ""
                    }${hpcJob.resources.mem_gb ? ` · ${hpcJob.resources.mem_gb}GB` : ""}${
                      hpcJob.resources.time_min_minutes ? ` · time-min ${formatMinutes(hpcJob.resources.time_min_minutes)}` : ""
                    }`
                  : ""}
              </p>
              {hpcJob.result ? <ResultJson result={hpcJob.result} /> : null}
            </div>
          ) : null}
          {hpcJob?.status === "queued_slurm" && hpcJob.queue_position != null ? (
            <QueuePosition
              position={hpcJob.queue_position}
              total={hpcJob.queue_total ?? null}
              estimatedStart={hpcJob.estimated_start ?? null}
              estimatedStartPending={hpcJob.estimated_start_pending ?? false}
              // created_at (fixé par sl_server.py dès la création du job) sert de repère de
              // repli si queued_since manque encore (ancien worker pas redémarré depuis son
              // ajout) — moins précis (inclut aussi l'attente avant dispatch à un worker),
              // mais évite que le crescendo de couleur reste bloqué au neutre indéfiniment.
              queuedSince={hpcJob.queued_since ?? hpcJob.created_at ?? null}
            />
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

// Même métrique que STEP_RESULT_METRIC_KEY, mais lue depuis la notification de phase en direct
// (HpcPhaseUpdate) plutôt que depuis le résultat final du job — pour afficher chaque valeur dès
// que sa phase se termine, sans attendre que les 4/5 phases suivantes aient aussi fini. "setup" :
// duration_seconds EST déjà la métrique affichée pour cette carte (pas de champ séparé).
const STEP_LIVE_METRIC_KEY: Partial<Record<PipelineStep["id"], keyof HpcPhaseUpdate>> = {
  setup: "duration_seconds",
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
      const liveMetricKey = STEP_LIVE_METRIC_KEY[step.id];
      const liveMetricValue = phase && liveMetricKey ? phase[liveMetricKey] : undefined;
      const metricValue = liveMetricValue ?? result?.[STEP_RESULT_METRIC_KEY[step.id]];
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

