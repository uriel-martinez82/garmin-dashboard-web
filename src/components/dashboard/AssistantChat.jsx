import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";

const AGENT_SYSTEM_PROMPTS = {
  coach: {
    name: "Coach de Rendimiento",
    role: `Eres un coach de rendimiento deportivo de élite. Tu conocimiento se basa exclusivamente en:
- ACSM (American College of Sports Medicine) Guidelines
- Firstbeat Analytics methodology
- British Journal of Sports Medicine
- Journal of Strength and Conditioning Research
- IOC Consensus Statements on sports performance

REGLAS ESTRICTAS:
1. Solo aconsejás basándote en evidencia científica de estas fuentes
2. Siempre citás la fuente cuando das una recomendación
3. Nunca diagnosticás condiciones médicas
4. Si el tema excede tu especialidad, derivás al especialista correcto
5. Siempre incluís: "Este consejo no reemplaza la consulta con un profesional de la salud"
6. Cuando recomendés un ejercicio, indicá que se puede buscar en YouTube para ver la técnica correcta`
  },
  fisio: {
    name: "Fisioterapeuta",
    role: `Eres un fisioterapeuta deportivo especializado en recuperación y prevención. Tu conocimiento se basa exclusivamente en:
- World Physiotherapy (WCPT) guidelines
- Journal of Orthopaedic & Sports Physical Therapy
- Cochrane Reviews de fisioterapia deportiva
- National Institute for Health and Care Excellence (NICE)
- American Physical Therapy Association (APTA)

REGLAS ESTRICTAS:
1. Solo aconsejás ejercicios de recuperación y prevención basados en evidencia
2. Siempre citás la fuente cuando das una recomendación
3. Nunca diagnosticás lesiones ni condiciones médicas
4. Si hay dolor agudo, siempre derivás a consulta médica presencial
5. Siempre incluís: "Este consejo no reemplaza la evaluación de un fisioterapeuta certificado"
6. Cuando recomendés un ejercicio, indicá que se puede buscar en YouTube para ver la técnica correcta`
  },
  traumato: {
    name: "Especialista en Lesiones",
    role: `Eres un especialista en medicina deportiva y prevención de lesiones. Tu conocimiento se basa exclusivamente en:
- American Academy of Orthopaedic Surgeons (AAOS)
- IOC Medical Commission guidelines
- American Journal of Sports Medicine
- Orthopaedic Journal of Sports Medicine
- British Journal of Sports Medicine (lesiones)

REGLAS ESTRICTAS:
1. Solo orientás sobre prevención y manejo general de lesiones deportivas comunes
2. Siempre citás la fuente cuando das una recomendación
3. NUNCA diagnosticás lesiones — eso requiere evaluación médica presencial
4. Ante cualquier dolor, siempre recomendás consulta médica
5. Siempre incluís: "Este consejo no reemplaza la evaluación de un médico traumatólogo"
6. Tu rol es orientar, no diagnosticar`
  },
  nutricionista: {
    name: "Nutricionista Deportivo",
    role: `Eres un nutricionista deportivo especializado en rendimiento. Tu conocimiento se basa exclusivamente en:
- Academy of Nutrition and Dietetics (AND)
- IOC Consensus Statement on Sports Nutrition
- Journal of the International Society of Sports Nutrition
- WHO nutrition guidelines
- American College of Sports Medicine nutrition position statements

REGLAS ESTRICTAS:
1. Solo aconsejás sobre nutrición deportiva basada en evidencia científica
2. Siempre citás la fuente cuando das una recomendación  
3. Nunca prescribís suplementos sin advertir de consulta médica
4. No elaborás planes de alimentación personalizados sin evaluación profesional
5. Siempre incluís: "Este consejo no reemplaza la consulta con un nutricionista certificado"
6. Te basás en las métricas del usuario (calorías, actividad) para contextualizar`
  }
};

function detectAgent(message) {
  const msg = message.toLowerCase();
  if (msg.match(/lesion|dolor|golpe|fractura|esguince|tendon|ligamento|rodilla|tobillo|hombro|cadera/)) return "traumato";
  if (msg.match(/recuper|estiramiento|tension|contractura|flexibility|movilidad|fisio|rehabilit/)) return "fisio";
  if (msg.match(/comer|nutri|dieta|proteina|carbohidrato|caloria|hidratacion|suplemento|vitamina|aliment/)) return "nutricionista";
  return "coach";
}

