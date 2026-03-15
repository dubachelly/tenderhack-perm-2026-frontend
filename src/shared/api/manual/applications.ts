import { client } from "@/shared/api/autogen/client.gen"
import type { Application } from "@/shared/api/autogen/types.gen"

type UpdateApplicationNameInput = {
  id: number
  name: string
}

export async function updateApplicationName({
  id,
  name,
}: UpdateApplicationNameInput): Promise<Application> {
  const data = await client.request<Application>({
    url: "/applications/{id}",
    method: "PATCH",
    path: { id },
    body: { name },
    responseStyle: "data",
    throwOnError: true,
  })

  return data
}
