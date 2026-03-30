import { useQueryClient } from "@tanstack/react-query";
import { 
  useListScraperRuns as useListScraperRunsApi,
  useGetScraperStatus as useGetScraperStatusApi,
  useRunScraper as useRunScraperApi,
  getListScraperRunsQueryKey,
  getGetScraperStatusQueryKey,
  getGetJobStatsQueryKey,
  getListJobsQueryKey
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export function useScraperRuns(params: { limit?: number; offset?: number } = { limit: 20 }) {
  return useListScraperRunsApi(params);
}

export function useScraperStatus(runId: string) {
  return useGetScraperStatusApi(runId, {
    query: {
      refetchInterval: (query) => {
        const status = query.state.data?.status;
        return (status === 'running' || status === 'pending') ? 3000 : false;
      }
    }
  });
}

export function useStartScraperRun() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useRunScraperApi({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListScraperRunsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetJobStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListJobsQueryKey() });
        toast({
          title: "Scraper Started",
          description: "Agent is now fetching and processing data.",
        });
      },
      onError: (err: any) => {
        toast({
          title: "Failed to start scraper",
          description: err?.message || "Check if you have active keywords.",
          variant: "destructive"
        });
      }
    }
  });
}
