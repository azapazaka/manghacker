import { Crosshair, MapPinned, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import { matchApi } from "../api/matches";
import { AKTAU_CENTER, resolveVacancyCoordinates } from "../utils/geo";
import { formatSalary } from "../utils/formatters";
import { Alert } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "./ui/card";

const DEFAULT_LIMIT = 12;

function getMarkerStyle(score) {
  if (score >= 75) {
    return { color: "#0f172a", fillColor: "#22c55e", label: "Высокое совпадение" };
  }

  if (score >= 45) {
    return { color: "#0f172a", fillColor: "#facc15", label: "Среднее совпадение" };
  }

  return { color: "#0f172a", fillColor: "#ef4444", label: "Низкое совпадение" };
}

export default function SeekerJobsMap() {
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setError("");
        setIsLoading(true);
        const { data } = await matchApi.recommendations();
        const items = Array.isArray(data?.data) ? data.data : [];

        if (!cancelled) {
          setRecommendations(items.filter((item) => item?.vacancy?.id).slice(0, DEFAULT_LIMIT));
        }
      } catch {
        if (!cancelled) {
          setError("Не удалось загрузить AI-рекомендации для карты.");
          setRecommendations([]);
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
  }, []);

  const markers = useMemo(
    () =>
      recommendations.map((item) => {
        const coords = resolveVacancyCoordinates(item.vacancy);
        return {
          id: item.vacancy.id,
          vacancy: item.vacancy,
          score: typeof item.score === "number" ? item.score : 0,
          verdict: item.verdict || "",
          summary: item.summary || "",
          coords,
          style: getMarkerStyle(typeof item.score === "number" ? item.score : 0)
        };
      }),
    [recommendations]
  );

  const mapCenter = userLocation ? [userLocation.lat, userLocation.lng] : [AKTAU_CENTER.lat, AKTAU_CENTER.lng];

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setLocationError("Ваш браузер не поддерживает геолокацию.");
      return;
    }

    setIsLocating(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setIsLocating(false);
      },
      () => {
        setLocationError("Не удалось определить местоположение. Показываем карту вакансий без вашей точки.");
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000
      }
    );
  };

  return (
    <Card>
      <CardContent className="space-y-5 p-6">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.26em] text-muted-foreground">AI-карта работ Актау</p>
          <CardTitle className="text-3xl">Сначала определим вас, потом подсветим подходящие вакансии</CardTitle>
          <CardDescription>
            Белая точка показывает ваше местоположение. Маркеры вакансий окрашены по AI match score и показывают примерное расположение по районам Актау.
          </CardDescription>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={handleLocate} disabled={isLocating}>
            <Crosshair className="size-4" />
            {isLocating ? "Определяем..." : userLocation ? "Обновить местоположение" : "Определить мое местоположение"}
          </Button>

          <Badge variant="secondary" className="gap-2 rounded-full px-4 py-2">
            <Sparkles className="size-4" />
            Точек на карте: {markers.length}
          </Badge>
        </div>

        {!userLocation ? (
          <Alert title="Шаг 1">
            Разрешите геолокацию, чтобы увидеть свою белую метку на карте и показать рекомендации относительно вашего положения в городе.
          </Alert>
        ) : null}

        {locationError ? <Alert intent="error">{locationError}</Alert> : null}
        {error ? <Alert intent="error">{error}</Alert> : null}

        {isLoading ? (
          <div className="grid h-[420px] place-items-center rounded-3xl border border-dashed border-border bg-white/70 text-muted-foreground">
            Загружаем AI-карту вакансий...
          </div>
        ) : markers.length === 0 ? (
          <div className="grid h-[420px] place-items-center rounded-3xl border border-dashed border-border bg-white/70 text-muted-foreground">
            Пока нет рекомендаций для карты. Сначала заполните профиль и дождитесь подбора вакансий.
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-white/70 shadow-glow">
            <MapContainer center={mapCenter} zoom={12} scrollWheelZoom className="h-[420px] w-full md:h-[520px]">
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

              {userLocation ? (
                <CircleMarker center={[userLocation.lat, userLocation.lng]} radius={11} pathOptions={{ color: "#0f172a", fillColor: "#ffffff", fillOpacity: 1, weight: 3 }}>
                  <Popup>Вы здесь</Popup>
                </CircleMarker>
              ) : null}

              {markers.map((item) => (
                <CircleMarker
                  key={item.id}
                  center={[item.coords.lat, item.coords.lng]}
                  radius={8}
                  pathOptions={{ color: item.style.color, fillColor: item.style.fillColor, fillOpacity: 0.92, weight: 2 }}
                >
                  <Popup>
                    <div className="space-y-1">
                      <p className="font-semibold">{item.vacancy.title}</p>
                      <p className="text-sm text-slate-600">{item.vacancy.employer_name || "Работодатель"}</p>
                      <p className="text-sm text-slate-600">{item.vacancy.microdistrict || item.vacancy.district || "Актау"}</p>
                      <p className="text-sm font-medium">{formatSalary(item.vacancy.salary)}</p>
                      <p className="text-sm font-medium">AI score: {item.score}/100</p>
                      {item.summary ? <p className="text-sm text-slate-600">{item.summary}</p> : null}
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        )}

        <div className="flex flex-wrap gap-3 text-sm">
          <Badge className="rounded-full px-4 py-2" variant="secondary">
            <MapPinned className="mr-2 size-4" />
            Белая точка: вы
          </Badge>
          <Badge className="rounded-full bg-emerald-100 px-4 py-2 text-emerald-800 hover:bg-emerald-100">Зелёный: высокий match</Badge>
          <Badge className="rounded-full bg-amber-100 px-4 py-2 text-amber-800 hover:bg-amber-100">Жёлтый: средний match</Badge>
          <Badge className="rounded-full bg-rose-100 px-4 py-2 text-rose-800 hover:bg-rose-100">Красный: низкий match</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
