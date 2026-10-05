import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { cancelHpcJob, getHpcJob, getWorkers, hasHpcToken, runAldHpcPipeline } from "../lib/api";
import { useAldStore } from "../stores/aldStore";
import { isHpcJobActive } from "../types";

// Même logique HPC que usePipelineRunner() (cf. hooks/usePipeline.ts) :
// cancel-then-run sur "Restart HPC", polling tant que le job est actif,
// capacités du worker pour le menu de ressources — dupliquée plutôt que
// généralisée dans usePipelineRunner() pour ne pas coupler ce hook au store
// pipelineStore (config de graphe MaxCut, sans rapport avec l'expérience
// chimique ALD).
export function useAldPipelineRunner() {
  const hpcJob = useAldStore((state) => state.hpcJob);
  const hpcResources = useAldStore((state) => state.hpcResources);
  const setHpcJob = useAldStore((state) => state.setHpcJob);
  const buildExperiment = useAldStore((state) => state.buildExperiment);

  const hpcRun = useMutation({
    mutationFn: async () => {
      if (hpcJob && isHpcJobActive(hpcJob.status)) {
        await cancelHpcJob(hpcJob.job_id);
      }
      return runAldHpcPipeline(buildExperiment(), hpcResources);
    },
    onSuccess: setHpcJob,
  });

  const hpcStatus = useQuery({
    queryKey: ["ald-hpc-job-status", hpcJob?.job_id],
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

  const workers = useQuery({
    queryKey: ["hpc-workers"],
    queryFn: getWorkers,
    enabled: hasHpcToken(),
    refetchInterval: 5000,
    retry: 1,
  });

  useEffect(() => {
    if (hpcStatus.data && hpcStatus.data.job_id === hpcJob?.job_id) {
      setHpcJob(hpcStatus.data);
    }
  }, [hpcJob?.job_id, hpcStatus.data, setHpcJob]);

  return { hpcRun, hpcStatus, hpcStop, workers };
}
