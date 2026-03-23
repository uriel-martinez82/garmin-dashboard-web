import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { fetchDashboard } from "../../api/auth";
import { calcHRZones, calcTRIMP, calcRecoveryScore, getVO2maxPercentile, getWHOCompliance, ZONE_COLORS } from "../../utils/calculations";
import Overview from "./Overview";
import ZonesFC from "./ZonesFC";
import Activities from "./Activities";
import Scientific from "./Scientific";
import InsightAI from "./InsightAI";
import AssistantChat from "./AssistantChat";

const TABS = ["overview", "zonas FC", "actividades", "científico", "insight IA", "mi asistente"];

const TAB_ICONS = {
  "overview":      "📊",
  "zonas FC":      "❤️",
  "actividades":   "🏃",
  "científico":    "🔬",
  "insight IA":    "✦",
  "mi asistente":  "💬",
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [mounted, setMounted]     = useState(false);
  const [isMobile, setIsMobile]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    setTimeout(() => setMounted(true), 100);
    loadData();
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!isMobile) setMenuOpen(false);
  }, [isMobile]);

  const loadData = () => {
    setLoading(true);
    fetchDashboard()
      .then(json => { setData(json); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  };

  const handleTabSelect = (t) => {
    setActiveTab(t);
    setMenuOpen(false);
  };

  const profile    = data?.user       || {};
  const summary    = data?.summary    || {};
  const activities = data?.activities || [];
  const insightText = data?.latest_insight?.insight_text || "Sin insight disponible.";
  const insightDate = data?.latest_insight?.created_at   || null;

  const daily = {
    sleep_seconds:      0,
    body_battery:       summary.avg_body_battery        || 0,
    stress_avg:         summary.avg_stress              || 0,
    resting_heart_rate: summary.avg_resting_heart_rate  || 0,
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

  const ctx = { profile, summary, activities, insightText, insightDate, daily, zones, recoveryScore, vo2percentile, whoCompliance, maxHR, weeklyTRIMP, totalZoneMins, totalTrainingMin, isMobile, age, gender, vo2max };

  return (
    <div style={{ minHeight: "100vh", background: "#080c14", color: "#f0f0f0", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { background: #080c14 !important; min-height: 100vh; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse   { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        @keyframes slideIn { from { transform:translateX(-100%); } to { transform:translateX(0); } }
        @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
        .card { animation: fadeUp .5s ease both; }
        .nav-tabs { display:flex; gap:4px; }
        .drawer-item:active { background: rgba(96,239,255,0.12) !important; }
      `}</style>

      {/* ── Drawer (mobile only) ──────────────────────────────────── */}
      {isMobile && menuOpen && (
        <>
          <div onClick={() => setMenuOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200, animation: "fadeIn .2s ease" }} />

          <div style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: 264, background: "#0d1520", borderRight: "1px solid rgba(255,255,255,0.08)", zIndex: 201, display: "flex", flexDirection: "column", animation: "slideIn .25s ease", boxShadow: "6px 0 30px rgba(0,0,0,0.6)" }}>

            {/* Drawer header */}
            <div style={{ padding: "18px 18px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,#00d4aa,#60efff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>⚡</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>Garmin Health</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>BETA</div>
                </div>
              </div>
              <button onClick={() => setMenuOpen(false)}
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "rgba(255,255,255,0.5)", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
                ✕
              </button>
            </div>

            {/* User info */}
            <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f0" }}>{user?.full_name || "Usuario"}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{user?.email || ""}</div>
            </div>

            {/* Nav items */}
            <div style={{ flex: 1, padding: "10px", overflowY: "auto" }}>
              {TABS.map(t => (
                <button key={t} className="drawer-item" onClick={() => handleTabSelect(t)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize", marginBottom: 2, background: activeTab === t ? "rgba(96,239,255,0.1)" : "transparent", color: activeTab === t ? "#60efff" : "rgba(255,255,255,0.65)", fontSize: 13, fontWeight: activeTab === t ? 700 : 500, transition: "all .15s", borderLeft: activeTab === t ? "3px solid #60efff" : "3px solid transparent" }}>
                  <span style={{ fontSize: 17, flexShrink: 0 }}>{TAB_ICONS[t]}</span>
                  {t}
                </button>
              ))}
            </div>

            {/* Drawer footer */}
            <div style={{ padding: "12px 10px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: 8 }}>
              <button onClick={() => { loadData(); setMenuOpen(false); }}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {loading ? <span style={{ animation: "pulse 1s infinite" }}>●</span> : "↻"} Sincronizar
              </button>
              <button onClick={logout}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", background: "transparent", color: "rgba(255,255,255,0.3)", fontSize: 12, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                ↩ Cerrar sesión
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Header ────────────────────────────────────────────────── */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", position: "sticky", top: 0, background: "rgba(8,12,20,0.97)", backdropFilter: "blur(20px)", zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: `0 ${pad}`, display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, gap: 12 }}>

          {/* Left: hamburger + logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            {isMobile && (
              <button onClick={() => setMenuOpen(true)}
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, width: 34, height: 34, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4.5, padding: 0, flexShrink: 0 }}>
                <span style={{ display: "block", width: 14, height: 1.5, background: "rgba(255,255,255,0.7)", borderRadius: 1 }} />
                <span style={{ display: "block", width: 14, height: 1.5, background: "rgba(255,255,255,0.7)", borderRadius: 1 }} />
                <span style={{ display: "block", width: 14, height: 1.5, background: "rgba(255,255,255,0.7)", borderRadius: 1 }} />
              </button>
            )}
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,#00d4aa,#60efff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>⚡</div>
            <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.02em" }}>Garmin Health</span>
            {!isMobile && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.06)", padding: "2px 8px", borderRadius: 20 }}>BETA</span>}
          </div>

          {/* Center: tabs (desktop) / active tab name (mobile) */}
          {!isMobile ? (
            <div className="nav-tabs" style={{ flex: 1, justifyContent: "center" }}>
              {TABS.map(t => (
                <button key={t} onClick={() => setActiveTab(t)}
                  style={{ padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit", whiteSpace: "nowrap", transition: "all .2s", textTransform: "capitalize", background: activeTab === t ? "rgba(96,239,255,0.12)" : "transparent", color: activeTab === t ? "#60efff" : "rgba(255,255,255,0.4)" }}>
                  {t}
                </button>
              ))}
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 15 }}>{TAB_ICONS[activeTab]}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#60efff", textTransform: "capitalize" }}>{activeTab}</span>
            </div>
          )}

          {/* Right: actions (desktop only) */}
          {!isMobile && (
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button onClick={loadData} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", transition: "all .2s" }}>
                {loading ? <span style={{ animation: "pulse 1s infinite" }}>●</span> : "↻"} Sync
              </button>
              <button onClick={logout} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "rgba(255,255,255,0.35)", fontSize: 12, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>
                Salir
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: `24px ${pad} 80px` }}>
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
        {activeTab === "mi asistente" && <AssistantChat ctx={ctx} />}
      </div>
    </div>
  );
}