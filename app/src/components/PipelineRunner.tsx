import { Activity, Check, Cloud, Loader2, Square, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { usePipelineRunner } from "../hooks/usePipeline";
import { buildInfo, formatBuildInfoDate } from "../lib/buildInfo";
import { usePipelineStore } from "../stores/pipelineStore";
import { isHpcJobActive } from "../types";
import type { HpcJobStatus, HpcPhaseUpdate, HpcResourcesRequest, HpcRoundingProgress, HpcWorkerCapabilities, PipelineStep } from "../types";

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

// Formate des minutes en libellé lisible : "45min", "3h30", "2j 4h" — la
// granularité affichée s'adapte à l'ordre de grandeur (minutes seules en
// dessous d'1h, heures:minutes en dessous d'1j, jours+heures au-delà)
// plutôt que d'afficher un nombre de minutes à 4 chiffres.
function formatMinutes(minutes: number): string {
  const total = Math.round(minutes);
  const days = Math.floor(total / (24 * 60));
  const hours = Math.floor((total % (24 * 60)) / 60);
  const mins = total % 60;

  if (days > 0) {
    return hours > 0 ? `${days}j ${hours}h` : `${days}j`;
  }
  if (hours > 0) {
    return mins > 0 ? `${hours}h${String(mins).padStart(2, "0")}` : `${hours}h`;
  }
  return `${mins}min`;
}

// Compte à rebours "mm:ss" / "hh:mm:ss" / "Nj hh:mm:ss" jusqu'à `target` (Date) —
// même logique de granularité que formatMinutes mais avec les secondes, utiles ici
// puisque la valeur défile en direct plutôt que d'être lue une fois.
function formatCountdown(remainingSeconds: number): string {
  const total = Math.max(0, Math.round(remainingSeconds));
  const days = Math.floor(total / (24 * 3600));
  const hours = Math.floor((total % (24 * 3600)) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const hhmmss = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  if (days > 0) return `${days}j ${hhmmss}`;
  if (hours > 0) return hhmmss;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// Tick à la seconde tant que `active` — sert à recalculer un compte à rebours en
// direct sans dépendre de la fréquence des job_update reçus du worker (~3s).
function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

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
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
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
            onClick={() => hpcRun.mutate()}
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
      </div>

      {workersKnown ? (
        <p className="mb-3 -mt-2 text-right text-[11px] text-foreground/40">
          {workerCount > 0
            ? `${workerCount} HPC worker${workerCount > 1 ? "s" : ""} connected to hpc-bridge`
            : "No HPC worker connected to hpc-bridge"}
        </p>
      ) : null}

      <HpcResourceSettings capabilities={workerCapabilities} resources={hpcResources} onChange={setHpcResources} />

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

// Paliers du crescendo de couleur ci-dessous, en minutes d'attente dans la
// queue (queuedSince) : sous 5min, texte neutre ; 5-10min jaune, 10-20min
// orange, au-delà rouge — pour signaler visuellement qu'une attente sur la
// partition preemptible s'éternise, avant même de savoir si/quand SLURM
// fournira une estimation de démarrage.
const QUEUE_WAIT_COLOR_STEPS: { afterMinutes: number; className: string }[] = [
  { afterMinutes: 20, className: "text-red-400" },
  { afterMinutes: 10, className: "text-orange-400" },
  { afterMinutes: 5, className: "text-yellow-400" },
];

function queueWaitColorClassName(waitMinutes: number | null): string {
  if (waitMinutes == null) return "text-foreground/70";
  const step = QUEUE_WAIT_COLOR_STEPS.find((s) => waitMinutes >= s.afterMinutes);
  return step?.className ?? "text-foreground/70";
}

// Rang du job dans la file d'attente de sa partition (cf. hpc_worker.py,
// get_queue_position) tant qu'il reste "queued_slurm" : toujours disponible,
// contrairement à l'heure de démarrage estimée par le scheduler backfill
// (squeue --start) — sur curta, ce dernier ne tourne que toutes les minutes,
// donc --start renvoie systématiquement N/A pour un job tout juste soumis.
// Le worker ne le sollicite qu'après ce délai (estimated_start_pending tombe
// alors à false, avec ou sans estimation exploitable) : tant qu'on attend
// encore ce premier essai, un spinner l'indique à côté du rang déjà connu —
// et reste affiché même si une tentative échoue transitoirement (le worker
// ne renvoie plus jamais estimated_start à null une fois obtenu, cf.
// hpc_worker.py poll_slurm_state_until_running), pour ne jamais laisser un
// trou muet entre le spinner et le compte à rebours.
function QueuePosition({
  position,
  total,
  estimatedStart,
  estimatedStartPending,
  queuedSince,
}: {
  position: number;
  total: number | null;
  estimatedStart: string | null;
  estimatedStartPending: boolean;
  queuedSince: string | null;
}) {
  const label =
    position <= 1
      ? "next in queue"
      : total != null
        ? `#${position} of ${total} pending`
        : `#${position} in queue`;

  const now = useNow(estimatedStart != null || queuedSince != null);
  const targetMs = estimatedStart ? new Date(estimatedStart).getTime() : null;
  const remainingSeconds = targetMs != null ? (targetMs - now) / 1000 : null;
  const queuedSinceMs = queuedSince ? new Date(queuedSince).getTime() : null;
  const waitMinutes = queuedSinceMs != null ? (now - queuedSinceMs) / 60000 : null;
  const waitColorClassName = queueWaitColorClassName(waitMinutes);

  return (
    <div className="mt-1 flex items-center justify-between gap-3 text-xs text-foreground/50">
      <span className="flex items-center gap-1.5">
        <span title="Rank among pending jobs on this partition — indicative, not a time estimate">
          Queue position: {label}
        </span>
        {estimatedStart && targetMs != null && remainingSeconds != null ? (
          <span className={waitColorClassName} title="Estimated by SLURM's backfill scheduler — not a guarantee">
            · estimated{" "}
            <span className="font-bold">
              {remainingSeconds > 0 ? `starting in ${formatCountdown(remainingSeconds)}` : "starting any moment"}
            </span>
          </span>
        ) : estimatedStartPending ? (
          <span className={`inline-flex items-center gap-1 ${waitColorClassName}`}>
            <Loader2 className="h-3 w-3 animate-spin" />
            estimating start time…
          </span>
        ) : null}
      </span>
      {targetMs != null ? (
        <span className={waitColorClassName} title="Estimated by SLURM's backfill scheduler — not a guarantee">
          est. {new Date(targetMs).toLocaleString()}
        </span>
      ) : null}
    </div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  suffix = "",
  formatValue,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix?: string;
  formatValue?: (value: number) => string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-foreground/60">
      <span className="flex items-center justify-between">
        <span>{label}</span>
        <span className="font-mono text-foreground/80">{formatValue ? formatValue(value) : `${value}${suffix}`}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={Math.min(Math.max(value, min), max)}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-primary"
      />
    </label>
  );
}

// Menu de paramétrage du run HPC, replié par défaut (élément <details> natif,
// même pattern que ResultJson ci-dessous) : les bornes (partitions proposées,
// cœurs/mémoire max, temps max par partition) viennent de ce que le worker
// connecté a annoncé à sa connexion (cf. hpc_worker.py WorkerConfig/register,
// sl_server.py Worker.capabilities) — un client ne peut jamais les dépasser,
// quoi qu'il envoie ici (revérifié côté worker, cf. resolve_job_resources).
function HpcResourceSettings({
  capabilities,
  resources,
  onChange,
}: {
  capabilities: HpcWorkerCapabilities | undefined;
  resources: HpcResourcesRequest;
  onChange: (patch: Partial<HpcResourcesRequest>) => void;
}) {
  const partitionNames = useMemo(
    () => (capabilities ? Object.keys(capabilities.partitions).sort() : []),
    [capabilities],
  );
  const selectedPartition = resources.partition ?? capabilities?.default_partition ?? partitionNames[0];
  const partitionInfo = selectedPartition ? capabilities?.partitions[selectedPartition] : undefined;
  const maxCpus = capabilities?.max_cpus ?? 32;
  const maxMemGb = capabilities?.max_mem_gb ?? 0;
  // Le worker peut annoncer "pas de plafond configuré" (max_mem_gb=0, cf.
  // --max-mem-gb) : un slider a quand même besoin d'une borne finie pour être
  // utilisable, 128 Go sert alors de repère purement indicatif côté UI — le
  // worker, lui, n'appliquera aucun plafond réel dans ce cas (cf. resolve_job_resources).
  const memSliderMax = maxMemGb > 0 ? maxMemGb : 128;
  const defaultTimeMin = capabilities?.default_time_min_minutes ?? 20;
  const timeMinSliderMax = partitionInfo?.max_time_minutes ?? 1440;

  return (
    <details className="mb-4 rounded-md border border-border bg-background/60">
      <summary className="cursor-pointer select-none px-3 py-2 text-xs font-medium text-foreground/60 hover:text-foreground">
        Job resources{selectedPartition ? ` (${selectedPartition})` : ""}
      </summary>
      <div className="grid gap-3 border-t border-border p-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1 text-xs text-foreground/60">
          Partition
          <select
            value={selectedPartition ?? ""}
            disabled={partitionNames.length === 0}
            onChange={(e) => onChange({ partition: e.target.value })}
            className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground disabled:opacity-50"
          >
            {partitionNames.length === 0 ? <option value="">(none advertised)</option> : null}
            {partitionNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>

        <SliderField
          label="Cores"
          min={1}
          max={maxCpus}
          value={resources.cpus ?? capabilities?.default_cpus_per_task ?? 8}
          onChange={(cpus) => onChange({ cpus })}
        />

        <SliderField
          label={`Memory (0 = auto${maxMemGb <= 0 ? ", no server-side cap" : ""})`}
          min={0}
          max={memSliderMax}
          suffix=" GB"
          value={resources.mem_gb ?? 0}
          onChange={(mem_gb) => onChange({ mem_gb })}
        />

        <SliderField
          label={`Min time${partitionInfo?.max_time_minutes != null ? ` (partition max ${formatMinutes(partitionInfo.max_time_minutes)})` : ""}`}
          min={1}
          max={timeMinSliderMax}
          formatValue={formatMinutes}
          value={resources.time_min_minutes ?? defaultTimeMin}
          onChange={(time_min_minutes) => onChange({ time_min_minutes })}
        />
      </div>
    </details>
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

function statusIcon(status: PipelineStep["status"], size = 15) {
  return {
    pending: <Activity size={size} />,
    running: <Loader2 className="animate-spin" size={size} />,
    completed: <Check size={size} />,
    failed: <X size={size} />,
  }[status];
}

function StepCard({ step }: { step: PipelineStep }) {
  const icon = statusIcon(step.status);

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
