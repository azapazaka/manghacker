import { KeyRound, MessageCircle, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useAuth } from "../hooks/useAuth";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      setIsSubmitting(true);
      const { user } = await login({ email, password });
      navigate(user.role === "employer" ? "/dashboard" : "/my-applications");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Не удалось выполнить вход.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[1.1fr_460px]">
      <Card className="overflow-hidden bg-hero">
        <CardContent className="flex h-full flex-col justify-between gap-10 p-8 md:p-10">
          <div className="space-y-6">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Вход в Qoldan</p>
            <h1 className="max-w-xl text-5xl font-semibold leading-[0.96] tracking-tight">Войдите и продолжите путь от отклика до оффера.</h1>
            <p className="max-w-xl text-lg leading-8 text-muted-foreground">
              Работодатели управляют вакансиями и кандидатами, а соискатели следят за офферами и решениями в одном понятном интерфейсе.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[["Без хаоса", MessageCircle], ["Без повторов", KeyRound], ["С Telegram", ShieldCheck]].map(([label, Icon]) => (
              <div key={label} className="rounded-[28px] border border-white/80 bg-white/80 p-5">
                <Icon className="mb-4 size-5" />
                <p className="font-medium">{label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-6 p-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold tracking-tight">Войти в аккаунт</h2>
            <p className="text-muted-foreground">Используйте email и пароль, которые вы указали при регистрации.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </div>

            {error ? <Alert intent="error">{error}</Alert> : null}

            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Входим..." : "Войти"}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground">
            Нет аккаунта?{" "}
            <Link className="font-medium text-foreground underline-offset-4 hover:underline" to="/register">
              Создать профиль
            </Link>
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
