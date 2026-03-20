import { useEffect, useState, useRef } from "react";

// ─── Scientific Calculation Engine ───────────────────────────────────────────

function calcHRZones(restingHR, age) {
  const maxHR = 220 - age;
  const hrReserve = maxHR - restingHR;
  return [
    { zone: 1, name: "Recuperación", min: Math.round(restingHR + hrReserve * 0.5), max: Math.round(restingHR + hrReserve * 0.6), color: "#60efff", desc: "Aeróbico suave" },
    { zone: 2, name: "Base aeróbica", min: Math.round(restingHR + hrReserve * 0.6), max: Math.round(restingHR + hrReserve * 0.7), color: "#00d4aa", desc: "Quema de grasa" },
    { zone: 3, name: "Aeróbico", min: Math.round(restingHR + hrReserve * 0.7), max: Math.round(restingHR + hrReserve * 0.8), color: "#f9c74f", desc: "Resistencia" },
    { zone: 4, name: "Umbral", min: Math.round(restingHR + hrReserve * 0.8), max: Math.round(restingHR + hrReserve * 0.9), color: "#f77f00", desc: "Alto rendimiento" },
    { zone: 5, name: "Máximo", min: Math.round(restingHR + hrReserve * 0.9), max: maxHR, color: "#d62828", desc: "Esfuerzo máximo" },
  ];
}

function getZoneForActivity(avgHR, zones) {
  for (let z of zones) {
    if (avgHR >= z.min && avgHR <= z.max) return z;
  }
  if (avgHR < zones[0].min) return { ...zones[0], name: "Por debajo Z1" };
  return { ...zones[4], name: "Zona 5+" };
}

function calcTRIMP(durationMin, avgHR, restingHR, maxHR, gender = "MALE") {
  const hrReserve = (avgHR - restingHR) / (maxHR - restingHR);
  const factor = gender === "FEMALE" ? 1.67 : 1.92;
  return durationMin * hrReserve * 0.64 * Math.exp(factor * hrReserve);
}

function calcRecoveryScore(bodyBattery, stress, sleepSeconds) {
  const bb = Math.min(bodyBattery || 50, 100) / 100;
  const st = 1 - Math.min(stress || 50, 100) / 100;
  const sl = Math.min(sleepSeconds || 0, 28800) / 28800;
  return Math.round((bb * 0.4 + st * 0.3 + sl * 0.3) * 100);
}

function getVO2maxPercentile(vo2max, age, gender) {
  // ACSM Reference tables (simplified)
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
  if (vo2max >= ref.good) return { label: "Bueno", percentile: 60, color: "#f9c74f" };
  if (vo2max >= ref.fair) return { label: "Regular", percentile: 40, color: "#f77f00" };
  return { label: "Por mejorar", percentile: 20, color: "#d62828" };
}

function getWHOCompliance(activeMinutes, vigorousMinutes = 0) {
  // WHO: 150 min/week moderate OR 75 min vigorous
  const equivalent = activeMinutes + vigorousMinutes * 2;
  const pct = Math.min(Math.round((equivalent / 150) * 100), 100);
  return { pct, equivalent, target: 150 };
}

function formatActivity(type) {
  const map = {
    running: "🏃 Running",
    treadmill_running: "🏃 Cinta",
    lap_swimming: "🏊 Natación",
    indoor_cycling: "🚴 Ciclismo indoor",
    cycling: "🚴 Ciclismo",
    walking: "🚶 Caminata",
    strength_training: "🏋️ Fuerza",
    yoga: "🧘 Yoga",
    hiking: "⛰️ Senderismo",
  };
  return map[type] || "🏅 " + (type || "Actividad");
}

