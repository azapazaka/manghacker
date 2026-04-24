import { Loader2, Send } from "lucide-react";
import { useState } from "react";
import { profileApi } from "../api/profile";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";

export default function SeekerOnboarding({ open, onComplete }) {
  const [messages, setMessages] = useState([{ role: "assistant", content: "Привет! 👋 Кем хочешь работать?" }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentQuestion = messages.filter(m => m.role === "assistant").pop()?.content;

  const handleSend = async (text = input) => {
    if (!text.trim() || isLoading) return;

    const userMessage = { role: "user", content: text.trim() };
    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInput("");
    setIsLoading(true);

    try {
      const { data } = await profileApi.parseOnboarding(newHistory);
      const { data: parsedState } = data;

      const assistantMessage = { role: "assistant", content: parsedState.reply_message || "🔍 Подбираем вакансии..." };
      setMessages((prev) => [...prev, assistantMessage]);

      if (parsedState.match_ready) {
        setIsCompleted(true);
        setTimeout(() => {
          onComplete();
        }, 3000);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Ой, что-то пошло не так. Давай попробуем еще раз?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Твой профиль Qoldan</DialogTitle>
          <DialogDescription>
            Ответь на пару вопросов, чтобы мы нашли лучшие вакансии для тебя.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-[200px] flex-col items-center justify-center gap-6 p-6 text-center">
          {isLoading ? (
            <div className="flex flex-col items-center gap-4 text-muted-foreground animate-pulse">
              <Loader2 className="size-10 animate-spin text-primary" />
              <p className="text-lg">Секунду, анализирую...</p>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-medium tracking-tight text-foreground">
                {currentQuestion}
              </h2>

              {!isCompleted && (
                <div className="flex w-full max-w-sm items-center space-x-2 mt-4">
                  <Input
                    type="text"
                    placeholder="Ваш ответ..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    className="flex-1 h-12 text-lg rounded-2xl px-4 bg-slate-50 border-border/50"
                    autoFocus
                  />
                  <Button type="button" size="icon" onClick={() => handleSend()} disabled={isLoading || !input.trim()} className="h-12 w-12 rounded-2xl">
                    <Send className="size-5" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
