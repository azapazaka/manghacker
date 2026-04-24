import { useAuth } from "../hooks/useAuth";
import DashboardPage from "./DashboardPage";
import MyApplicationsPage from "./MyApplicationsPage";

export default function UserDashboard() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  if (user.role === "employer") {
    return <DashboardPage />;
  }

  return <MyApplicationsPage />;
}
