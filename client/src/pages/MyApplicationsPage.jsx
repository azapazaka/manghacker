import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { applicationApi } from "../api/applications";
import { profileApi } from "../api/profile";
import TelegramBanner from "../components/TelegramBanner";
import { Alert } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useAuth } from "../hooks/useAuth";
import { applicationStatusLabel, applicationStatusVariant, employmentTypeLabel, formatDate, formatSalary } from "../utils/formatters";

const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || "QooldaaanBot";

function joinList(value) {
  return Array.isArray(value) ? value.join(", ") : "";
}

export default function MyApplicationsPage() {
  const { user } = useAuth();
  const [offers, setOffers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [profile, setProfile] = useState({
    skills: "",
    experience_years: "",
    preferred_districts: "",
    preferred_employment_type: "",
    profile_summary: "",
    availability: ""
  });
  const [message, setMessage] = useState("");
  const [profileMessage, setProfileMessage] = useState("");

  const load = async () => {
    try {
      const [offersResponse, applicationsResponse] = await Promise.all([applicationApi.offers(), applicationApi.my()]);
      setOffers(offersResponse.data.data);
      setApplications(applicationsResponse.data.data);
    } catch (error) {
      setMessage("Не удалось загрузить данные.");
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      await load();
    };

    bootstrap();
  }, []);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    let ignore = false;

    const loadProfile = async () => {
      try {
        const { data } = await profileApi.me();

        if (ignore) {
          return;
        }

        const profileUser = data.data;
        setProfile({
          skills: joinList(profileUser.skills),
          experience_years: profileUser.experience_years ?? "",
          preferred_districts: joinList(profileUser.preferred_districts),
          preferred_employment_type: profileUser.preferred_employment_type || "",
          profile_summary: profileUser.profile_summary || "",
          availability: profileUser.availability || ""
        });
      } catch (error) {
        setProfileMessage("Не удалось загрузить профиль.");
      }
    };

    loadProfile();

    return () => {
      ignore = true;
    };
  }, [user?.id]);

  const handleDecision = async (applicationId, decision) => {
    try {
      const action = decision === "accept" ? applicationApi.acceptOffer : applicationApi.rejectOffer;
      const { data } = await action(applicationId);
      setMessage(data.message);
      await load();
    } catch (error) {
      setMessage("Не удалось отправить решение.");
    }
  };

  const updateProfileField = (key, value) => {
    setProfile((current) => ({ ...current, [key]: value }));
  };

  const handleProfileSave = async () => {
    try {
      const { data } = await profileApi.update(profile);
      setProfileMessage(data.message);
    } catch (error) {
      setProfileMessage("Не удалось сохранить профиль.");
    }
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-[1.15fr_360px]">
        <Card className="overflow-hidden bg-hero">
          <CardContent className="space-y-5 p-8 md:p-10">
            <Badge variant="secondary" className="rounded-full px-4 py-2">Мой кабинет</Badge>
            <h1 className="text-5xl font-semibold leading-[0.96] tracking-tight">Ваши отклики и офферы.</h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              Следите за статусом откликов и принимайте офферы от работодателей.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Профиль</p>
              <CardTitle>{user?.full_name || user?.name}</CardTitle>
              <CardDescription>@{user?.telegram_username}</CardDescription>
            </div>
            {!user?.telegram_chat_id ? <TelegramBanner botUsername={botUsername} roleLabel="Соискатель" /> : null}
            {message ? <Alert intent="success">{message}</Alert> : null}
          </CardContent>
        </Card>
      </section>

      <Tabs defaultValue="offers">
        <TabsList>
          <TabsTrigger value="offers">Входящие офферы</TabsTrigger>
          <TabsTrigger value="applications">Мои отклики</TabsTrigger>
          <TabsTrigger value="ai-profile">AI-профиль</TabsTrigger>
        </TabsList>

        <TabsContent value="offers">
          {offers.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-muted-foreground">Пока офферов нет. Когда работодатель пришлет предложение, оно появится здесь.</CardContent>
            </Card>
          ) : (
            <div className="grid gap-5 xl:grid-cols-2">
              {offers.map((offer) => (
                <Card key={offer.id}>
                  <CardContent className="space-y-4 p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle>{offer.vacancy_title}</CardTitle>
                        <CardDescription>{offer.employer_name}</CardDescription>
                      </div>
                      <Badge variant={applicationStatusVariant(offer.status)}>{applicationStatusLabel(offer.status)}</Badge>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>Локация: {offer.district}</p>
                      <p>Категория: {offer.category}</p>
                      <p>Оффер отправлен {formatDate(offer.offer_sent_at)}</p>
                    </div>
                    {offer.status === "offer_sent" ? (
                      <div className="flex flex-wrap gap-3">
                        <Button type="button" onClick={() => handleDecision(offer.id, "accept")}>
                          <Check className="size-4" />
                          Принять
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => handleDecision(offer.id, "reject")}>
                          <X className="size-4" />
                          Отклонить
                        </Button>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="applications">
          {applications.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-muted-foreground">Вы еще не отправляли отклики.</CardContent>
            </Card>
          ) : (
            <div className="grid gap-5 xl:grid-cols-2">
              {applications.map((application) => (
                <Card key={application.id}>
                  <CardContent className="space-y-4 p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle>{application.vacancy_title}</CardTitle>
                        <CardDescription>{application.employer_name}</CardDescription>
                      </div>
                      <Badge variant={applicationStatusVariant(application.status)}>{applicationStatusLabel(application.status)}</Badge>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>{employmentTypeLabel(application.employment_type)}</p>
                      <p>{formatSalary(application.salary)}</p>
                      <p>Отклик от {formatDate(application.created_at)}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="ai-profile">
          <Card>
            <CardContent className="space-y-5 p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.26em] text-muted-foreground">AI-профиль</p>
                  <CardTitle>Расскажите AI, какую работу искать</CardTitle>
                  <CardDescription>Навыки, район и формат работы помогут Qoldan честно объяснять совпадения.</CardDescription>
                </div>
                <Button type="button" onClick={handleProfileSave}>Сохранить профиль</Button>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="skills">Навыки</Label>
                  <input id="skills" className="h-12 w-full rounded-2xl border border-border/70 bg-white/80 px-4 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="Навыки: касса, продажи, бариста" value={profile.skills} onChange={(event) => updateProfileField("skills", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience_years">Опыт (лет)</Label>
                  <input id="experience_years" className="h-12 w-full rounded-2xl border border-border/70 bg-white/80 px-4 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="Опыт, лет" value={profile.experience_years} onChange={(event) => updateProfileField("experience_years", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preferred_districts">Предпочтительные районы</Label>
                  <input id="preferred_districts" className="h-12 w-full rounded-2xl border border-border/70 bg-white/80 px-4 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="Районы: Актау, 14 мкр" value={profile.preferred_districts} onChange={(event) => updateProfileField("preferred_districts", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preferred_employment_type">Формат работы</Label>
                  <select id="preferred_employment_type" className="h-12 w-full rounded-2xl border border-border/70 bg-white/80 px-4 text-sm outline-none focus:ring-2 focus:ring-ring" value={profile.preferred_employment_type} onChange={(event) => updateProfileField("preferred_employment_type", event.target.value)}>
                    <option value="">Любой формат</option>
                    <option value="full_time">Полная занятость</option>
                    <option value="part_time">Частичная занятость</option>
                    <option value="contract">Проектная работа</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="availability">Доступность</Label>
                  <input id="availability" className="h-12 w-full rounded-2xl border border-border/70 bg-white/80 px-4 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="Доступность: вечер, выходные" value={profile.availability} onChange={(event) => updateProfileField("availability", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile_summary">Коротко о себе</Label>
                  <input id="profile_summary" className="h-12 w-full rounded-2xl border border-border/70 bg-white/80 px-4 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="Коротко о себе" value={profile.profile_summary} onChange={(event) => updateProfileField("profile_summary", event.target.value)} />
                </div>
              </div>

              {profileMessage ? <Alert intent="success">{profileMessage}</Alert> : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
