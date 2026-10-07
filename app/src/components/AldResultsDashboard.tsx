import { Download } from "lucide-react";

import { useAldStore } from "../stores/aldStore";

// Clés attendues dans ExperimentResult.results.global_references (cf.
// quantum_ald/experiment.py, ExperimentResult.to_dict) — affichées quelle
// que soit la forme exacte de active_spaces, qui elle varie par expérience.
const REFERENCE_LABELS: Record<string, string> = {
  hartree_fock: "Hartree-Fock",
  fci_full_space: "FCI (full space)",
};

// ExperimentResult.status (cf. quantum_ald/experiment.py, run_experiment) :
// "completed"/"partial"/"invalid_configuration"/"failed" — sans code couleur,
// ce statut en texte neutre passait inaperçu à côté des cartes "Global
// references" (valeurs HF/FCI, en vert) qui restent affichées même si TOUS
// les active spaces sont invalides (HF/FCI pleine échelle ne dépendent pas
// de l'active space, cf. _run_global_references) : un run invalid_configuration
// semblait "à moitié réussi" alors qu'aucun CASCI/VQE n'a pu tourner.
const STATUS_COLOR_CLASSES: Record<string, string> = {
  completed: "text-primary",
  partial: "text-yellow-400",
  invalid_configuration: "text-red-300",
  failed: "text-red-300",
};

export function AldResultsDashboard() {
  const hpcJob = useAldStore((state) => state.hpcJob);
  const result = hpcJob?.result;
  const status = typeof result?.["status"] === "string" ? (result["status"] as string) : null;
  const experimentId = typeof result?.["experiment_id"] === "string" ? (result["experiment_id"] as string) : null;
  const globalReferences = (result?.["results"] as Record<string, unknown> | undefined)?.["global_references"] as
    | Record<string, { status?: string; energy_total_hartree?: number | null }>
    | undefined;
  const comparisonTable = (result?.["comparison_table"] as Record<string, unknown>[] | undefined) ?? [];
  const warnings = (result?.["warnings"] as Record<string, unknown>[] | undefined) ?? [];
  const errors = (result?.["errors"] as Record<string, unknown>[] | undefined) ?? [];

  return (
    <aside className="flex min-h-0 flex-col gap-4 overflow-y-auto overscroll-contain border-t border-border bg-muted/30 p-4 sm:p-5 lg:h-[100svh] lg:border-t-0 lg:border-l">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase text-foreground/50">Results</p>
          <h2 className="text-xl font-semibold">Experiment result</h2>
        </div>
        <button
          type="button"
          disabled={!result}
          onClick={() => exportJson(result)}
          className="rounded-md border border-border p-2 text-foreground/75 transition hover:bg-background disabled:opacity-40"
          title="Export JSON"
        >
          <Download size={16} />
        </button>
      </div>

      {result ? (
        <div className="rounded-md border border-border bg-background/70 p-3 text-xs text-foreground/60">
          <p>
            Status:{" "}
            <span className={`font-medium ${status ? (STATUS_COLOR_CLASSES[status] ?? "text-foreground") : "text-foreground"}`}>
              {status ?? "—"}
            </span>
          </p>
          {experimentId ? <p className="mt-1 truncate font-mono text-foreground/45">{experimentId}</p> : null}
        </div>
      ) : null}

      {globalReferences ? (
        <div className="rounded-md border border-border bg-background/70 p-4">
          <p className="mb-3 text-sm font-semibold">Global references</p>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(globalReferences).map(([key, value]) => (
              <article key={key} className="rounded-md border border-border bg-background/70 p-3">
                <p className="text-xs text-foreground/55">{REFERENCE_LABELS[key] ?? key}</p>
                <p className="mt-2 font-mono text-lg font-semibold text-primary">
                  {typeof value.energy_total_hartree === "number" ? value.energy_total_hartree.toFixed(6) : "—"}
                </p>
                <p className="mt-1 text-[11px] text-foreground/45">{value.status ?? ""}</p>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {comparisonTable.length > 0 ? (
        <div className="rounded-md border border-border bg-background/70 p-4">
          <p className="mb-3 text-sm font-semibold">Active-space comparison</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-foreground/50">
                  {Object.keys(comparisonTable[0]).map((column) => (
                    <th key={column} className="whitespace-nowrap px-2 py-1 font-medium">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonTable.map((row, index) => (
                  <tr key={index} className="border-t border-border/60">
                    {Object.values(row).map((value, columnIndex) => (
                      <td key={columnIndex} className="whitespace-nowrap px-2 py-1 font-mono text-foreground/75">
                        {typeof value === "number" ? value.toFixed(6) : String(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {warnings.length > 0 ? (
        <div className="rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3 text-xs text-yellow-100">
          {warnings.map((warning, index) => (
            <p key={index}>{String(warning["message"] ?? warning["code"])}</p>
          ))}
        </div>
      ) : null}

      {errors.length > 0 ? (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
          {errors.map((error, index) => (
            <p key={index}>{String(error["message"] ?? error["code"])}</p>
          ))}
        </div>
      ) : null}
    </aside>
  );
}

function exportJson(result: Record<string, unknown> | null | undefined) {
  if (!result) {
    return;
  }
  const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "quantum-ald-simulation-result.json";
  anchor.click();
  URL.revokeObjectURL(url);
}
