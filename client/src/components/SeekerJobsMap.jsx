import { Crosshair, MapPinned } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import { vacancyApi } from "../api/vacancies";
import { AKTAU_CENTER, getDistanceKm, resolveVacancyCoordinates } from "../utils/geo";
import { formatSalary } from "../utils/formatters";
import { Alert } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "./ui/card";

const RANGE_OPTIONS = [2, 5, 10, 20];

export default function SeekerJobsMap() {
  const [vacancies, setVacancies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("city");
  const [radiusKm, setRadiusKm] = useState(5);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setError("");
        setIsLoading(true);
        const { data } = await vacancyApi.list({});
        if (cancelled) return;
        setVacancies(Array.isArray(data?.data) ? data.data : []);
      } catch {
        if (cancelled) return;
        setError("Не удалось загрузить вакансии для карты.");
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

  const vacanciesWithCoordinates = useMemo(
    () =>
      vacancies.map((vacancy) => {
        const coords = resolveVacancyCoordinates(vacancy);
        return {
          vacancy,
          coords
        };
      }),
    [vacancies]
  );

  const filteredVacancies = useMemo(() => {
    if (mode !== "nearby" || !userLocation) {
      return vacanciesWithCoordinates;
    }

    return vacanciesWithCoordinates.filter(({ coords }) => getDistanceKm(userLocation, coords) <= radiusKm);
  }, [mode, radiusKm, userLocation, vacanciesWithCoordinates]);

  const mapCenter = mode === "nearby" && userLocation ? [userLocation.lat, userLocation.lng] : [AKTAU_CENTER.lat, AKTAU_CENTER.lng];

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
        setMode("nearby");
        setIsLocating(false);
      },
      () => {
        setLocationError("Не удалось определить местоположение. Разрешите доступ к геолокации.");
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
          <p className="text-xs uppercase tracking-[0.26em] text-muted-foreground">Карта работ Актау</p>
          <CardTitle className="text-3xl">Найдите вакансии рядом с вами</CardTitle>
          <CardDescription>Сначала определите местоположение, затем смотрите вакансии в радиусе или по всему городу.</CardDescription>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={handleLocate} disabled={isLocating}>
            <Crosshair className="size-4" />
            {isLocating ? "Определяем..." : "Определить мое местоположение"}
          </Button>

          <Button type="button" variant={mode === "nearby" ? "default" : "secondary"} onClick={() => setMode("nearby")} disabled={!userLocation}>
            Рядом со мной
          </Button>
          <Button type="button" variant={mode === "city" ? "default" : "secondary"} onClick={() => setMode("city")}>
            Весь город
          </Button>

          {mode === "nearby" ? (
            <select
              value={radiusKm}
              onChange={(event) => setRadiusKm(Number(event.target.value))}
              className="h-10 rounded-xl border border-border/70 bg-white px-3 text-sm outline-none"
            >
              {RANGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  Радиус {option} км
                </option>
              ))}
            </select>
          ) : null}
        </div>

        {locationError ? <Alert intent="error">{locationError}</Alert> : null}
        {error ? <Alert intent="error">{error}</Alert> : null}

        <div className="overflow-hidden rounded-3xl border border-white/70 shadow-glow">
          <MapContainer center={mapCenter} zoom={12} scrollWheelZoom className="h-[420px] w-full md:h-[500px]">
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {userLocation ? (
              <CircleMarker center={[userLocation.lat, userLocation.lng]} radius={10} pathOptions={{ color: "#0f172a", fillColor: "#22c55e", fillOpacity: 0.95, weight: 2 }}>
                <Popup>Вы здесь</Popup>
              </CircleMarker>
            ) : null}

            {filteredVacancies.map(({ vacancy, coords }) => (
              <CircleMarker key={vacancy.id} center={[coords.lat, coords.lng]} radius={8} pathOptions={{ color: "#0f172a", fillColor: "#2563eb", fillOpacity: 0.82, weight: 2 }}>
                <Popup>
                  <div className="space-y-1">
                    <p className="font-semibold">{vacancy.title}</p>
                    <p className="text-sm text-slate-600">{vacancy.employer_name || "Работодатель"}</p>
                    <p className="text-sm text-slate-600">{vacancy.microdistrict || vacancy.district || "Актау"}</p>
                    <p className="text-sm font-medium">{formatSalary(vacancy.salary)}</p>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        <div className="flex flex-wrap gap-3 text-sm">
          <Badge variant="secondary" className="gap-2 rounded-full px-4 py-2">
            <MapPinned className="size-4" />
            Показано вакансий: {filteredVacancies.length}
          </Badge>
          {mode === "nearby" ? <Badge className="rounded-full px-4 py-2">Режим: рядом ({radiusKm} км)</Badge> : <Badge className="rounded-full px-4 py-2">Режим: весь город</Badge>}
        </div>

        {!isLoading && mode === "nearby" && userLocation && filteredVacancies.length === 0 ? (
          <Alert>В выбранном радиусе вакансий пока нет. Попробуйте увеличить радиус или переключиться на весь город.</Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}
