
export function renderAbout() {
    const app = document.querySelector('#app');

    app.innerHTML = `
    <section class="prose" aria-labelledby="about-title">
      <h1 class="prose__title" id="about-title">Sobre el proyecto</h1>

      <p>
        Una SPA donde fans de videojuegos pueden
        conversar con un personaje de ficcion mediante un modelo de lenguaje.
      </p>

      <h2>El personaje</h2>
      <p>
        <strong>Kratos</strong>, "El Fantasma de Esparta", protagonista de
        <em>God of War</em>. Elegimos su version nordica
        (<em>God of War</em> 2018 y <em>Ragnarok</em>): un guerrero que intenta
        contener su ira para ser mejor padre. Su voz es muy reconocible &mdash;frases
        cortas, tono grave, cero adornos&mdash;, lo que hace facil evaluar si la AI
        mantiene el personaje.
      </p>

      <h2>Como esta construido</h2>
      <ul>
        <li><strong>Frontend:</strong> JavaScript vanilla con modulos ES, sin framework.</li>
        <li><strong>Routing:</strong> History API (<code>pushState</code> + <code>popstate</code>).</li>
        <li><strong>Estilos:</strong> CSS propio, mobile-first, Flexbox y Grid con media queries.</li>
        <li><strong>Backend:</strong> Vercel Serverless Function en <code>/api/chat</code>.</li>
        <li><strong>Modelo:</strong> Google Gemini (<code>gemini-3.1-flash-lite</code>).</li>
        <li><strong>Tests:</strong> Vitest con <code>fetch</code> mockeado, sin red.</li>
      </ul>

      <h2>Seguridad de la API key</h2>
      <p>
        Todo lo que se compila al bundle del cliente es publico. Si la key estuviera
        en <code>main.js</code>, cualquiera podria extraerla desde devtools y consumir
        nuestra cuota. Por eso el navegador solo habla con <code>/api/chat</code>, y esa
        funcion &mdash;que corre en el servidor&mdash; lee la clave de
        <code>process.env.GEMINI_API_KEY</code> y anade el system prompt antes de
        llamar a Gemini.
      </p>

      <h2>Parametros del modelo</h2>
      <ul>
        <li><strong>temperature 0.85:</strong> suficiente creatividad para que suene humano sin desvariar.</li>
        <li><strong>maxOutputTokens 120:</strong> techo de longitud; ademas controla el coste.</li>
        <li><strong>Historial recortado:</strong> se envian los ultimos 10 mensajes para no inflar los tokens.</li>
        <li><strong>Rate limiting:</strong> un 429 de Gemini se traduce en un aviso claro con boton de reintento.</li>
      </ul>

      <p class="prose__cta">
        <a class="btn btn--primary" href="/chat" data-link>Ir al chat</a>
      </p>
    </section>
  `
}