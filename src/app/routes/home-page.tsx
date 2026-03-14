import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router";
import { X } from "lucide-react";

import { SearchBar } from "@/components/search-bar";
import { Button } from "@/components/ui/button";
import { getApplicationsByIdOptions } from "@/shared/api/autogen/@tanstack/react-query.gen";
import { useCreateApplicationWithQuery } from "@/hooks/use-create-application-with-query";
import { useAddQueryToApplication } from "@/hooks/use-add-query-to-application";

export function HomePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const appId = searchParams.get("appId");

  const { data: app } = useQuery({
    ...getApplicationsByIdOptions({ path: { id: Number(appId) } }),
    enabled: !!appId,
  });

  const createApp = useCreateApplicationWithQuery();
  const addQuery = useAddQueryToApplication();

  const handleSearch = (query: string) => {
    if (appId) {
      addQuery.mutate({
        path: { id: Number(appId) },
        body: { queryText: query },
      });
    } else {
      createApp.mutate({
        body: { name: query, queries: [query] },
      });
    }
  };

  const isPending = createApp.isPending || addQuery.isPending;

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-20">
      <div className="w-full max-w-2xl space-y-4">
        <h1 className="text-2xl font-semibold text-center">Поиск СТЕ</h1>

        {appId && app && (
          <div className="flex items-center gap-2 rounded-sm border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
            <span className="flex-1 text-muted-foreground">
              Добавление позиции в заявку:{" "}
              <span className="font-medium text-foreground">{app.name}</span>
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => navigate("/")}
              title="Отмена"
            >
              <X className="size-3" />
            </Button>
          </div>
        )}

        <SearchBar
          onSearch={handleSearch}
          placeholder="Введите поисковый запрос и нажмите Enter..."
          className="w-full"
        />

        {isPending && (
          <p className="text-center text-xs text-muted-foreground animate-pulse">
            Создание заявки...
          </p>
        )}

        {!appId && (
          <p className="text-center text-xs text-muted-foreground">
            Введите запрос, чтобы создать новую заявку и найти СТЕ
          </p>
        )}
      </div>
    </div>
  );
}
