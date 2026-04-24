import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import DashboardLayout from "./components/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import UserDashboard from "./pages/UserDashboard";
import VacancyDetailPage from "./pages/VacancyDetailPage";
import VacancyEditorPage from "./pages/VacancyEditorPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="/vacancies/:id" element={<VacancyDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="vacancies" replace />} />
            <Route path=":tab" element={<UserDashboard />} />
            <Route
              path="vacancies/new"
              element={
                <ProtectedRoute role="employer">
                  <VacancyEditorPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="vacancies/:id/edit"
              element={
                <ProtectedRoute role="employer">
                  <VacancyEditorPage />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="/my-applications" element={<Navigate to="/dashboard/vacancies" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
