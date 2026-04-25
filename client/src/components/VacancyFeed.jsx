import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { matchApi } from "../api/matches";
import { useAuth } from "../hooks/useAuth";
import { vacancyApi } from "../api/vacancies";
import VacancyCard from "./VacancyCard";
import VacancyFilters from "./VacancyFilters";
import { Card, CardContent } from "./ui/card";

const initialFilters = {
  search: "",
  category: "",
  district: "",
  employment_type: ""
};

const categoryCoverMap = {
  "Рестораны/Общепит": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1400&q=80",
  "Розничная торговля": "https://images.unsplash.com/photo-1604719312566-8912e9c8a213?auto=format&fit=crop&w=1400&q=80",
  "Логистика/Доставка": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1400&q=80",
  "Логистика/Склад": "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=1400&q=80",
  "IT": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80",
  "IT/Аналитика": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1400&q=80",
  "Маркетинг": "https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?auto=format&fit=crop&w=1400&q=80",
  "Продажи": "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=1400&q=80",
  "Административный персонал": "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=80",
  "Сервис и поддержка": "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1400&q=80",
  "Финансы": "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1400&q=80",
  "HR": "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1400&q=80",
  "Автосервис": "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1400&q=80",
  "Строительство/Ремонт": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1400&q=80",
  "Безопасность": "https://images.unsplash.com/photo-1581093458791-9d15482442f2?auto=format&fit=crop&w=1400&q=80",
  "Медицина": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1400&q=80",
  "Образование": "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1400&q=80"
};

const defaultCover = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80";

function resolveCoverImage(vacancy) {
  return categoryCoverMap[vacancy?.category] || defaultCover;
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function matchesFilters(item, filters) {
  const vacancy = item?.vacancy || {};
  const normalizedSearch = normalizeText(filters.search);
  const normalizedCategory = normalizeText(filters.category);
  const normalizedDistrict = normalizeText(vacancy.microdistrict || vacancy.district);
  const normalizedEmploymentType = normalizeText(filters.employment_type);

  if (normalizedSearch) {
    const haystack = [vacancy.title, vacancy.description, vacancy.category, vacancy.district]
      .concat(vacancy.microdistrict || [])
      .map(normalizeText)
      .join(" ");

    if (!haystack.includes(normalizedSearch)) {
      return false;
    }
  }

  if (normalizedCategory && !normalizeText(vacancy.category).includes(normalizedCategory)) {
    return false;
  }

  if (normalizeText(filters.district) && !normalizedDistrict.includes(normalizeText(filters.district))) {
    return false;
  }

  if (normalizedEmploymentType && normalizeText(vacancy.employment_type) !== normalizedEmploymentType) {
    return false;
  }

  return true;
}

export default function VacancyFeed() {
  const { isAuthenticated, user } = useAuth();
  const feedRef = useRef(null);
  const [filters, setFilters] = useState(initialFilters);
  const [feedItems, setFeedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const query = useMemo(() => Object.fromEntries(Object.entries(filters).filter(([, value]) => value)), [filters]);
  const filteredFeedItems = useMemo(() => feedItems.filter((item) => matchesFilters(item, filters)), [feedItems, filters]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setError("");
        setIsLoading(true);
        const canUseAiRecommendations = isAuthenticated && user?.role === "seeker" && Boolean(user?.profile_summary);
        let normalized = [];

        if (canUseAiRecommendations) {
          try {
            const { data } = await matchApi.recommendations();
            const recommendations = Array.isArray(data?.data) ? data.data : [];
            normalized = recommendations
              .filter((entry) => entry?.vacancy?.id)
              .map((entry) => ({
                id: entry.vacancy.id,
                vacancy: {
                  ...entry.vacancy,
                  cover_image_url: resolveCoverImage(entry.vacancy)
                },
                source: "ai",
                match_score: entry.score ?? null,
                match_verdict: entry.verdict || "",
                match_summary: entry.summary || ""
              }));
          } catch {
            normalized = [];
          }
        }

        if (!normalized.length) {
          const { data } = await vacancyApi.list(query);
          const vacancies = Array.isArray(data?.data) ? data.data : [];
          normalized = vacancies.map((vacancy) => ({
            id: vacancy.id,
            vacancy: {
              ...vacancy,
              cover_image_url: resolveCoverImage(vacancy)
            },
            source: "vacancy",
            match_score: null,
            match_verdict: "",
            match_summary: ""
          }));
        }

        if (!cancelled) {
          setFeedItems(normalized);
        }
      } catch {
        if (!cancelled) {
          setError("Не удалось загрузить вакансии.");
          setFeedItems([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, query, user?.profile_summary, user?.role]);

  const goToNextCard = () => {
    const container = feedRef.current;
    if (!container) return;

    const cards = Array.from(container.querySelectorAll("[data-feed-card]"));
    if (!cards.length) return;

    const top = container.scrollTop;
    const currentIndex = cards.findIndex((card) => card.offsetTop >= top - 8 && card.offsetTop <= top + card.clientHeight / 2);
    const nextIndex = currentIndex >= 0 ? Math.min(currentIndex + 1, cards.length - 1) : 0;
    const nextCard = cards[nextIndex];

    if (nextCard) {
      container.scrollTo({
        top: nextCard.offsetTop,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="space-y-6">
      <VacancyFilters
        filters={filters}
        onChange={(key, value) => setFilters((current) => ({ ...current, [key]: value }))}
        onReset={() => setFilters(initialFilters)}
      />

      {isLoading ? (
        <Card className="h-[calc(100vh-80px)] rounded-3xl bg-slate-900/85 text-white">
          <CardContent className="grid h-full place-items-center p-6 text-slate-200">Загружаем ленту вакансий...</CardContent>
        </Card>
      ) : error ? (
        <Card className="h-[calc(100vh-80px)] rounded-3xl">
          <CardContent className="grid h-full place-items-center p-6 text-rose-600">{error}</CardContent>
        </Card>
      ) : filteredFeedItems.length === 0 ? (
        <Card className="h-[calc(100vh-80px)] rounded-3xl">
          <CardContent className="grid h-full place-items-center p-6 text-muted-foreground">По текущим фильтрам вакансий пока нет.</CardContent>
        </Card>
      ) : (
        <div className="relative">
          <div ref={feedRef} className="scrollbar-hide h-[calc(100vh-80px)] snap-y snap-mandatory overflow-y-scroll rounded-3xl">
            {filteredFeedItems.map((item, index) => (
              <VacancyCard
                key={item.id}
                vacancy={item.vacancy}
                matchScore={item.match_score}
                matchVerdict={item.match_verdict}
                matchSummary={item.match_summary}
                isAiSource={item.source === "ai"}
                animationDelayMs={Math.min(index * 60, 320)}
              />
            ))}
          </div>

          {filteredFeedItems.length > 1 ? (
            <button
              type="button"
              onClick={goToNextCard}
              aria-label="Следующая карточка"
              className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full border border-white/30 bg-black/55 p-3 text-white shadow-xl backdrop-blur transition hover:bg-black/70 md:block"
            >
              <ChevronDown className="size-5" />
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
