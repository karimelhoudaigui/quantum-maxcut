import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { generateGraph, getHpcJob, getPipelineStatus, runHpcPipeline, runPipeline } from "../lib/api";
import { usePipelineStore } from "../stores/pipelineStore";

export function useGraphGeneration() {
  const config = usePipelineStore((state) => state.config);
  const setGraph = usePipelineStore((state) => state.setGraph);

  return useMutation({
    mutationFn: () => generateGraph(config),
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
    mutationFn: () => runHpcPipeline(config, annealing, enableAnimations),
    onSuccess: setHpcJob,
  });

  const hpcStatus = useQuery({
    queryKey: ["hpc-job-status", hpcJob?.job_id],
    queryFn: () => getHpcJob(hpcJob?.job_id ?? ""),
    enabled: Boolean(hpcJob?.job_id) && !["done", "error", "cancelled"].includes(hpcJob?.status ?? ""),
    refetchInterval: 3000,
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

  return { run, status, hpcRun, hpcStatus };
}
