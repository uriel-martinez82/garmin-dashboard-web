import { AnimatedNumber, RingGauge } from "../ui/index";
import { ZONE_COLORS } from "../../utils/calculations";

export default function Overview({ ctx }) {
  const { summary, daily, zones, recoveryScore, vo2percentile, whoCompliance, weeklyTRIMP, totalZoneMins, totalTrainingMin, activities, isMobile, age, vo2max } = ctx;

  return (
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

      {/* Zone distribution */}
      <div className="card" style={{ animationDelay:"320ms", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div>
            <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", fontWeight:700, letterSpacing:"0.08em" }}>DISTRIBUCIÓN DE ZONAS · DATOS REALES GARMIN</p>
            <p style={{ fontSize:12, color:"rgba(255,255,255,0.3)", marginTop:3 }}>Tiempo total — {activities.length} actividades</p>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:24, fontWeight:800, color:"#60efff", fontFamily:"'Space Mono',monospace" }}>{totalTrainingMin}</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>min totales</div>
          </div>
        </div>
        <div style={{ display:"flex", height:12, borderRadius:6, overflow:"hidden", marginBottom:14, gap:1 }}>
          {totalZoneMins.map((min, i) => {
            const pct = totalTrainingMin > 0 ? (min / totalTrainingMin) * 100 : 0;
            if (pct < 0.5) return null;
            return <div key={i} style={{ width:`${pct}%`, background:ZONE_COLORS[i], transition:"width 1.2s ease" }} />;
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

        <div className="card" style={{ animationDelay:"400ms", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:20 }}>
          <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", fontWeight:700, letterSpacing:"0.08em", marginBottom:14 }}>RECOVERY SCORE</p>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <RingGauge value={recoveryScore} color={recoveryScore>70?"#00d4aa":recoveryScore>40?"#f9c74f":"#d62828"} size={78}>
              <span style={{ fontSize:17, fontWeight:800, fontFamily:"'Space Mono',monospace" }}>{recoveryScore}</span>
            </RingGauge>
            <div style={{ flex:1 }}>
              {[
                { label:"Body Battery", value:daily.body_battery, color:"#60efff" },
                { label:"Stress",       value:100-(daily.stress_avg||0), color:"#00d4aa" },
                { label:"Sueño",        value:Math.round(Math.min((daily.sleep_seconds||0)/28800,1)*100), color:"#f9c74f" },
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

        <div className="card" style={{ animationDelay:"480ms", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:20 }}>
          <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", fontWeight:700, letterSpacing:"0.08em", marginBottom:14 }}>VO2MAX · ACSM</p>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <RingGauge value={vo2percentile.percentile} color={vo2percentile.color} size={78}>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:14, fontWeight:800, fontFamily:"'Space Mono',monospace" }}>{vo2max}</div>
                <div style={{ fontSize:8, color:"rgba(255,255,255,0.4)" }}>ml/kg/min</div>
              </div>
            </RingGauge>
            <div>
              <div style={{ fontSize:20, fontWeight:800, color:vo2percentile.color }}>{vo2percentile.label}</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginTop:4 }}>Percentil {vo2percentile.percentile}</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>hombres {age} años</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.25)", marginTop:6 }}>ACSM Guidelines 2022</div>
            </div>
          </div>
        </div>

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
  );
}
