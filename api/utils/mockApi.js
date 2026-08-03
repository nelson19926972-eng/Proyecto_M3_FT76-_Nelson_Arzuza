export function shouldUseMockApi(env = process.env) {
  return env?.NODE_ENV === "test" || env?.MOCK_API === "true";
}

export function getLastUserText(messages = []) {
  if (!Array.isArray(messages)) {
    return "";
  }

  const lastUserMessage = [...messages]
    .reverse()
    .find((message) => message && typeof message.role === "string" && message.role === "user");

  if (!lastUserMessage) {
    return "";
  }

  return typeof lastUserMessage.content === "string" ? lastUserMessage.content : String(lastUserMessage.content ?? "");
}

export function buildMockChatResponse({ payload, lastUserText } = {}) {
  const fallbackText = getLastUserText(payload?.messages);
  const text =
    typeof lastUserText === "string" && lastUserText.trim().length > 0
      ? lastUserText
      : fallbackText || "prueba la API mock de chat";

  const responseText = `Respuesta mock del modelo Gemini (sin llamar a Google): "${text}"`;

  return {
    id: `msg_mock_${Date.now()}`,
    type: "message",
    role: "assistant",
    content: [
      {
        type: "text",
        text: responseText,
      },
    ],
    stop_reason: "end_turn",
    usage: {
      input_tokens: estimateTokens(JSON.stringify(payload ?? {})),
      output_tokens: estimateTokens(responseText),
    },
  };
}

function estimateTokens(value) {
  return Math.max(1, Math.ceil(String(value).length / 4));
}
