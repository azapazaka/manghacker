import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { applicationApi } from "../api/applications";
import TelegramBanner from "../components/TelegramBanner";
import { Alert } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useAuth } from "../hooks/useAuth";
import { applicationStatusLabel, applicationStatusVariant, employmentTypeLabel, formatDate, formatSalary } from "../utils/formatters";

const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || "QooldaaanBot";

export default function MyApplicationsPage() {
  const { user } = useAuth();
  const [offers, setOffers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [message, setMessage] = useState("");

  const load = async () => {
    const [offersResponse, applicationsResponse] = await Promise.all([applicationApi.offers(), applicationApi.my()]);
    setOffers(offersResponse.data.data);
    setApplications(applicationsResponse.data.data);
  };

  useEffect(() => {
    const bootstrap = async () => {
      await load();
    };

    bootstrap();
  }, []);

  const handleDecision = async (applicationId, decision) => {
    const action = decision === "accept" ? applicationApi.acceptOffer : applicationApi.rejectOffer;
    const { data } = await action(applicationId);
    setMessage(data.message);
    await load();
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-[1.15fr_360px]">
        <Card className="overflow-hidden bg-hero">
          <CardContent className="space-y-5 p-8 md:p-10">
            <Badge variant="secondary" className="rounded-full px-4 py-2">Почта соискателя</Badge>
            <h1 className="text-5xl font-semibold leading-[0.96] tracking-tight">Принимайте решения по офферам на сайте, а уведомления получайте в Telegram.</h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              Здесь хранится короткая почта по офферам: от какой вакансии, от какой компании и какое решение уже принято.
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
          <TabsTrigger value="offers">Почта</TabsTrigger>
          <TabsTrigger value="applications">Мои отклики</TabsTrigger>
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
      </Tabs>
    </div>
  );
}
