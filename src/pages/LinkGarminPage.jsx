import { useState } from "react";
import { linkGarmin } from "../api/auth";
import { useAuth } from "../context/AuthContext";

export default function LinkGarminPage() {
  const { token, user, updateUser, logout } = useAuth();
  const [form, setForm]     = useState({ garmin_email: "", garmin_password: "" });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!form.garmin_email || !form.garmin_password) { setError("Completá las credenciales de Garmin"); return; }
    setLoading(true);
    try {
      const res = await linkGarmin({ ...form, token });
      if (res.success) {
        updateUser({ garmin_linked: true });
        setSuccess(true);
      } else {
        setError(res.error || "Error al vincular Garmin");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={{ fontSize: 48, textAlign: "center" }}>🎉</div>
          <h2 style={{ ...styles.title, fontSize: 22 }}>¡Garmin vinculado!</h2>
          <p style={styles.subtitle}>Tu cuenta de Garmin fue conectada exitosamente. Ya podés ver tu dashboard.</p>
          <button style={styles.btn} onClick={() => updateUser({ garmin_linked: true })}>
            Ver mi dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>🏃</div>
        <h1 style={styles.title}>Vincular Garmin</h1>
        <p style={styles.subtitle}>
          Hola <strong style={{ color: "#f0f0f0" }}>{user?.full_name}</strong>, ingresá tus credenciales de Garmin Connect para sincronizar tus datos.
        </p>

        <div style={styles.infoBox}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: 1.6 }}>
            🔒 Tus credenciales se guardan de forma segura y solo se usan para sincronizar tu actividad de Garmin.
          </p>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <input style={styles.input} type="email" placeholder="Email de Garmin Connect"
          value={form.garmin_email} onChange={e => setForm(f => ({ ...f, garmin_email: e.target.value }))} />

        <input style={styles.input} type="password" placeholder="Password de Garmin Connect"
          value={form.garmin_password} onChange={e => setForm(f => ({ ...f, garmin_password: e.target.value }))}
          onKeyDown={e => e.key === "Enter" && handleSubmit()} />

        <button style={{ ...styles.btn, opacity: loading ? 0.6 : 1 }}
          onClick={handleSubmit} disabled={loading}>
          {loading ? "Vinculando..." : "Vincular cuenta Garmin"}
        </button>

        <button style={styles.logoutBtn} onClick={logout}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#080c14", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'DM Sans', sans-serif" },
  card: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 40, width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", gap: 16 },
  logo: { fontSize: 40, textAlign: "center" },
  title: { fontSize: 24, fontWeight: 800, color: "#f0f0f0", textAlign: "center", letterSpacing: "-0.02em", margin: 0 },
  subtitle: { fontSize: 13, color: "rgba(255,255,255,0.4)", textAlign: "center", margin: 0, lineHeight: 1.6 },
  infoBox: { background: "rgba(96,239,255,0.05)", border: "1px solid rgba(96,239,255,0.15)", borderRadius: 10, padding: "12px 14px" },
  error: { background: "rgba(214,40,40,0.1)", border: "1px solid rgba(214,40,40,0.3)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#ff6b6b" },
  input: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 16px", fontSize: 14, color: "#f0f0f0", outline: "none", fontFamily: "inherit" },
  btn: { background: "linear-gradient(135deg,#00d4aa,#60efff)", border: "none", borderRadius: 10, padding: "13px", fontSize: 14, fontWeight: 700, color: "#080c14", cursor: "pointer", fontFamily: "inherit", marginTop: 4 },
  logoutBtn: { background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px", fontSize: 13, color: "rgba(255,255,255,0.4)", cursor: "pointer", fontFamily: "inherit" },
};
