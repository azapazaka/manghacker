import { Heart, MapPin, Rocket, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatSalary } from "../utils/formatters";
import ApplyDialog from "./ApplyDialog";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

function ActionButton({ children, label, onClick, isActive = false }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`grid size-12 place-items-center rounded-full border border-white/30 backdrop-blur transition ${
        isActive ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30" : "bg-black/35 text-white hover:bg-black/60"
      }`}
    >
      {children}
    </button>
  );
}

export default function VacancyCard({ vacancy, matchScore, matchVerdict, matchSummary, isAiSource, animationDelayMs = 0 }) {
  const [showAiScore, setShowAiScore] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), Math.max(0, animationDelayMs));
    return () => clearTimeout(timer);
  }, [animationDelayMs]);

  return (
    <article className="snap-start" data-feed-card>
      <div className="mx-auto h-[calc(100vh-80px)] w-full px-0 py-0 md:max-w-2xl md:px-4 md:py-4">
        <div
          className={`relative flex h-full flex-col justify-end overflow-hidden rounded-3xl border border-white/15 bg-slate-950/80 p-5 shadow-2xl backdrop-blur-xl transition-all duration-500 md:p-8 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
          }`}
        >
          {vacancy.cover_image_url ? (
            <img
              src={vacancy.cover_image_url}
              alt={vacancy.title}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
          ) : null}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.26),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(244,114,182,0.22),transparent_40%)]" />
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute inset-x-0 bottom-0 h-[52%] bg-gradient-to-t from-black/90 via-black/55 to-transparent" />

          <div className="absolute right-4 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-3 md:right-5">
            <ApplyDialog
              vacancyId={vacancy.id}
              triggerLabel=""
              triggerAriaLabel="Откликнуться"
              triggerVariant="ghost"
              triggerSize="icon"
              triggerClassName="size-12 rounded-full border border-white/30 bg-black/35 text-white backdrop-blur hover:bg-black/60"
              triggerIcon={<Rocket className="size-5" />}
            />
            <ActionButton label="Сохранить" onClick={() => setIsSaved((current) => !current)} isActive={isSaved}>
              <Heart className={`size-5 ${isSaved ? "fill-current" : ""}`} />
            </ActionButton>
            <ActionButton label="Показать AI подбор" onClick={() => setShowAiScore((current) => !current)}>
              <Sparkles className="size-5" />
            </ActionButton>
          </div>

          <div className="relative z-10 max-w-[84%] space-y-3 text-white md:max-w-[76%]">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-white/30 bg-white/15 text-white hover:bg-white/20">{vacancy.category}</Badge>
              <Badge className="border-white/25 bg-black/25 text-slate-100">{vacancy.district || "Мангистау"}</Badge>
              {isAiSource ? <Badge className="border-sky-300/40 bg-sky-500/20 text-sky-100">AI лента</Badge> : null}
            </div>

            <h3 className="text-2xl font-extrabold leading-tight tracking-tight md:text-3xl">{vacancy.title}</h3>

            <p className="text-base font-medium text-slate-100">{vacancy.employer_name || "Работодатель"}</p>

            <div className="flex items-center gap-2 text-base font-semibold">
              <MapPin className="size-4 text-slate-200" />
              <span className="text-slate-100">{formatSalary(vacancy.salary)}</span>
            </div>

            {showAiScore ? (
              <div className="rounded-2xl border border-white/25 bg-black/35 p-3 text-sm text-slate-100 backdrop-blur">
                <p className="font-semibold">
                  AI score: {typeof matchScore === "number" ? `${matchScore}/100` : "недостаточно данных"}
                </p>
                {matchVerdict ? <p className="mt-1 opacity-90">Вердикт: {matchVerdict}</p> : null}
                {matchSummary ? <p className="mt-1 opacity-90">{matchSummary}</p> : null}
              </div>
            ) : null}

            <div className="pt-1">
              <Button asChild variant="secondary" className="rounded-full bg-white/95 text-slate-900 hover:bg-white">
                <Link to={`/vacancies/${vacancy.id}`}>Подробнее</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
