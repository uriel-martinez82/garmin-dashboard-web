const N8N_BASE = "/n8n";

const HEADERS = {
  "Content-Type": "application/json",
  "ngrok-skip-browser-warning": "true",
};

export async function register({ email, password, full_name }) {
  const res = await fetch(`${N8N_BASE}/auth/register`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ email, password, full_name }),
  });
  return res.json();
}

export async function login({ email, password }) {
  const res = await fetch(`${N8N_BASE}/auth/login`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function linkGarmin({ garmin_email, garmin_password, token }) {
  const res = await fetch(`${N8N_BASE}/auth/link-garmin`, {
    method: "POST",
    headers: { ...HEADERS, "Authorization": `Bearer ${token}` },
    body: JSON.stringify({ garmin_email, garmin_password }),
  });
  return res.json();
}

export async function fetchDashboard() {
  const res = await fetch(`${N8N_BASE}/dashboard/summary`, {
    headers: HEADERS,
  });
  return res.json();
}