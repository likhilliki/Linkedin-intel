import { useQuery } from "@tanstack/react-query";
import { 
  useListJobs as useListJobsApi,
  useGetJobStats as useGetJobStatsApi,
  getListJobsQueryKey,
  getGetJobStatsQueryKey
} from "@workspace/api-client-react";

export function useJobs(params: { limit?: number; offset?: number; keyword?: string; company?: string } = {}) {
  return useListJobsApi(params, {
    query: {
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  });
}

export function useJobStats() {
  return useGetJobStatsApi({
    query: {
      staleTime: 1000 * 60 * 5,
    }
  });
}
