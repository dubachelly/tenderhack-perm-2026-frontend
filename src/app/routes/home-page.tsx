import { useQuery } from "@tanstack/react-query"
import { useSearchParams, useNavigate } from "react-router"
import { X } from "lucide-react"

import { SearchBar } from "@/components/search-bar"
import { Button } from "@/components/ui/button"
import { getApplicationsByIdOptions } from "@/shared/api/autogen/@tanstack/react-query.gen"
import { useCreateApplicationWithQuery } from "@/hooks/use-create-application-with-query"
import { useAddQueryToApplication } from "@/hooks/use-add-query-to-application"

export function HomePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const appId = searchParams.get("appId")

  const { data: app } = useQuery({
    ...getApplicationsByIdOptions({ path: { id: Number(appId) } }),
    enabled: !!appId,
  })

  const createApp = useCreateApplicationWithQuery()
  const addQuery = useAddQueryToApplication()

  const handleSearch = (query: string) => {
    if (appId) {
      addQuery.mutate({
        path: { id: Number(appId) },
        body: { queryText: query },
      })
    } else {
      createApp.mutate(query)
    }
  }

  const isPending = createApp.isPending || addQuery.isPending

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-20">
      <div className="w-full max-w-2xl space-y-4">
        <h1 className="text-center text-2xl font-semibold">
          {appId && app
            ? `Добавить товар в заявку "${app.name}"`
            : "Создать заявку"}
        </h1>

        <SearchBar
          onSearch={handleSearch}
          placeholder="Введите название товара"
          className="w-full"
        />

        {isPending && (
          <p className="animate-pulse text-center text-xs text-muted-foreground">
            Создание заявки...
          </p>
        )}
      </div>
    </div>
  )
}
