import { BriefcaseBusiness, MessageCircleHeart, UserRoundSearch } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useAuth } from "../hooks/useAuth";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [role, setRole] = useState("seeker");
  const [form, setForm] = useState({
    full_name: "",
    contact_name: "",
    company_name: "",
    email: "",
    password: "",
    telegram_username: ""
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      setIsSubmitting(true);
      const payload =
        role === "seeker"
          ? {
              role,
              full_name: form.full_name,
              email: form.email,
              password: form.password,
              telegram_username: form.telegram_username
            }
          : {
              role,
              contact_name: form.contact_name,
              company_name: form.company_name,
              email: form.email,
              password: form.password,
              telegram_username: form.telegram_username
            };

      const { user } = await register(payload);
      navigate("/dashboard");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Не удалось зарегистрироваться.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_520px]">
      <Card className="overflow-hidden bg-hero">
        <CardContent className="space-y-8 p-8 md:p-10">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Регистрация в Qoldan</p>
          <h1 className="max-w-2xl text-5xl font-semibold leading-[0.96] tracking-tight">Создайте профиль и подключите Telegram, чтобы не потерять важные решения.</h1>
          <p className="max-w-xl text-lg leading-8 text-muted-foreground">
            Telegram обязателен для обеих ролей: работодатель получает отклики и статусы, соискатель — офферы и напоминания о решении на сайте.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["Соискатель", "Отклики и офферы в одном месте", UserRoundSearch],
              ["Работодатель", "Кандидаты и предложения по вакансии", BriefcaseBusiness],
              ["Telegram", "Подтверждение через /start", MessageCircleHeart]
            ].map(([title, subtitle, Icon]) => (
              <div key={title} className="rounded-[28px] border border-white/80 bg-white/80 p-5">
                <Icon className="mb-4 size-5" />
                <p className="font-medium">{title}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{subtitle}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-6 p-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold tracking-tight">Создать аккаунт</h2>
            <p className="text-muted-foreground">После регистрации обязательно откройте Telegram-бота и отправьте <strong>/start</strong>.</p>
          </div>

          <Tabs value={role} onValueChange={setRole}>
            <TabsList className="w-full">
              <TabsTrigger className="flex-1" value="seeker">Я соискатель</TabsTrigger>
              <TabsTrigger className="flex-1" value="employer">Я работодатель</TabsTrigger>
            </TabsList>

            <form className="space-y-5 pt-6" onSubmit={handleSubmit}>
              <TabsContent value="seeker" className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Имя и фамилия</Label>
                  <Input id="full_name" value={form.full_name} onChange={(event) => updateField("full_name", event.target.value)} />
                </div>
              </TabsContent>

              <TabsContent value="employer" className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Название компании</Label>
                  <Input id="company_name" value={form.company_name} onChange={(event) => updateField("company_name", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_name">Имя контактного лица</Label>
                  <Input id="contact_name" value={form.contact_name} onChange={(event) => updateField("contact_name", event.target.value)} />
                </div>
              </TabsContent>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input id="password" type="password" value={form.password} onChange={(event) => updateField("password", event.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telegram_username">Telegram username</Label>
                <Input id="telegram_username" placeholder="@username" value={form.telegram_username} onChange={(event) => updateField("telegram_username", event.target.value)} />
              </div>

              {error ? <Alert intent="error">{error}</Alert> : null}

              <Button className="w-full" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Создаем профиль..." : "Зарегистрироваться"}
              </Button>
            </form>
          </Tabs>
        </CardContent>
      </Card>
    </section>
  );
}
