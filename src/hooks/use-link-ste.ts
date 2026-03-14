import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  postApplicationsByAppIdQueriesByQueryIdContractsMutation,
  getApplicationsByIdQueryKey,
} from "@/shared/api/autogen/@tanstack/react-query.gen";

export function useLinkSte(appId: number, _queryId: number) {
  const qc = useQueryClient();

  return useMutation({
    ...postApplicationsByAppIdQueriesByQueryIdContractsMutation(),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: getApplicationsByIdQueryKey({ path: { id: appId } }),
      });
    },
  });
}
