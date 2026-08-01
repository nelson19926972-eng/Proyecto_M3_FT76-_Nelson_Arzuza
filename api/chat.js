/**
 * Vercel Serverless Function que actua como proxy seguro hacia Google Gemini.
 *
 * Por que existe este archivo:
 * la API key NUNCA puede vivir en el frontend, porque cualquier persona podria
 * abrir devtools, copiarla y gastar nuestra cuota. Este handler corre en el
 * servidor de Vercel, lee la key desde process.env y el navegador solo ve /api/chat.
 */

const GEMINI_MODEL = "gemini-3.5-flash-lite"
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

// System prompt: define la personalidad del personaje.
// Se envia en cada peticion porque la API de Gemini no guarda estado.
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

// Limite defensivo de historial: mas mensajes = mas tokens = mas coste y mas
// riesgo de rate limiting. Nos quedamos con los ultimos turnos de conversacion.
const MAX_HISTORY_MESSAGES = 10
const MAX_MESSAGE_LENGTH = 250
/**
 * Valida el cuerpo de la peticion que llega del cliente.
 * Nunca confiamos en el frontend: cualquiera puede hacer un POST a mano.
 */
export function validateMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return { valid: false, error: "Se requiere un array 'messages' con al menos un mensaje." }
  }

  for (const message of messages) {
    if (!message || typeof message !== "object") {
      return { valid: false, error: "Cada mensaje debe ser un objeto." }
    }
    if (message.role !== "user" && message.role !== "assistant") {
      return { valid: false, error: "El campo 'role' debe ser 'user' o 'assistant'." }
    }
    if (typeof message.content !== "string" || message.content.trim() === "") {
      return { valid: false, error: "El campo 'content' debe ser un texto no vacio." }
    }
    if (message.content.length > MAX_MESSAGE_LENGTH) {
      return { valid: false, error: `Los mensajes no pueden superar ${MAX_MESSAGE_LENGTH} caracteres.` }
    }
  }

  return { valid: true }
}

/**
 * Transforma nuestro formato interno ({role: 'assistant'}) al formato que
 * espera Gemini ({role: 'model', parts: [{text}]}).
 */
export function toGeminiContents(messages) {
  return messages.slice(-MAX_HISTORY_MESSAGES).map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  }))
}

/**
 * Extrae el texto de la respuesta de Gemini navegando el JSON con cuidado.
 * La estructura es candidates[0].content.parts[].text, pero cualquier nivel
 * puede faltar si el modelo bloquea la respuesta.
 */
export function extractReply(data) {
  const parts = data?.candidates?.[0]?.content?.parts
  if (!Array.isArray(parts)) return ""

  return parts
    .map((part) => part?.text ?? "")
    .join("")
    .trim()
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo no permitido. Usa POST." })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(500).json({
      error: "El servidor no tiene configurada GEMINI_API_KEY. Revisa las variables de entorno.",
    })
  }

  // El body puede venir ya parseado (Vercel) o como string (otros runtimes).
  let body = req.body
  if (typeof body === "string") {
    try {
      body = JSON.parse(body)
    } catch {
      return res.status(400).json({ error: "El cuerpo de la peticion no es JSON valido." })
    }
  }

  const { messages } = body ?? {}
  const validation = validateMessages(messages)
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error })
  }

  try {
    const geminiResponse = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: toGeminiContents(messages),
        generationConfig: {
          // temperature media-alta: queremos personalidad, no un manual tecnico.
          temperature: 0.85,
          topP: 0.95,
          // Techo de tokens de salida: fuerza respuestas breves y controla el coste.
          maxOutputTokens: 150,
          // Los modelos Gemini 3 razonan antes de responder y ese razonamiento
          // consume tokens de salida. Para un chat de personaje no aporta nada
          // y podria agotar los 150 tokens antes de escribir la respuesta.
          thinkingConfig: { thinkingLevel: "low" },
        },
      }),
    })

    if (!geminiResponse.ok) {
      const detail = await geminiResponse.text()
      console.error("[api/chat] Error de Gemini:", geminiResponse.status, detail)

      if (geminiResponse.status === 429) {
        return res.status(429).json({
          error: "Demasiadas peticiones seguidas (rate limit). Espera unos segundos e intentalo de nuevo.",
        })
      }
      if (geminiResponse.status === 400 || geminiResponse.status === 403) {
        return res.status(502).json({ error: "La API key de Gemini es invalida o no tiene permisos." })
      }
      return res.status(502).json({ error: "El servicio de AI no esta disponible ahora mismo." })
    }

    const data = await geminiResponse.json()
    const reply = extractReply(data)

    if (!reply) {
      return res.status(502).json({ error: "Kratos guarda silencio. Reformula tu pregunta." })
    }

    return res.status(200).json({ reply })
  } catch (error) {
    console.error("[api/chat] Error inesperado:", error)
    return res.status(500).json({ error: "Error interno al contactar con el servicio de AI." })
  }
}
