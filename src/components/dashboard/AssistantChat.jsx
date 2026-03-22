import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";

const AGENT_NAMES = {
  coach:         "Coach de Rendimiento",
  fisio:         "Fisioterapeuta",
  traumato:      "Especialista en Lesiones",
  nutricionista: "Nutricionista Deportivo",
};

function detectAgent(message) {
  const msg = message.toLowerCase();
  if (msg.match(/lesion|dolor|golpe|fractura|esguince|tendon|ligamento|rodilla|tobillo|hombro|cadera/)) return "traumato";
  if (msg.match(/recuper|estiramiento|tension|contractura|flexibility|movilidad|fisio|rehabilit/)) return "fisio";
  if (msg.match(/comer|nutri|dieta|proteina|carbohidrato|caloria|hidratacion|suplemento|vitamina|aliment/)) return "nutricionista";
  return "coach";
}

function parseMarkdown(text) {
  if (!text) return "";
  return text
    .replace(/^### (.+)$/gm, '<strong style="color:#60efff;font-size:13px;display:block;margin-top:8px">$1</strong>')
    .replace(/^## (.+)$/gm, '<strong style="color:#60efff;font-size:14px;display:block;margin-top:12px">$1</strong>')
    .replace(/^# (.+)$/gm, '<strong style="color:#60efff;font-size:15px;display:block;margin-top:12px">$1</strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '• $1')
    .replace(/\n/g, '<br/>');
}

// ─── History Modal ────────────────────────────────────────────────────────────
function HistoryModal({ history, onClose, isMobile }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={onClose}>
      <div style={{ background: "#0f1623", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, width: "100%", maxWidth: 680, maxHeight: "80vh", display: "flex", flexDirection: "column", overflow: "hidden" }}
        onClick={e => e.stopPropagation()}>

        {/* Modal header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f0", margin: 0 }}>Historial de conversaciones</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0 }}>{history.length} mensajes guardados</p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "rgba(255,255,255,0.6)", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          {history.length === 0 ? (
            <p style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13, marginTop: 40 }}>No hay conversaciones previas</p>
          ) : (
            history.map((msg, i) => {
              if (!msg?.role || !msg?.content) return null;
              const isUser = msg.role === "user";
              return (
                <div key={i} style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
                  <div style={{ maxWidth: "80%", padding: "10px 14px", borderRadius: isUser ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: isUser ? "linear-gradient(135deg,#00d4aa,#60efff)" : "rgba(255,255,255,0.05)", border: isUser ? "none" : "1px solid rgba(255,255,255,0.08)", color: isUser ? "#080c14" : "#f0f0f0", fontSize: 12, lineHeight: 1.6 }}>
                    {!isUser && msg.agent && (
                      <div style={{ fontSize: 10, color: "#60efff", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 4 }}>
                        {AGENT_NAMES[msg.agent]?.toUpperCase() || "ASISTENTE"}
                      </div>
                    )}
                    <div dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }} />
                    <div style={{ fontSize: 10, color: isUser ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.25)", marginTop: 4, textAlign: "right" }}>
                      {new Date(msg.created_at || Date.now()).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit" })} · {new Date(msg.created_at || Date.now()).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg, isMobile }) {
  if (!msg?.role || !msg?.content) return null;
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 12 }}>
      {!isUser && (
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#00d4aa,#60efff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, marginRight: 8, alignSelf: "flex-end" }}>✦</div>
      )}
      <div style={{ maxWidth: isMobile ? "85%" : "70%", padding: "12px 16px", borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: isUser ? "linear-gradient(135deg,#00d4aa,#60efff)" : "rgba(255,255,255,0.06)", border: isUser ? "none" : "1px solid rgba(255,255,255,0.08)", color: isUser ? "#080c14" : "#f0f0f0", fontSize: 13, lineHeight: 1.6, fontWeight: isUser ? 600 : 400 }}>
        {!isUser && msg.agent && (
          <div style={{ fontSize: 10, color: "#60efff", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 6 }}>
            {AGENT_NAMES[msg.agent]?.toUpperCase() || "ASISTENTE"}
          </div>
        )}
        <div style={{ whiteSpace: "pre-wrap" }} dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }} />
        {msg.video && (
          <div style={{ marginTop: 12 }}>
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

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AssistantChat({ ctx }) {
  const { user, token } = useAuth();
  const { summary, activities, daily, isMobile } = ctx;
  const [messages, setMessages]         = useState([]);
  const [input, setInput]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [history, setHistory]           = useState([]);
  const [showHistory, setShowHistory]   = useState(false);
  const messagesEndRef = useRef(null);

  const WELCOME = {
    role: "assistant",
    agent: "coach",
    content: `¡Hola ${user?.full_name?.split(" ")[0] || ""}! 👋 Soy tu asistente personal de salud y rendimiento deportivo.\n\nPuedo ayudarte con:\n• 🏃 Optimización de entrenamiento\n• 🦴 Prevención de lesiones\n• 🧘 Recuperación y movilidad\n• 🥗 Nutrición deportiva\n\nTodas mis recomendaciones están basadas en estudios científicos de organismos mundiales como ACSM, IOC, WHO y más.\n\n¿En qué te puedo ayudar hoy?`,
    created_at: new Date().toISOString(),
  };

  useEffect(() => {
    setMessages([WELCOME]);
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
        const hist = Array.isArray(data.messages)
          ? data.messages.filter(m => m?.role && m?.content)
          : [];
        setHistory(hist);
      }
    } catch (e) {
      console.log("Sin historial previo");
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMessage = { role: "user", content: input.trim(), created_at: new Date().toISOString() };
    const detectedAgent = detectAgent(input);
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/n8n/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          user_id:    user?.garmin_user_id || user?.id,
          message:    userMessage.content,
          agent_type: detectedAgent,
          context: {
            resting_hr:        daily?.resting_heart_rate,
            body_battery:      daily?.body_battery,
            stress:            daily?.stress_avg,
            avg_steps:         summary?.avg_steps,
            avg_calories:      summary?.avg_calories,
            active_minutes:    summary?.avg_active_minutes,
            recent_activities: activities?.slice(0, 5).map(a => ({
              type:         a.activity_type,
              duration_min: Math.round(a.duration_seconds / 60),
              avg_hr:       a.avg_heart_rate,
              date:         a.start_time?.slice(0, 10),
            })),
          }
        }),
      });
      const data = await res.json();
      const assistantMsg = {
        role:       "assistant",
        agent:      detectedAgent,
        content:    data.response || "No pude procesar tu consulta. Intentá de nuevo.",
        video:      data.video || null,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMsg]);
      setHistory(prev => [...prev, userMessage, assistantMsg]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", agent: "coach", content: "Hubo un error al conectar con el asistente. Por favor intentá de nuevo.", created_at: new Date().toISOString() }]);
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

const [uploadingPDF, setUploadingPDF] = useState(false);

const handlePDFUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  setUploadingPDF(true);

  try {
    // Extraer texto del PDF en el browser
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      fullText += content.items.map(item => item.str).join(" ") + "\n";
    }

    // Enviar texto a n8n
    const res = await fetch("/n8n/agent/upload-document", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        user_id:     user?.garmin_user_id || user?.id,
        filename:    file.name,
        agent_type:  "general",
        content_text: fullText.slice(0, 50000), // máximo 50k caracteres
      }),
    });

    const data = await res.json();
    if (data.success) {
      setMessages(prev => [...prev, {
        role: "assistant",
        agent: "coach",
        content: `✅ Documento **"${file.name}"** cargado correctamente. Ahora puedo analizarlo en mis respuestas. ¿Tenés alguna pregunta sobre el estudio?`,
        created_at: new Date().toISOString(),
      }]);
    }
  } catch (err) {
    console.error(err);
    setMessages(prev => [...prev, {
      role: "assistant",
      agent: "coach",
      content: "❌ No pude procesar el PDF. Asegurate que sea un archivo PDF válido.",
      created_at: new Date().toISOString(),
    }]);
  } finally {
    setUploadingPDF(false);
    e.target.value = "";
  }
};

  return (
    <>
      {showHistory && <HistoryModal history={history} onClose={() => setShowHistory(false)} isMobile={isMobile} />}

      <div style={{ display: "flex", flexDirection: "column", height: isMobile ? "calc(100vh - 200px)" : "70vh", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, overflow: "hidden" }}>
        <style>{`
          @keyframes bounce { 0%,60%,100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }
        `}</style>

        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.02)" }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,#00d4aa,#60efff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>✦</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f0", margin: 0 }}>Tu Asistente Personal</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0 }}>Basado en ACSM · IOC · WHO · AND · AAOS</p>
          </div>
          {history.length > 0 && (
            <button onClick={() => setShowHistory(true)}
              style={{ fontSize: 11, color: "#60efff", background: "rgba(96,239,255,0.08)", border: "1px solid rgba(96,239,255,0.2)", borderRadius: 20, padding: "6px 12px", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              🕐 Ver historial ({history.length})
            </button>
          )}
          <label style={{ fontSize: 11, color: "#f9c74f", background: "rgba(249,199,79,0.08)", border: "1px solid rgba(249,199,79,0.2)", borderRadius: 20, padding: "6px 12px", cursor: uploadingPDF ? "default" : "pointer", fontFamily: "inherit", whiteSpace: "nowrap", opacity: uploadingPDF ? 0.6 : 1 }}>
            {uploadingPDF ? "⏳ Procesando..." : "📄 Subir estudio"}
            <input type="file" accept=".pdf" style={{ display: "none" }} onChange={handlePDFUpload} disabled={uploadingPDF} />
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00d4aa" }} />
            {!isMobile && <span style={{ fontSize: 11, color: "#00d4aa", fontWeight: 600 }}>En línea</span>}
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px" }}>
          {messages.map((msg, i) => <MessageBubble key={i} msg={msg} isMobile={isMobile} />)}
          {loading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested questions */}
        {messages.length <= 1 && !loading && (
          <div style={{ padding: "0 16px 12px", display: "flex", gap: 8, flexWrap: "wrap" }}>
            {suggestedQuestions.map((q, i) => (
              <button key={i} onClick={() => setInput(q)}
                style={{ fontSize: 11, color: "#60efff", background: "rgba(96,239,255,0.08)", border: "1px solid rgba(96,239,255,0.2)", borderRadius: 20, padding: "6px 12px", cursor: "pointer", fontFamily: "inherit", transition: "all .2s" }}>
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 10, alignItems: "flex-end", background: "rgba(255,255,255,0.02)" }}>
          <textarea value={input} onChange={e => setInput(e.target.value)}
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
    </>
  );
}