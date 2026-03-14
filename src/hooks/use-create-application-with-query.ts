import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";

import {
  getApplications,
  postApplications,
  postApplicationsByIdQueries,
} from "@/shared/api/autogen/sdk.gen";
import { getApplicationsQueryKey } from "@/shared/api/autogen/@tanstack/react-query.gen";

async function buildApplicationName(): Promise<string> {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, "0");
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const yyyy = today.getFullYear();
  const dateStr = `${dd}.${mm}.${yyyy}`;

  // Загружаем все заявки (с запасом), фильтруем по сегодняшней дате
  const { data } = await getApplications({ query: { limit: 1000 } });
  const todayApps = (data?.data ?? []).filter((app) => {
    if (!app.createdAt) return false;
    const created = new Date(app.createdAt);
    return (
      created.getDate() === today.getDate() &&
      created.getMonth() === today.getMonth() &&
      created.getFullYear() === today.getFullYear()
    );
  });

  const number = todayApps.length + 1;
  return `Заявка №${number}/${dateStr}`;
}

export function useCreateApplicationWithQuery() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (queryText: string) => {
      const name = await buildApplicationName();
      const app = await postApplications({
        body: { name },
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
