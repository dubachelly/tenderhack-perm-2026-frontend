import { useEffect, useState, type MouseEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Check,
  ChevronDown,
  ChevronRight,
  FolderOpen,
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
import { Input } from "@/components/ui/input";
import { useUpdateApplicationName } from "@/hooks/use-update-application-name";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-context";

function ApplicationItem({
  appId: id,
  appName,
  activeAppId,
  activeQueryId,
}: {
  appId: number;
  appName: string | undefined;
  activeAppId: string | undefined;
  activeQueryId: string | undefined;
}) {
  const isActive = String(id) === activeAppId;
  const [open, setOpen] = useState(isActive);
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(appName ?? "");
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();
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
      if (isActive) navigate("/");
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
    e.preventDefault();
    e.stopPropagation();
    setIsEditing(true);
  };

  const cancelEdit = (e?: MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setDraftName(appName ?? "");
    setIsEditing(false);
  };

  const saveEdit = (e?: MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
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

  const handleAddPosition = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/?appId=${id}`);
  };

  const handleDeleteApp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    deleteApp.mutate({ path: { id } });
  };

  const handleDeleteQuery = (e: React.MouseEvent, queryId: number) => {
    e.preventDefault();
    e.stopPropagation();
    deleteQuery.mutate({ path: { appId: id, queryId } });
    if (String(queryId) === activeQueryId) navigate(`/applications/${id}`);
  };

  if (isCollapsed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center p-2 cursor-pointer rounded-sm transition-colors",
          isActive ? "bg-primary/10 text-primary" : "hover:bg-muted"
        )}
        title={appName}
        onClick={() => !isEditing && setOpen((o) => !o)}
      >
        <FolderOpen className="size-4 shrink-0" />
      </div>
    );
  }

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1 px-2 py-1.5 cursor-pointer rounded-sm transition-colors group",
          isActive ? "bg-primary/10 text-primary" : "hover:bg-muted"
        )}
        onClick={() => !isEditing && setOpen((o) => !o)}
      >
        <span className="shrink-0 text-muted-foreground">
          {open ? (
            <ChevronDown className="size-3" />
          ) : (
            <ChevronRight className="size-3" />
          )}
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
          className="h-6 text-xs"
          autoFocus
        />
      ) : (
        <span className="flex-1 truncate text-xs font-medium">{appName}</span>
      )}
        {isEditing ? (
          <>
            <button
              onClick={saveEdit}
              className="shrink-0 text-muted-foreground hover:text-foreground"
              title="Сохранить"
              disabled={updateName.isPending}
            >
              <Check className="size-3" />
            </button>
            <button
              onClick={cancelEdit}
              className="shrink-0 text-muted-foreground hover:text-foreground"
              title="Отменить"
              disabled={updateName.isPending}
            >
              <X className="size-3" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={startEdit}
              className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
              title="Редактировать"
            >
              <Pencil className="size-3" />
            </button>
            <button
              onClick={handleAddPosition}
              className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
              title="Добавить позицию"
            >
              <Plus className="size-3" />
            </button>
            <button
              onClick={handleDeleteApp}
              className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
              title="Удалить заявку"
              disabled={deleteApp.isPending}
            >
              <Trash2 className="size-3" />
            </button>
          </>
        )}
      </div>
      {open && (
        <div className="ml-4 border-l border-border pl-2 mt-0.5 space-y-0.5">
          {queries.map((q) => (
            <div
              key={q.id}
              className={cn(
                "flex items-center group/query rounded-sm transition-colors",
                String(q.id) === activeQueryId
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Link
                to={`/applications/${id}/queries/${q.id}`}
                className="flex-1 truncate text-xs px-2 py-1"
              >
                {q.queryText}
              </Link>
              <button
                onClick={(e) => handleDeleteQuery(e, q.id!)}
                className="shrink-0 opacity-0 group-hover/query:opacity-100 transition-opacity pr-2 text-muted-foreground hover:text-destructive"
                title="Удалить запрос"
                disabled={deleteQuery.isPending}
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          ))}
          <button
            onClick={handleAddPosition}
            className="flex items-center gap-1 w-full text-xs px-2 py-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-sm transition-colors"
          >
            <Plus className="size-3" />
            Добавить позицию
          </button>
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const { isCollapsed, toggle } = useSidebar();
  const { appId, queryId } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery(
    getApplicationsOptions({ query: { limit: 100 } })
  );

  const applications = data?.data ?? [];

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-background transition-all duration-300 shrink-0",
        isCollapsed ? "w-16" : "w-72"
      )}
    >
      {!isCollapsed && (
        <div className="px-3 py-3 border-b border-border">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Заявки
          </h2>
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-sm bg-muted animate-pulse",
                  isCollapsed ? "h-8 mx-auto w-8" : "h-7"
                )}
              />
            ))
          : applications.length === 0
            ? !isCollapsed && (
                <p className="text-xs text-muted-foreground px-2 py-2">
                  Нет заявок
                </p>
              )
            : applications.map((app) => (
                <ApplicationItem
                  key={app.id}
                  appId={app.id!}
                  appName={app.name}
                  activeAppId={appId}
                  activeQueryId={queryId}
                />
              ))}
      </div>

      <div className="border-t border-border p-2 space-y-2">
        {isCollapsed ? (
          <Button variant="default" size="icon" className="w-full" title="Создать новую заявку" onClick={() => navigate("/")}>
            <Plus className="size-4" />
          </Button>
        ) : (
          <Button variant="default" className="w-full" onClick={() => navigate("/")}>
            <Plus className="size-4 mr-2" />Новая заявка
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="w-full"
          title={isCollapsed ? "Развернуть" : "Свернуть"}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </Button>
      </div>
    </aside>
  );
}
