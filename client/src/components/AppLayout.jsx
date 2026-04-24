import { BriefcaseBusiness, ChevronDown, Mail, Menu, Sparkles, UserRound } from "lucide-react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";

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
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const isHome = location.pathname === "/";

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
                  href={isHome ? item.to : item.to.replace("/", "")}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </a>
              ))}
              {user?.role === "employer" ? (
                <NavLink to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                  Кабинет
                </NavLink>
              ) : null}
              {user?.role === "seeker" ? (
                <NavLink to="/my-applications" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                  Мои отклики
                </NavLink>
              ) : null}
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" className="gap-2">
                      <UserRound className="size-4" />
                      <span className="hidden sm:inline">{user?.name}</span>
                      <ChevronDown className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {user?.role === "employer" ? (
                      <DropdownMenuItem onClick={() => navigate("/dashboard")}>Кабинет работодателя</DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => navigate("/my-applications")}>Мой кабинет</DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleLogout}>Выйти</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button variant="secondary" className="hidden sm:inline-flex" onClick={() => navigate("/login")}>
                    Войти
                  </Button>
                  <Button className="hidden sm:inline-flex" onClick={() => navigate("/register")}>Регистрация</Button>
                </>
              )}

              <div className="lg:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="shrink-0">
                      <Menu className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {navItems.map((item) => (
                      <DropdownMenuItem key={item.label} asChild>
                        <a href={isHome ? item.to : item.to.replace("/", "")}>{item.label}</a>
                      </DropdownMenuItem>
                    ))}
                    {user?.role === "employer" ? (
                      <DropdownMenuItem onClick={() => navigate("/dashboard")}>Кабинет</DropdownMenuItem>
                    ) : null}
                    {user?.role === "seeker" ? (
                      <DropdownMenuItem onClick={() => navigate("/my-applications")}>Мои отклики</DropdownMenuItem>
                    ) : null}
                    {!isAuthenticated ? (
                      <>
                        <DropdownMenuItem onClick={() => navigate("/login")}>Войти</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate("/register")}>Регистрация</DropdownMenuItem>
                      </>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
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
