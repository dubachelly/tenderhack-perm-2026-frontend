import { useMutation, useQueryClient } from "@tanstack/react-query"

import {
  getApplicationsByIdQueryKey,
  getApplicationsQueryKey,
} from "@/shared/api/autogen/@tanstack/react-query.gen"
import { updateApplicationName } from "@/shared/api/manual/applications"

export function useUpdateApplicationName() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: updateApplicationName,
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: getApplicationsQueryKey() })
      qc.invalidateQueries({
        queryKey: getApplicationsByIdQueryKey({ path: { id: vars.id } }),
      })
    },
  })
}
