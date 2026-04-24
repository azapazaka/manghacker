import { BriefcaseBusiness, Mail, Sparkles } from "lucide-react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Button } from "./ui/button";

const navItems = [
  { to: "/#job-seekers", label: "Для соискателей" },
  { to: "/#employers", label: "Для работодателей" },
  { to: "/#how-it-works", label: "Как это работает" }
];

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-3">
      <div className="grid size-11 place-items-center rounded-2xl bg-foreground text-background shadow-soft">
        <BriefcaseBusiness className="size-5" />
      </div>
      <div>
        <p className="text-base font-semibold tracking-tight">Qoldan</p>
        <p className="text-sm text-muted-foreground">Работа и офферы в Telegram</p>
      </div>
    </Link>
  );
}

export default function AppLayout() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute left-[-8rem] top-16 size-72 rounded-full bg-cyan-200/40 blur-3xl" />
      <div className="absolute right-[-4rem] top-36 size-72 rounded-full bg-rose-200/50 blur-3xl" />

      <header className="sticky top-0 z-50 py-4">
        <div className="page-shell">
          <div className="flex items-center justify-between rounded-[32px] border border-white/80 bg-white/70 px-5 py-3 shadow-glow backdrop-blur-xl">
            <Brand />

            <nav className="hidden items-center gap-8 lg:flex">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.to}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </a>
              ))}
              {isAuthenticated ? (
                <NavLink to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                  Кабинет
                </NavLink>
              ) : null}
            </nav>

            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <Button variant="secondary" onClick={() => navigate("/dashboard")}>
                  В дашборд
                </Button>
              ) : (
                <>
                  <Button variant="secondary" onClick={() => navigate("/login")}>
                    Войти
                  </Button>
                  <Button onClick={() => navigate("/register")}>Регистрация</Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="page-shell pb-16">
        <Outlet />
      </main>

      <footer className="page-shell pb-10">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-white/70 bg-white/65 px-6 py-4 text-sm text-muted-foreground shadow-soft backdrop-blur">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4" />
            Qoldan помогает работодателям и соискателям встречаться без хаоса в чатах.
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-2">
              <Mail className="size-4" />
              Telegram-офферы и отклики
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
