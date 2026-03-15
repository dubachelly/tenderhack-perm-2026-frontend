import { useEffect, useState, type MouseEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import {
  getApplicationsOptions,
  getApplicationsByIdOptions,
  getApplicationsQueryKey,
  getApplicationsByIdQueryKey,
  deleteApplicationsByIdMutation,
  deleteApplicationsByAppIdQueriesByQueryIdMutation,
} from "@/shared/api/autogen/@tanstack/react-query.gen";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useUpdateApplicationName } from "@/hooks/use-update-application-name";

function ApplicationRow({ appId: id, appName }: { appId: number; appName: string | undefined }) {
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(appName ?? "");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: fullApp } = useQuery({
    ...getApplicationsByIdOptions({ path: { id } }),
    enabled: open,
  });

  const queries = fullApp?.queries ?? [];

  const deleteApp = useMutation({
    ...deleteApplicationsByIdMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getApplicationsQueryKey() });
    },
  });

  const deleteQuery = useMutation({
    ...deleteApplicationsByAppIdQueriesByQueryIdMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getApplicationsByIdQueryKey({ path: { id } }),
      });
    },
  });

  const updateName = useUpdateApplicationName();

  useEffect(() => {
    setDraftName(appName ?? "");
  }, [appName]);

  const startEdit = (e: MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const cancelEdit = (e?: MouseEvent) => {
    if (e) e.stopPropagation();
    setDraftName(appName ?? "");
    setIsEditing(false);
  };

  const saveEdit = (e?: MouseEvent) => {
    if (e) e.stopPropagation();
    const next = draftName.trim();
    if (!next) return;
    if (next === appName) {
      setIsEditing(false);
      return;
    }
    updateName.mutate(
      { id, name: next },
      {
        onSuccess: () => setIsEditing(false),
      }
    );
  };

  return (
    <div className="rounded-lg border border-border bg-card">
      <div
        className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors rounded-lg"
        onClick={() => !isEditing && setOpen((o) => !o)}
      >
        <span className="text-muted-foreground shrink-0">
          {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </span>
        {isEditing ? (
          <Input
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                saveEdit();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                cancelEdit();
              }
            }}
            className="h-7 text-sm"
            autoFocus
          />
        ) : (
          <span className="flex-1 font-medium text-sm truncate">{appName}</span>
        )}
        {isEditing ? (
          <>
            <button
              onClick={saveEdit}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
              title="Сохранить"
              disabled={updateName.isPending}
            >
              <Check className="size-4" />
            </button>
            <button
              onClick={cancelEdit}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
              title="Отменить"
              disabled={updateName.isPending}
            >
              <X className="size-4" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={startEdit}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
              title="Редактировать"
            >
              <Pencil className="size-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/applications/${id}`);
              }}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
              title="Просмотр заявки"
            >
              <FileText className="size-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/?appId=${id}`);
              }}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
              title="Добавить позицию"
            >
              <Plus className="size-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteApp.mutate({ path: { id } });
              }}
              className="shrink-0 text-muted-foreground hover:text-destructive transition-colors p-1 rounded"
              title="Удалить заявку"
              disabled={deleteApp.isPending}
            >
              <Trash2 className="size-4" />
            </button>
          </>
        )}
      </div>

      {open && (
        <div className="border-t border-border px-4 py-2 space-y-1">
          {queries.length === 0 && !fullApp ? (
            <div className="space-y-1 py-1">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-full" />
              ))}
            </div>
          ) : queries.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">Нет запросов</p>
          ) : (
            queries.map((q) => (
              <div
                key={q.id}
                className="flex items-center group rounded-md hover:bg-muted/50 transition-colors"
              >
                <Link
                  to={`/applications/${id}/queries/${q.id}`}
                  className="flex-1 truncate text-sm px-2 py-1.5 text-muted-foreground hover:text-foreground"
                >
                  {q.queryText}
                </Link>
                <button
                  onClick={() =>
                    deleteQuery.mutate({ path: { appId: id, queryId: q.id! } })
                  }
                  className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-destructive"
                  title="Удалить запрос"
                  disabled={deleteQuery.isPending}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))
          )}
          <button
            onClick={() => navigate(`/?appId=${id}`)}
            className="flex items-center gap-1.5 w-full text-xs px-2 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
          >
            <Plus className="size-3.5" />
            Добавить позицию
          </button>
        </div>
      )}
    </div>
  );
}

export function HistoryPage() {
  const { data, isLoading } = useQuery(
    getApplicationsOptions({ query: { limit: 100 } })
  );

  const applications = data?.data ?? [];

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">История заявок</h1>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="text-sm">Заявок пока нет</p>
        </div>
      ) : (
        <div className="space-y-2">
          {applications.map((app) => (
            <ApplicationRow key={app.id} appId={app.id!} appName={app.name} />
          ))}
        </div>
      )}
    </div>
  );
}
