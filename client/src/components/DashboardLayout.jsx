import { BriefcaseBusiness, Building2, Inbox, Layers, LogOut, Send, UserRound, Users } from "lucide-react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Button } from "./ui/button";

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-3">
      <div className="grid size-11 place-items-center rounded-2xl bg-foreground text-background shadow-soft shrink-0">
        <BriefcaseBusiness className="size-5" />
      </div>
      <div className="overflow-hidden">
        <p className="truncate text-base font-semibold leading-tight tracking-tight">Qoldan</p>
        <p className="truncate text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Dashboard</p>
      </div>
    </Link>
  );
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const navItems =
    user?.role === "seeker"
      ? [
          { to: "/dashboard/vacancies", label: "Вакансии", icon: Layers },
          { to: "/dashboard/applications", label: "Отклики", icon: Send },
          { to: "/dashboard/inbox", label: "Почта", icon: Inbox },
          { to: "/dashboard/profile", label: "Профиль", icon: UserRound }
        ]
      : [
          { to: "/dashboard/vacancies", label: "Мои вакансии", icon: BriefcaseBusiness },
          { to: "/dashboard/candidates", label: "Кандидаты", icon: Users },
          { to: "/dashboard/profile", label: "Профиль", icon: Building2 }
        ];

  return (
    <div className="relative min-h-screen bg-[#fbfaf9] md:flex">
      <div className="pointer-events-none absolute left-[-8rem] top-16 size-72 rounded-full bg-cyan-200/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-16 right-[-4rem] size-72 rounded-full bg-rose-200/50 blur-3xl" />

      <aside className="relative z-10 w-full shrink-0 p-4 pb-0 md:w-64 md:p-6 md:pr-0 lg:w-72 lg:p-8 lg:pr-0">
        <div className="flex flex-col overflow-hidden rounded-[32px] border border-white/80 bg-white/70 shadow-glow backdrop-blur-xl md:h-full md:max-h-[calc(100vh-48px)]">
          <div className="p-6 pb-2">
            <Brand />
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-4 py-6">
            <p className="mb-3 px-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">Главная</p>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
                      isActive ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:bg-white/50 hover:text-foreground"
                    }`
                  }
                >
                  <Icon className="size-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="p-4 pt-0">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-4 text-muted-foreground hover:text-foreground"
              onClick={handleLogout}
            >
              <LogOut className="size-4" />
              Выйти
            </Button>
          </div>
        </div>
      </aside>

      <main className="relative z-10 flex-1 p-4 md:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
