import { ZoneBar, InsightBlock } from "../ui/index";
import { formatActivity, formatLocalDate, formatLocalTime, getZoneForActivity, ZONE_COLORS } from "../../utils/calculations";

// ─── Zones FC Tab ─────────────────────────────────────────────────────────────
export function ZonesFC({ ctx }) {
  const { zones, activities, summary, maxHR, isMobile } = ctx;
  return (
    <div style={{ display:"grid", gap:16 }}>
      <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:16 }}>
        <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:20 }}>
          <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", fontWeight:700, letterSpacing:"0.08em", marginBottom:4 }}>TUS ZONAS · KARVONEN</p>
          <p style={{ fontSize:12, color:"rgba(255,255,255,0.3)", marginBottom:16 }}>FC reposo: {summary.avg_resting_heart_rate} bpm · FC máx: {maxHR} bpm</p>
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
            <strong style={{ color:"#60efff" }}>Entrenamiento polarizado:</strong> 80% en Z1-Z2 y 20% en Z4-Z5 para máximo VO2max.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Activity Row ─────────────────────────────────────────────────────────────
function ActivityRow({ act, zones, isMobile }) {
  const zone = getZoneForActivity(act.avg_heart_rate || 0, zones);
  const distKm = ((act.distance_meters || 0) / 1000).toFixed(2);
  const durMin = Math.round((act.duration_seconds || 0) / 60);
  const dateStr = formatLocalDate(act.start_time);
  const timeStr = formatLocalTime(act.start_time);

  const ZoneMiniBar = () => {
    const totals = [1,2,3,4,5].map(z => act[`hr_zone_${z}_sec`] || 0);
    const total = totals.reduce((s,v) => s+v, 0);
    if (total === 0) return null;
    return (
      <div style={{ display:"flex", height:4, borderRadius:2, overflow:"hidden", marginTop:8, gap:1 }}>
        {totals.map((sec, i) => {
          const pct = (sec/total)*100;
          if (pct < 1) return null;
          return <div key={i} style={{ width:`${pct}%`, background:ZONE_COLORS[i] }} title={`Z${i+1}: ${Math.round(sec/60)} min`} />;
        })}
      </div>
    );
  };

  if (isMobile) {
    return (
      <div style={{ padding:"12px 16px", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:"#f0f0f0" }}>{formatActivity(act.activity_type)}</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginTop:2 }}>{dateStr} · {timeStr}</div>
          </div>
          <span style={{ fontSize:11, fontWeight:700, color:zone.color, background:`${zone.color}18`, padding:"3px 8px", borderRadius:20, border:`1px solid ${zone.color}40`, flexShrink:0, marginLeft:8 }}>Z{zone.zone}</span>
        </div>
        <div style={{ display:"flex", gap:20 }}>
          <div><div style={{ fontSize:13, fontWeight:700, color:"#f0f0f0" }}>{distKm} km</div><div style={{ fontSize:10, color:"rgba(255,255,255,0.35)" }}>distancia</div></div>
          <div><div style={{ fontSize:13, fontWeight:700, color:"#f0f0f0" }}>{durMin} min</div><div style={{ fontSize:10, color:"rgba(255,255,255,0.35)" }}>duración</div></div>
          <div><div style={{ fontSize:13, fontWeight:700, color:"#f0f0f0" }}>{act.avg_heart_rate || "—"} bpm</div><div style={{ fontSize:10, color:"rgba(255,255,255,0.35)" }}>FC media</div></div>
          {act.avg_cadence && <div><div style={{ fontSize:13, fontWeight:700, color:"#f0f0f0" }}>{act.avg_cadence} rpm</div><div style={{ fontSize:10, color:"rgba(255,255,255,0.35)" }}>cadencia</div></div>}
        </div>
        <ZoneMiniBar />
      </div>
    );
  }

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 70px 70px 80px 80px 110px", gap:8, alignItems:"center", padding:"12px 16px", borderBottom:"1px solid rgba(255,255,255,0.05)", transition:"background .2s" }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
      <div>
        <div style={{ fontSize:13, fontWeight:600, color:"#f0f0f0" }}>{formatActivity(act.activity_type)}</div>
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginTop:2 }}>{dateStr} · {timeStr}</div>
        <ZoneMiniBar />
      </div>
      <div style={{ textAlign:"right" }}><div style={{ fontSize:13, fontWeight:700, color:"#f0f0f0" }}>{distKm} km</div><div style={{ fontSize:10, color:"rgba(255,255,255,0.35)" }}>distancia</div></div>
      <div style={{ textAlign:"right" }}><div style={{ fontSize:13, fontWeight:700, color:"#f0f0f0" }}>{durMin} min</div><div style={{ fontSize:10, color:"rgba(255,255,255,0.35)" }}>duración</div></div>
      <div style={{ textAlign:"right" }}><div style={{ fontSize:13, fontWeight:700, color:"#f0f0f0" }}>{act.avg_heart_rate || "—"} bpm</div><div style={{ fontSize:10, color:"rgba(255,255,255,0.35)" }}>FC media</div></div>
      <div style={{ textAlign:"right" }}><div style={{ fontSize:13, fontWeight:700, color:"#f0f0f0" }}>{act.avg_cadence ? `${act.avg_cadence} rpm` : "—"}</div><div style={{ fontSize:10, color:"rgba(255,255,255,0.35)" }}>cadencia</div></div>
      <div style={{ textAlign:"right" }}>
        <span style={{ fontSize:11, fontWeight:700, color:zone.color, background:`${zone.color}18`, padding:"3px 8px", borderRadius:20, border:`1px solid ${zone.color}40` }}>Z{zone.zone} {zone.name}</span>
      </div>
    </div>
  );
}

