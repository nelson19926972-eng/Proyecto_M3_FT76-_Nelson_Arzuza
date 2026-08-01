export function getHttpStatus(error) {
  return typeof error?.status === "number" ? error.status : 500;
}

export function isRateLimitError(error) {
  const text = String(error?.message ?? "");
  return error?.status === 429 || text.includes("429") || text.toLowerCase().includes("quota");
}
