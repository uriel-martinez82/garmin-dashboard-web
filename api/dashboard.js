export default async function handler(req, res) {
  try {
    const response = await fetch(
      "https://86ee-186-148-227-34.ngrok-free.app/webhook/dashboard/summary"
    );

    if (!response.ok) {
      return res.status(response.status).json({
        error: "No se pudo obtener el dashboard desde n8n",
      });
    }

    const data = await response.json();

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      error: "Error interno al consultar el dashboard",
      detail: error.message,
    });
  }
}