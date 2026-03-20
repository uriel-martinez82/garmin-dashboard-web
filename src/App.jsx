import { useEffect, useState } from "react";

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

function getWHOCompliance(activeMinutes) {
  const pct = Math.min(Math.round((activeMinutes / 150) * 100), 100);
  return { pct, target: 150 };
}

function formatActivity(type) {
  const map = {
    running: "🏃 Running", treadmill_running: "🏃 Cinta", lap_swimming: "🏊 Natación",
    indoor_cycling: "🚴 Ciclismo indoor", cycling: "🚴 Ciclismo", walking: "🚶 Caminata",
    strength_training: "🏋️ Fuerza", yoga: "🧘 Yoga", hiking: "⛰️ Senderismo",
  };
  return map[type] || "🏅 " + (type || "Actividad");
}

const ZONE_COLORS = ["#60efff", "#00d4aa", "#f9c74f", "#f77f00", "#d62828"];

function getActivityZoneTotals(act) {
  return [1,2,3,4,5].map(z => act[`hr_zone_${z}_sec`] || 0);
}

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
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)" }} />
      <foreignObject x={0} y={0} width={size} height={size}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", transform: "rotate(90deg)" }}>
          {children}
        </div>
      </foreignObject>
    </svg>
  );
}

// Usa datos reales de Garmin (hr_zone_X_sec)
function ZoneBar({ zone, activities }) {
  const zoneKey = `hr_zone_${zone.zone}_sec`;
  const totalSec = activities.reduce((s, a) => s + (a[zoneKey] || 0), 0);
  const totalMin = Math.round(totalSec / 60);
  const pct = Math.min((totalMin / 300) * 100, 100);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: zone.color, fontWeight: 700 }}>Z{zone.zone} {zone.name}</span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{zone.min}–{zone.max} bpm · {totalMin} min</span>
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: zone.color, borderRadius: 3, transition: "width 1.4s cubic-bezier(.4,0,.2,1)" }} />
      </div>
    </div>
  );
}

// Mini barra de distribución de zonas por actividad
function ZoneDistBar({ act }) {
  const totals = getActivityZoneTotals(act);
  const total = totals.reduce((s, v) => s + v, 0);
  if (total === 0) return null;
  return (
    <div style={{ display: "flex", height: 4, borderRadius: 2, overflow: "hidden", marginTop: 8, gap: 1 }}>
      {totals.map((sec, i) => {
        const pct = (sec / total) * 100;
        if (pct < 1) return null;
        return <div key={i} style={{ width: `${pct}%`, background: ZONE_COLORS[i], transition: "width 1s ease" }} title={`Z${i+1}: ${Math.round(sec/60)} min`} />;
      })}
    </div>
  );
}

function ActivityRow({ act, zones, isMobile }) {
  const zone = getZoneForActivity(act.avg_heart_rate || 0, zones);
  const distKm = ((act.distance_meters || 0) / 1000).toFixed(2);
  const durMin = Math.round((act.duration_seconds || 0) / 60);

  const dateStr = new Date(act.start_time).toLocaleDateString("es-MX", {
    timeZone: "America/Costa_Rica", day: "2-digit", month: "2-digit", year: "numeric"
  });
  const timeStr = new Date(act.start_time).toLocaleTimeString("es-MX", {
    timeZone: "America/Costa_Rica", hour: "2-digit", minute: "2-digit"
  });

  if (isMobile) {
    return (
      <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f0" }}>{formatActivity(act.activity_type)}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{dateStr} · {timeStr}</div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: zone.color, background: `${zone.color}18`, padding: "3px 8px", borderRadius: 20, border: `1px solid ${zone.color}40`, flexShrink: 0, marginLeft: 8 }}>Z{zone.zone}</span>
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          <div><div style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>{distKm} km</div><div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>distancia</div></div>
          <div><div style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>{durMin} min</div><div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>duración</div></div>
          <div><div style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>{act.avg_heart_rate || "—"} bpm</div><div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>FC media</div></div>
          {act.avg_cadence && <div><div style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>{act.avg_cadence} rpm</div><div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>cadencia</div></div>}
        </div>
        <ZoneDistBar act={act} />
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 70px 80px 80px 110px", gap: 8, alignItems: "center", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", transition: "background .2s" }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f0" }}>{formatActivity(act.activity_type)}</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{dateStr} · {timeStr}</div>
        <ZoneDistBar act={act} />
      </div>
      <div style={{ textAlign: "right" }}><div style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>{distKm} km</div><div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>distancia</div></div>
      <div style={{ textAlign: "right" }}><div style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>{durMin} min</div><div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>duración</div></div>
      <div style={{ textAlign: "right" }}><div style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>{act.avg_heart_rate || "—"} bpm</div><div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>FC media</div></div>
      <div style={{ textAlign: "right" }}><div style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>{act.avg_cadence ? `${act.avg_cadence} rpm` : "—"}</div><div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>cadencia</div></div>
      <div style={{ textAlign: "right" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: zone.color, background: `${zone.color}18`, padding: "3px 8px", borderRadius: 20, border: `1px solid ${zone.color}40` }}>Z{zone.zone} {zone.name}</span>
      </div>
    </div>
  );
}

