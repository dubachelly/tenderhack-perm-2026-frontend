import { Route, Routes } from "react-router";
import { RootLayout } from "./layout/root-layout";
import { HomePage } from "./routes/home-page";
import { QueryPage } from "./routes/query-page";

export function AppRouter() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<HomePage />} />
        <Route
          path="/applications/:appId/queries/:queryId"
          element={<QueryPage />}
        />
      </Route>
    </Routes>
  );
}
