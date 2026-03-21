import { useEffect, useState } from "react";
import { ZONE_COLORS } from "../../utils/calculations";

// ─── Animated Number ──────────────────────────────────────────────────────────
export function AnimatedNumber({ value, suffix = "" }) {
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

// ─── Ring Gauge ───────────────────────────────────────────────────────────────
export function RingGauge({ value, max = 100, color, size = 80, strokeWidth = 8, children }) {
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

// ─── Zone Bar (uses real Garmin hr_zone_X_sec data) ───────────────────────────
export function ZoneBar({ zone, activities }) {
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

// ─── Zone Distribution Bar (per activity) ────────────────────────────────────
export function ZoneDistBar({ act }) {
  const totals = [1,2,3,4,5].map(z => act[`hr_zone_${z}_sec`] || 0);
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

// ─── Insight Block (markdown renderer) ───────────────────────────────────────
export function InsightBlock({ text }) {
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
