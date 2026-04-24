import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { vacancyApi } from "../api/vacancies";
import VacancyForm from "../components/VacancyForm";
import { Alert } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";

const initialForm = {
  title: "",
  category: "",
  district: "",
  salary: "",
  employment_type: "full_time",
  description: "",
  requirements: "",
  ai_required_skills: "",
  ai_min_experience_years: "",
  microdistrict: "",
  schedule: "",
  ai_summary: ""
};

export default function VacancyEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit) {
      return;
    }

    const load = async () => {
      try {
        const { data } = await vacancyApi.detail(id);
        setForm({
          title: data.data.title || "",
          category: data.data.category || "",
          district: data.data.district || "",
          salary: data.data.salary || "",
          employment_type: data.data.employment_type || "full_time",
          description: data.data.description || "",
          requirements: data.data.requirements || "",
          ai_required_skills: Array.isArray(data.data.ai_required_skills) ? data.data.ai_required_skills.join(", ") : "",
          ai_min_experience_years: data.data.ai_min_experience_years || "",
          microdistrict: data.data.microdistrict || "",
          schedule: data.data.schedule || "",
          ai_summary: data.data.ai_summary || ""
        });
      } catch {
        setError("Не удалось загрузить вакансию.");
      }
    };

    load();
  }, [id, isEdit]);

  const handleSubmit = async () => {
    setError("");

    try {
      setIsSubmitting(true);
      if (isEdit) {
        await vacancyApi.update(id, form);
      } else {
        await vacancyApi.create(form);
      }
      navigate("/dashboard");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Не удалось сохранить вакансию.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden bg-hero">
        <CardContent className="space-y-4 p-8 md:p-10">
          <Badge variant="secondary" className="rounded-full px-4 py-2">{isEdit ? "Редактирование" : "Новая вакансия"}</Badge>
          <h1 className="text-5xl font-semibold leading-[0.96] tracking-tight">
            {isEdit ? "Обновите карточку вакансии и продолжайте работу с кандидатами." : "Создайте вакансию, чтобы начать получать отклики в Telegram."}
          </h1>
        </CardContent>
      </Card>

      {error ? <Alert intent="error">{error}</Alert> : null}
      <VacancyForm form={form} setForm={setForm} onSubmit={handleSubmit} isSubmitting={isSubmitting} error={error} />
    </div>
  );
}
