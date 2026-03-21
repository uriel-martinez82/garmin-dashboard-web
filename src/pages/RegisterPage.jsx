import { useState } from "react";
import { register } from "../api/auth";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage({ onGoLogin }) {
  const { saveSession } = useAuth();
  const [form, setForm]     = useState({ email: "", password: "", full_name: "" });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!form.email || !form.password || !form.full_name) { setError("Completá todos los campos"); return; }
    if (form.password.length < 6) { setError("El password debe tener al menos 6 caracteres"); return; }
    setLoading(true);
    try {
      const res = await register(form);
      if (res.success) {
        saveSession(res.token, res.user);
      } else {
        setError(res.error || "Error al registrarse");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>⚡</div>
        <h1 style={styles.title}>Crear cuenta</h1>
        <p style={styles.subtitle}>Empezá a analizar tu rendimiento</p>

        {error && <div style={styles.error}>{error}</div>}

        <input style={styles.input} type="text" placeholder="Nombre completo"
          value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />

        <input style={styles.input} type="email" placeholder="Email"
          value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />

        <input style={styles.input} type="password" placeholder="Password (mínimo 6 caracteres)"
          value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          onKeyDown={e => e.key === "Enter" && handleSubmit()} />

        <button style={{ ...styles.btn, opacity: loading ? 0.6 : 1 }}
          onClick={handleSubmit} disabled={loading}>
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </button>

        <p style={styles.link}>
          ¿Ya tenés cuenta?{" "}
          <span style={styles.linkBtn} onClick={onGoLogin}>Iniciá sesión</span>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#080c14", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'DM Sans', sans-serif" },
  card: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 40, width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 16 },
  logo: { width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg,#00d4aa,#60efff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto" },
  title: { fontSize: 24, fontWeight: 800, color: "#f0f0f0", textAlign: "center", letterSpacing: "-0.02em", margin: 0 },
  subtitle: { fontSize: 13, color: "rgba(255,255,255,0.4)", textAlign: "center", margin: 0 },
  error: { background: "rgba(214,40,40,0.1)", border: "1px solid rgba(214,40,40,0.3)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#ff6b6b" },
  input: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 16px", fontSize: 14, color: "#f0f0f0", outline: "none", fontFamily: "inherit" },
  btn: { background: "linear-gradient(135deg,#00d4aa,#60efff)", border: "none", borderRadius: 10, padding: "13px", fontSize: 14, fontWeight: 700, color: "#080c14", cursor: "pointer", fontFamily: "inherit", marginTop: 4 },
  link: { fontSize: 13, color: "rgba(255,255,255,0.4)", textAlign: "center", margin: 0 },
  linkBtn: { color: "#60efff", cursor: "pointer", fontWeight: 600 },
};
