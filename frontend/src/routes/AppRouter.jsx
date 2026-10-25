import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

import UnauthorizedPage from "@/pages/shared/UnauthorizedPage";

import ProtectedRoute from "./ProtectedRoute";
import RoleRedirect from "./RoleRedirect";
import FallbackRedirect from "./FallbackRedirect";
import PublicOnlyRoute from "./PublicOnlyRoute";
import AuthRedirectRoute from "./AuthRedirectRoute";

import { ROLES } from "@/constants/roles";

import { ScrollToTop } from "@/components/public/ScrollToTop";
import { FullScreenLoader } from "@/components/public/FullScreenLoader";

const DashboardLayout = lazy(() =>
  import("@/layouts/DashboardLayout").then((m) => ({ default: m.default })),
);

const HomePage = lazy(() =>
  import("@/pages/public/HomePage").then((m) => ({ default: m.HomePage })),
);
const AuthPage = lazy(() =>
  import("@/pages/public/AuthPage").then((m) => ({ default: m.AuthPage })),
);
const OverviewPage = lazy(() =>
  import("@/pages/public/OverviewPage").then((m) => ({ default: m.OverviewPage })),
);
const FarmersPage = lazy(() =>
  import("@/pages/public/FarmersPage").then((m) => ({ default: m.FarmersPage })),
);
const FarmsPage = lazy(() =>
  import("@/pages/public/FarmsPage").then((m) => ({ default: m.FarmsPage })),
);
const EquipmentsPage = lazy(() =>
  import("@/pages/public/EquipmentsPage").then((m) => ({ default: m.EquipmentsPage })),
);
const LivestocksPage = lazy(() =>
  import("@/pages/public/LivestocksPage").then((m) => ({ default: m.LivestocksPage })),
);
const CropsPage = lazy(() =>
  import("@/pages/public/CropsPage").then((m) => ({ default: m.CropsPage })),
);
const FarmMapsPage = lazy(() =>
  import("@/pages/public/FarmMapsPage").then((m) => ({ default: m.FarmMapsPage })),
);
const RequestsPage = lazy(() =>
  import("@/pages/public/RequestsPage").then((m) => ({ default: m.RequestsPage })),
);
const ReportsPage = lazy(() =>
  import("@/pages/public/ReportsPage").then((m) => ({ default: m.ReportsPage })),
);
const SettingsPage = lazy(() =>
  import("@/pages/public/SettingsPage").then((m) => ({ default: m.SettingsPage })),
);
const UsersPage = lazy(() =>
  import("@/pages/public/UsersPage").then((m) => ({ default: m.UsersPage })),
);
const AnalyticsPage = lazy(() =>
  import("@/pages/public/AnalyticsPage").then((m) => ({ default: m.AnalyticsPage })),
);
const AssociationsPage = lazy(() =>
  import("@/pages/public/AssociationsPage").then((m) => ({ default: m.AssociationsPage })),
);
const MaintenancePage = lazy(() =>
  import("@/pages/public/MaintenancePage").then((m) => ({ default: m.MaintenancePage })),
);

function PageLoader() {
  return <FullScreenLoader />;
}

export default function AppRouter() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* PUBLIC */}
          <Route element={<AuthRedirectRoute />}>
            <Route path="/" element={<HomePage />} />
          </Route>

          {/* ROLE REDIRECT */}
          <Route path="/redirect" element={<RoleRedirect />} />

          {/* GUEST ONLY */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/auth" element={<AuthPage />} />
          </Route>

          {/* FAR ONLY */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.FAR]} />}>
            <Route path="/far" element={<DashboardLayout />}>
              <Route path="overview" element={<OverviewPage />} />
              <Route path="farmers" element={<FarmersPage />} />
              <Route path="farms" element={<FarmsPage />} />
              <Route path="equipments" element={<EquipmentsPage />} />
              <Route path="livestocks" element={<LivestocksPage />} />
              <Route path="crops" element={<CropsPage />} />
              <Route path="farm-maps" element={<FarmMapsPage />} />
              <Route path="requests" element={<RequestsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Route>

          {/* AEW ONLY */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.AEW]} />}>
            <Route path="/aew" element={<DashboardLayout />}>
              <Route path="overview" element={<OverviewPage />} />
              <Route path="farmers" element={<FarmersPage />} />
              <Route path="farms" element={<FarmsPage />} />
              <Route path="associations" element={<AssociationsPage />} />
              <Route path="equipments" element={<EquipmentsPage />} />
              <Route path="livestocks" element={<LivestocksPage />} />
              <Route path="crops" element={<CropsPage />} />
              <Route path="farm-maps" element={<FarmMapsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Route>

          {/* COORDINATOR ONLY */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.COORDINATOR]} />}>
            <Route path="/coordinator" element={<DashboardLayout />}>
              <Route path="overview" element={<OverviewPage />} />
              <Route path="farmers" element={<FarmersPage />} />
              <Route path="associations" element={<AssociationsPage />} />
              <Route path="equipments" element={<EquipmentsPage />} />
              <Route path="livestocks" element={<LivestocksPage />} />
              <Route path="crops" element={<CropsPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="requests" element={<RequestsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Route>

          {/* GOVERNOR ONLY */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.GOVERNOR]} />}>
            <Route path="/governor" element={<DashboardLayout />}>
              <Route path="overview" element={<OverviewPage />} />
              <Route path="equipments" element={<EquipmentsPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="requests" element={<RequestsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Route>

          {/* HEAD ONLY */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.HEAD]} />}>
            <Route path="/head" element={<DashboardLayout />}>
              <Route path="overview" element={<OverviewPage />} />
              <Route path="farms" element={<FarmsPage />} />
              <Route path="equipments" element={<EquipmentsPage />} />
              <Route path="livestocks" element={<LivestocksPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="requests" element={<RequestsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="farm-maps" element={<FarmMapsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Route>

          {/* ADMIN ONLY */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
            <Route path="/admin" element={<DashboardLayout />}>
              <Route path="maintenance" element={<MaintenancePage />} />
              <Route path="overview" element={<OverviewPage />} />
              <Route path="farmers" element={<FarmersPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="associations" element={<AssociationsPage />} />
              <Route path="farms" element={<FarmsPage />} />
              <Route path="equipments" element={<EquipmentsPage />} />
              <Route path="livestocks" element={<LivestocksPage />} />
              <Route path="crops" element={<CropsPage />} />
              <Route path="farm-maps" element={<FarmMapsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="requests" element={<RequestsPage />} />
            </Route>
          </Route>

          {/* UNAUTHORIZED */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* FALLBACK */}
          <Route path="*" element={<FallbackRedirect />} />
        </Routes>
      </Suspense>
    </>
  );
}
