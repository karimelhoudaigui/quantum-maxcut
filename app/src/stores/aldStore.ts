import { create } from "zustand";

import type { AldExperimentConfig, AldMoleculePreset, HpcJob, HpcResourcesRequest } from "../types";

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

// Active space par défaut raisonnable pour chaque preset — requis dès que
// "casci" ou "vqe" est demandé (cf. ExperimentConfig.__post_init__, schéma
// version 1 : CASCI est la référence du solveur actif, VQE requiert CASCI).
const DEFAULT_ACTIVE_SPACE: Record<AldMoleculePreset, AldExperimentConfig["active_spaces"][number]> = {
  h2: { n_active_electrons: 2, n_active_orbitals: 2, orbital_indices: [0, 1], selection_mode: "manual" },
  lih: { n_active_electrons: 2, n_active_orbitals: 2, orbital_indices: [1, 2], selection_mode: "manual" },
  h2o: { n_active_electrons: 2, n_active_orbitals: 2, orbital_indices: [3, 4], selection_mode: "manual" },
};

const DEFAULT_ANSATZ: AldExperimentConfig["ansatz"] = {
  ansatz_type: "uccsd",
  reps: 1,
  preserve_spin: true,
  generalized: false,
  initialization: "zeros",
};

const DEFAULT_SOLVER: AldExperimentConfig["solver"] = {
  optimizer: "slsqp",
  maxiter: 100,
  tolerance: 1e-9,
  initialization: "ansatz_default",
  random_seeds: [],
  random_scale: 0.05,
  execution_mode: "exact_statevector",
};

function experimentForPreset(preset: AldMoleculePreset, methods: AldExperimentConfig["methods"]): AldExperimentConfig {
  const needsActiveSpace = methods.includes("casci") || methods.includes("vqe");
  const needsVqe = methods.includes("vqe");
  return {
    schema_version: "1",
    molecule: MOLECULE_PRESETS[preset],
    active_spaces: needsActiveSpace ? [DEFAULT_ACTIVE_SPACE[preset]] : [],
    methods,
    mapping: "jordan-wigner",
    ansatz: needsVqe ? DEFAULT_ANSATZ : null,
    solver: needsVqe ? DEFAULT_SOLVER : null,
    execution_mode: "exact_statevector",
    chemical_accuracy_hartree: 0.0016,
  };
}

interface AldState {
  moleculePreset: AldMoleculePreset;
  methods: AldExperimentConfig["methods"];
  hpcJob: HpcJob | null;
  hpcResources: HpcResourcesRequest;
  setMoleculePreset: (preset: AldMoleculePreset) => void;
  setMethods: (methods: AldExperimentConfig["methods"]) => void;
  setHpcJob: (job: HpcJob | null) => void;
  setHpcResources: (resources: Partial<HpcResourcesRequest>) => void;
  buildExperiment: () => AldExperimentConfig;
}

export const useAldStore = create<AldState>((set, get) => ({
  moleculePreset: "h2",
  methods: ["hf", "casci", "fci", "vqe"],
  hpcJob: null,
  hpcResources: {},
  setMoleculePreset: (moleculePreset) => set({ moleculePreset }),
  setMethods: (methods) => set({ methods }),
  setHpcJob: (hpcJob) => set({ hpcJob }),
  setHpcResources: (resources) => set((state) => ({ hpcResources: { ...state.hpcResources, ...resources } })),
  buildExperiment: () => experimentForPreset(get().moleculePreset, get().methods),
}));
