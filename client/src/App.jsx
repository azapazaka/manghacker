import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import DashboardPage from "./pages/DashboardPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import MyApplicationsPage from "./pages/MyApplicationsPage";
import RegisterPage from "./pages/RegisterPage";
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
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute role="employer">
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/vacancies/new"
              element={
                <ProtectedRoute role="employer">
                  <VacancyEditorPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/vacancies/:id/edit"
              element={
                <ProtectedRoute role="employer">
                  <VacancyEditorPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-applications"
              element={
                <ProtectedRoute role="seeker">
                  <MyApplicationsPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