// ─── Activities Tab ───────────────────────────────────────────────────────────
export function Activities({ ctx }) {
  const { activities, zones, isMobile } = ctx;
  return (
    <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, overflow:"hidden" }}>
      <div style={{ padding:"16px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
        <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", fontWeight:700, letterSpacing:"0.08em" }}>HISTORIAL DE ACTIVIDADES</p>
        <p style={{ fontSize:12, color:"rgba(255,255,255,0.3)", marginTop:2 }}>{activities.length} sesiones · Zona FC + cadencia + distribución real de zonas</p>
      </div>
      {!isMobile && (
        <div style={{ fontSize:10, color:"rgba(255,255,255,0.2)", display:"grid", gridTemplateColumns:"1fr 70px 70px 80px 80px 110px", gap:8, padding:"8px 16px" }}>
          <span>ACTIVIDAD</span><span style={{ textAlign:"right" }}>DIST.</span><span style={{ textAlign:"right" }}>DUR.</span><span style={{ textAlign:"right" }}>FC MEDIA</span><span style={{ textAlign:"right" }}>CADENCIA</span><span style={{ textAlign:"right" }}>ZONA</span>
        </div>
      )}
      {activities.map((act, i) => <ActivityRow key={i} act={act} zones={zones} isMobile={isMobile} />)}
    </div>
  );
}

