import { ArrowRight, BriefcaseBusiness, Building2, FileText, MapPin, Sparkles, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { matchApi } from "../api/matches";
import { vacancyApi } from "../api/vacancies";
import VacancyCard from "../components/VacancyCard";
import VacancyFilters from "../components/VacancyFilters";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "../components/ui/card";
import { useAuth } from "../hooks/useAuth";

const initialFilters = {
  search: "",
  category: "",
  district: "",
  employment_type: ""
};

const featureCards = [
  {
    id: "job-seekers",
    kicker: "Для соискателей",
    title: "Все отклики и офферы под рукой",
    description: "Вакансии, отклики и приглашения на работу без путаницы между десятками чатов.",
    chips: ["Отклики", "Кабинет", "Telegram"],
    icon: UserRound
  },
  {
    id: "employers",
    kicker: "Для работодателей",
    title: "Удобный поиск сотрудников",
    description: "Все кандидаты собраны в кабинете, а новые отклики моментально приходят в Telegram.",
    chips: ["Кандидаты", "PDF", "Офферы"],
    icon: Building2
  },
  {
    id: "how-it-works",
    kicker: "Как это работает",
    title: "Быстро, понятно, эффективно",
    description: "Мы соединили удобный сайт с привычным Telegram, чтобы вы не пропустили важное.",
    chips: ["Сайт", "Telegram", "AI-подбор"],
    icon: Sparkles
  }
];

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const [filters, setFilters] = useState(initialFilters);
  const [vacancies, setVacancies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [isRefreshingMatches, setIsRefreshingMatches] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setError("");
        setIsLoading(true);
        const query = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
        const { data } = await vacancyApi.list(query);
        setVacancies(data.data);
      } catch {
        setError("Не удалось загрузить вакансии.");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [filters]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "seeker") {
      return;
    }

    const loadRecommendations = async () => {
      try {
        const { data } = await matchApi.recommendations();
        setRecommendations(data.data);
      } catch {
        setRecommendations([]);
      }
    };

    loadRecommendations();
  }, [isAuthenticated, user?.role]);

  const refreshMatches = async () => {
    setIsRefreshingMatches(true);
    try {
      const { data } = await matchApi.refresh();
      setRecommendations(data.data.map((match) => recommendations.find((item) => item.vacancy_id === match.vacancy_id) || match));
      const refreshed = await matchApi.recommendations();
      setRecommendations(refreshed.data.data);
    } finally {
      setIsRefreshingMatches(false);
    }
  };

  return (
    <div className="space-y-8 pb-6">
      <section className="relative overflow-hidden rounded-[40px] border border-white/80 bg-hero px-8 py-10 shadow-glow md:px-12 md:py-14">
        <div className="absolute inset-y-16 right-8 hidden w-[340px] md:block">
          <div className="relative h-full">
            <div className="hero-glow right-10 top-8 h-52 w-48 rotate-12 bg-cyan-100" />
            <div className="hero-glow right-0 top-28 h-56 w-44 -rotate-12 bg-rose-100" />
            <div className="hero-glow bottom-16 right-20 h-44 w-40 rotate-6 bg-violet-100" />
          </div>
        </div>

        <div className="relative z-10 grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_360px]">
          <div className="space-y-8">
            <Badge variant="secondary" className="rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.32em]">
              Qoldan job platform
            </Badge>

            <div className="space-y-5">
              <h1 className="max-w-4xl text-5xl font-semibold leading-[0.95] tracking-tight text-foreground md:text-6xl">
                Работа в Мангистау — без хаоса в чатах.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                Откликайтесь на вакансии или находите сотрудников. Быстро, просто и с уведомлениями прямо в Telegram.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to={isAuthenticated ? (user?.role === "employer" ? "/dashboard" : "/my-applications") : "/register"}>
                  {isAuthenticated ? "Перейти в кабинет" : "Начать регистрацию"}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link to={isAuthenticated ? "/" : "/login"}>{isAuthenticated ? "Перейти к вакансиям" : "Уже есть аккаунт"}</Link>
              </Button>
            </div>

            <div className="flex flex-wrap gap-3">
              <Badge variant="secondary" className="gap-2 rounded-full px-4 py-2">
                <FileText className="size-3.5" />
                PDF-резюме
              </Badge>
              <Badge variant="secondary" className="gap-2 rounded-full px-4 py-2">
                <BriefcaseBusiness className="size-3.5" />
                Офферы на сайте
              </Badge>
              <Badge variant="secondary" className="gap-2 rounded-full px-4 py-2">
                <MapPin className="size-3.5" />
                Мангистауская область
              </Badge>
            </div>
          </div>

          <Card className="self-end">
            <CardContent className="space-y-6 p-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Как это работает</p>
                <CardTitle className="text-2xl leading-tight">От вакансии до первого рабочего дня</CardTitle>
                <CardDescription className="text-base leading-7">
                  Интерфейс специально строится так, чтобы и работодатель, и соискатель понимали свой следующий шаг без перегруженного кабинета.
                </CardDescription>
              </div>

              <div className="grid gap-3 text-sm text-muted-foreground">
                <div className="rounded-[24px] border border-white/80 bg-white/80 px-4 py-3">1. Соискатель находит вакансию и отправляет резюме.</div>
                <div className="rounded-[24px] border border-white/80 bg-white/80 px-4 py-3">2. Работодатель получает документ в Telegram и видит кандидата в кабинете.</div>
                <div className="rounded-[24px] border border-white/80 bg-white/80 px-4 py-3">3. Оффер уходит соискателю, ответ возвращается работодателю.</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {featureCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.id} id={card.id}>
              <CardContent className="space-y-5 p-6">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.26em] text-muted-foreground">{card.kicker}</p>
                  <div className="grid size-10 place-items-center rounded-2xl bg-secondary text-foreground">
                    <Icon className="size-4" />
                  </div>
                </div>
                <div className="space-y-3">
                  <CardTitle className="text-3xl leading-tight">{card.title}</CardTitle>
                  <CardDescription className="text-base leading-7">{card.description}</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  {card.chips.map((chip) => (
                    <Badge key={chip} variant="secondary">
                      {chip}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {isAuthenticated && user?.role === "seeker" ? (
        <section className="space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.26em] text-muted-foreground">AI рекомендует</p>
              <h2 className="text-4xl font-semibold tracking-tight">Вакансии, которые ближе всего к вашему профилю</h2>
              <p className="max-w-2xl text-muted-foreground">Qoldan анализирует навыки, район, опыт и формат занятости, а затем объясняет каждое совпадение человеческим языком.</p>
            </div>
            <Button type="button" variant="secondary" onClick={refreshMatches} disabled={isRefreshingMatches}>
              {isRefreshingMatches ? "Пересчитываем..." : "Обновить AI"}
            </Button>
          </div>

          {recommendations.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-muted-foreground">Заполните <Link to="/my-applications" className="underline hover:text-foreground">AI-профиль в кабинете</Link>, чтобы увидеть персональные рекомендации.</CardContent>
            </Card>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {recommendations.slice(0, 3).map((match) => (
                <VacancyCard key={match.id} vacancy={match.vacancy} match={match} />
              ))}
            </div>
          )}
        </section>
      ) : null}

      <section className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.26em] text-muted-foreground">Каталог вакансий</p>
          <h2 className="text-4xl font-semibold tracking-tight">Найдите работу без лишнего шума</h2>
          <p className="max-w-2xl text-muted-foreground">Фильтруйте предложения по локации, категории и формату занятости. Подача отклика занимает несколько секунд.</p>
        </div>

        <VacancyFilters
          filters={filters}
          onChange={(key, value) => setFilters((current) => ({ ...current, [key]: value }))}
          onReset={() => setFilters(initialFilters)}
        />

        {isLoading ? (
          <Card>
            <CardContent className="p-6 text-muted-foreground">Загружаем вакансии...</CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="p-6 text-rose-600">{error}</CardContent>
          </Card>
        ) : vacancies.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-muted-foreground">По текущим фильтрам вакансий пока нет.</CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {vacancies.map((vacancy) => (
              <VacancyCard key={vacancy.id} vacancy={vacancy} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
