export const NO_TOKENS_MESSAGE = "Haz agotado la paciencia de Kratos, intentalo de nuevo mas tarde. (Limite de tokens alcanzado)";

export function getHttpStatus(error) {
  return typeof error?.status === "number" ? error.status : 500;
}

export function isRateLimitError(error) {
  const text = String(error?.message ?? "").toLowerCase();
  return (
    error?.status === 429 ||
    text.includes("429") ||
    text.includes("quota") ||
    text.includes("resource_exhausted") ||
    text.includes("exhausted")
  );
}
