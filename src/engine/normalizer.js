// ============================================================
// normalizer.js — Normalización de la respuesta de la AI API
// ============================================================

export function normalizeAIResponse(raw) {
  const blocks = Array.isArray(raw?.content) ? raw.content : [];
  const text = blocks
    .filter(block => block.type === "text" && typeof block.text === "string")
    .map(block => block.text)
    .join("")
    .trim();
  const truncated = raw?.stop_reason === "max_tokens";
  return { text, truncated };
}

export function extractUsage(raw) {
  return { inputTokens: raw?.usage?.input_tokens ?? 0, outputTokens: raw?.usage?.output_tokens ?? 0 };
}
