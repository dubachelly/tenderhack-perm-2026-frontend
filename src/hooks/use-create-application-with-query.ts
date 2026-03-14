import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";

import {
  postApplications,
  postApplicationsByIdQueries,
} from "@/shared/api/autogen/sdk.gen";
import { getApplicationsQueryKey } from "@/shared/api/autogen/@tanstack/react-query.gen";

export function useCreateApplicationWithQuery() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (queryText: string) => {
      const app = await postApplications({
        body: { name: queryText },
        throwOnError: true,
      });
      const query = await postApplicationsByIdQueries({
        path: { id: app.data.id! },
        body: { queryText },
        throwOnError: true,
      });
      return { app: app.data, query: query.data };
    },
    onSuccess: async ({ app, query }) => {
      await qc.invalidateQueries({ queryKey: getApplicationsQueryKey() });
      navigate(`/applications/${app.id}/queries/${query.id}`);
    },
  });
}
