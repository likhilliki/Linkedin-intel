import { useQueryClient } from "@tanstack/react-query";
import { 
  useListKeywords as useListKeywordsApi,
  useCreateKeyword as useCreateKeywordApi,
  useDeleteKeyword as useDeleteKeywordApi,
  getListKeywordsQueryKey
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export function useKeywords() {
  return useListKeywordsApi();
}

export function useCreateKeyword() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useCreateKeywordApi({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListKeywordsQueryKey() });
        toast({
          title: "Keyword Added",
          description: "New keyword successfully added to tracker.",
        });
      },
      onError: (err: any) => {
        toast({
          title: "Failed to add keyword",
          description: err?.message || "An error occurred",
          variant: "destructive"
        });
      }
    }
  });
}

export function useDeleteKeyword() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useDeleteKeywordApi({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListKeywordsQueryKey() });
        toast({
          title: "Keyword Removed",
          description: "The keyword has been removed from tracking.",
        });
      },
      onError: (err: any) => {
        toast({
          title: "Failed to remove keyword",
          description: err?.message || "An error occurred",
          variant: "destructive"
        });
      }
    }
  });
}
