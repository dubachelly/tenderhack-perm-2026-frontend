import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";

import {
  postApplicationsMutation,
  getApplicationsByIdOptions,
  getApplicationsQueryKey,
} from "@/shared/api/autogen/@tanstack/react-query.gen";

export function useCreateApplicationWithQuery() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    ...postApplicationsMutation(),
    onSuccess: async (app) => {
      await qc.invalidateQueries({ queryKey: getApplicationsQueryKey() });
      const full = await qc.fetchQuery(
        getApplicationsByIdOptions({ path: { id: app.id! } })
      );
      const firstQuery = full.queries?.[0];
      if (firstQuery) {
        navigate(`/applications/${app.id}/queries/${firstQuery.id}`);
      }
    },
  });
}
