// ============================================================
// history.js — Gestión del historial de conversación
// ============================================================
export function appendUserMessage(messages, text) {
  return [...messages, { role: "user", content: text }]
}


export function appendAssistantMessage(messages, text) {
  return [...messages, { role: "assistant", content: text }];
}


export function getTrimmedHistory(messages, maxTurns = 10) {
  return messages.slice(-maxTurns);
}


export function resetHistory() {
  return [];
}
