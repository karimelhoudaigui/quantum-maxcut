import { Download } from "lucide-react";
import { useMemo } from "react";

import { usePipelineStore } from "../stores/pipelineStore";

const metricKeys = [
  ["ratio_proxy_exact", "Ratio Proxy"],
  ["cut_value", "Cut Value"],
  ["mapping_error", "Mapping Error"],
  ["gain_hybrid_vs_pulser", "Gain Hybrid"],
] as const;

export function ResultsDashboard() {
  const job = usePipelineStore((state) => state.job);
  const result = job?.result;

  const comparisonData = useMemo(
    () =>
      result
        ? [
            { name: "Pulser", ratio: Number(result.ratio_pulser ?? 0) },
            { name: "Hybrid", ratio: Number(result.ratio_hybrid ?? 0) },
          ]
        : [
            { name: "Pulser", ratio: 0 },
            { name: "Hybrid", ratio: 0 },
          ],
    [result],
  );
  const maxRatio = Math.max(...comparisonData.map((item) => item.ratio), 1);

  return (
    <aside className="flex h-[100svh] min-h-0 flex-col gap-4 overflow-y-auto overscroll-contain border-l border-border bg-muted/30 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase text-foreground/50">Results</p>
          <h2 className="text-xl font-semibold">Live metrics</h2>
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

      <div className="grid grid-cols-2 gap-3">
        {metricKeys.map(([key, label]) => (
          <MetricCard key={key} label={label} value={result?.[key]} />
        ))}
      </div>

      <div className="min-h-64 rounded-md border border-border bg-background/70 p-4">
        <p className="mb-4 text-sm font-semibold">Pulser vs Hybrid</p>
        <div className="grid h-[210px] grid-cols-2 items-end gap-4 border-b border-l border-border/70 px-4 pb-6 pt-4">
          {comparisonData.map((item) => (
            <div key={item.name} className="flex h-full min-w-0 flex-col items-center justify-end gap-3">
              <div className="flex h-full w-full items-end justify-center">
                <div
                  className="w-full max-w-[5rem] rounded-t-md bg-primary"
                  style={{ height: `${Math.max(4, (item.ratio / maxRatio) * 100)}%` }}
                />
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-foreground/60">{item.name}</p>
                <p className="mt-1 font-mono text-xs text-primary">{result ? item.ratio.toFixed(5) : "—"}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function MetricCard({ label, value }: { label: string; value: unknown }) {
  const display = typeof value === "number" ? value.toFixed(5) : "—";
  return (
    <article className="rounded-md border border-border bg-background/70 p-3">
      <p className="text-xs text-foreground/55">{label}</p>
      <p className="mt-2 font-mono text-lg font-semibold text-primary">{display}</p>
      <div className="mt-3 h-8 rounded-sm bg-[linear-gradient(90deg,rgba(67,217,184,.1),rgba(67,217,184,.45),rgba(67,217,184,.08))]" />
    </article>
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
  anchor.download = "quantum-maxcut-result.json";
  anchor.click();
  URL.revokeObjectURL(url);
}
