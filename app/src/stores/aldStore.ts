import { create } from "zustand";

import type {
  AldActiveSpaceConfig,
  AldAnsatzConfig,
  AldExperimentConfig,
  AldMoleculePreset,
  AldSolverConfig,
  HpcJob,
  HpcResourcesRequest,
} from "../types";

// Coordonnées des presets exposés par le dépôt quantum-ald-simulation
// (MoleculeSpec.predefined dans src/quantum_ald/experiment.py) — dupliquées
// ici car ExperimentConfig.from_dict côté serveur exige des atomes
// explicites (pas de nom de preset accepté dans le JSON de requête).
const MOLECULE_PRESETS: Record<AldMoleculePreset, AldExperimentConfig["molecule"]> = {
  h2: {
    name: "H2",
    atoms: [
      { symbol: "H", x: 0, y: 0, z: 0 },
      { symbol: "H", x: 0, y: 0, z: 0.74 },
    ],
    charge: 0,
    spin: 0,
    basis: "sto-3g",
    unit: "angstrom",
  },
  lih: {
    name: "LiH",
    atoms: [
      { symbol: "Li", x: 0, y: 0, z: 0 },
      { symbol: "H", x: 0, y: 0, z: 1.64 },
    ],
    charge: 0,
    spin: 0,
    basis: "sto-3g",
    unit: "angstrom",
  },
  h2o: {
    name: "H2O",
    atoms: [
      { symbol: "O", x: 0.0, y: 0.0, z: 0.11872 },
      { symbol: "H", x: 0.0, y: 0.755453, z: -0.47488 },
      { symbol: "H", x: 0.0, y: -0.755453, z: -0.47488 },
    ],
    charge: 0,
    spin: 0,
    basis: "sto-3g",
    unit: "angstrom",
  },
};

// Nombre total d'électrons / d'orbitales moléculaires (base sto-3g) pour
// chaque preset — bornes de l'active space côté UI (cf. ActiveSpaceConfig
// .validate_for_system dans quantum_ald/active_space.py : n_active_electrons
// <= total_electrons, n_active_orbitals <= total_orbitals, et le nombre
// d'électrons de coeur (total - actifs)/2 doit être entier, donc
// n_active_electrons doit rester pair ici puisque les 3 presets ont un
// total_electrons pair).
export const MOLECULE_BOUNDS: Record<AldMoleculePreset, { totalElectrons: number; totalOrbitals: number }> = {
  h2: { totalElectrons: 2, totalOrbitals: 2 },
  lih: { totalElectrons: 4, totalOrbitals: 6 },
  h2o: { totalElectrons: 10, totalOrbitals: 7 },
};

// Active space par défaut raisonnable pour chaque preset — requis dès que
// "casci" ou "vqe" est demandé (cf. ExperimentConfig.__post_init__, schéma
// version 1 : CASCI est la référence du solveur actif, VQE requiert CASCI).
// Point de départ de l'état éditable ci-dessous, pas une valeur figée.
const DEFAULT_ACTIVE_SPACE: Record<AldMoleculePreset, AldActiveSpaceConfig> = {
  h2: { n_active_electrons: 2, n_active_orbitals: 2, orbital_indices: [0, 1], selection_mode: "manual" },
  lih: { n_active_electrons: 2, n_active_orbitals: 2, orbital_indices: [1, 2], selection_mode: "manual" },
  h2o: { n_active_electrons: 2, n_active_orbitals: 2, orbital_indices: [3, 4], selection_mode: "manual" },
};

const DEFAULT_ANSATZ: AldAnsatzConfig = {
  ansatz_type: "uccsd",
  reps: 1,
  preserve_spin: true,
  generalized: false,
  initialization: "zeros",
};

const DEFAULT_SOLVER: AldSolverConfig = {
  optimizer: "slsqp",
  maxiter: 100,
  tolerance: 1e-9,
  initialization: "ansatz_default",
  random_seeds: [],
  random_scale: 0.05,
  execution_mode: "exact_statevector",
};

