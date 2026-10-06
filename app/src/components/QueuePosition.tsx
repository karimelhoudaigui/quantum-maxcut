import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

// Extrait de PipelineRunner.tsx (MaxCut) : ne dépend que de ce que
// hpc_worker.py calcule déjà génériquement pour tout job_kind (queue
// position/estimated_start/queued_since, cf. get_queue_position /
// poll_slurm_state_until_running) — rien de propre à MaxCut. ALD, qui
// soumet aussi un vrai job SLURM, a exactement les mêmes informations à
// afficher tant qu'un job reste "queued_slurm".

// Compte à rebours "mm:ss" / "hh:mm:ss" / "Nj hh:mm:ss" jusqu'à `target` (Date) —
// même logique de granularité que formatMinutes (cf. HpcResourceSettings.tsx)
// mais avec les secondes, utiles ici puisque la valeur défile en direct plutôt
// que d'être lue une fois.
export function formatCountdown(remainingSeconds: number): string {
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

// Paliers du crescendo de couleur ci-dessous, en minutes d'attente : sous 5min, texte
// neutre ; 5-10min jaune, 10-20min orange, au-delà rouge. Basé en priorité sur le temps
// RESTANT estimé avant démarrage (le countdown lui-même : une estimation qui pointe vers
// dans 1j doit être rouge tout de suite, même si le job vient tout juste d'être soumis),
// avec repli sur le temps déjà écoulé dans la queue (queuedSince) tant qu'aucune
// estimation n'est encore disponible (le spinner "estimating..." reste alors affiché).
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
export function QueuePosition({
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
  const elapsedMinutes = queuedSinceMs != null ? (now - queuedSinceMs) / 60000 : null;
  const remainingMinutes = remainingSeconds != null ? remainingSeconds / 60 : null;
  const waitColorClassName = queueWaitColorClassName(remainingMinutes ?? elapsedMinutes);

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
