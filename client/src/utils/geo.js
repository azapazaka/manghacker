export const AKTAU_CENTER = {
  lat: 43.6532,
  lng: 51.1975
};

function hashText(value) {
  return String(value || "")
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

export function getDistanceKm(from, to) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);

  const a = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

export function resolveVacancyCoordinates(vacancy) {
  const label = vacancy?.microdistrict || vacancy?.district || vacancy?.title || "";
  const districtMatch = String(label).match(/(\d{1,2})/);

  if (districtMatch) {
    const districtNumber = Number(districtMatch[1]);
    const angle = ((districtNumber * 29) % 360) * (Math.PI / 180);
    const radius = 0.008 + ((districtNumber % 8) * 0.0024);
    return {
      lat: AKTAU_CENTER.lat + Math.cos(angle) * radius,
      lng: AKTAU_CENTER.lng + Math.sin(angle) * radius * 1.15
    };
  }

  const seed = hashText(label);
  const latOffset = ((seed % 19) - 9) * 0.0036;
  const lngOffset = (((seed * 7) % 19) - 9) * 0.004;
  return {
    lat: AKTAU_CENTER.lat + latOffset,
    lng: AKTAU_CENTER.lng + lngOffset
  };
}
