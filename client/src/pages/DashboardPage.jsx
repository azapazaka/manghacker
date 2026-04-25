import { Bot, BriefcaseBusiness, MailPlus, Plus, RefreshCw, Send, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { applicationApi } from "../api/applications";
import { vacancyApi } from "../api/vacancies";
import TelegramBanner from "../components/TelegramBanner";
import { Alert } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "../components/ui/card";
import { useAuth } from "../hooks/useAuth";
import { applicationStatusLabel, applicationStatusVariant, employmentTypeLabel, formatDate, formatSalary } from "../utils/formatters";

const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || "QooldaaanBot";

function outreachBadgeVariant(status) {
  if (status === "applied") return "success";
  if (status === "invited") return "secondary";
  if (status === "dismissed") return "outline";
  return "secondary";
}

function outreachLabel(status) {
  if (status === "applied") return "Откликнулся";
  if (status === "invited") return "Приглашен";
  if (status === "viewed") return "Просмотрел";
  if (status === "dismissed") return "Скрыт";
  return "Новый";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const location = useLocation();
  const currentTab = location.pathname.split("/").pop();
  const [vacancies, setVacancies] = useState([]);
  const [selectedVacancyId, setSelectedVacancyId] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [aiMatches, setAiMatches] = useState([]);
  const [message, setMessage] = useState("");
  const [isRefreshingMatches, setIsRefreshingMatches] = useState(false);
  const [invitingSeekerId, setInvitingSeekerId] = useState("");

  const loadVacancies = useCallback(async () => {
    const { data } = await vacancyApi.my();
    setVacancies(data.data);
    setSelectedVacancyId((current) => current || data.data[0]?.id || "");
  }, []);

  const loadCandidates = useCallback(async (vacancyId) => {
    if (!vacancyId) {
      setCandidates([]);
      return;
    }

    const { data } = await vacancyApi.candidates(vacancyId);
    setCandidates(data.data.candidates);
  }, []);

  const loadAiMatches = useCallback(async (vacancyId) => {
    if (!vacancyId) {
      setAiMatches([]);
      return;
    }

    const { data } = await vacancyApi.matches(vacancyId);
    setAiMatches(data.data.matches);
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadVacancies);
  }, [loadVacancies]);

  useEffect(() => {
    if (!selectedVacancyId) {
      void Promise.resolve().then(() => {
        setCandidates([]);
        setAiMatches([]);
      });
      return;
    }

    if (currentTab === "candidates" || currentTab === "profile") {
      void Promise.resolve().then(() => loadCandidates(selectedVacancyId));
    }

    if (currentTab === "ai") {
      void Promise.resolve().then(() => loadAiMatches(selectedVacancyId));
    }
  }, [currentTab, loadAiMatches, loadCandidates, selectedVacancyId]);

  const selectedVacancy = useMemo(
    () => vacancies.find((vacancy) => vacancy.id === selectedVacancyId) || null,
    [selectedVacancyId, vacancies]
  );

  const handleCloseVacancy = async (id) => {
    await vacancyApi.close(id);
    setVacancies((current) => current.map((item) => (item.id === id ? { ...item, is_active: false } : item)));
    setMessage("Вакансия закрыта.");
  };

  const handleSendOffer = async (applicationId) => {
    const { data } = await applicationApi.sendOffer(applicationId);
    setMessage(data.message);
    await loadCandidates(selectedVacancyId);
  };

  const handleRefreshMatches = async () => {
    if (!selectedVacancyId) return;

    setIsRefreshingMatches(true);
    try {
      const { data } = await vacancyApi.refreshMatches(selectedVacancyId);
      setAiMatches(data.data.matches);
      setMessage(data.message);
    } finally {
      setIsRefreshingMatches(false);
    }
  };

  const handleInvite = async (seekerId) => {
    if (!selectedVacancyId) return;

    setInvitingSeekerId(seekerId);
    try {
      const { data } = await vacancyApi.invite(selectedVacancyId, seekerId);
      setAiMatches((current) => current.map((item) => (item.seeker.id === seekerId ? { ...item, status: "invited" } : item)));
      setMessage(data.message);
    } finally {
      setInvitingSeekerId("");
    }
  };

  return (
    <div className="space-y-6">
      {currentTab === "profile" && (
        <section className="grid gap-6 lg:grid-cols-[1.15fr_360px]">
          <Card className="overflow-hidden bg-hero">
            <CardContent className="space-y-6 p-8 md:p-10">
              <Badge variant="secondary" className="rounded-full px-4 py-2">
                Кабинет работодателя
              </Badge>
              <div className="space-y-4">
                <h1 className="text-5xl font-semibold leading-[0.96] tracking-tight">Управляйте вакансиями, кандидатами и Telegram-интеграцией.</h1>
                <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                  Отклики идут по обычному flow, а AI-подбор помогает заранее находить релевантных кандидатов и приглашать их к отклику.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[28px] border border-white/80 bg-white/80 p-5">
                  <BriefcaseBusiness className="mb-4 size-5" />
                  <p className="font-medium">{vacancies.length}</p>
                  <p className="text-sm text-muted-foreground">вакансий в кабинете</p>
                </div>
                <div className="rounded-[28px] border border-white/80 bg-white/80 p-5">
                  <MailPlus className="mb-4 size-5" />
                  <p className="font-medium">{candidates.length}</p>
                  <p className="text-sm text-muted-foreground">реальных откликов по выбранной вакансии</p>
                </div>
                <div className="rounded-[28px] border border-white/80 bg-white/80 p-5">
                  <Bot className="mb-4 size-5" />
                  <p className="font-medium">{user?.telegram_chat_id ? "Активен" : "Нужно /start"}</p>
                  <p className="text-sm text-muted-foreground">статус Telegram-бота</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-5 p-6">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Компания</p>
                <CardTitle>{user?.company_name}</CardTitle>
                <CardDescription>Контактное лицо: {user?.contact_name || user?.name}</CardDescription>
              </div>
              {!user?.telegram_chat_id ? <TelegramBanner botUsername={botUsername} roleLabel="Работодатель" /> : null}
              {message ? <Alert intent="success">{message}</Alert> : null}
            </CardContent>
          </Card>
        </section>
      )}

      {currentTab === "vacancies" && (
        <div className="space-y-5">
          <div className="flex justify-end">
            <Button asChild>
              <Link to="/dashboard/vacancies/new">
                <Plus className="size-4" />
                Добавить вакансию
              </Link>
            </Button>
          </div>
          {vacancies.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-muted-foreground">У вас пока нет вакансий. Создайте первую карточку.</CardContent>
            </Card>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {vacancies.map((vacancy) => (
                <Card key={vacancy.id}>
                  <CardContent className="space-y-4 p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <CardTitle>{vacancy.title}</CardTitle>
                        <CardDescription>{vacancy.category}</CardDescription>
                      </div>
                      <Badge variant={vacancy.is_active ? "success" : "secondary"}>{vacancy.is_active ? "Активна" : "Закрыта"}</Badge>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>{vacancy.district}</p>
                      <p>{employmentTypeLabel(vacancy.employment_type)}</p>
                      <p>{formatSalary(vacancy.salary)}</p>
                      <p>Создана {formatDate(vacancy.created_at)}</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button asChild variant="secondary">
                        <Link to={`/dashboard/vacancies/${vacancy.id}/edit`}>Редактировать</Link>
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setSelectedVacancyId(vacancy.id)}>
                        Кандидаты
                      </Button>
                      <Button asChild type="button" variant="outline">
                        <Link to="/dashboard/ai" onClick={() => setSelectedVacancyId(vacancy.id)}>
                          AI подбор
                        </Link>
                      </Button>
                      {vacancy.is_active ? (
                        <Button type="button" variant="ghost" onClick={() => handleCloseVacancy(vacancy.id)}>
                          Закрыть
                        </Button>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {currentTab === "candidates" && (
        <div className="space-y-5">
          <Card>
            <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Выбранная вакансия</p>
                <CardTitle>{selectedVacancy?.title || "Сначала выберите вакансию"}</CardTitle>
              </div>
              <select
                className="h-12 rounded-2xl border border-border/70 bg-white px-4 text-sm outline-none"
                value={selectedVacancyId}
                onChange={(event) => setSelectedVacancyId(event.target.value)}
              >
                {vacancies.map((vacancy) => (
                  <option key={vacancy.id} value={vacancy.id}>
                    {vacancy.title}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>

          {candidates.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-muted-foreground">По этой вакансии пока нет откликов или выберите другую карточку.</CardContent>
            </Card>
          ) : (
            <div className="grid gap-5 xl:grid-cols-2">
              {candidates.map((candidate) => (
                <Card key={candidate.id}>
                  <CardContent className="space-y-4 p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle>{candidate.seeker_name}</CardTitle>
                        <CardDescription>{candidate.seeker_email}</CardDescription>
                      </div>
                      <Badge variant={applicationStatusVariant(candidate.status)}>{applicationStatusLabel(candidate.status)}</Badge>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>Telegram: @{candidate.seeker_telegram_username}</p>
                      <p>Отклик от {formatDate(candidate.created_at)}</p>
                      {candidate.offer_sent_at ? <p>Оффер отправлен {formatDate(candidate.offer_sent_at)}</p> : null}
                    </div>
                    <Button type="button" onClick={() => handleSendOffer(candidate.id)} disabled={candidate.status === "accepted"}>
                      <Send className="size-4" />
                      Отправить оффер
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {currentTab === "ai" && (
        <div className="space-y-5">
          {message ? <Alert intent="success">{message}</Alert> : null}

          <Card>
            <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">AI-поиск релевантных кандидатов</p>
                <CardTitle>{selectedVacancy?.title || "Выберите вакансию для подбора"}</CardTitle>
                <CardDescription>В этом списке только кандидаты, которые еще не откликались. Отклики остаются в разделе “Кандидаты”.</CardDescription>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <select
                  className="h-12 rounded-2xl border border-border/70 bg-white px-4 text-sm outline-none"
                  value={selectedVacancyId}
                  onChange={(event) => setSelectedVacancyId(event.target.value)}
                >
                  {vacancies.map((vacancy) => (
                    <option key={vacancy.id} value={vacancy.id}>
                      {vacancy.title}
                    </option>
                  ))}
                </select>
                <Button type="button" variant="secondary" onClick={handleRefreshMatches} disabled={!selectedVacancyId || isRefreshingMatches}>
                  <RefreshCw className={`size-4 ${isRefreshingMatches ? "animate-spin" : ""}`} />
                  Обновить AI
                </Button>
              </div>
            </CardContent>
          </Card>

          {!selectedVacancyId ? (
            <Card>
              <CardContent className="p-6 text-muted-foreground">Сначала выберите вакансию, чтобы увидеть AI-подбор.</CardContent>
            </Card>
          ) : aiMatches.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-muted-foreground">AI пока не нашел новых кандидатов для этой вакансии. Попробуйте обновить подбор после заполнения профилей соискателей.</CardContent>
            </Card>
          ) : (
            <div className="grid gap-5 xl:grid-cols-2">
              {aiMatches.map((match) => (
                <Card key={match.seeker.id}>
                  <CardContent className="space-y-5 p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle>{match.seeker.name}</CardTitle>
                          <Badge variant="secondary" className="rounded-full">
                            <Sparkles className="mr-1 size-3" />
                            {match.score}% совпадение
                          </Badge>
                        </div>
                        <CardDescription>{match.seeker.email}</CardDescription>
                      </div>
                      <Badge variant={outreachBadgeVariant(match.status)}>{outreachLabel(match.status)}</Badge>
                    </div>

                    <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                      <p>Навыки: {match.seeker.skills?.length ? match.seeker.skills.join(", ") : "не указаны"}</p>
                      <p>Опыт: {match.seeker.experience_years ?? "не указан"} лет</p>
                      <p>Районы: {match.seeker.preferred_districts?.length ? match.seeker.preferred_districts.join(", ") : "не указаны"}</p>
                      <p>Формат: {match.seeker.preferred_employment_type ? employmentTypeLabel(match.seeker.preferred_employment_type) : "не указан"}</p>
                    </div>

                    <div className="space-y-2 rounded-2xl border border-border/60 bg-muted/20 p-4">
                      <p className="text-sm font-medium text-foreground">{match.employer_summary || match.summary}</p>
                      {match.reasons?.length ? (
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          {match.reasons.slice(0, 3).map((reason) => (
                            <li key={reason}>• {reason}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Риски и пробелы</p>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          {match.risks?.slice(0, 2).map((risk) => (
                            <p key={risk}>• {risk}</p>
                          ))}
                          {match.missing_skills?.length ? <p>• Не хватает: {match.missing_skills.join(", ")}</p> : null}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Что спросить на первом контакте</p>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          {match.interview_focus?.slice(0, 3).map((point) => (
                            <p key={point}>• {point}</p>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-white p-4 text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">Сообщение для приглашения</p>
                      <p className="mt-2">{match.outreach_message || "Пригласите кандидата к отклику, чтобы перевести его в основной flow."}</p>
                    </div>

                    <Button
                      type="button"
                      onClick={() => handleInvite(match.seeker.id)}
                      disabled={match.status === "invited" || match.status === "applied" || invitingSeekerId === match.seeker.id}
                    >
                      <Send className="size-4" />
                      {match.status === "applied" ? "Уже откликнулся" : match.status === "invited" ? "Приглашение отправлено" : "Пригласить к отклику"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