function InsightBlock({ text }) {
  if (!text) return null;
  return (
    <div style={{ lineHeight: 1.75 }}>
      {text.split("\n").map((line, i) => {
        if (line.startsWith("## ")) return <h3 key={i} style={{ fontSize: 15, fontWeight: 800, color: "#60efff", margin: "16px 0 6px", letterSpacing: "0.02em" }}>{line.replace("## ", "")}</h3>;
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    setTimeout(() => setMounted(true), 100);
    loadData();
    return () => window.removeEventListener("resize", check);
  }, []);

  const loadData = () => {
    setLoading(true);
    fetch("/api/dashboard")
      .then(r => r.json())
      .then(json => { setData(json); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  };

  const user        = data?.user       || {};
  const summary     = data?.summary    || {};
  const activities  = data?.activities || [];
  const insightText = data?.latest_insight?.insight_text || "Sin insight disponible.";
  const daily = {
    sleep_seconds:      0,
    body_battery:       summary.avg_body_battery  || 0,
    stress_avg:         summary.avg_stress         || 0,
    resting_heart_rate: summary.avg_resting_heart_rate || 0,
  };

  const zones         = calcHRZones(daily.resting_heart_rate || 47, user.age || 42);
  const recoveryScore = calcRecoveryScore(daily.body_battery, daily.stress_avg, daily.sleep_seconds);
  const vo2percentile = getVO2maxPercentile(user.vo2max || 45, user.age || 42, user.gender || "MALE");
  const whoCompliance = getWHOCompliance(summary.avg_active_minutes || 0);
  const maxHR         = 220 - (user.age || 42);
  const weeklyTRIMP   = activities
    .filter(a => (new Date() - new Date(a.start_time)) < 7 * 24 * 3600 * 1000)
    .reduce((s, a) => s + calcTRIMP(a.duration_seconds / 60, a.avg_heart_rate || 120, daily.resting_heart_rate || 47, maxHR, user.gender), 0);

  // Total minutos reales en cada zona (todas las actividades)
  const totalZoneMins = [1,2,3,4,5].map(z =>
    Math.round(activities.reduce((s, a) => s + (a[`hr_zone_${z}_sec`] || 0), 0) / 60)
  );
  const totalTrainingMin = totalZoneMins.reduce((s, v) => s + v, 0);

  const tabs = ["overview", "zonas FC", "actividades", "científico", "insight IA"];
  const pad  = isMobile ? "16px" : "32px";

  return (
    <div style={{ minHeight: "100vh", background: "#080c14", color: "#f0f0f0", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { background: #080c14 !important; min-height: 100vh; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse  { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        .card { animation: fadeUp .5s ease both; }
        .nav-tabs { display:flex; gap:4px; overflow-x:auto; }
        .nav-tabs::-webkit-scrollbar { height:0; }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", position: "sticky", top: 0, background: "rgba(8,12,20,0.97)", backdropFilter: "blur(20px)", zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: `0 ${pad}`, display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,#00d4aa,#60efff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>⚡</div>
            <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.02em" }}>Garmin Health</span>
            {!isMobile && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.06)", padding: "2px 8px", borderRadius: 20 }}>BETA</span>}
          </div>
          <div className="nav-tabs" style={{ flex: 1, justifyContent: isMobile ? "flex-start" : "center" }}>
            {tabs.map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                style={{ padding: isMobile ? "5px 10px" : "6px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: isMobile ? 11 : 12, fontWeight: 600, fontFamily: "inherit", whiteSpace: "nowrap", transition: "all .2s", textTransform: "capitalize", background: activeTab === t ? "rgba(96,239,255,0.12)" : "transparent", color: activeTab === t ? "#60efff" : "rgba(255,255,255,0.4)" }}>
                {t}
              </button>
            ))}
          </div>
          <button onClick={loadData} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", flexShrink: 0, transition: "all .2s" }}>
            {loading ? <span style={{ animation: "pulse 1s infinite" }}>●</span> : "↻"}
            {!isMobile && " Sincronizar"}
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: `24px ${pad} 80px` }}>

        {/* Hero */}
        <div style={{ marginBottom: 24, opacity: mounted ? 1 : 0, transform: mounted ? "none" : "translateY(16px)", transition: "all .6s ease" }}>
          <p style={{ fontSize: 11, color: "#00d4aa", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 6 }}>DASHBOARD DE RENDIMIENTO</p>
          <h1 style={{ fontSize: isMobile ? 26 : 34, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            Hola{user.name ? `, ${user.name}` : ""} <span style={{ fontSize: isMobile ? 22 : 28 }}>👋</span>
          </h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>
            {summary.total_days || 0} día{summary.total_days !== 1 ? "s" : ""} de datos
            {user.vo2max ? ` · VO2max ${user.vo2max}` : ""}
            {user.age    ? ` · ${user.age} años` : ""}
            {totalTrainingMin > 0 ? ` · ${totalTrainingMin} min entrenados` : ""}
          </p>
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === "overview" && (
          <div style={{ display: "grid", gap: 16 }}>

            {/* KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 14 }}>
              {[
                { label: "Pasos diarios",   value: summary.avg_steps,             suffix: "",     icon: "👣", color: "#60efff", sub: `Meta 10k · ${Math.round(((summary.avg_steps||0)/10000)*100)}%` },
                { label: "Calorías",        value: summary.avg_calories,           suffix: " kcal",icon: "🔥", color: "#f77f00", sub: `Activas: ${Math.round((summary.avg_calories||0)*0.14)} kcal` },
                { label: "FC en reposo",    value: summary.avg_resting_heart_rate, suffix: " bpm", icon: "❤️", color: "#d62828", sub: (summary.avg_resting_heart_rate||0)<60?"Atlético (AHA)":(summary.avg_resting_heart_rate||0)<70?"Normal (AHA)":"Sobre promedio" },
                { label: "Min. activos",    value: summary.avg_active_minutes,     suffix: " min", icon: "⚡", color: "#00d4aa", sub: `OMS: ${whoCompliance.pct}% objetivo` },
              ].map((kpi, i) => (
                <div key={i} className="card" style={{ animationDelay:`${i*80}ms`, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:16 }}>
                  <div style={{ display:"flex", justifyContent:"space-between" }}>
                    <span style={{ fontSize:20 }}>{kpi.icon}</span>
                    <span style={{ fontSize:10, color:kpi.color, fontWeight:700 }}>HOY</span>
                  </div>
                  <div style={{ marginTop:12, fontSize:isMobile?22:26, fontWeight:800, fontFamily:"'Space Mono',monospace" }}>
                    <AnimatedNumber value={kpi.value} suffix={kpi.suffix} />
                  </div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:4 }}>{kpi.label}</div>
                  <div style={{ fontSize:11, color:kpi.color, marginTop:8, fontWeight:600 }}>{kpi.sub}</div>
                </div>
              ))}
            </div>

            {/* Distribución global de zonas */}
            <div className="card" style={{ animationDelay:"320ms", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <div>
                  <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", fontWeight:700, letterSpacing:"0.08em" }}>DISTRIBUCIÓN DE ZONAS · DATOS REALES GARMIN</p>
                  <p style={{ fontSize:12, color:"rgba(255,255,255,0.3)", marginTop:3 }}>Tiempo total en cada zona — {activities.length} actividades</p>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:24, fontWeight:800, color:"#60efff", fontFamily:"'Space Mono',monospace" }}>{totalTrainingMin}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>min totales</div>
                </div>
              </div>
              {/* Barra apilada */}
              <div style={{ display:"flex", height:12, borderRadius:6, overflow:"hidden", marginBottom:14, gap:1 }}>
                {totalZoneMins.map((min, i) => {
                  const pct = totalTrainingMin > 0 ? (min / totalTrainingMin) * 100 : 0;
                  if (pct < 0.5) return null;
                  return <div key={i} style={{ width:`${pct}%`, background:ZONE_COLORS[i], transition:"width 1.2s ease" }} title={`Z${i+1}: ${min} min`} />;
                })}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:isMobile?"repeat(3,1fr)":"repeat(5,1fr)", gap:10 }}>
                {zones.map((z, i) => (
                  <div key={z.zone} style={{ padding:"10px 12px", background:`${z.color}0a`, border:`1px solid ${z.color}20`, borderRadius:10 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:z.color, flexShrink:0 }} />
                      <span style={{ fontSize:11, fontWeight:700, color:z.color }}>Z{z.zone}</span>
                    </div>
                    <div style={{ fontSize:18, fontWeight:800, color:"#f0f0f0", fontFamily:"'Space Mono',monospace" }}>{totalZoneMins[i]}</div>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>min · {z.name}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recovery + VO2max + WHO */}
            <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)", gap:14 }}>
              {/* Recovery */}
              <div className="card" style={{ animationDelay:"400ms", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:20 }}>
                <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", fontWeight:700, letterSpacing:"0.08em", marginBottom:14 }}>RECOVERY SCORE</p>
                <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                  <RingGauge value={recoveryScore} color={recoveryScore>70?"#00d4aa":recoveryScore>40?"#f9c74f":"#d62828"} size={78}>
                    <span style={{ fontSize:17, fontWeight:800, fontFamily:"'Space Mono',monospace" }}>{recoveryScore}</span>
                  </RingGauge>
                  <div style={{ flex:1 }}>
                    {[
                      { label:"Body Battery", value:daily.body_battery, color:"#60efff" },
                      { label:"Stress",        value:100-(daily.stress_avg||0), color:"#00d4aa" },
                      { label:"Sueño",         value:Math.round(Math.min((daily.sleep_seconds||0)/28800,1)*100), color:"#f9c74f" },
                    ].map(item => (
                      <div key={item.label} style={{ marginBottom:7 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"rgba(255,255,255,0.4)", marginBottom:3 }}>
                          <span>{item.label}</span><span style={{ color:item.color }}>{item.value}%</span>
                        </div>
                        <div style={{ height:4, background:"rgba(255,255,255,0.07)", borderRadius:2 }}>
                          <div style={{ height:"100%", width:`${item.value}%`, background:item.color, borderRadius:2, transition:"width 1.2s ease" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <p style={{ fontSize:10, color:"rgba(255,255,255,0.25)", marginTop:10 }}>Modelo Firstbeat · Body Battery + Stress + Sueño</p>
              </div>

              {/* VO2max */}
              <div className="card" style={{ animationDelay:"480ms", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:20 }}>
                <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", fontWeight:700, letterSpacing:"0.08em", marginBottom:14 }}>VO2MAX · ACSM</p>
                <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                  <RingGauge value={vo2percentile.percentile} color={vo2percentile.color} size={78}>
                    <div style={{ textAlign:"center" }}>
                      <div style={{ fontSize:14, fontWeight:800, fontFamily:"'Space Mono',monospace" }}>{user.vo2max}</div>
                      <div style={{ fontSize:8, color:"rgba(255,255,255,0.4)" }}>ml/kg/min</div>
                    </div>
                  </RingGauge>
                  <div>
                    <div style={{ fontSize:20, fontWeight:800, color:vo2percentile.color }}>{vo2percentile.label}</div>
                    <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginTop:4 }}>Percentil {vo2percentile.percentile}</div>
                    <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>hombres {user.age} años</div>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,0.25)", marginTop:6 }}>ACSM Guidelines 2022</div>
                  </div>
                </div>
              </div>

              {/* WHO */}
              <div className="card" style={{ animationDelay:"560ms", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:20 }}>
                <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", fontWeight:700, letterSpacing:"0.08em", marginBottom:14 }}>ADHERENCIA OMS</p>
                <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                  <RingGauge value={whoCompliance.pct} color={whoCompliance.pct>=100?"#00d4aa":whoCompliance.pct>=60?"#f9c74f":"#f77f00"} size={78}>
                    <span style={{ fontSize:15, fontWeight:800, fontFamily:"'Space Mono',monospace" }}>{whoCompliance.pct}%</span>
                  </RingGauge>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,0.6)", lineHeight:1.7 }}>
                    <div><span style={{ color:"#f0f0f0", fontWeight:700 }}>{Math.round((summary.avg_active_minutes||0)*7)} min</span> / sem</div>
                    <div>Objetivo: <span style={{ color:"#60efff" }}>150 min</span></div>
                    <div style={{ marginTop:6, fontSize:10, color:"rgba(255,255,255,0.3)" }}>OMS: 150 min/sem moderada</div>
                  </div>
                </div>
              </div>
            </div>

            {/* TRIMP */}
            <div className="card" style={{ animationDelay:"640ms", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:20 }}>
              <div style={{ display:"flex", flexDirection:isMobile?"column":"row", justifyContent:"space-between", alignItems:isMobile?"flex-start":"center", gap:10, marginBottom:16 }}>
                <div>
                  <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", fontWeight:700, letterSpacing:"0.08em" }}>TRAINING LOAD SEMANAL · TRIMP (BANISTER)</p>
                  <p style={{ fontSize:12, color:"rgba(255,255,255,0.3)", marginTop:4 }}>Carga normalizada entre modalidades</p>
                </div>
                <div>
                  <div style={{ fontSize:30, fontWeight:800, color:"#60efff", fontFamily:"'Space Mono',monospace" }}>{Math.round(weeklyTRIMP)}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>TRIMP · 7 días</div>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)", gap:10 }}>
                {[
                  { label:"Carga baja",     range:"< 100",   color:"#00d4aa", desc:"Recuperación" },
                  { label:"Carga moderada", range:"100–300", color:"#f9c74f", desc:"Progreso óptimo" },
                  { label:"Carga alta",     range:"> 300",   color:"#d62828", desc:"Riesgo sobreentrenamiento" },
                ].map(r => (
                  <div key={r.label} style={{ padding:"10px 14px", background:`${r.color}0d`, border:`1px solid ${r.color}25`, borderRadius:10 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:r.color }}>{r.label}</div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:2 }}>{r.range} · {r.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ZONAS FC ── */}
        {activeTab === "zonas FC" && (
          <div style={{ display:"grid", gap:16 }}>
            <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:16 }}>
              <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:20 }}>
                <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", fontWeight:700, letterSpacing:"0.08em", marginBottom:4 }}>TUS ZONAS · KARVONEN</p>
                <p style={{ fontSize:12, color:"rgba(255,255,255,0.3)", marginBottom:16 }}>FC reposo: {daily.resting_heart_rate} bpm · FC máx: {maxHR} bpm</p>
                {zones.map(z => (
                  <div key={z.zone} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10, padding:"10px 12px", background:`${z.color}0a`, border:`1px solid ${z.color}20`, borderRadius:10 }}>
                    <div style={{ width:30, height:30, borderRadius:7, background:z.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:"#080c14", flexShrink:0 }}>Z{z.zone}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:"#f0f0f0" }}>{z.name}</div>
                      <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>{z.desc}</div>
                    </div>
                    <div style={{ textAlign:"right", flexShrink:0 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:z.color, fontFamily:"'Space Mono',monospace" }}>{z.min}–{z.max}</div>
                      <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>bpm</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:20 }}>
                <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", fontWeight:700, letterSpacing:"0.08em", marginBottom:4 }}>TIEMPO EN ZONA · DATOS REALES GARMIN</p>
                <p style={{ fontSize:12, color:"rgba(255,255,255,0.3)", marginBottom:16 }}>Acumulado en {activities.length} actividades</p>
                {zones.map(z => <ZoneBar key={z.zone} zone={z} activities={activities} />)}
                <div style={{ marginTop:14, padding:"10px 12px", background:"rgba(255,255,255,0.03)", borderRadius:10, fontSize:12, color:"rgba(255,255,255,0.4)", lineHeight:1.6 }}>
                  <strong style={{ color:"#60efff" }}>Entrenamiento polarizado:</strong> 80% en Z1-Z2 y 20% en Z4-Z5 para máximo desarrollo de VO2max.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── ACTIVIDADES ── */}
        {activeTab === "actividades" && (
          <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, overflow:"hidden" }}>
            <div style={{ padding:"16px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
              <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", fontWeight:700, letterSpacing:"0.08em" }}>HISTORIAL DE ACTIVIDADES</p>
              <p style={{ fontSize:12, color:"rgba(255,255,255,0.3)", marginTop:2 }}>{activities.length} sesiones · Zona FC + cadencia + distribución de zonas reales</p>
            </div>
            {!isMobile && (
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.2)", display:"grid", gridTemplateColumns:"1fr 70px 70px 80px 80px 110px", gap:8, padding:"8px 16px" }}>
                <span>ACTIVIDAD</span>
                <span style={{ textAlign:"right" }}>DIST.</span>
                <span style={{ textAlign:"right" }}>DUR.</span>
                <span style={{ textAlign:"right" }}>FC MEDIA</span>
                <span style={{ textAlign:"right" }}>CADENCIA</span>
                <span style={{ textAlign:"right" }}>ZONA</span>
              </div>
            )}
            {activities.map((act, i) => <ActivityRow key={i} act={act} zones={zones} isMobile={isMobile} />)}
          </div>
        )}

        {/* ── CIENTÍFICO ── */}
        {activeTab === "científico" && (
          <div style={{ display:"grid", gap:14 }}>
            {[
              { title:"ACSM — American College of Sports Medicine", icon:"🏅", color:"#60efff", content:`VO2max de ${user.vo2max} ml/kg/min para hombre de ${user.age} años = categoría "${vo2percentile.label}" (Percentil ${vo2percentile.percentile}). Referencia: ACSM's Guidelines for Exercise Testing and Prescription, 11va edición (2022).`, detail:"Para alcanzar 'Excelente' (≥49 ml/kg/min): 2 sesiones semanales de HIIT de 20-30 min durante 8-12 semanas." },
              { title:"AHA — American Heart Association", icon:"❤️", color:"#d62828", content:`FC reposo de ${daily.resting_heart_rate} bpm. La AHA clasifica 60 bpm como límite entre rango normal y atlético.`, detail:"FC reposo < 50 bpm es común en atletas de resistencia e indica alta eficiencia cardíaca." },
              { title:"OMS — Organización Mundial de la Salud", icon:"🌍", color:"#00d4aa", content:`Recomendación: 150-300 min/semana moderada o 75-150 min vigorosa. Tu adherencia: ${whoCompliance.pct}% del objetivo mínimo.`, detail:"Las guías OMS 2020 también recomiendan interrumpir el tiempo sedentario cada 30-45 min." },
              { title:"Firstbeat Analytics — Training Load TRIMP", icon:"📊", color:"#f9c74f", content:`TRIMP semanal: ${Math.round(weeklyTRIMP)}. Modelo Banister (1991) cuantifica la carga normalizando duración e intensidad entre deportes.`, detail:"TRIMP < 100: mantenimiento. 100-300: progreso óptimo. > 300: riesgo de sobreentrenamiento." },
              { title:"Karvonen — Zonas de Frecuencia Cardíaca", icon:"💓", color:"#f77f00", content:`Método Karvonen usa la FC de reserva (FC máx - FC reposo) para calcular zonas reales, más preciso que solo FC máx.`, detail:`FC reserva = ${maxHR} - ${daily.resting_heart_rate} = ${maxHR - (daily.resting_heart_rate||47)} bpm. FC reposo baja amplía zonas bajas, ideales para entrenamiento polarizado.` },
            ].map((item, i) => (
              <div key={i} className="card" style={{ animationDelay:`${i*80}ms`, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:18 }}>
                <div style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
                  <div style={{ width:38, height:38, borderRadius:10, background:`${item.color}18`, border:`1px solid ${item.color}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, flexShrink:0 }}>{item.icon}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:11, color:item.color, fontWeight:700, letterSpacing:"0.06em", marginBottom:8 }}>{item.title}</p>
                    <p style={{ fontSize:13, color:"rgba(255,255,255,0.7)", lineHeight:1.6, marginBottom:10 }}>{item.content}</p>
                    <div style={{ padding:"10px 12px", background:`${item.color}08`, border:`1px solid ${item.color}18`, borderRadius:8 }}>
                      <p style={{ fontSize:12, color:"rgba(255,255,255,0.5)", lineHeight:1.6 }}>📌 {item.detail}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── INSIGHT IA ── */}
        {activeTab === "insight IA" && (
          <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 300px", gap:16 }}>
            <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:isMobile?16:24 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
                <div style={{ width:34, height:34, borderRadius:10, background:"linear-gradient(135deg,#00d4aa,#60efff)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, flexShrink:0 }}>✦</div>
                <div>
                  <p style={{ fontSize:13, fontWeight:700 }}>Análisis generado por Claude AI</p>
                  <p style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>Datos reales Garmin + ACSM · AHA · OMS</p>
                </div>
              </div>
              <InsightBlock text={insightText} />
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {[
                { label:"FC Reposo",    value:`${daily.resting_heart_rate} bpm`,  status:"Atlético",   color:"#00d4aa", icon:"❤️" },
                { label:"VO2max",       value:`${user.vo2max} ml/kg/min`,         status:vo2percentile.label, color:vo2percentile.color, icon:"🫁" },
                { label:"Stress",       value:`${daily.stress_avg}/100`,          status:"Nivel bajo", color:"#60efff", icon:"🧘" },
                { label:"Body Battery", value:`${daily.body_battery}/100`,        status:"Buena carga",color:"#f9c74f", icon:"⚡" },
                { label:"Zona dominante", value:`Z${totalZoneMins.indexOf(Math.max(...totalZoneMins))+1}`, status:zones[totalZoneMins.indexOf(Math.max(...totalZoneMins))]?.name || "", color:ZONE_COLORS[totalZoneMins.indexOf(Math.max(...totalZoneMins))], icon:"🎯" },
              ].map((m, i) => (
                <div key={i} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:"14px 16px", display:"flex", alignItems:"center", gap:12 }}>
                  <span style={{ fontSize:18 }}>{m.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>{m.label}</div>
                    <div style={{ fontSize:15, fontWeight:700, fontFamily:"'Space Mono',monospace" }}>{m.value}</div>
                  </div>
                  <span style={{ fontSize:11, color:m.color, fontWeight:700, background:`${m.color}15`, padding:"3px 8px", borderRadius:20, whiteSpace:"nowrap" }}>{m.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}