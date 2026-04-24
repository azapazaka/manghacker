import { ArrowLeft, Building2, MapPin, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { vacancyApi } from "../api/vacancies";
import ApplyDialog from "../components/ApplyDialog";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { employmentTypeLabel, formatDate, formatSalary } from "../utils/formatters";

export default function VacancyDetailPage() {
  const { id } = useParams();
  const [vacancy, setVacancy] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data } = await vacancyApi.detail(id);
      setVacancy(data.data);
    };

    load();
  }, [id]);

  if (!vacancy) {
    return (
      <Card>
        <CardContent className="p-6 text-muted-foreground">Загружаем карточку вакансии...</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild className="pl-0">
        <Link to="/">
          <ArrowLeft className="size-4" />
          Назад к вакансиям
        </Link>
      </Button>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_380px]">
        <Card className="overflow-hidden bg-hero">
          <CardContent className="space-y-8 p-8 md:p-10">
            <div className="space-y-4">
              <Badge variant="secondary" className="rounded-full px-4 py-2">{employmentTypeLabel(vacancy.employment_type)}</Badge>
              <h1 className="text-5xl font-semibold leading-[0.96] tracking-tight">{vacancy.title}</h1>
              <p className="max-w-3xl text-lg leading-8 text-muted-foreground">{vacancy.description}</p>
            </div>

            <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
              <div className="flex items-center gap-2 rounded-[24px] border border-white/80 bg-white/80 px-4 py-3">
                <Building2 className="size-4" />
                {vacancy.employer_name}
              </div>
              <div className="flex items-center gap-2 rounded-[24px] border border-white/80 bg-white/80 px-4 py-3">
                <MapPin className="size-4" />
                {vacancy.district}
              </div>
              <div className="flex items-center gap-2 rounded-[24px] border border-white/80 bg-white/80 px-4 py-3">
                <Wallet className="size-4" />
                {formatSalary(vacancy.salary)}
              </div>
              <div className="rounded-[24px] border border-white/80 bg-white/80 px-4 py-3">Опубликовано {formatDate(vacancy.created_at)}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="space-y-2">
              <CardTitle>Быстрый отклик</CardTitle>
              <CardDescription>Работодатель получит ваш PDF и контакты в Telegram, а оффер потом придет вам на сайт и в Telegram.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge>{vacancy.category}</Badge>
              <Badge variant="secondary">{vacancy.district}</Badge>
            </div>
            <ApplyDialog vacancyId={vacancy.id} onApplied={(result) => setMessage(result.message)} />
            {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 p-6">
            <CardTitle>Обязанности и ожидания</CardTitle>
            <Separator />
            <p className="whitespace-pre-line leading-7 text-muted-foreground">{vacancy.description}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-4 p-6">
            <CardTitle>Требования к кандидату</CardTitle>
            <Separator />
            <p className="whitespace-pre-line leading-7 text-muted-foreground">{vacancy.requirements || "Работодатель обсудит требования после рассмотрения вашего отклика."}</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
