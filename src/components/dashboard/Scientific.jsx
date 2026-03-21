export default function Scientific({ ctx }) {
  const { vo2max, age, vo2percentile, whoCompliance, weeklyTRIMP, maxHR, daily } = ctx;

  const items = [
    {
      title: "ACSM — American College of Sports Medicine",
      icon: "🏅", color: "#60efff",
      content: `VO2max de ${vo2max} ml/kg/min para hombre de ${age} años = categoría "${vo2percentile.label}" (Percentil ${vo2percentile.percentile}). Referencia: ACSM's Guidelines for Exercise Testing and Prescription, 11va edición (2022).`,
      detail: "Para alcanzar 'Excelente' (≥49 ml/kg/min): 2 sesiones semanales de HIIT de 20-30 min durante 8-12 semanas.",
    },
    {
      title: "AHA — American Heart Association",
      icon: "❤️", color: "#d62828",
      content: `FC reposo de ${daily.resting_heart_rate} bpm. La AHA clasifica 60 bpm como límite entre rango normal y atlético. Tu FC indica excelente condición cardiovascular.`,
      detail: "FC reposo < 50 bpm es común en atletas de resistencia e indica alta eficiencia cardíaca. Monitorear si baja de 40 bpm.",
    },
    {
      title: "OMS — Organización Mundial de la Salud",
      icon: "🌍", color: "#00d4aa",
      content: `Recomendación: 150-300 min/semana moderada o 75-150 min vigorosa. Tu adherencia: ${whoCompliance.pct}% del objetivo mínimo.`,
      detail: "Las guías OMS 2020 también recomiendan reducir el tiempo sedentario, interrumpiendo cada 30-45 min.",
    },
    {
      title: "Firstbeat Analytics — Training Load TRIMP",
      icon: "📊", color: "#f9c74f",
      content: `TRIMP semanal: ${Math.round(weeklyTRIMP)}. Modelo Banister (1991) cuantifica la carga normalizando duración e intensidad entre deportes.`,
      detail: "TRIMP < 100: mantenimiento. 100-300: progreso óptimo. > 300: riesgo de sobreentrenamiento. Base del Training Status de Garmin.",
    },
    {
      title: "Karvonen — Zonas de Frecuencia Cardíaca",
      icon: "💓", color: "#f77f00",
      content: `Método Karvonen usa la FC de reserva (FC máx - FC reposo) para calcular zonas reales, más preciso que solo FC máx.`,
      detail: `FC reserva = ${maxHR} - ${daily.resting_heart_rate} = ${maxHR - (daily.resting_heart_rate || 47)} bpm. FC reposo baja amplía zonas bajas, ideales para entrenamiento polarizado.`,
    },
  ];

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {items.map((item, i) => (
        <div key={i} className="card" style={{ animationDelay: `${i * 80}ms`, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 18 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: `${item.color}18`, border: `1px solid ${item.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>
              {item.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 11, color: item.color, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 8 }}>{item.title}</p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, marginBottom: 10 }}>{item.content}</p>
              <div style={{ padding: "10px 12px", background: `${item.color}08`, border: `1px solid ${item.color}18`, borderRadius: 8 }}>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>📌 {item.detail}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