// ─── Mock data (reemplazar con fetch real) ────────────────────────────────────
const MOCK = {
  user: { name: "Juan Pablo", age: 42, gender: "MALE", vo2max: 45, height: 189, weight: 90 },
  summary: {
    avg_steps: 10011, avg_calories: 2668, avg_sleep_hours: 0,
    avg_active_minutes: 99, avg_resting_heart_rate: 47,
    avg_stress: 25, avg_body_battery: 67, total_days: 1,
  },
  daily: { sleep_seconds: 0, body_battery: 67, stress_avg: 25, resting_heart_rate: 47 },
  activities: [
    { activity_type: "lap_swimming", start_time: "2026-03-16 19:53:21", duration_seconds: 1413, distance_meters: 600, calories: 144, avg_heart_rate: 126, max_heart_rate: 149 },
    { activity_type: "running", start_time: "2026-03-15 13:53:00", duration_seconds: 1203, distance_meters: 3452, calories: 307, avg_heart_rate: 157, max_heart_rate: 169 },
    { activity_type: "indoor_cycling", start_time: "2026-03-15 11:11:15", duration_seconds: 9097, distance_meters: 78990, calories: 1467, avg_heart_rate: 126, max_heart_rate: 154 },
    { activity_type: "treadmill_running", start_time: "2026-03-12 00:30:29", duration_seconds: 3033, distance_meters: 8010, calories: 782, avg_heart_rate: 154, max_heart_rate: 163 },
    { activity_type: "treadmill_running", start_time: "2026-03-10 14:54:28", duration_seconds: 2146, distance_meters: 5004, calories: 455, avg_heart_rate: 133, max_heart_rate: 145 },
    { activity_type: "treadmill_running", start_time: "2026-03-08 15:03:00", duration_seconds: 4209, distance_meters: 10006, calories: 990, avg_heart_rate: 145, max_heart_rate: 158 },
    { activity_type: "running", start_time: "2026-02-01 00:20:55", duration_seconds: 8095, distance_meters: 21314, calories: 2048, avg_heart_rate: 171, max_heart_rate: 185 },
  ],
  insight: `## Análisis de Rendimiento — Semana del 13 al 19 de Marzo\n\n**Resumen ejecutivo:** Perfil cardiovascular sobresaliente con FC reposo de 47 bpm, ubicándote en el percentil 80+ para tu edad según la ACSM. La carga de entrenamiento semanal es moderada-alta con buena variedad de modalidades.\n\n**🎯 Hallazgos clave:**\n- Tu VO2max de 45 ml/kg/min equivale a categoría "Bueno" para hombres de 42 años (ACSM). Con 3-4 semanas de trabajo en Zona 2 podés alcanzar "Excelente".\n- Las sesiones de natación muestran FC controlada (126 bpm) — ideal para recuperación activa.\n- El running del 1ro de febrero con FC 171 bpm indica trabajo en Zona 4-5, excelente para VO2max.\n\n**⚠️ Puntos de atención:**\n- Sin registro de sueño — imposible calcular recuperación completa. Se recomienda usar el reloj al dormir.\n- El stress promedio de 25 es bajo (positivo), pero el body battery de 67 sugiere que podés agregar carga.\n\n**📈 Recomendaciones para la próxima semana:**\n1. Incorporar 2 sesiones largas en Zona 2 (FC 104-117 bpm) para desarrollar base aeróbica\n2. Registrar sueño con el reloj para activar métricas de recuperación\n3. Mantener al menos 1 sesión de alta intensidad (Zona 4) para preservar VO2max`,
};

// ─── Components ───────────────────────────────────────────────────────────────

function AnimatedNumber({ value, suffix = "" }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = parseFloat(value) || 0;
    if (end === 0) { setDisplay(0); return; }
    const step = end / 40;
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setDisplay(end); clearInterval(timer); }
      else setDisplay(Math.round(start));
    }, 20);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{display}{suffix}</span>;
}

function RingGauge({ value, max = 100, color, size = 80, strokeWidth = 8, children }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round" style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)" }} />
      <foreignObject x={0} y={0} width={size} height={size}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", transform: "rotate(90deg)" }}>
          {children}
        </div>
      </foreignObject>
    </svg>
  );
}

function ZoneBar({ zone, maxHR, activities, zones }) {
  const inZone = activities.filter(a => a.avg_heart_rate >= zone.min && a.avg_heart_rate <= zone.max);
  const totalMin = inZone.reduce((s, a) => s + a.duration_seconds / 60, 0);
  const pct = Math.min((totalMin / 300) * 100, 100);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: zone.color, fontWeight: 700 }}>Z{zone.zone} {zone.name}</span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{zone.min}–{zone.max} bpm · {Math.round(totalMin)} min</span>
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: zone.color, borderRadius: 3, transition: "width 1.4s cubic-bezier(.4,0,.2,1)" }} />
      </div>
    </div>
  );
}

