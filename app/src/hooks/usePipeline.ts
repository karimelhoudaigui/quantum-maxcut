import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import {
  cancelHpcJob,
  generateGraph,
  getHpcJob,
  getPipelineStatus,
  getWorkers,
  hasHpcToken,
  runHpcPipeline,
  runPipeline,
} from "../lib/api";
import { usePipelineStore } from "../stores/pipelineStore";
import { isHpcJobActive } from "../types";

export function useGraphGeneration() {
  const config = usePipelineStore((state) => state.config);
  const randomizeSeed = usePipelineStore((state) => state.randomizeSeed);
  const setConfig = usePipelineStore((state) => state.setConfig);
  const setGraph = usePipelineStore((state) => state.setGraph);

  return useMutation({
    mutationFn: () => {
      if (randomizeSeed) {
        const seed = Math.floor(Math.random() * 1_000_000);
        setConfig({ seed });
        return generateGraph({ ...config, seed });
      }
      return generateGraph(config);
    },
    onSuccess: setGraph,
  });
}

export function usePipelineRunner() {
  const config = usePipelineStore((state) => state.config);
  const graph = usePipelineStore((state) => state.graph);
  const job = usePipelineStore((state) => state.job);
  const hpcJob = usePipelineStore((state) => state.hpcJob);
  const annealing = usePipelineStore((state) => state.annealing);
  const enableAnimations = usePipelineStore((state) => state.enableAnimations);
  const hpcResources = usePipelineStore((state) => state.hpcResources);
  const setJob = usePipelineStore((state) => state.setJob);
  const setHpcJob = usePipelineStore((state) => state.setHpcJob);

  const run = useMutation({
    mutationFn: () => {
      if (!graph) {
        throw new Error("Generate a graph before running the pipeline.");
      }
      return runPipeline(graph, annealing);
    },
    onSuccess: setJob,
  });

  const status = useQuery({
    queryKey: ["pipeline-status", job?.job_id],
    queryFn: () => getPipelineStatus(job?.job_id ?? ""),
    enabled: Boolean(job?.job_id) && job?.status !== "completed" && job?.status !== "failed",
    refetchInterval: 1200,
  });

  const hpcRun = useMutation({
    mutationFn: async () => {
      if (hpcJob && isHpcJobActive(hpcJob.status)) {
        await cancelHpcJob(hpcJob.job_id).catch(() => undefined);
      }
      return runHpcPipeline(config, annealing, enableAnimations, hpcResources);
    },
    onMutate: () => setHpcJob(null),
    onSuccess: setHpcJob,
  });

  const hpcStatus = useQuery({
    queryKey: ["hpc-job-status", hpcJob?.job_id],
    queryFn: () => getHpcJob(hpcJob?.job_id ?? ""),
    enabled: Boolean(hpcJob?.job_id) && Boolean(hpcJob && isHpcJobActive(hpcJob.status)),
    refetchInterval: 3000,
  });

  const hpcStop = useMutation({
    mutationFn: () => {
      if (!hpcJob) {
        throw new Error("No HPC job to stop.");
      }
      return cancelHpcJob(hpcJob.job_id);
    },
    onSuccess: setHpcJob,
  });

  // enabled: hasHpcToken() — n'interroge /api/workers que si un jeton HPC a
  // déjà été fourni par ailleurs (ex. un précédent Run HPC), pour ne jamais
  // déclencher le window.prompt du jeton juste pour savoir si le bouton doit
  // être actif. Tant qu'aucun jeton n'est connu, workers.isSuccess reste
  // false et PipelineRunner retombe sur son comportement précédent (bouton
  // actif dès qu'un graphe existe) plutôt que de bloquer sans pouvoir vérifier.
  const workers = useQuery({
    queryKey: ["hpc-workers"],
    queryFn: getWorkers,
    enabled: hasHpcToken(),
    refetchInterval: 5000,
    retry: 1,
  });

  useEffect(() => {
    if (status.data && status.data.job_id === job?.job_id) {
      setJob(status.data);
    }
  }, [job?.job_id, setJob, status.data]);

  useEffect(() => {
    if (hpcStatus.data && hpcStatus.data.job_id === hpcJob?.job_id) {
      setHpcJob(hpcStatus.data);
    }
  }, [hpcJob?.job_id, hpcStatus.data, setHpcJob]);

  return { run, status, hpcRun, hpcStatus, hpcStop, workers };
}
