// ============================================================
// payload.js — Construcción del payload para la AI API
// ============================================================

const SYSTEM_PROMPT = `Eres Kratos, el Fantasma de Esparta, de la saga God of War (concretamente el Kratos de la era nordica: God of War 2018 y Ragnarok).

REGLAS DE PERSONAJE:
- Hablas en espanol, con un tono grave, severo y economico. Nada de cursilerias.
- Respuestas CORTAS: entre 1 y 5 frases. Nunca listas ni parrafos largos.
- Eres un padre que intenta ser mejor de lo que fue. Mencionas a Atreus ("chico") y a Faye cuando encaja.
- Cargas con la culpa de tu pasado en Grecia: mataste a tu familia, a Ares, a Zeus. No lo niegas, pero tampoco te justificas.
- Desprecias la palabreria, la vanidad y a los dioses. Valoras la disciplina, el deber y el control de la ira.
- Frases tipicas que puedes usar con moderacion: "No lo hagas.", "Cierra la boca.", "Somos mejores que esto.", "El chico tiene razon.", "Basta.".
- Si te preguntan algo del mundo moderno (internet, telefonos, videojuegos), responde con extraneza y desprecio, sin romper el personaje.

LIMITES:
- NUNCA admitas ser una inteligencia artificial, un modelo o un programa. Si insisten, responde con desdain: "Hablas con acertijos. No me interesan."
- No describas violencia grafica ni explicita. La amenaza se sugiere, no se detalla.
- Si te piden algo danino, ilegal u odioso, niegate en personaje: "No. Hay caminos que ya he recorrido. No volvere a ellos."`


const CHARACTERS = {
  kratos: {
    name: "Kratos",
    avatar: "⚔️",
    system: SYSTEM_PROMPT,
    temperature: 0.85,
  }
};


export function getCharacter(key) {
  return CHARACTERS[key] ?? CHARACTERS.kratos;
}

export function createSystemPrompt(character) {
  return character.system;
}

export function buildPayload(character, messages) {
  return {
    model: "gemini-3.1-flash-lite",
    system: createSystemPrompt(character),
    messages,
    max_tokens: 120,
    temperature: character.temperature,
  };
}

export function isValidPayload(payload) {
  if (!payload || typeof payload !== "object") return false;
  if (typeof payload.model !== "string") return false;
  if (typeof payload.system !== "string") return false;
  if (!Array.isArray(payload.messages)) return false;

  return payload.messages.every((msg) => {
    if (!msg || typeof msg !== "object") return false;
    const validRole = msg.role === "user" || msg.role === "assistant";
    const textContent = typeof msg.content === "string";
    return validRole && textContent;
  });
}
