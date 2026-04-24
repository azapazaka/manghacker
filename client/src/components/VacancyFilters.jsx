import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export default function VacancyFilters({ filters, onChange, onReset }) {
  return (
    <Card>
      <CardContent className="grid gap-5 p-6 lg:grid-cols-[1.3fr_1fr_1fr_1fr_auto] lg:items-end">
        <div className="space-y-2">
          <Label htmlFor="search">Поиск</Label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search"
              className="pl-10"
              placeholder="Например: кассир, продавец, логист"
              value={filters.search}
              onChange={(event) => onChange("search", event.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Категория</Label>
          <Input id="category" placeholder="HoReCa, логистика..." value={filters.category} onChange={(event) => onChange("category", event.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="district">Локация</Label>
          <Input id="district" placeholder="Актау, Жанаозен..." value={filters.district} onChange={(event) => onChange("district", event.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="employment_type">Формат работы</Label>
          <select
            id="employment_type"
            className="flex h-12 w-full rounded-2xl border border-border/70 bg-white/80 px-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
            value={filters.employment_type}
            onChange={(event) => onChange("employment_type", event.target.value)}
          >
            <option value="">Любой формат</option>
            <option value="full_time">Полная занятость</option>
            <option value="part_time">Частичная занятость</option>
            <option value="contract">Проектная работа</option>
          </select>
        </div>

        <Button type="button" variant="secondary" onClick={onReset}>
          <SlidersHorizontal className="size-4" />
          Сбросить
        </Button>
      </CardContent>
    </Card>
  );
}
