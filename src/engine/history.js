// ============================================================
// history.js — Gestión del historial de conversación
// ============================================================

const STORAGE_KEY = "kratos_chat_history";

// --- Helpers internos de persistencia ---
function saveToStorage(messages) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch (error) {
    console.error("No se pudo guardar el historial:", error);
  }
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error("No se pudo leer el historial guardado:", error);
    return [];
  }
}

// --- API pública ---
export function appendUserMessage(messages, text) {
  const updated = [...messages, { role: "user", content: text }];
  saveToStorage(updated);
  return updated;
}

export function appendAssistantMessage(messages, text) {
  const updated = [...messages, { role: "assistant", content: text }];
  saveToStorage(updated);
  return updated;
}

export function getTrimmedHistory(messages, maxTurns = 10) {
  return messages.slice(-maxTurns);
}

// Ahora carga lo que haya en localStorage al iniciar el chat
export function resetHistory() {
  return loadFromStorage();
}

// Limpia el historial por completo (para el botón "Reiniciar")
export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
  return [];
}
