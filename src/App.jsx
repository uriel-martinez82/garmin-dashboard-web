import { useEffect, useState } from "react";

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = () => {
    setLoading(true);
    setError("");

    fetch("https://86ee-186-148-227-34.ngrok-free.app/webhook/dashboard/summary")
      .then((res) => {
        if (!res.ok) {
          throw new Error("No se pudo obtener el dashboard");
        }
        return res.json();
      })
      .then((json) => {
        setData(json);
        setError("");
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const summary = data?.summary;
  const latestInsight = data?.latest_insight;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Garmin Health Dashboard</h1>
        <p style={styles.subtitle}>
          Resumen de actividad, recuperación e insight generado por IA
        </p>

        <button style={styles.button} onClick={loadDashboard}>
          {loading ? "Cargando..." : "Cargar dashboard"}
        </button>

        {error && !data && <p style={styles.error}>Error: {error}</p>}

        {summary && (
          <>
            <div style={styles.grid}>
              <div style={styles.card}>
                <span style={styles.cardLabel}>Pasos promedio</span>
                <strong style={styles.cardValue}>{summary.avg_steps}</strong>
              </div>

              <div style={styles.card}>
                <span style={styles.cardLabel}>Calorías promedio</span>
                <strong style={styles.cardValue}>{summary.avg_calories}</strong>
              </div>

              <div style={styles.card}>
                <span style={styles.cardLabel}>Sueño promedio</span>
                <strong style={styles.cardValue}>
                  {summary.avg_sleep_hours} hs
                </strong>
              </div>

              <div style={styles.card}>
                <span style={styles.cardLabel}>Minutos activos</span>
                <strong style={styles.cardValue}>
                  {summary.avg_active_minutes}
                </strong>
              </div>
            </div>

            <div style={styles.insightCard}>
              <h2 style={styles.insightTitle}>Último insight</h2>
              <p style={styles.insightText}>
                {latestInsight?.insight_text || "No hay insight disponible."}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#0f172a",
    color: "#ffffff",
    padding: "40px 20px",
    fontFamily: "Arial, sans-serif",
  },
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
  },
  title: {
    fontSize: "36px",
    marginBottom: "8px",
  },
  subtitle: {
    fontSize: "18px",
    color: "#cbd5e1",
    marginBottom: "24px",
  },
  button: {
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    padding: "12px 18px",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "16px",
    marginBottom: "24px",
  },
  error: {
    color: "#fca5a5",
    fontSize: "18px",
    marginBottom: "20px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
    marginBottom: "30px",
  },
  card: {
    backgroundColor: "#1e293b",
    padding: "24px",
    borderRadius: "16px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
  },
  cardLabel: {
    display: "block",
    fontSize: "14px",
    color: "#94a3b8",
    marginBottom: "10px",
  },
  cardValue: {
    fontSize: "32px",
    fontWeight: "bold",
  },
  insightCard: {
    backgroundColor: "#1e293b",
    padding: "24px",
    borderRadius: "16px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
  },
  insightTitle: {
    marginTop: 0,
    marginBottom: "16px",
    fontSize: "24px",
  },
  insightText: {
    fontSize: "16px",
    lineHeight: 1.6,
    color: "#e2e8f0",
    whiteSpace: "pre-line",
  },
};

export default App;