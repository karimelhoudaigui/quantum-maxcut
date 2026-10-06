import { useMemo } from "react";
import type { UseQueryResult } from "@tanstack/react-query";

import type { HpcResourcesRequest, HpcWorker, HpcWorkerCapabilities } from "../types";

// Extrait de PipelineRunner.tsx (MaxCut) pour être réutilisé tel quel par
// AldPipelineRunner.tsx : le menu de paramétrage du run (partition/cœurs/
// mémoire/temps) ne dépend d'aucun concept propre à MaxCut ou à ALD, juste
// des capacités annoncées par le worker connecté et d'un HpcResourcesRequest
// — pas de raison d'avoir deux copies.

// Formate des minutes en libellé lisible : "45min", "3h30", "2j 4h" — la
// granularité affichée s'adapte à l'ordre de grandeur (minutes seules en
// dessous d'1h, heures:minutes en dessous d'1j, jours+heures au-delà)
// plutôt que d'afficher un nombre de minutes à 4 chiffres.
export function formatMinutes(minutes: number): string {
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
// même pattern que ResultJson dans PipelineRunner.tsx) : les bornes (partitions
// proposées, cœurs/mémoire max, temps max par partition) viennent de ce que le
// worker connecté a annoncé à sa connexion (cf. hpc_worker.py WorkerConfig/register,
// sl_server.py Worker.capabilities) — un client ne peut jamais les dépasser,
// quoi qu'il envoie ici (revérifié côté worker, cf. resolve_job_resources).
export function HpcResourceSettings({
  capabilities,
  resources,
  onChange,
}: {
  capabilities: HpcWorkerCapabilities | undefined;
  resources: HpcResourcesRequest;
  onChange: (patch: Partial<HpcResourcesRequest>) => void;
}) {
  // Pas de .sort() : l'ordre vient tel quel du worker (cf. hpc_worker.py,
  // _order_partitions_for_curta — préférences propres à curta, préemptible
  // en premier/formation en dernier, pas un tri alphabétique). JSON.parse
  // préserve l'ordre d'insertion d'un objet pour des clés non-numériques
  // comme des noms de partition, donc Object.keys() ici reflète fidèlement
  // ce que le worker a choisi d'annoncer, dans cet ordre.
  const partitionNames = useMemo(() => (capabilities ? Object.keys(capabilities.partitions) : []), [capabilities]);
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

// Affiche le nombre de workers connectés (même ligne dans PipelineRunner.tsx
// et AldPipelineRunner.tsx, cf. getWorkers()/usePipelineRunner()/
// useAldPipelineRunner()) — et, nouveau, l'erreur elle-même quand la requête
// /api/workers échoue (jusqu'ici totalement silencieux : `workersKnown`
// restait simplement `false`, sans rien afficher, cf. hasHpcToken()). Un
// échec de fetch() bloqué par CORS ne donne presque aucun détail exploitable
// au JS (juste "Failed to fetch"/"NetworkError..." selon le navigateur, la
// vraie raison — ex. origine non autorisée — n'est visible que dans les logs
// serveur) ; on ne prétend donc pas deviner la cause précise, on affiche le
// message brut du navigateur et la piste la plus fréquente rencontrée en
// pratique (tester depuis une origine hors liste blanche CORS, cf.
// SL_CORS_ORIGINS côté sl_server.py).
export function HpcWorkersStatus({ workers }: { workers: UseQueryResult<HpcWorker[], Error> }) {
  if (workers.isError) {
    return (
      <p className="mb-3 -mt-2 rounded-md border border-red-500/40 bg-red-500/10 px-2 py-1.5 text-right text-[11px] text-red-300">
        Unable to reach hpc-bridge ({workers.error.message || "network error"}) — if you're testing from a
        non-default origin (e.g. a network IP instead of localhost), check that it's allowed by SL_CORS_ORIGINS.
      </p>
    );
  }

  if (!workers.isSuccess) {
    return null;
  }

  const workerCount = workers.data.length;
  return (
    <p className="mb-3 -mt-2 text-right text-[11px] text-foreground/40">
      {workerCount > 0
        ? `${workerCount} HPC worker${workerCount > 1 ? "s" : ""} connected to hpc-bridge`
        : "No HPC worker connected to hpc-bridge"}
    </p>
  );
}
