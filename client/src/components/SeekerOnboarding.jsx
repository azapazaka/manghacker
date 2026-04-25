import { Loader2, Send, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { profileApi } from "../api/profile";
import { Alert } from "./ui/alert";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";

const initialMessages = [{ role: "assistant", content: "Привет! 👋 Кем хочешь работать?" }];

const initialManualForm = {
  profile_summary: "",
  skills: "",
  preferred_employment_type: "",
  location_mode: "city",
  district: "",
  experience_years: ""
};

export default function SeekerOnboarding({ open, onComplete }) {
  const [mode, setMode] = useState("ai");
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [manualForm, setManualForm] = useState(initialManualForm);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSavingManual, setIsSavingManual] = useState(false);
  const [error, setError] = useState("");
  const [completionMessage, setCompletionMessage] = useState("");

  const currentQuestion = useMemo(() => messages.filter((message) => message.role === "assistant").at(-1)?.content, [messages]);

  const finishOnboarding = (message) => {
    setCompletionMessage(message);
    window.setTimeout(() => {
      onComplete?.();
    }, 700);
  };

  const handleSend = async (text = input) => {
    if (!text.trim() || isAiLoading) return;

    const userMessage = { role: "user", content: text.trim() };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setError("");
    setIsAiLoading(true);

    try {
      const { data } = await profileApi.parseOnboarding(nextMessages);
      const parsedState = data?.data || {};
      const assistantMessage = {
        role: "assistant",
        content: parsedState.reply_message || "Подбираем вакансии..."
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (parsedState.match_ready) {
        finishOnboarding("Профиль готов. Открываем AI-подбор вакансий...");
      }
    } catch {
      setError("AI-онбординг сейчас недоступен. Можно продолжить через ручное заполнение профиля.");
      setMessages((prev) => [...prev, { role: "assistant", content: "Не получилось обработать ответ через AI." }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSend();
    }
  };

  const handleManualField = (key, value) => {
    setManualForm((current) => ({ ...current, [key]: value }));
  };

  const handleManualSubmit = async () => {
    if (!manualForm.profile_summary.trim()) {
      setError("Укажите желаемую роль, чтобы мы могли собрать профиль.");
      return;
    }

    if (manualForm.location_mode === "district" && !manualForm.district.trim()) {
      setError("Укажите район или микрорайон.");
      return;
    }

    setError("");
    setIsSavingManual(true);

    try {
      await profileApi.update({
        profile_summary: manualForm.profile_summary,
        skills: manualForm.skills,
        preferred_employment_type: manualForm.preferred_employment_type || null,
        preferred_districts: manualForm.location_mode === "district" ? [manualForm.district] : [],
        experience_years: manualForm.experience_years,
        availability: manualForm.location_mode
      });

      finishOnboarding("Профиль сохранён. Открываем персональную ленту вакансий...");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Не удалось сохранить профиль.");
    } finally {
      setIsSavingManual(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-xl"
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Твой профиль Qoldan</DialogTitle>
          <DialogDescription>
            Сначала попробуем быстрый AI-онбординг. Если сервис недоступен, можно сразу заполнить профиль вручную.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant={mode === "ai" ? "default" : "secondary"} onClick={() => setMode("ai")}>
              <Sparkles className="size-4" />
              AI-онбординг
            </Button>
            <Button type="button" variant={mode === "manual" ? "default" : "secondary"} onClick={() => setMode("manual")}>
              Пропустить AI и заполнить вручную
            </Button>
          </div>

          {error ? (
            <Alert intent="error" title="Нужен fallback">
              {error}
            </Alert>
          ) : null}

          {completionMessage ? (
            <Alert intent="success">{completionMessage}</Alert>
          ) : mode === "ai" ? (
            <div className="space-y-5 rounded-[28px] border border-border/70 bg-white/70 p-5">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Последний вопрос</p>
                <h2 className="text-2xl font-medium tracking-tight text-foreground">{currentQuestion}</h2>
              </div>

              <div className="max-h-52 space-y-3 overflow-y-auto pr-1">
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`rounded-3xl px-4 py-3 text-sm ${
                      message.role === "assistant" ? "bg-secondary text-foreground" : "ml-auto max-w-[85%] bg-primary text-primary-foreground"
                    }`}
                  >
                    {message.content}
                  </div>
                ))}
              </div>

              {isAiLoading ? (
                <div className="flex items-center gap-3 rounded-3xl border border-border/70 bg-white px-4 py-3 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  AI анализирует ответ и уточняет профиль...
                </div>
              ) : null}

              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Ваш ответ..."
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isAiLoading}
                  className="h-12 flex-1 rounded-2xl px-4"
                  autoFocus
                />
                <Button type="button" size="icon" onClick={() => handleSend()} disabled={isAiLoading || !input.trim()} className="size-12 rounded-2xl">
                  <Send className="size-5" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 rounded-[28px] border border-border/70 bg-white/70 p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="manual-profile-summary">
                    Кем хотите работать
                  </label>
                  <Input
                    id="manual-profile-summary"
                    value={manualForm.profile_summary}
                    onChange={(event) => handleManualField("profile_summary", event.target.value)}
                    placeholder="Например: бариста, кассир, продавец, курьер"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="manual-skills">
                    Навыки
                  </label>
                  <Input
                    id="manual-skills"
                    value={manualForm.skills}
                    onChange={(event) => handleManualField("skills", event.target.value)}
                    placeholder="Через запятую: продажи, касса, общение с клиентами"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="manual-employment-type">
                    Формат занятости
                  </label>
                  <select
                    id="manual-employment-type"
                    className="flex h-12 w-full rounded-2xl border border-border/70 bg-white/80 px-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                    value={manualForm.preferred_employment_type}
                    onChange={(event) => handleManualField("preferred_employment_type", event.target.value)}
                  >
                    <option value="">Выберите формат</option>
                    <option value="full_time">Полный день</option>
                    <option value="part_time">Частичная занятость</option>
                    <option value="contract">Гибкий / проектный график</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="manual-experience">
                    Опыт, лет
                  </label>
                  <Input
                    id="manual-experience"
                    type="number"
                    min="0"
                    value={manualForm.experience_years}
                    onChange={(event) => handleManualField("experience_years", event.target.value)}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="manual-location-mode">
                    Локация
                  </label>
                  <select
                    id="manual-location-mode"
                    className="flex h-12 w-full rounded-2xl border border-border/70 bg-white/80 px-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                    value={manualForm.location_mode}
                    onChange={(event) => handleManualField("location_mode", event.target.value)}
                  >
                    <option value="city">Весь город</option>
                    <option value="district">Конкретный район</option>
                    <option value="nearby">Рядом со мной</option>
                  </select>
                </div>

                {manualForm.location_mode === "district" ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="manual-district">
                      Район / микрорайон
                    </label>
                    <Input
                      id="manual-district"
                      value={manualForm.district}
                      onChange={(event) => handleManualField("district", event.target.value)}
                      placeholder="Например: 15 мкр, 11 мкр, центр"
                    />
                  </div>
                ) : null}
              </div>

              <Button type="button" onClick={handleManualSubmit} disabled={isSavingManual} className="w-full">
                {isSavingManual ? "Сохраняем профиль..." : "Сохранить и открыть ленту"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
