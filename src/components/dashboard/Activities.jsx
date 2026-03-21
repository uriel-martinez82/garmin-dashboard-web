import { getZoneForActivity, formatActivity, formatLocalDate, formatLocalTime, ZONE_COLORS } from "../../utils/calculations";

function ZoneMiniBar({ act }) {
  const totals = [1, 2, 3, 4, 5].map(z => act[`hr_zone_${z}_sec`] || 0);
  const total = totals.reduce((s, v) => s + v, 0);
  if (total === 0) return null;
  return (
    <div style={{ display: "flex", height: 4, borderRadius: 2, overflow: "hidden", marginTop: 8, gap: 1 }}>
      {totals.map((sec, i) => {
        const pct = (sec / total) * 100;
        if (pct < 1) return null;
        return <div key={i} style={{ width: `${pct}%`, background: ZONE_COLORS[i] }} title={`Z${i + 1}: ${Math.round(sec / 60)} min`} />;
      })}
    </div>
  );
}

function ActivityRow({ act, zones, isMobile }) {
  const zone = getZoneForActivity(act.avg_heart_rate || 0, zones);
  const distKm = ((act.distance_meters || 0) / 1000).toFixed(2);
  const durMin = Math.round((act.duration_seconds || 0) / 60);
  const dateStr = formatLocalDate(act.start_time);
  const timeStr = formatLocalTime(act.start_time);

  if (isMobile) {
    return (
      <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f0" }}>{formatActivity(act.activity_type)}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{dateStr} · {timeStr}</div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: zone.color, background: `${zone.color}18`, padding: "3px 8px", borderRadius: 20, border: `1px solid ${zone.color}40`, flexShrink: 0, marginLeft: 8 }}>
            Z{zone.zone}
          </span>
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          <div><div style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>{distKm} km</div><div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>distancia</div></div>
          <div><div style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>{durMin} min</div><div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>duración</div></div>
          <div><div style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>{act.avg_heart_rate || "—"} bpm</div><div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>FC media</div></div>
          {act.avg_cadence && <div><div style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>{act.avg_cadence} rpm</div><div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>cadencia</div></div>}
        </div>
        <ZoneMiniBar act={act} />
      </div>
    );
  }

  return (
    <div
      style={{ display: "grid", gridTemplateColumns: "1fr 70px 70px 80px 80px 110px", gap: 8, alignItems: "center", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", transition: "background .2s" }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f0" }}>{formatActivity(act.activity_type)}</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{dateStr} · {timeStr}</div>
        <ZoneMiniBar act={act} />
      </div>
      <div style={{ textAlign: "right" }}><div style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>{distKm} km</div><div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>distancia</div></div>
      <div style={{ textAlign: "right" }}><div style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>{durMin} min</div><div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>duración</div></div>
      <div style={{ textAlign: "right" }}><div style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>{act.avg_heart_rate || "—"} bpm</div><div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>FC media</div></div>
      <div style={{ textAlign: "right" }}><div style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>{act.avg_cadence ? `${act.avg_cadence} rpm` : "—"}</div><div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>cadencia</div></div>
      <div style={{ textAlign: "right" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: zone.color, background: `${zone.color}18`, padding: "3px 8px", borderRadius: 20, border: `1px solid ${zone.color}40` }}>
          Z{zone.zone} {zone.name}
        </span>
      </div>
    </div>
  );
}

export default function Activities({ ctx }) {
  const { activities, zones, isMobile } = ctx;
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, overflow: "hidden" }}>
      <div style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: "0.08em" }}>HISTORIAL DE ACTIVIDADES</p>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
          {activities.length} sesiones · Zona FC + cadencia + distribución real de zonas
        </p>
      </div>
      {!isMobile && (
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", display: "grid", gridTemplateColumns: "1fr 70px 70px 80px 80px 110px", gap: 8, padding: "8px 16px" }}>
          <span>ACTIVIDAD</span>
          <span style={{ textAlign: "right" }}>DIST.</span>
          <span style={{ textAlign: "right" }}>DUR.</span>
          <span style={{ textAlign: "right" }}>FC MEDIA</span>
          <span style={{ textAlign: "right" }}>CADENCIA</span>
          <span style={{ textAlign: "right" }}>ZONA</span>
        </div>
      )}
      {activities.map((act, i) => <ActivityRow key={i} act={act} zones={zones} isMobile={isMobile} />)}
    </div>
  );
}
