export async function callAI(payload) {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const err = new Error(data.error || `HTTP ${response.status}`);
      err.status = response.status;
      err.retryAfterSeconds = data.retryAfterSeconds;
      throw err;
    }

    return data;
  } catch (error) {
    if (error instanceof TypeError) {
      const err = new Error(
        "El servidor no está activo. Ejecuta: >>npm run local<< antes de usar el chat."
      );
      err.status = 503;
      throw err;
    }

    throw error;
  }
}