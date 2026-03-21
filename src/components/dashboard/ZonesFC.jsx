import { ZoneBar } from "../ui/index";

export default function ZonesFC({ ctx }) {
  const { zones, activities, summary, maxHR, isMobile } = ctx;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>

        {/* Zonas calculadas por Karvonen */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 20 }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 4 }}>TUS ZONAS · KARVONEN</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: 16 }}>
            FC reposo: {summary.avg_resting_heart_rate} bpm · FC máx: {maxHR} bpm
          </p>
          {zones.map(z => (
            <div key={z.zone} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, padding: "10px 12px", background: `${z.color}0a`, border: `1px solid ${z.color}20`, borderRadius: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 7, background: z.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#080c14", flexShrink: 0 }}>
                Z{z.zone}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>{z.name}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{z.desc}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: z.color, fontFamily: "'Space Mono',monospace" }}>{z.min}–{z.max}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>bpm</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tiempo en zona — datos reales Garmin */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 20 }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 4 }}>
            TIEMPO EN ZONA · DATOS REALES GARMIN
          </p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: 16 }}>
            Acumulado en {activities.length} actividades
          </p>
          {zones.map(z => <ZoneBar key={z.zone} zone={z} activities={activities} />)}
          <div style={{ marginTop: 14, padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 10, fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
            <strong style={{ color: "#60efff" }}>Entrenamiento polarizado:</strong> 80% en Z1-Z2 y 20% en Z4-Z5 para máximo VO2max.
          </div>
        </div>
      </div>
    </div>
  );
}
