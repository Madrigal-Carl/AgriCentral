import { Routes, Route } from "react-router-dom";

import HomePage from "@/pages/public/HomePage";
import AuthPage from "@/pages/public/AuthPage";

import DashboardLayout from "@/layouts/DashboardLayout";

import OverviewPage from "@/pages/public/OverviewPage";
import FarmersPage from "@/pages/public/FarmersPage";
import FarmsPage from "@/pages/public/FarmsPage";
import EquipmentsPage from "@/pages/public/EquipmentsPage";

import UnauthorizedPage from "@/pages/shared/UnauthorizedPage";

import ProtectedRoute from "./ProtectedRoute";
import RoleRedirect from "./RoleRedirect";
import FallbackRedirect from "./FallbackRedirect";
import PublicOnlyRoute from "./PublicOnlyRoute";
import AuthRedirectRoute from "./AuthRedirectRoute";

import { ROLES } from "@/constants/roles";

import { ScrollToTop } from "@/components/public";

export default function AppRouter() {
  return (
    <>
      <ScrollToTop />
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
            <Route
              path="livestocks"
              element={<h1 className="text-3xl">Far Livestock Page</h1>}
            />
            <Route
              path="farm-maps"
              element={<h1 className="text-3xl">Far Farm Maps Page</h1>}
            />
            <Route
              path="reports"
              element={<h1 className="text-3xl">Far Report Page</h1>}
            />
            <Route
              path="settings"
              element={<h1 className="text-3xl">Far Settings Page</h1>}
            />
          </Route>
        </Route>

        {/* AEW ONLY */}
        <Route element={<ProtectedRoute allowedRoles={[ROLES.AEW]} />}>
          <Route path="/aew/overview" element={<div>AEW Page</div>} />
        </Route>

        {/* COORDINATOR ONLY */}
        <Route element={<ProtectedRoute allowedRoles={[ROLES.COORDINATOR]} />}>
          <Route
            path="/coordinator/overview"
            element={<div>Coordinator Page</div>}
          />
        </Route>

        {/* GOVERNOR ONLY */}
        <Route element={<ProtectedRoute allowedRoles={[ROLES.GOVERNOR]} />}>
          <Route path="/governor/overview" element={<div>Governor Page</div>} />
        </Route>

        {/* HEAD ONLY */}
        <Route element={<ProtectedRoute allowedRoles={[ROLES.HEAD]} />}>
          <Route path="/head/overview" element={<div>Head Page</div>} />
        </Route>

        {/* ADMIN ONLY */}
        <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
          <Route path="/admin/overview" element={<div>Admin Page</div>} />
        </Route>

        {/* MULTIPLE ROLES */}
        {/* <Route
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.HEAD]} />
          }
        >
          <Route path="/reports" element={<div>Reports Page</div>} />
        </Route> */}

        {/* UNAUTHORIZED */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* FALLBACK */}
        <Route path="*" element={<FallbackRedirect />} />
      </Routes>
    </>
  );
}