// Réaligne orbital_indices sur une nouvelle longueur n_active_orbitals en
// gardant les indices déjà choisis quand c'est possible, plutôt que de tout
// régénérer (évite de surprendre l'utilisateur à chaque clic sur le slider
// "Active orbitals") :
// - si la liste rétrécit, on tronque par la fin ;
// - si elle s'agrandit, on ajoute le premier indice libre au-dessus du
//   maximum courant, et on reboucle depuis 0 si on atteint totalOrbitals
//   (ne devrait arriver qu'avec des bornes déjà très serrées).
function resizeOrbitalIndices(current: number[], nActiveOrbitals: number, totalOrbitals: number): number[] {
  const next = current.slice(0, nActiveOrbitals);
  let candidate = next.length > 0 ? Math.max(...next) + 1 : 0;
  while (next.length < nActiveOrbitals) {
    if (candidate >= totalOrbitals) {
      candidate = 0;
      while (next.includes(candidate)) candidate += 1;
    }
    if (!next.includes(candidate)) {
      next.push(candidate);
    }
    candidate += 1;
  }
  return next.sort((a, b) => a - b);
}

function experimentForPreset(
  preset: AldMoleculePreset,
  methods: AldExperimentConfig["methods"],
  activeSpace: AldActiveSpaceConfig,
  ansatz: AldAnsatzConfig,
  solver: AldSolverConfig,
): AldExperimentConfig {
  const needsActiveSpace = methods.includes("casci") || methods.includes("vqe");
  const needsVqe = methods.includes("vqe");
  return {
    schema_version: "1",
    molecule: MOLECULE_PRESETS[preset],
    active_spaces: needsActiveSpace ? [activeSpace] : [],
    methods,
    mapping: "jordan-wigner",
    ansatz: needsVqe ? ansatz : null,
    solver: needsVqe ? solver : null,
    execution_mode: "exact_statevector",
    chemical_accuracy_hartree: 0.0016,
  };
}

interface AldState {
  moleculePreset: AldMoleculePreset;
  methods: AldExperimentConfig["methods"];
  activeSpace: AldActiveSpaceConfig;
  ansatz: AldAnsatzConfig;
  solver: AldSolverConfig;
  hpcJob: HpcJob | null;
  hpcResources: HpcResourcesRequest;
  setMoleculePreset: (preset: AldMoleculePreset) => void;
  setMethods: (methods: AldExperimentConfig["methods"]) => void;
  setActiveSpace: (patch: Partial<AldActiveSpaceConfig>) => void;
  setAnsatz: (patch: Partial<AldAnsatzConfig>) => void;
  setSolver: (patch: Partial<AldSolverConfig>) => void;
  setHpcJob: (job: HpcJob | null) => void;
  setHpcResources: (resources: Partial<HpcResourcesRequest>) => void;
  buildExperiment: () => AldExperimentConfig;
}

export const useAldStore = create<AldState>((set, get) => ({
  moleculePreset: "h2",
  methods: ["hf", "casci", "fci", "vqe"],
  activeSpace: DEFAULT_ACTIVE_SPACE.h2,
  ansatz: DEFAULT_ANSATZ,
  solver: DEFAULT_SOLVER,
  hpcJob: null,
  hpcResources: {},
  setMoleculePreset: (moleculePreset) =>
    // L'active space dépend du nombre d'électrons/orbitales de la molécule
    // (cf. MOLECULE_BOUNDS) : on repart du défaut du nouveau preset plutôt
    // que de garder une config potentiellement invalide pour lui. L'ansatz
    // et le solveur, eux, ne dépendent pas de la molécule : conservés tels quels.
    set({ moleculePreset, activeSpace: DEFAULT_ACTIVE_SPACE[moleculePreset] }),
  setMethods: (methods) => set({ methods }),
  setActiveSpace: (patch) =>
    set((state) => {
      const next: AldActiveSpaceConfig = { ...state.activeSpace, ...patch };
      if (patch.n_active_orbitals !== undefined && next.selection_mode !== "canonical") {
        const totalOrbitals = MOLECULE_BOUNDS[state.moleculePreset].totalOrbitals;
        next.orbital_indices = resizeOrbitalIndices(state.activeSpace.orbital_indices ?? [], patch.n_active_orbitals, totalOrbitals);
      }
      if (next.selection_mode === "canonical") {
        next.orbital_indices = undefined;
      }
      return { activeSpace: next };
    }),
  setAnsatz: (patch) => set((state) => ({ ansatz: { ...state.ansatz, ...patch } })),
  setSolver: (patch) => set((state) => ({ solver: { ...state.solver, ...patch } })),
  setHpcJob: (hpcJob) => set({ hpcJob }),
  setHpcResources: (resources) => set((state) => ({ hpcResources: { ...state.hpcResources, ...resources } })),
  buildExperiment: () => {
    const state = get();
    return experimentForPreset(state.moleculePreset, state.methods, state.activeSpace, state.ansatz, state.solver);
  },
}));
