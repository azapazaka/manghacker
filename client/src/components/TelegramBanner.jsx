import { Bot, ExternalLink } from "lucide-react";
import { Alert } from "./ui/alert";
import { Button } from "./ui/button";

export default function TelegramBanner({ botUsername, roleLabel }) {
  return (
    <Alert title="Нужно активировать Telegram-бота" className="border-sky-200 bg-sky-50/90 text-sky-900">
      <div className="space-y-4">
        <p>
          Для роли «{roleLabel}» Telegram обязателен. Откройте <strong>@{botUsername}</strong> и отправьте <strong>/start</strong>, чтобы получать отклики, офферы и статусы.
        </p>
        <Button asChild variant="secondary">
          <a href={`https://t.me/${botUsername}`} target="_blank" rel="noreferrer">
            <Bot className="size-4" />
            Открыть бота
            <ExternalLink className="size-4" />
          </a>
        </Button>
      </div>
    </Alert>
  );
}
