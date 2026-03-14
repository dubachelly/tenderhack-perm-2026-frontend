import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";

import {
  postApplicationsByIdQueriesMutation,
  getApplicationsByIdQueryKey,
  getApplicationsQueryKey,
} from "@/shared/api/autogen/@tanstack/react-query.gen";

export function useAddQueryToApplication() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    ...postApplicationsByIdQueriesMutation(),
    onSuccess: async (query) => {
      const appId = query.applicationId!;
      await qc.invalidateQueries({
        queryKey: getApplicationsByIdQueryKey({ path: { id: appId } }),
      });
      await qc.invalidateQueries({ queryKey: getApplicationsQueryKey() });
      navigate(`/applications/${appId}/queries/${query.id}`);
    },
  });
}
