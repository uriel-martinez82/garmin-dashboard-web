import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { fetchDashboard } from "../../api/auth";
import { calcHRZones, calcTRIMP, calcRecoveryScore, getVO2maxPercentile, getWHOCompliance, ZONE_COLORS } from "../../utils/calculations";
import Overview from "./Overview";
import ZonesFC from "./ZonesFC";
import Activities from "./Activities";
import Scientific from "./Scientific";
import InsightAI from "./InsightAI";

const TABS = ["overview", "zonas FC", "actividades", "científico", "insight IA"];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [mounted, setMounted]   = useState(false);
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
    fetchDashboard()
      .then(json => { setData(json); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  };

  // Derived data
  const profile    = data?.user     || {};
  const summary    = data?.summary  || {};
  const activities = data?.activities || [];
  const insightText = data?.latest_insight?.insight_text || "Sin insight disponible.";

  const daily = {
    sleep_seconds:      0,
    body_battery:       summary.avg_body_battery  || 0,
    stress_avg:         summary.avg_stress         || 0,
    resting_heart_rate: summary.avg_resting_heart_rate || 0,
  };

  const age    = profile.age    || user?.age    || 42;
  const gender = profile.gender || user?.gender || "MALE";
  const vo2max = profile.vo2max || user?.vo2max || 45;

  const zones         = calcHRZones(daily.resting_heart_rate || 47, age);
  const recoveryScore = calcRecoveryScore(daily.body_battery, daily.stress_avg, daily.sleep_seconds);
  const vo2percentile = getVO2maxPercentile(vo2max, age, gender);
  const whoCompliance = getWHOCompliance(summary.avg_active_minutes || 0);
  const maxHR         = 220 - age;

  const weeklyTRIMP = activities
    .filter(a => (new Date() - new Date(a.start_time)) < 7 * 24 * 3600 * 1000)
    .reduce((s, a) => s + calcTRIMP(a.duration_seconds / 60, a.avg_heart_rate || 120, daily.resting_heart_rate || 47, maxHR, gender), 0);

  const totalZoneMins = [1,2,3,4,5].map(z =>
    Math.round(activities.reduce((s, a) => s + (a[`hr_zone_${z}_sec`] || 0), 0) / 60)
  );
  const totalTrainingMin = totalZoneMins.reduce((s, v) => s + v, 0);

  const pad = isMobile ? "16px" : "32px";

  const ctx = { profile, summary, activities, insightText, daily, zones, recoveryScore, vo2percentile, whoCompliance, maxHR, weeklyTRIMP, totalZoneMins, totalTrainingMin, isMobile, age, gender, vo2max };

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
            {TABS.map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                style={{ padding: isMobile ? "5px 10px" : "6px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: isMobile ? 11 : 12, fontWeight: 600, fontFamily: "inherit", whiteSpace: "nowrap", transition: "all .2s", textTransform: "capitalize", background: activeTab === t ? "rgba(96,239,255,0.12)" : "transparent", color: activeTab === t ? "#60efff" : "rgba(255,255,255,0.4)" }}>
                {t}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <button onClick={loadData} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", transition: "all .2s" }}>
              {loading ? <span style={{ animation: "pulse 1s infinite" }}>●</span> : "↻"}
              {!isMobile && " Sync"}
            </button>
            <button onClick={logout} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "rgba(255,255,255,0.35)", fontSize: 12, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>
              {isMobile ? "↩" : "Salir"}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: `24px ${pad} 80px` }}>

        {/* Hero */}
        <div style={{ marginBottom: 24, opacity: mounted ? 1 : 0, transform: mounted ? "none" : "translateY(16px)", transition: "all .6s ease" }}>
          <p style={{ fontSize: 11, color: "#00d4aa", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 6 }}>DASHBOARD DE RENDIMIENTO</p>
          <h1 style={{ fontSize: isMobile ? 26 : 34, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            Hola{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""} <span style={{ fontSize: isMobile ? 22 : 28 }}>👋</span>
          </h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>
            {summary.total_days || 0} día{summary.total_days !== 1 ? "s" : ""} de datos
            {vo2max ? ` · VO2max ${vo2max}` : ""}
            {age    ? ` · ${age} años` : ""}
            {totalTrainingMin > 0 ? ` · ${totalTrainingMin} min entrenados` : ""}
          </p>
        </div>

        {activeTab === "overview"     && <Overview    ctx={ctx} />}
        {activeTab === "zonas FC"     && <ZonesFC     ctx={ctx} />}
        {activeTab === "actividades"  && <Activities  ctx={ctx} />}
        {activeTab === "científico"   && <Scientific  ctx={ctx} />}
        {activeTab === "insight IA"   && <InsightAI   ctx={ctx} />}
      </div>
    </div>
  );
}
