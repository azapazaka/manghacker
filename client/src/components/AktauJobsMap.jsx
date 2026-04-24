import { BriefcaseBusiness, MapPin } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import { vacancyApi } from "../api/vacancies";
import { AKTAU_CENTER, resolveVacancyCoordinates } from "../utils/geo";
import { formatSalary } from "../utils/formatters";
import { Card, CardContent, CardDescription, CardTitle } from "./ui/card";

export default function AktauJobsMap() {
  const [vacancies, setVacancies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setError("");
        setIsLoading(true);
        const { data } = await vacancyApi.list({});
        if (cancelled) return;
        setVacancies(Array.isArray(data?.data) ? data.data.slice(0, 120) : []);
      } catch {
        if (cancelled) return;
        setError("Не удалось загрузить карту вакансий.");
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
      vacancies.map((vacancy) => {
        const coords = resolveVacancyCoordinates(vacancy);
        return {
        vacancy,
          position: [coords.lat, coords.lng]
        };
      }),
    [vacancies]
  );

  return (
    <Card>
      <CardContent className="space-y-4 p-5 md:p-6">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.26em] text-muted-foreground">Карта рабочих мест Актау</p>
          <CardTitle className="text-2xl">Где сейчас открыты вакансии</CardTitle>
          <CardDescription>Маркеры показывают активные рабочие точки по микрорайонам Актау. Нажмите на точку, чтобы увидеть вакансию.</CardDescription>
        </div>

        {isLoading ? (
          <div className="grid h-[360px] place-items-center rounded-3xl border border-dashed border-border bg-white/65 text-muted-foreground">
            Загружаем карту...
          </div>
        ) : error ? (
          <div className="grid h-[360px] place-items-center rounded-3xl border border-dashed border-border bg-white/65 text-rose-600">{error}</div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-white/70 shadow-glow">
            <MapContainer center={[AKTAU_CENTER.lat, AKTAU_CENTER.lng]} zoom={12} scrollWheelZoom={false} className="h-[360px] w-full md:h-[420px]">
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

              {markers.map(({ vacancy, position }) => (
                <CircleMarker key={vacancy.id} center={position} radius={8} pathOptions={{ color: "#0f172a", fillColor: "#2563eb", fillOpacity: 0.8, weight: 2 }}>
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
        )}

        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5">
            <BriefcaseBusiness className="size-3.5" />
            Активных вакансий: {vacancies.length}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5">
            <MapPin className="size-3.5" />
            Центр карты: Актау
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
