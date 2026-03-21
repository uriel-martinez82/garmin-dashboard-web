const N8N_BASE = "https://86ee-186-148-227-34.ngrok-free.app/webhook";
// En producción reemplazar por la URL fija de n8n

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function register({ email, password, full_name }) {
  const res = await fetch(`${N8N_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, full_name }),
  });
  return res.json();
}

export async function login({ email, password }) {
  const res = await fetch(`${N8N_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function linkGarmin({ garmin_email, garmin_password, token }) {
  const res = await fetch(`${N8N_BASE}/auth/link-garmin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ garmin_email, garmin_password }),
  });
  return res.json();
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function fetchDashboard() {
  const res = await fetch(`${N8N_BASE}/dashboard/summary`);
  return res.json();
}
