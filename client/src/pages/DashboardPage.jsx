import { Bot, BriefcaseBusiness, MailPlus, Plus, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { applicationApi } from "../api/applications";
import { vacancyApi } from "../api/vacancies";
import TelegramBanner from "../components/TelegramBanner";
import { Alert } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useAuth } from "../hooks/useAuth";
import { applicationStatusLabel, applicationStatusVariant, employmentTypeLabel, formatDate, formatSalary, matchVerdictLabel, matchVerdictVariant } from "../utils/formatters";

const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || "QooldaaanBot";

export default function DashboardPage() {
  const { user } = useAuth();
  const [vacancies, setVacancies] = useState([]);
  const [selectedVacancyId, setSelectedVacancyId] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [aiMatches, setAiMatches] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadVacancies = async () => {
      try {
        const { data } = await vacancyApi.my();
        setVacancies(data.data);
        if (data.data[0]) {
          setSelectedVacancyId(data.data[0].id);
        }
      } catch (error) {
        setMessage("Не удалось загрузить вакансии.");
      }
    };

    loadVacancies();
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      if (!selectedVacancyId) {
        setCandidates([]);
        return;
      }

      try {
        const { data } = await vacancyApi.candidates(selectedVacancyId);
        setCandidates(data.data.candidates);
        const matchesResponse = await vacancyApi.matches(selectedVacancyId);
        setAiMatches(matchesResponse.data.data.matches);
      } catch (error) {
        setMessage("Не удалось загрузить кандидатов.");
      }
    };

    bootstrap();
  }, [selectedVacancyId, message]);

  const selectedVacancy = useMemo(
    () => vacancies.find((vacancy) => vacancy.id === selectedVacancyId) || null,
    [selectedVacancyId, vacancies]
  );

  const handleCloseVacancy = async (id) => {
    try {
      await vacancyApi.close(id);
      setVacancies((current) => current.map((item) => (item.id === id ? { ...item, is_active: false } : item)));
      setMessage("Вакансия закрыта.");
    } catch (error) {
      setMessage("Не удалось закрыть вакансию.");
    }
  };

  const handleSendOffer = async (applicationId) => {
    try {
      const { data } = await applicationApi.sendOffer(applicationId);
      setMessage(data.message);
    } catch (error) {
      setMessage(error.response?.data?.message || "Не удалось отправить оффер.");
    }
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-[1.15fr_360px]">
        <Card className="overflow-hidden bg-hero">
          <CardContent className="space-y-6 p-8 md:p-10">
            <Badge variant="secondary" className="rounded-full px-4 py-2">Кабинет работодателя</Badge>
            <div className="space-y-4">
              <h1 className="text-5xl font-semibold leading-[0.96] tracking-tight">Ваши вакансии и кандидаты.</h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                Управляйте откликами и отправляйте офферы прямо отсюда.
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
                <p className="text-sm text-muted-foreground">кандидатов по выбранной вакансии</p>
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
            <Button asChild className="w-full">
              <Link to="/dashboard/vacancies/new">
                <Plus className="size-4" />
                Добавить вакансию
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <Tabs defaultValue="vacancies">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="vacancies">Мои вакансии</TabsTrigger>
            <TabsTrigger value="candidates">Кандидаты</TabsTrigger>
            <TabsTrigger value="ai">Подбор AI</TabsTrigger>
          </TabsList>

          {vacancies.length > 0 ? (
            <select
              className="h-10 rounded-xl border border-border/70 bg-white px-3 text-sm outline-none"
              value={selectedVacancyId}
              onChange={(event) => setSelectedVacancyId(event.target.value)}
            >
              {vacancies.map((vacancy) => (
                <option key={vacancy.id} value={vacancy.id}>{vacancy.title}</option>
              ))}
            </select>
          ) : null}
        </div>

        <TabsContent value="vacancies">
          {vacancies.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-muted-foreground">У вас пока нет вакансий. Создайте первую карточку.</CardContent>
            </Card>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {vacancies.map((vacancy) => (
                <Card key={vacancy.id} className={vacancy.id === selectedVacancyId ? "ring-2 ring-foreground" : ""}>
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
                      <Button type="button" variant="outline" onClick={() => setSelectedVacancyId(vacancy.id)}>Кандидаты</Button>
                      {vacancy.is_active ? (
                        <Button type="button" variant="ghost" onClick={() => handleCloseVacancy(vacancy.id)}>Закрыть</Button>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="candidates">
          <div className="space-y-5">


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
                      <Button type="button" onClick={() => handleSendOffer(candidate.id)} disabled={candidate.status === "accepted" || candidate.status === "offer_sent"}>
                        <Send className="size-4" />
                        Отправить оффер
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="ai">
          <div className="space-y-5">


            {aiMatches.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-muted-foreground">Пока нет соискателей для AI-анализа. Когда появятся профили, Qoldan покажет самых релевантных кандидатов.</CardContent>
              </Card>
            ) : (
              <div className="grid gap-5 xl:grid-cols-2">
                {aiMatches.slice(0, 8).map((match) => (
                  <Card key={match.id}>
                    <CardContent className="space-y-4 p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle>{match.seeker.name}</CardTitle>
                          <CardDescription>{match.seeker.email}</CardDescription>
                        </div>
                        <Badge variant={matchVerdictVariant(match.verdict)}>{match.score}%</Badge>
                      </div>
                      <p className="text-sm leading-6 text-muted-foreground">{match.summary}</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={matchVerdictVariant(match.verdict)}>{matchVerdictLabel(match.verdict)}</Badge>
                        <Badge variant="secondary">{match.source === "llm" ? "LLM-анализ" : "Fallback-анализ"}</Badge>
                      </div>
                      {match.reasons.length ? (
                        <div className="space-y-1 text-sm text-muted-foreground">
                          {match.reasons.slice(0, 3).map((reason) => (
                            <p key={reason}>{reason}</p>
                          ))}
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
