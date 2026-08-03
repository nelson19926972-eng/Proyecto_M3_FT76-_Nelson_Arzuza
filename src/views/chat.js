import { callAI } from "../engine/aiClient.js";
import {
  appendAssistantMessage,
  appendUserMessage,
  getTrimmedHistory,
  resetHistory,
} from "../engine/history.js";
import { buildPayload, getCharacter } from "../engine/payload.js";

const MAX_HISTORY = 20;

export function renderChat() {
  const app = document.querySelector("#app");

  if (!app) {
    return;
  }

  let history = resetHistory();
  let isTyping = false;

  app.innerHTML = `
    <section class="chat" aria-labelledby="chat-title">
      <header class="chat__header">
        <img class="chat__avatar" src="/src/assets/img/kratos-avatar.png" alt="Retrato de Kratos" width="56" height="56" />
        <div class="chat__identity">
          <h1 class="chat__name" id="chat-title">Kratos</h1>
          <p class="chat__status">El Fantasma de Esparta &middot; God of War</p>
        </div>
        <button type="button" class="btn btn--ghost btn--sm" id="chat-reset">Reiniciar</button>
      </header>

      <div class="chat__scroll" id="chat-scroll">
        <ul class="chat__messages" id="message-list" aria-live="polite" aria-relevant="additions"></ul>
      </div>

      <p class="chat__error" id="chat-error" role="alert" hidden></p>

      <form class="composer" id="chat-form" autocomplete="off">
        <label class="sr-only" for="chat-input">Escribe tu mensaje para Kratos</label>
        <textarea
          class="composer__input"
          id="chat-input"
          name="message"
          rows="1"
          maxlength="200"
          placeholder="Preguntale algo al Fantasma de Esparta..."
        ></textarea>
        <div class="composer__actions">
          <button type="submit" class="btn btn--primary" id="chat-submit" disabled>Enviar</button>
        </div>
      </form>
    </section>
  `;

  const messageList = app.querySelector("#message-list");
  const chatScroll = app.querySelector("#chat-scroll");
  const form = app.querySelector("#chat-form");
  const input = app.querySelector("#chat-input");
  const submitButton = app.querySelector("#chat-submit");
  const errorBox = app.querySelector("#chat-error");
  const resetButton = app.querySelector("#chat-reset");

  const renderMessages = () => {
    const renderedHistory = history
      .map(
        (message) => `
          <li class="chat__message chat__message--${message.role}">
            <div class="chat__bubble">${String(message.content ?? "").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
          </li>
        `
      )
      .join("");

    const typingMarkup = isTyping
      ? `
        <li class="chat__message chat__message--assistant">
          <div class="chat__bubble chat__bubble--typing" aria-live="polite" aria-label="Kratos está escribiendo">
            <span class="typing" aria-hidden="true">
              <span class="typing__dot"></span>
              <span class="typing__dot"></span>
              <span class="typing__dot"></span>
            </span>
          </div>
        </li>
      `
      : "";

    messageList.innerHTML = renderedHistory + typingMarkup;

    if (chatScroll) {
      chatScroll.scrollTop = chatScroll.scrollHeight;
    }
  };

  const setError = (message) => {
    if (!message) {
      errorBox.hidden = true;
      errorBox.textContent = "";
      return;
    }

    errorBox.textContent = message;
    errorBox.hidden = false;
  };

  const setBusy = (busy) => {
    submitButton.disabled = busy || input.value.trim() === "";
    input.disabled = busy;
    submitButton.textContent = busy ? "Pensando..." : "Enviar";
  };

  input.addEventListener("input", () => {
    submitButton.disabled = input.value.trim() === "";
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const text = input.value.trim();
    if (!text) return;

    history = appendUserMessage(history, text);
    isTyping = true;
    renderMessages();
    input.value = "";
    setError("");
    setBusy(true);

    try {
      const payload = buildPayload(
        getCharacter("kratos"),
        getTrimmedHistory(history, MAX_HISTORY)
      );

      const response = await callAI(payload);
      const aiText =
        response?.content?.[0]?.text ||
        response?.text ||
        "No pude generar una respuesta en este momento.";

      isTyping = false;
      history = appendAssistantMessage(history, aiText);
      renderMessages();
    } catch (error) {
      isTyping = false;
      renderMessages();
      setError(error?.message || "No se pudo conectar con la IA.");
    } finally {
      setBusy(false);
      input.focus();
    }
  });

  resetButton.addEventListener("click", () => {
    history = resetHistory();
    isTyping = false;
    setError("");
    input.value = "";
    renderMessages();
    input.focus();
  });

  renderMessages();
  setBusy(false);
}