function ActivityRow({ act, zones }) {
  const zone = getZoneForActivity(act.avg_heart_rate || 0, zones);
  const distKm = ((act.distance_meters || 0) / 1000).toFixed(2);
  const durMin = Math.round((act.duration_seconds || 0) / 60);
  const pace = act.distance_meters > 0 ? Math.round(act.duration_seconds / 60 / (act.distance_meters / 1000)) : null;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 80px 100px", gap: 8, alignItems: "center", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", transition: "background .2s" }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f0", fontFamily: "'DM Sans', sans-serif" }}>{formatActivity(act.activity_type)}</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{act.start_time?.slice(0, 10)}</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f0" }}>{distKm} km</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>distancia</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f0" }}>{durMin} min</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>duración</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f0" }}>{act.avg_heart_rate || "—"}</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>FC media</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: zone.color, background: `${zone.color}18`, padding: "3px 8px", borderRadius: 20, border: `1px solid ${zone.color}40` }}>Z{zone.zone} {zone.name}</span>
      </div>
    </div>
  );
}

function InsightBlock({ text }) {
  if (!text) return null;
  const lines = text.split("\n");
  return (
    <div style={{ lineHeight: 1.75 }}>
      {lines.map((line, i) => {
        if (line.startsWith("## ")) return <h3 key={i} style={{ fontSize: 15, fontWeight: 800, color: "#60efff", margin: "16px 0 6px", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.02em" }}>{line.replace("## ", "")}</h3>;
        if (line.startsWith("**") && line.endsWith("**")) return <p key={i} style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0", margin: "8px 0 4px" }}>{line.replace(/\*\*/g, "")}</p>;
        if (line.startsWith("- ") || line.match(/^\d+\./)) return <p key={i} style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", margin: "4px 0 4px 12px", paddingLeft: 8, borderLeft: "2px solid rgba(255,255,255,0.1)" }}>{line.replace(/^[-\d+.]\s*/, "")}</p>;
        if (line.trim() === "") return <div key={i} style={{ height: 6 }} />;
        return <p key={i} style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", margin: "4px 0" }}>{line.replace(/\*\*/g, "")}</p>;
      })}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    fetch("/api/dashboard")
      .then(r => r.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  const user     = data?.user     || {};
  const summary  = data?.summary  || {};
  const activities = data?.activities || [];
  const insightText = data?.latest_insight?.insight_text || "Sin insight disponible.";
  const daily = {
    sleep_seconds:    0,
    body_battery:     summary.avg_body_battery,
    stress_avg:       summary.avg_stress,
    resting_heart_rate: summary.avg_resting_heart_rate,
  };

  // Calculations
  const zones = calcHRZones(summary.avg_resting_heart_rate || 47, user.age || 42);
  const recoveryScore = calcRecoveryScore(daily.body_battery, daily.stress_avg, daily.sleep_seconds);
  const vo2percentile = getVO2maxPercentile(user.vo2max || 45, user.age || 42, user.gender || "MALE");
  const whoCompliance = getWHOCompliance(summary.avg_active_minutes || 0);
  const maxHR = 220 - (user.age || 42);

  const weeklyTRIMP = activities
    .filter(a => {
      const d = new Date(a.start_time);
      const now = new Date();
      return (now - d) < 7 * 24 * 3600 * 1000;
    })
    .reduce((sum, a) => sum + calcTRIMP(a.duration_seconds / 60, a.avg_heart_rate || 120, summary.avg_resting_heart_rate || 47, maxHR, user.gender), 0);

  const tabs = ["overview", "zonas FC", "actividades", "científico", "insight IA"];

  return (
    <div style={{ minHeight: "100vh", background: "#080c14", color: "#f0f0f0", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        .card { animation: fadeUp .5s ease both; }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 32px", position: "sticky", top: 0, background: "rgba(8,12,20,0.95)", backdropFilter: "blur(20px)", zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #00d4aa, #60efff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⚡</div>
            <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em", color: "#f0f0f0" }}>Garmin Health</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.06)", padding: "2px 8px", borderRadius: 20 }}>BETA</span>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {tabs.map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                style={{ padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit", transition: "all .2s", textTransform: "capitalize", letterSpacing: "0.02em", background: activeTab === t ? "rgba(96,239,255,0.12)" : "transparent", color: activeTab === t ? "#60efff" : "rgba(255,255,255,0.4)" }}>
                {t}
              </button>
            ))}
          </div>
          <button onClick={loadData} style={{ padding: "7px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all .2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#60efff"; e.currentTarget.style.color = "#60efff"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}>
            {loading ? <span style={{ animation: "pulse 1s infinite" }}>●</span> : "↻"} Sincronizar
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 32px 80px" }}>

        {/* Hero */}
        <div style={{ marginBottom: 32, opacity: mounted ? 1 : 0, transform: mounted ? "none" : "translateY(16px)", transition: "all .6s ease" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <p style={{ fontSize: 12, color: "#00d4aa", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 6 }}>DASHBOARD DE RENDIMIENTO</p>
              <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                Hola, {user.name} <span style={{ fontSize: 28 }}>👋</span>
              </h1>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>
                {summary.total_days} día{summary.total_days !== 1 ? "s" : ""} de datos · VO2max {user.vo2max} ml/kg/min · {user.age} años
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {["🏃 Running", "🏊 Natación", "🚴 Ciclismo"].map(t => (
                <span key={t} style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", padding: "4px 10px", borderRadius: 20 }}>{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <div style={{ display: "grid", gap: 20 }}>

            {/* KPI Row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              {[
                { label: "Pasos diarios", value: summary.avg_steps, suffix: "", icon: "👣", color: "#60efff", sub: `Meta: 10,000 · ${Math.round((summary.avg_steps / 10000) * 100)}%` },
                { label: "Calorías", value: summary.avg_calories, suffix: " kcal", icon: "🔥", color: "#f77f00", sub: `Activas: ${Math.round(summary.avg_calories * 0.14)} kcal` },
                { label: "FC en reposo", value: summary.avg_resting_heart_rate, suffix: " bpm", icon: "❤️", color: "#d62828", sub: summary.avg_resting_heart_rate < 60 ? "Atlético (AHA)" : summary.avg_resting_heart_rate < 70 ? "Normal (AHA)" : "Sobre promedio" },
                { label: "Minutos activos", value: summary.avg_active_minutes, suffix: " min", icon: "⚡", color: "#00d4aa", sub: `OMS: ${whoCompliance.pct}% del objetivo` },
              ].map((kpi, i) => (
                <div key={i} className="card" style={{ animationDelay: `${i * 80}ms`, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span style={{ fontSize: 22 }}>{kpi.icon}</span>
                    <span style={{ fontSize: 10, color: kpi.color, fontWeight: 700, letterSpacing: "0.08em" }}>HOY</span>
                  </div>
                  <div style={{ marginTop: 16, fontSize: 28, fontWeight: 800, color: "#f0f0f0", letterSpacing: "-0.02em", fontFamily: "'Space Mono', monospace" }}>
                    <AnimatedNumber value={kpi.value} suffix={kpi.suffix} />
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{kpi.label}</div>
                  <div style={{ fontSize: 11, color: kpi.color, marginTop: 8, fontWeight: 600 }}>{kpi.sub}</div>
                </div>
              ))}
            </div>

            {/* Recovery + VO2max + WHO */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>

              {/* Recovery Score */}
              <div className="card" style={{ animationDelay: "320ms", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 24 }}>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 16 }}>RECOVERY SCORE</p>
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <RingGauge value={recoveryScore} color={recoveryScore > 70 ? "#00d4aa" : recoveryScore > 40 ? "#f9c74f" : "#d62828"} size={88}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: "#f0f0f0", fontFamily: "'Space Mono', monospace" }}>{recoveryScore}</span>
                  </RingGauge>
                  <div style={{ flex: 1 }}>
                    {[
                      { label: "Body Battery", value: daily.body_battery || 67, max: 100, color: "#60efff" },
                      { label: "Stress", value: 100 - (daily.stress_avg || 25), max: 100, color: "#00d4aa" },
                      { label: "Sueño", value: Math.round(Math.min((daily.sleep_seconds || 0) / 28800, 1) * 100), max: 100, color: "#f9c74f" },
                    ].map(item => (
                      <div key={item.label} style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 3 }}>
                          <span>{item.label}</span><span style={{ color: item.color }}>{item.value}%</span>
                        </div>
                        <div style={{ height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 2 }}>
                          <div style={{ height: "100%", width: `${item.value}%`, background: item.color, borderRadius: 2, transition: "width 1.2s ease" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 12 }}>Modelo Firstbeat · Body Battery + Stress + Sueño</p>
              </div>

              {/* VO2max */}
              <div className="card" style={{ animationDelay: "400ms", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 24 }}>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 16 }}>VO2MAX · ACSM</p>
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <RingGauge value={vo2percentile.percentile} color={vo2percentile.color} size={88}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "#f0f0f0", fontFamily: "'Space Mono', monospace" }}>{user.vo2max}</div>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>ml/kg/min</div>
                    </div>
                  </RingGauge>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: vo2percentile.color }}>{vo2percentile.label}</div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>Percentil {vo2percentile.percentile} para</div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>hombres de {user.age} años</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 8 }}>Fuente: ACSM Guidelines 2022</div>
                  </div>
                </div>
              </div>

              {/* WHO Compliance */}
              <div className="card" style={{ animationDelay: "480ms", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 24 }}>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 16 }}>ADHERENCIA OMS</p>
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <RingGauge value={whoCompliance.pct} color={whoCompliance.pct >= 100 ? "#00d4aa" : whoCompliance.pct >= 60 ? "#f9c74f" : "#f77f00"} size={88}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: "#f0f0f0", fontFamily: "'Space Mono', monospace" }}>{whoCompliance.pct}%</span>
                  </RingGauge>
                  <div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
                      <div><span style={{ color: "#f0f0f0", fontWeight: 700 }}>{Math.round(summary.avg_active_minutes * 7)} min</span> / semana</div>
                      <div>Objetivo: <span style={{ color: "#60efff" }}>150 min</span></div>
                      <div style={{ marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.3)", lineHeight: 1.5 }}>OMS recomienda 150 min/sem de actividad moderada o 75 min vigorosa</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly TRIMP */}
            <div className="card" style={{ animationDelay: "560ms", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: "0.08em" }}>TRAINING LOAD SEMANAL · TRIMP (BANISTER)</p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>Carga de entrenamiento normalizada entre modalidades</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 32, fontWeight: 800, color: "#60efff", fontFamily: "'Space Mono', monospace" }}>{Math.round(weeklyTRIMP)}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>TRIMP · 7 días</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                {[
                  { label: "Carga baja", range: "< 100", color: "#00d4aa", desc: "Recuperación/mantenimiento" },
                  { label: "Carga moderada", range: "100–300", color: "#f9c74f", desc: "Zona de progreso óptima" },
                  { label: "Carga alta", range: "> 300", color: "#d62828", desc: "Riesgo de sobreentrenamiento" },
                ].map(r => (
                  <div key={r.label} style={{ padding: "10px 14px", background: `${r.color}0d`, border: `1px solid ${r.color}25`, borderRadius: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: r.color }}>{r.label}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{r.range} · {r.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ZONAS FC TAB ── */}
        {activeTab === "zonas FC" && (
          <div style={{ display: "grid", gap: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 24 }}>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 4 }}>TUS ZONAS DE FC · KARVONEN</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: 20 }}>FC reposo: {summary.avg_resting_heart_rate} bpm · FC máx estimada: {maxHR} bpm</p>
                {zones.map(z => (
                  <div key={z.zone} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, padding: "10px 14px", background: `${z.color}0a`, border: `1px solid ${z.color}20`, borderRadius: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: z.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#080c14", flexShrink: 0 }}>Z{z.zone}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>{z.name}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{z.desc}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: z.color, fontFamily: "'Space Mono', monospace" }}>{z.min}–{z.max}</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>bpm</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 24 }}>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 4 }}>TIEMPO EN ZONA · ACTIVIDADES RECIENTES</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: 20 }}>Distribución de intensidad en últimas {activities.length} sesiones</p>
                {zones.map(z => <ZoneBar key={z.zone} zone={z} maxHR={maxHR} activities={activities} zones={zones} />)}
                <div style={{ marginTop: 16, padding: "12px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 10, fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
                  <strong style={{ color: "#60efff" }}>Recomendación polarizada:</strong> 80% del tiempo en Z1-Z2 (base aeróbica) y 20% en Z4-Z5 (alta intensidad) para máximo desarrollo de VO2max.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── ACTIVIDADES TAB ── */}
        {activeTab === "actividades" && (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "20px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: "0.08em" }}>HISTORIAL DE ACTIVIDADES</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{activities.length} sesiones · Con zona de FC calculada por Karvonen</p>
              </div>
            </div>
            <div style={{ padding: "4px 0px", fontSize: 10, color: "rgba(255,255,255,0.2)", display: "grid", gridTemplateColumns: "1fr 80px 80px 80px 100px", gap: 8, padding: "8px 16px" }}>
              <span>ACTIVIDAD</span><span style={{ textAlign: "right" }}>DISTANCIA</span><span style={{ textAlign: "right" }}>DURACIÓN</span><span style={{ textAlign: "right" }}>FC MEDIA</span><span style={{ textAlign: "right" }}>ZONA</span>
            </div>
            {activities.map((act, i) => <ActivityRow key={i} act={act} zones={zones} />)}
          </div>
        )}

        {/* ── CIENTÍFICO TAB ── */}
        {activeTab === "científico" && (
          <div style={{ display: "grid", gap: 20 }}>
            {[
              {
                title: "ACSM — American College of Sports Medicine",
                icon: "🏅",
                color: "#60efff",
                content: `VO2max de ${user.vo2max} ml/kg/min para hombre de ${user.age} años = categoría "${vo2percentile.label}" (Percentil ${vo2percentile.percentile}). Referencia: ACSM's Guidelines for Exercise Testing and Prescription, 11va edición (2022).`,
                detail: "Para alcanzar 'Excelente' (≥49 ml/kg/min): incorporar 2 sesiones semanales de intervalos de alta intensidad (HIIT) de 20-30 minutos durante 8-12 semanas.",
              },
              {
                title: "AHA — American Heart Association",
                icon: "❤️",
                color: "#d62828",
                content: `FC en reposo de ${summary.avg_resting_heart_rate} bpm. La AHA clasifica 60 bpm como límite entre rango normal y atlético. Tu FC indica excelente condición cardiovascular.`,
                detail: "FC reposo < 50 bpm es común en atletas de resistencia. Valores bajos indican mayor eficiencia del corazón. Monitorear si baja de 40 bpm sin ser atleta de élite.",
              },
              {
                title: "OMS — Organización Mundial de la Salud",
                icon: "🌍",
                color: "#00d4aa",
                content: `Recomendación: 150-300 min/semana de actividad moderada o 75-150 min vigorosa. Tu adherencia estimada: ${whoCompliance.pct}% del objetivo mínimo.`,
                detail: "Las guías OMS 2020 también recomiendan reducir el tiempo sedentario. Tu registro muestra 80,256 segundos sedentario — se recomienda interrumpir cada 30-45 min.",
              },
              {
                title: "Firstbeat Analytics — Training Load TRIMP",
                icon: "📊",
                color: "#f9c74f",
                content: `TRIMP semanal calculado: ${Math.round(weeklyTRIMP)}. El modelo Banister (1991) cuantifica la carga de entrenamiento normalizando duración e intensidad de cualquier deporte.`,
                detail: "TRIMP < 100: mantenimiento. 100-300: zona de progreso. > 300: riesgo de sobreentrenamiento. Esta metodología es la base del sistema de carga de Garmin Training Status.",
              },
              {
                title: "Karvonen — Zonas de Frecuencia Cardíaca",
                icon: "💓",
                color: "#f77f00",
                content: `Método Karvonen usa la FC de reserva (FC máx - FC reposo) para calcular zonas reales de entrenamiento, siendo más preciso que métodos basados solo en FC máx.`,
                detail: `Tu FC de reserva = ${maxHR} - ${summary.avg_resting_heart_rate} = ${maxHR - (summary.avg_resting_heart_rate || 47)} bpm. Una FC reposo baja como la tuya amplía las zonas bajas, ideales para entrenamiento polarizado.`,
              },
            ].map((item, i) => (
              <div key={i} className="card" style={{ animationDelay: `${i * 80}ms`, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 24 }}>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${item.color}18`, border: `1px solid ${item.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{item.icon}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 11, color: item.color, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 8 }}>{item.title}</p>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, marginBottom: 10 }}>{item.content}</p>
                    <div style={{ padding: "10px 14px", background: `${item.color}08`, border: `1px solid ${item.color}18`, borderRadius: 8 }}>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>📌 {item.detail}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── INSIGHT IA TAB ── */}
        {activeTab === "insight IA" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #00d4aa, #60efff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>✦</div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>Análisis generado por Claude AI</p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Basado en datos reales de Garmin + referencias ACSM · AHA · OMS</p>
                </div>
              </div>
              <InsightBlock text={insightText} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { label: "FC Reposo", value: `${summary.avg_resting_heart_rate} bpm`, status: "Atlético", color: "#00d4aa", icon: "❤️" },
                { label: "VO2max", value: `${user.vo2max} ml/kg/min`, status: vo2percentile.label, color: vo2percentile.color, icon: "🫁" },
                { label: "Stress", value: `${daily.stress_avg || 25}/100`, status: "Nivel bajo", color: "#60efff", icon: "🧘" },
                { label: "Body Battery", value: `${daily.body_battery || 67}/100`, status: "Buena carga", color: "#f9c74f", icon: "⚡" },
              ].map((m, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 20 }}>{m.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{m.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#f0f0f0", fontFamily: "'Space Mono', monospace" }}>{m.value}</div>
                  </div>
                  <span style={{ fontSize: 11, color: m.color, fontWeight: 700, background: `${m.color}15`, padding: "3px 8px", borderRadius: 20 }}>{m.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}