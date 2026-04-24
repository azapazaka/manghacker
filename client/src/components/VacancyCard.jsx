import { ArrowUpRight, Building2, Clock3, MapPin, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { employmentTypeLabel, formatDate, formatSalary } from "../utils/formatters";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

export default function VacancyCard({ vacancy }) {
  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col gap-5 p-6">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Вакансия</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight">{vacancy.title}</h3>
            </div>
            <Badge variant="secondary">{employmentTypeLabel(vacancy.employment_type)}</Badge>
          </div>
          <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{vacancy.description}</p>
        </div>

        <div className="grid gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Building2 className="size-4" />
            {vacancy.employer_name}
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="size-4" />
            {vacancy.district}
          </div>
          <div className="flex items-center gap-2">
            <Wallet className="size-4" />
            {formatSalary(vacancy.salary)}
          </div>
          <div className="flex items-center gap-2">
            <Clock3 className="size-4" />
            {formatDate(vacancy.created_at)}
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3">
          <Badge>{vacancy.category}</Badge>
          <Button asChild variant="secondary">
            <Link to={`/vacancies/${vacancy.id}`}>
              Подробнее
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
