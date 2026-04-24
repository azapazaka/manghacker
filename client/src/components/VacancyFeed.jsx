import { useEffect, useState } from "react";
import { vacancyApi } from "../api/vacancies";
import VacancyCard from "./VacancyCard";
import VacancyFilters from "./VacancyFilters";
import { Card, CardContent } from "./ui/card";

const initialFilters = {
  search: "",
  category: "",
  district: "",
  employment_type: ""
};

export default function VacancyFeed() {
  const [filters, setFilters] = useState(initialFilters);
  const [vacancies, setVacancies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <div className="space-y-6">
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
    </div>
  );
}