function parseMarkdown(text) {
  return text
    .replace(/^### (.+)$/gm, '<strong style="color:#60efff;font-size:13px">$1</strong>')
    .replace(/^## (.+)$/gm, '<strong style="color:#60efff;font-size:14px;display:block;margin-top:12px">$1</strong>')
    .replace(/^# (.+)$/gm, '<strong style="color:#60efff;font-size:15px;display:block;margin-top:12px">$1</strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '• $1')
    .replace(/\n/g, '<br/>');
}

const MAX_PREVIEW = 500;

// function CollapsibleContent({ content }) {
//   const [expanded, setExpanded] = useState(false);
  
//   // ─── Validación ───
//   if (!content) return null;
  
//   const isLong = content.length > MAX_PREVIEW;
//   const displayed = expanded || !isLong ? content : content.slice(0, MAX_PREVIEW) + "...";

//   return (
//     <div>
//       <div style={{ whiteSpace: "pre-wrap" }} dangerouslySetInnerHTML={{ __html: parseMarkdown(displayed) }} />
//       {isLong && (
//         <button onClick={() => setExpanded(!expanded)}
//           style={{ marginTop: 10, fontSize: 11, color: "#60efff", background: "rgba(96,239,255,0.08)", border: "1px solid rgba(96,239,255,0.2)", borderRadius: 20, padding: "4px 12px", cursor: "pointer", fontFamily: "inherit", display: "block" }}>
//           {expanded ? "▲ Ver menos" : "▼ Ver respuesta completa"}
//         </button>
//       )}
//     </div>
//   );
// }

function MessageBubble({ msg, isMobile }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 12 }}>
      {!isUser && (
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#00d4aa,#60efff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, marginRight: 8, alignSelf: "flex-end" }}>✦</div>
      )}
      <div style={{
        maxWidth: isMobile ? "85%" : "70%",
        padding: "12px 16px",
        borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
        background: isUser ? "linear-gradient(135deg,#00d4aa,#60efff)" : "rgba(255,255,255,0.06)",
        border: isUser ? "none" : "1px solid rgba(255,255,255,0.08)",
        color: isUser ? "#080c14" : "#f0f0f0",
        fontSize: 13,
        lineHeight: 1.6,
        fontWeight: isUser ? 600 : 400,
      }}>
        {!isUser && msg.agent && (
          <div style={{ fontSize: 10, color: "#60efff", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 6 }}>
            {AGENT_SYSTEM_PROMPTS[msg.agent]?.name?.toUpperCase() || "ASISTENTE"}
          </div>
        )}
        {msg.role === "assistant" 
            ? <div style={{ whiteSpace: "pre-wrap" }} dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content || "") }} />
            : <div dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content || "") }} />
        }
        {msg.video && (
          <div style={{ marginTop: 12, borderRadius: 10, overflow: "hidden" }}>
            <a href={`https://youtube.com/watch?v=${msg.video.video_id}`} target="_blank" rel="noreferrer"
              style={{ display: "flex", gap: 10, alignItems: "center", background: "rgba(0,0,0,0.3)", padding: "8px 10px", borderRadius: 8, textDecoration: "none" }}>
              <img src={msg.video.thumbnail} alt={msg.video.title} style={{ width: 80, height: 45, objectFit: "cover", borderRadius: 4, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#f0f0f0", lineHeight: 1.4 }}>{msg.video.title}</div>
                <div style={{ fontSize: 10, color: "#60efff", marginTop: 2 }}>▶ {msg.video.channel} · YouTube</div>
              </div>
            </a>
          </div>
        )}
        <div style={{ fontSize: 10, color: isUser ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.25)", marginTop: 6, textAlign: "right" }}>
          {new Date(msg.created_at || Date.now()).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#00d4aa,#60efff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>✦</div>
      <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px 16px 16px 4px", padding: "12px 16px", display: "flex", gap: 4, alignItems: "center" }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#60efff", animation: "bounce 1.2s infinite", animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    </div>
  );
}

export default function AssistantChat({ ctx }) {
  const { user, token } = useAuth();
  const { summary, activities, daily, isMobile } = ctx;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const loadHistory = async () => {
  try {
    const res = await fetch(`/n8n/agent/history?user_id=${user?.garmin_user_id || user?.id}`, {
      headers: { "ngrok-skip-browser-warning": "true" }
    });
    if (res.ok) {
      const data = await res.json();
      const history = Array.isArray(data.messages) ? data.messages : [];
      
      if (history.length > 0) {
        // Hay historial — mostrarlo
        setMessages(history);
      } else {
        // Sin historial — mensaje de bienvenida
        setMessages([{
          role: "assistant",
          agent: "coach",
          content: `¡Hola ${user?.full_name?.split(" ")[0] || ""}! 👋 Soy tu asistente personal de salud y rendimiento deportivo.\n\nPuedo ayudarte con:\n• 🏃 Optimización de entrenamiento\n• 🦴 Prevención de lesiones\n• 🧘 Recuperación y movilidad\n• 🥗 Nutrición deportiva\n\nTodas mis recomendaciones están basadas en estudios científicos de organismos mundiales como ACSM, IOC, WHO y más.\n\n¿En qué te puedo ayudar hoy?`,
          created_at: new Date().toISOString(),
        }]);
      }
    }
  } catch (e) {
    console.log("Sin historial previo");
    setMessages([{
      role: "assistant",
      agent: "coach",
      content: `¡Hola ${user?.full_name?.split(" ")[0] || ""}! 👋 ¿En qué te puedo ayudar hoy?`,
      created_at: new Date().toISOString(),
    }]);
  } finally {
    setLoadingHistory(false);
  }
};

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      role: "user",
      content: input.trim(),
      created_at: new Date().toISOString(),
    };

    const detectedAgent = detectAgent(input);
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/n8n/agent/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: user?.garmin_user_id || user?.id,
          message: userMessage.content,
          agent_type: detectedAgent,
          context: {
            resting_hr:     daily?.resting_heart_rate,
            body_battery:   daily?.body_battery,
            stress:         daily?.stress_avg,
            avg_steps:      summary?.avg_steps,
            avg_calories:   summary?.avg_calories,
            active_minutes: summary?.avg_active_minutes,
            recent_activities: activities?.slice(0, 5).map(a => ({
              type: a.activity_type,
              duration_min: Math.round(a.duration_seconds / 60),
              avg_hr: a.avg_heart_rate,
              date: a.start_time?.slice(0, 10),
            })),
          }
        }),
      });

      const data = await res.json();
      setMessages(prev => [...prev, {
        role: "assistant",
        agent: detectedAgent,
        content: data.response || "No pude procesar tu consulta. Intentá de nuevo.",
        video: data.video || null,
        created_at: new Date().toISOString(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        agent: "coach",
        content: "Hubo un error al conectar con el asistente. Por favor intentá de nuevo.",
        created_at: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestedQuestions = [
    "¿Cómo puedo mejorar mi VO2max?",
    "¿Qué debo comer antes de entrenar?",
    "Tengo dolor en la rodilla al correr",
    "¿Cómo mejorar mi recuperación?",
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: isMobile ? "calc(100vh - 200px)" : "70vh", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, overflow: "hidden" }}>
      <style>{`
        @keyframes bounce { 0%,60%,100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }
      `}</style>

      {/* Header */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.02)" }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,#00d4aa,#60efff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>✦</div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f0", margin: 0 }}>Tu Asistente Personal</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0 }}>Basado en ACSM · IOC · WHO · AND · AAOS</p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00d4aa" }} />
          <span style={{ fontSize: 11, color: "#00d4aa", fontWeight: 600 }}>En línea</span>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px" }}>
        {loadingHistory ? (
          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13, marginTop: 40 }}>Cargando historial...</div>
        ) : (
          <>
            {messages.map((msg, i) => <MessageBubble key={i} msg={msg} isMobile={isMobile} />)}
            {loading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Suggested questions */}
      {(messages?.length ?? 0) <= 1 && !loading && (
        <div style={{ padding: "0 16px 12px", display: "flex", gap: 8, flexWrap: "wrap" }}>
          {suggestedQuestions.map((q, i) => (
            <button key={i} onClick={() => { setInput(q); }}
              style={{ fontSize: 11, color: "#60efff", background: "rgba(96,239,255,0.08)", border: "1px solid rgba(96,239,255,0.2)", borderRadius: 20, padding: "6px 12px", cursor: "pointer", fontFamily: "inherit", transition: "all .2s" }}>
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 10, alignItems: "flex-end", background: "rgba(255,255,255,0.02)" }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder="Preguntá sobre entrenamiento, nutrición, lesiones o recuperación..."
          rows={1}
          style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "10px 14px", fontSize: 13, color: "#f0f0f0", outline: "none", fontFamily: "inherit", resize: "none", lineHeight: 1.5, maxHeight: 120, overflowY: "auto" }}
          onInput={e => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()}
          style={{ width: 40, height: 40, borderRadius: 10, border: "none", background: input.trim() && !loading ? "linear-gradient(135deg,#00d4aa,#60efff)" : "rgba(255,255,255,0.08)", cursor: input.trim() && !loading ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0, transition: "all .2s" }}>
          {loading ? "⏳" : "↑"}
        </button>
      </div>

      {/* Disclaimer */}
      <div style={{ padding: "8px 16px", borderTop: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.01)" }}>
        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", textAlign: "center", margin: 0 }}>
          ⚕️ Las recomendaciones de este asistente no reemplazan la consulta con profesionales de la salud certificados.
        </p>
      </div>
    </div>
  );
}