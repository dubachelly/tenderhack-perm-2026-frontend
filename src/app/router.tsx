import { Route, Routes } from "react-router";
import { RootLayout } from "./layout/root-layout";
import { HomePage } from "./routes/home-page";
import { ApplicationPage } from "./routes/application-page";
import { QueryPage } from "./routes/query-page";
import { HistoryPage } from "./routes/history-page";

export function AppRouter() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<HomePage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/applications/:appId" element={<ApplicationPage />} />
        <Route
          path="/applications/:appId/queries/:queryId"
          element={<QueryPage />}
        />
      </Route>
    </Routes>
  );
}
