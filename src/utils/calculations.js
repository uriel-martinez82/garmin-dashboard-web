// ─── Karvonen HR Zones ────────────────────────────────────────────────────────
export function calcHRZones(restingHR, age) {
  const maxHR = 220 - age;
  const hrReserve = maxHR - restingHR;
  return [
    { zone: 1, name: "Recuperación", min: Math.round(restingHR + hrReserve * 0.5), max: Math.round(restingHR + hrReserve * 0.6), color: "#60efff", desc: "Aeróbico suave" },
    { zone: 2, name: "Base aeróbica", min: Math.round(restingHR + hrReserve * 0.6), max: Math.round(restingHR + hrReserve * 0.7), color: "#00d4aa", desc: "Quema de grasa" },
    { zone: 3, name: "Aeróbico",      min: Math.round(restingHR + hrReserve * 0.7), max: Math.round(restingHR + hrReserve * 0.8), color: "#f9c74f", desc: "Resistencia" },
    { zone: 4, name: "Umbral",        min: Math.round(restingHR + hrReserve * 0.8), max: Math.round(restingHR + hrReserve * 0.9), color: "#f77f00", desc: "Alto rendimiento" },
    { zone: 5, name: "Máximo",        min: Math.round(restingHR + hrReserve * 0.9), max: maxHR,                                   color: "#d62828", desc: "Esfuerzo máximo" },
  ];
}

export function getZoneForActivity(avgHR, zones) {
  for (let z of zones) {
    if (avgHR >= z.min && avgHR <= z.max) return z;
  }
  if (avgHR < zones[0].min) return { ...zones[0], name: "Por debajo Z1" };
  return { ...zones[4], name: "Zona 5+" };
}

// ─── TRIMP (Banister 1991) ────────────────────────────────────────────────────
export function calcTRIMP(durationMin, avgHR, restingHR, maxHR, gender = "MALE") {
  const hrReserve = (avgHR - restingHR) / (maxHR - restingHR);
  const factor = gender === "FEMALE" ? 1.67 : 1.92;
  return durationMin * hrReserve * 0.64 * Math.exp(factor * hrReserve);
}

// ─── Recovery Score (Firstbeat model) ────────────────────────────────────────
export function calcRecoveryScore(bodyBattery, stress, sleepSeconds) {
  const bb = Math.min(bodyBattery || 50, 100) / 100;
  const st = 1 - Math.min(stress || 50, 100) / 100;
  const sl = Math.min(sleepSeconds || 0, 28800) / 28800;
  return Math.round((bb * 0.4 + st * 0.3 + sl * 0.3) * 100);
}

// ─── VO2max Percentile (ACSM 2022) ───────────────────────────────────────────
export function getVO2maxPercentile(vo2max, age, gender) {
  const tables = {
    MALE: [
      { ageMin: 20, ageMax: 29, poor: 33, fair: 37, good: 42, excellent: 52, superior: 60 },
      { ageMin: 30, ageMax: 39, poor: 31, fair: 35, good: 41, excellent: 49, superior: 57 },
      { ageMin: 40, ageMax: 49, poor: 29, fair: 33, good: 38, excellent: 46, superior: 55 },
      { ageMin: 50, ageMax: 59, poor: 25, fair: 30, good: 35, excellent: 43, superior: 51 },
      { ageMin: 60, ageMax: 69, poor: 20, fair: 26, good: 31, excellent: 39, superior: 45 },
    ],
    FEMALE: [
      { ageMin: 20, ageMax: 29, poor: 28, fair: 32, good: 36, excellent: 45, superior: 53 },
      { ageMin: 30, ageMax: 39, poor: 26, fair: 30, good: 34, excellent: 42, superior: 50 },
      { ageMin: 40, ageMax: 49, poor: 24, fair: 27, good: 31, excellent: 38, superior: 46 },
      { ageMin: 50, ageMax: 59, poor: 20, fair: 23, good: 27, excellent: 34, superior: 42 },
      { ageMin: 60, ageMax: 69, poor: 17, fair: 20, good: 24, excellent: 30, superior: 37 },
    ],
  };
  const genderTable = tables[gender] || tables.MALE;
  const ref = genderTable.find(r => age >= r.ageMin && age <= r.ageMax) || genderTable[2];
  if (vo2max >= ref.superior) return { label: "Superior", percentile: 95, color: "#00d4aa" };
  if (vo2max >= ref.excellent) return { label: "Excelente", percentile: 80, color: "#60efff" };
  if (vo2max >= ref.good)      return { label: "Bueno",     percentile: 60, color: "#f9c74f" };
  if (vo2max >= ref.fair)      return { label: "Regular",   percentile: 40, color: "#f77f00" };
  return { label: "Por mejorar", percentile: 20, color: "#d62828" };
}

// ─── WHO Compliance ───────────────────────────────────────────────────────────
export function getWHOCompliance(activeMinutes) {
  const pct = Math.min(Math.round((activeMinutes / 150) * 100), 100);
  return { pct, target: 150 };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const ZONE_COLORS = ["#60efff", "#00d4aa", "#f9c74f", "#f77f00", "#d62828"];

export function getActivityZoneTotals(act) {
  return [1,2,3,4,5].map(z => act[`hr_zone_${z}_sec`] || 0);
}

export function formatActivity(type) {
  const map = {
    running:           "🏃 Running",
    treadmill_running: "🏃 Cinta",
    lap_swimming:      "🏊 Natación",
    indoor_cycling:    "🚴 Ciclismo indoor",
    cycling:           "🚴 Ciclismo",
    walking:           "🚶 Caminata",
    strength_training: "🏋️ Fuerza",
    yoga:              "🧘 Yoga",
    hiking:            "⛰️ Senderismo",
  };
  return map[type] || "🏅 " + (type || "Actividad");
}

export function formatLocalDate(isoString, timezone = "America/Costa_Rica") {
  return new Date(isoString).toLocaleDateString("es-MX", {
    timeZone: timezone, day: "2-digit", month: "2-digit", year: "numeric"
  });
}

export function formatLocalTime(isoString, timezone = "America/Costa_Rica") {
  return new Date(isoString).toLocaleTimeString("es-MX", {
    timeZone: timezone, hour: "2-digit", minute: "2-digit"
  });
}