// ─── Scientific Tab ───────────────────────────────────────────────────────────
export function Scientific({ ctx }) {
  const { vo2max, age, vo2percentile, whoCompliance, weeklyTRIMP, maxHR, daily } = ctx;
  const items = [
    { title:"ACSM — American College of Sports Medicine", icon:"🏅", color:"#60efff", content:`VO2max de ${vo2max} ml/kg/min para hombre de ${age} años = categoría "${vo2percentile.label}" (Percentil ${vo2percentile.percentile}). Referencia: ACSM's Guidelines for Exercise Testing and Prescription, 11va edición (2022).`, detail:"Para alcanzar 'Excelente' (≥49 ml/kg/min): 2 sesiones semanales de HIIT de 20-30 min durante 8-12 semanas." },
    { title:"AHA — American Heart Association", icon:"❤️", color:"#d62828", content:`FC reposo de ${daily.resting_heart_rate} bpm. La AHA clasifica 60 bpm como límite entre rango normal y atlético.`, detail:"FC reposo < 50 bpm es común en atletas de resistencia e indica alta eficiencia cardíaca." },
    { title:"OMS — Organización Mundial de la Salud", icon:"🌍", color:"#00d4aa", content:`Recomendación: 150-300 min/semana moderada o 75-150 min vigorosa. Tu adherencia: ${whoCompliance.pct}% del objetivo mínimo.`, detail:"Las guías OMS 2020 también recomiendan interrumpir el tiempo sedentario cada 30-45 min." },
    { title:"Firstbeat Analytics — Training Load TRIMP", icon:"📊", color:"#f9c74f", content:`TRIMP semanal: ${Math.round(weeklyTRIMP)}. Modelo Banister (1991) cuantifica la carga normalizando duración e intensidad entre deportes.`, detail:"TRIMP < 100: mantenimiento. 100-300: progreso óptimo. > 300: riesgo de sobreentrenamiento." },
    { title:"Karvonen — Zonas de Frecuencia Cardíaca", icon:"💓", color:"#f77f00", content:`Método Karvonen usa la FC de reserva (FC máx - FC reposo) para calcular zonas reales, más preciso que solo FC máx.`, detail:`FC reserva = ${maxHR} - ${daily.resting_heart_rate} = ${maxHR - (daily.resting_heart_rate||47)} bpm.` },
  ];
  return (
    <div style={{ display:"grid", gap:14 }}>
      {items.map((item, i) => (
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
  );
}

// ─── Insight AI Tab ───────────────────────────────────────────────────────────
export function InsightAI({ ctx }) {
  const { insightText, daily, vo2max, vo2percentile, totalZoneMins, zones, isMobile, summary } = ctx;
  const dominantZoneIdx = totalZoneMins.indexOf(Math.max(...totalZoneMins));
  const metrics = [
    { label:"FC Reposo",      value:`${daily.resting_heart_rate} bpm`, status:"Atlético",          color:"#00d4aa", icon:"❤️" },
    { label:"VO2max",         value:`${vo2max} ml/kg/min`,             status:vo2percentile.label,  color:vo2percentile.color, icon:"🫁" },
    { label:"Stress",         value:`${daily.stress_avg}/100`,         status:"Nivel bajo",         color:"#60efff", icon:"🧘" },
    { label:"Body Battery",   value:`${daily.body_battery}/100`,       status:"Buena carga",        color:"#f9c74f", icon:"⚡" },
    { label:"Zona dominante", value:`Z${dominantZoneIdx+1}`,           status:zones[dominantZoneIdx]?.name || "", color:["#60efff","#00d4aa","#f9c74f","#f77f00","#d62828"][dominantZoneIdx], icon:"🎯" },
  ];
  return (
    <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 300px", gap:16 }}>
      <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:isMobile?16:24 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
          <div style={{ width:34, height:34, borderRadius:10, background:"linear-gradient(135deg,#00d4aa,#60efff)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, flexShrink:0 }}>✦</div>
          <div>
            <p style={{ fontSize:13, fontWeight:700, color:"#f0f0f0" }}>Análisis generado por Claude AI</p>
            <p style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>Datos reales Garmin + ACSM · AHA · OMS</p>
          </div>
        </div>
        <InsightBlock text={insightText} />
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {metrics.map((m, i) => (
          <div key={i} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:"14px 16px", display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ fontSize:18 }}>{m.icon}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>{m.label}</div>
              <div style={{ fontSize:15, fontWeight:700, color:"#f0f0f0", fontFamily:"'Space Mono',monospace" }}>{m.value}</div>
            </div>
            <span style={{ fontSize:11, color:m.color, fontWeight:700, background:`${m.color}15`, padding:"3px 8px", borderRadius:20, whiteSpace:"nowrap" }}>{m.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
