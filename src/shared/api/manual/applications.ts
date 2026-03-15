import { patchApplicationsById } from "@/shared/api/autogen/sdk.gen"
import type { Application } from "@/shared/api/autogen/types.gen"

type UpdateApplicationNameInput = {
  id: number
  name: string
}

export async function updateApplicationName({
  id,
  name,
}: UpdateApplicationNameInput): Promise<Application> {
  const { data } = await patchApplicationsById({
    path: { id },
    body: { name },
    throwOnError: true,
  })

  return data
}
