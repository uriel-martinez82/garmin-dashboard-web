import { InsightBlock } from "../ui/index";
import { ZONE_COLORS } from "../../utils/calculations";

export default function InsightAI({ ctx }) {
  const { insightText, daily, vo2max, vo2percentile, totalZoneMins, zones, isMobile } = ctx;

  const dominantZoneIdx = totalZoneMins.indexOf(Math.max(...totalZoneMins));

  const metrics = [
    { label: "FC Reposo",      value: `${daily.resting_heart_rate} bpm`, status: "Atlético",         color: "#00d4aa",              icon: "❤️" },
    { label: "VO2max",         value: `${vo2max} ml/kg/min`,             status: vo2percentile.label, color: vo2percentile.color,    icon: "🫁" },
    { label: "Stress",         value: `${daily.stress_avg}/100`,         status: "Nivel bajo",        color: "#60efff",              icon: "🧘" },
    { label: "Body Battery",   value: `${daily.body_battery}/100`,       status: "Buena carga",       color: "#f9c74f",              icon: "⚡" },
    { label: "Zona dominante", value: `Z${dominantZoneIdx + 1}`,         status: zones[dominantZoneIdx]?.name || "", color: ZONE_COLORS[dominantZoneIdx], icon: "🎯" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 300px", gap: 16 }}>

      {/* Insight text */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: isMobile ? 16 : 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#00d4aa,#60efff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>✦</div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>Análisis generado por Claude AI</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Datos reales Garmin + ACSM · AHA · OMS</p>
          </div>
        </div>
        <InsightBlock text={insightText} />
      </div>

      {/* Metrics sidebar */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {metrics.map((m, i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 18 }}>{m.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{m.label}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#f0f0f0", fontFamily: "'Space Mono',monospace" }}>{m.value}</div>
            </div>
            <span style={{ fontSize: 11, color: m.color, fontWeight: 700, background: `${m.color}15`, padding: "3px 8px", borderRadius: 20, whiteSpace: "nowrap" }}>{m.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
