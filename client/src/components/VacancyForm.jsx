import { Alert } from "./ui/alert";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

export default function VacancyForm({ form, setForm, onSubmit, isSubmitting, error }) {
  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="title">Название вакансии</Label>
            <Input id="title" value={form.title} onChange={(event) => updateField("title", event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Категория</Label>
            <Input id="category" value={form.category} onChange={(event) => updateField("category", event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="district">Локация</Label>
            <Input id="district" value={form.district} onChange={(event) => updateField("district", event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="salary">Зарплата</Label>
            <Input id="salary" value={form.salary} onChange={(event) => updateField("salary", event.target.value)} />
          </div>
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="employment_type">Формат работы</Label>
            <select
              id="employment_type"
              className="flex h-12 w-full rounded-2xl border border-border/70 bg-white/80 px-4 text-sm outline-none focus:ring-2 focus:ring-ring"
              value={form.employment_type}
              onChange={(event) => updateField("employment_type", event.target.value)}
            >
              <option value="full_time">Полная занятость</option>
              <option value="part_time">Частичная занятость</option>
              <option value="contract">Проектная работа</option>
            </select>
          </div>
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea id="description" value={form.description} onChange={(event) => updateField("description", event.target.value)} />
          </div>
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="requirements">Требования</Label>
            <Textarea id="requirements" value={form.requirements} onChange={(event) => updateField("requirements", event.target.value)} />
          </div>
        </div>

        {error ? <Alert intent="error">{error}</Alert> : null}

        <div className="flex justify-end">
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Сохраняем..." : "Сохранить вакансию"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
