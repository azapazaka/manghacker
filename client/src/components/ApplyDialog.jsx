import { useState } from "react";
import { applicationApi } from "../api/applications";
import { useAuth } from "../hooks/useAuth";
import { Alert } from "./ui/alert";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "./ui/dialog";

export default function ApplyDialog({ vacancyId, onApplied }) {
  const { isAuthenticated, user } = useAuth();
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!file) {
      setError("Выберите PDF-резюме до 5 MB.");
      return;
    }

    setError("");
    setSuccess("");

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("vacancy_id", vacancyId);
      formData.append("resume", file);
      const { data } = await applicationApi.apply(formData);
      setSuccess(data.message);
      onApplied?.(data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Не удалось отправить отклик.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return <p className="text-sm text-muted-foreground">Чтобы откликнуться, сначала войдите как соискатель.</p>;
  }

  if (user?.role !== "seeker") {
    return <p className="text-sm text-muted-foreground">Отклик доступен только для аккаунта соискателя.</p>;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="lg">Откликнуться</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Отправить отклик</DialogTitle>
          <DialogDescription>Загрузите PDF-резюме. Работодатель получит его в Telegram вместе с вашими контактами.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <label className="block rounded-[24px] border border-dashed border-border bg-white/70 p-5 text-sm text-muted-foreground">
            <span className="mb-2 block font-medium text-foreground">PDF-резюме</span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              className="block w-full text-sm"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />
          </label>
          {error ? <Alert intent="error">{error}</Alert> : null}
          {success ? <Alert intent="success">{success}</Alert> : null}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" type="button">
              Позже
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Отправляем..." : "Отправить отклик"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
