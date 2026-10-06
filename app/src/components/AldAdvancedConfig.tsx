import type { AldActiveSpaceConfig, AldAnsatzConfig, AldMethod, AldMoleculePreset, AldSolverConfig } from "../types";
import { MOLECULE_BOUNDS } from "../stores/aldStore";

// Menu replié par défaut, même pattern que HpcResourceSettings.tsx : expose
// l'active space (toujours requis dès CASCI/VQE), l'ansatz et le solveur
// VQE (requis seulement pour VQE) — jusqu'ici fixés en dur à une valeur par
// preset côté aldStore.ts, invisibles et non ajustables depuis l'UI.

function NumberSlider({
  label,
  value,
  min,
  max,
  step = 1,
  formatValue,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  formatValue?: (value: number) => string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-foreground/60">
      <span className="flex items-center justify-between">
        <span>{label}</span>
        <span className="font-mono text-foreground/80">{formatValue ? formatValue(value) : value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={Math.min(Math.max(value, min), max)}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-primary"
      />
    </label>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-xs text-foreground/60">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-primary" />
      {label}
    </label>
  );
}

// Parse une liste d'indices séparés par des virgules ("1, 2, 3") en entiers
// non négatifs uniques — utilisé par le champ libre de orbital_indices en
// mode "manual" ; une entrée invalide est simplement ignorée (on garde la
// liste déjà en place plutôt que de bloquer la saisie au milieu de l'édition).
function parseOrbitalIndices(text: string): number[] | null {
  const parts = text.split(",").map((part) => part.trim()).filter((part) => part.length > 0);
  const values = parts.map((part) => Number(part));
  if (values.length === 0 || values.some((value) => !Number.isInteger(value) || value < 0)) {
    return null;
  }
  return values;
}

export function AldAdvancedConfig({
  moleculePreset,
  methods,
  activeSpace,
  onActiveSpaceChange,
  ansatz,
  onAnsatzChange,
  solver,
  onSolverChange,
}: {
  moleculePreset: AldMoleculePreset;
  methods: AldMethod[];
  activeSpace: AldActiveSpaceConfig;
  onActiveSpaceChange: (patch: Partial<AldActiveSpaceConfig>) => void;
  ansatz: AldAnsatzConfig;
  onAnsatzChange: (patch: Partial<AldAnsatzConfig>) => void;
  solver: AldSolverConfig;
  onSolverChange: (patch: Partial<AldSolverConfig>) => void;
}) {
  const needsActiveSpace = methods.includes("casci") || methods.includes("vqe");
  const needsVqe = methods.includes("vqe");
  if (!needsActiveSpace) {
    return null;
  }

  const bounds = MOLECULE_BOUNDS[moleculePreset];
  const nCore = (bounds.totalElectrons - activeSpace.n_active_electrons) / 2;
  const maxActiveOrbitals = Math.max(1, bounds.totalOrbitals - nCore);
  const minActiveOrbitals = Math.ceil(activeSpace.n_active_electrons / 2);
  const isManual = (activeSpace.selection_mode ?? "manual") === "manual";

  return (
    <details className="mb-4 rounded-md border border-border bg-background/60">
      <summary className="cursor-pointer select-none px-3 py-2 text-xs font-medium text-foreground/60 hover:text-foreground">
        Active space{needsVqe ? " / ansatz / solver" : ""}
      </summary>
      <div className="flex flex-col gap-4 border-t border-border p-3">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-foreground/40">Active space</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <NumberSlider
              label={`Active electrons (molecule has ${bounds.totalElectrons})`}
              min={2}
              max={bounds.totalElectrons}
              step={2}
              value={activeSpace.n_active_electrons}
              onChange={(n_active_electrons) => onActiveSpaceChange({ n_active_electrons })}
            />
            <NumberSlider
              label={`Active orbitals (molecule has ${bounds.totalOrbitals})`}
              min={minActiveOrbitals}
              max={maxActiveOrbitals}
              value={activeSpace.n_active_orbitals}
              onChange={(n_active_orbitals) => onActiveSpaceChange({ n_active_orbitals })}
            />
            <label className="flex flex-col gap-1 text-xs text-foreground/60">
              Orbital selection
              <select
                value={activeSpace.selection_mode ?? "manual"}
                onChange={(e) => onActiveSpaceChange({ selection_mode: e.target.value as AldActiveSpaceConfig["selection_mode"] })}
                className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground"
              >
                <option value="manual">Manual</option>
                <option value="canonical">Canonical (automatic)</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-foreground/60">
              Orbital indices{isManual ? "" : " (chosen by the solver)"}
              <input
                type="text"
                disabled={!isManual}
                defaultValue={(activeSpace.orbital_indices ?? []).join(", ")}
                key={(activeSpace.orbital_indices ?? []).join(",")}
                onBlur={(e) => {
                  const parsed = parseOrbitalIndices(e.target.value);
                  if (parsed && parsed.length === activeSpace.n_active_orbitals) {
                    onActiveSpaceChange({ orbital_indices: parsed });
                  } else {
                    e.target.value = (activeSpace.orbital_indices ?? []).join(", ");
                  }
                }}
                placeholder={`${activeSpace.n_active_orbitals} comma-separated indices, 0-based`}
                className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground disabled:opacity-50"
              />
            </label>
          </div>
        </div>

        {needsVqe ? (
          <>
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-foreground/40">Ansatz (UCCSD)</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <NumberSlider
                  label="Repetitions"
                  min={1}
                  max={4}
                  value={ansatz.reps}
                  onChange={(reps) => onAnsatzChange({ reps })}
                />
                <label className="flex flex-col gap-1 text-xs text-foreground/60">
                  Initialization
                  <select
                    value={ansatz.initialization}
                    onChange={(e) => onAnsatzChange({ initialization: e.target.value as AldAnsatzConfig["initialization"] })}
                    className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground"
                  >
                    <option value="zeros">Zeros</option>
                    <option value="random">Random</option>
                  </select>
                </label>
                <div className="flex flex-col gap-2 pt-4">
                  <Checkbox label="Preserve spin" checked={ansatz.preserve_spin} onChange={(preserve_spin) => onAnsatzChange({ preserve_spin })} />
                  <Checkbox label="Generalized" checked={ansatz.generalized} onChange={(generalized) => onAnsatzChange({ generalized })} />
                </div>
              </div>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-foreground/40">Solver (SLSQP)</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <NumberSlider
                  label="Max iterations"
                  min={10}
                  max={500}
                  step={10}
                  value={solver.maxiter}
                  onChange={(maxiter) => onSolverChange({ maxiter })}
                />
                <label className="flex flex-col gap-1 text-xs text-foreground/60">
                  Initialization
                  <select
                    value={solver.initialization}
                    onChange={(e) => onSolverChange({ initialization: e.target.value as AldSolverConfig["initialization"] })}
                    className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground"
                  >
                    <option value="ansatz_default">Ansatz default</option>
                    <option value="random">Random</option>
                  </select>
                </label>
                <NumberSlider
                  label="Random scale"
                  min={0.01}
                  max={1}
                  step={0.01}
                  formatValue={(value) => value.toFixed(2)}
                  value={solver.random_scale}
                  onChange={(random_scale) => onSolverChange({ random_scale })}
                />
              </div>
            </div>
          </>
        ) : null}
      </div>
    </details>
  );
}
