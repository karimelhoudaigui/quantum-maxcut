import { create } from "zustand";

import type { AnnealingConfig, GraphGenerateRequest, GraphResponse, HpcJob, HpcResourcesRequest, PipelineJob } from "../types";

interface PipelineState {
  config: GraphGenerateRequest;
  annealing: AnnealingConfig;
  enableAnimations: boolean;
  randomizeSeed: boolean;
  graph: GraphResponse | null;
  job: PipelineJob | null;
  hpcJob: HpcJob | null;
  hpcResources: HpcResourcesRequest;
  setConfig: (config: Partial<GraphGenerateRequest>) => void;
  setAnnealing: (annealing: Partial<AnnealingConfig>) => void;
  setEnableAnimations: (enableAnimations: boolean) => void;
  setRandomizeSeed: (randomizeSeed: boolean) => void;
  setGraph: (graph: GraphResponse) => void;
  setJob: (job: PipelineJob | null) => void;
  setHpcJob: (job: HpcJob | null) => void;
  setHpcResources: (resources: Partial<HpcResourcesRequest>) => void;
}

export const usePipelineStore = create<PipelineState>((set) => ({
  config: {
    family: "random",
    n_nodes: 6,
    density: 0.6,
    weight_min: 0.5,
    weight_max: 1.5,
    seed: 42,
    optimize_geometry: true,
  },
  annealing: {
    omega_peak_mhz: 2,
    rise_duration: 1000,
    hold_duration: 1000,
    fall_duration: 26000,
    delta_start_pi: 1,
    delta_hold_pi: -0.5,
    delta_end_pi: -1,
    sampling_rate: 0.05,
    n_roundings: 32,
  },
  enableAnimations: false,
  randomizeSeed: false,
  graph: null,
  job: null,
  hpcJob: null,
  hpcResources: {},
  setConfig: (config) => set((state) => ({ config: { ...state.config, ...config } })),
  setAnnealing: (annealing) => set((state) => ({ annealing: { ...state.annealing, ...annealing } })),
  setEnableAnimations: (enableAnimations) => set({ enableAnimations }),
  setRandomizeSeed: (randomizeSeed) => set({ randomizeSeed }),
  setGraph: (graph) => set({ graph }),
  setJob: (job) => set({ job }),
  setHpcJob: (hpcJob) => set({ hpcJob }),
  setHpcResources: (resources) => set((state) => ({ hpcResources: { ...state.hpcResources, ...resources } })),
}));
