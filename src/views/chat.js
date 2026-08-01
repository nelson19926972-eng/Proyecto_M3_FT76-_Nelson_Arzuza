
export function renderChat() {
    const app = document.querySelector('#app');

    app.innerHTML = `
    <section class="chat" aria-labelledby="chat-title">
      <header class="chat__header">
        <img class="chat__avatar" src="./src/assets/img/kratos-avatar.png" alt="Retrato de Kratos" width="56" height="56" />
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
          maxlength=200
          placeholder="Preguntale algo al Fantasma de Esparta..."
        ></textarea>
        <div class="composer__actions">
          <button type="submit" class="btn btn--primary" id="chat-submit" disabled>Enviar</button>
        </div>
      </form>
    </section>
  `
}

