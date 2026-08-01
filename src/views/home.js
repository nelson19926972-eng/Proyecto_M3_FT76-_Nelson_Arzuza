
export function renderHome() {
    const app = document.querySelector('#app');

    app.innerHTML = `
    <section class="hero">
      <div class="hero__content">
        <p class="hero__eyebrow">Proyecto M3 FT76 &middot; Prueba de concepto</p>
        <h1 class="hero__title">Habla con Kratos, "El Fantasma de Esparta"</h1>
        <p class="hero__text">
          Una conversacion real con el dios de la guerra: seca, severa y sin adornos.
          Preguntale por Atreus, por los dioses del Olimpo o por el peso de su pasado.
        </p>
        <div class="hero__actions">
          <a class="btn btn--primary btn--lg" href="/chat" data-link>Empezar la conversacion</a>
          <a class="btn btn--ghost btn--lg" href="/about" data-link>Sobre el proyecto</a>
        </div>
      </div>
      <img class="hero__image" src="./src/assets/img/kratos-hero.png" alt="Ilustracion de Kratos con el hacha Leviatan" />
    </section>

    <section class="features" aria-label="Caracteristicas">
      <article class="card">
        <h2 class="card__title">Personalidad definida</h2>
        <p class="card__text">
          Un system prompt cuidado fija su tono, sus limites y su historia para que
          cada respuesta suene al personaje y no a un asistente generico.
        </p>
      </article>
      <article class="card">
        <h2 class="card__title">Clave protegida</h2>
        <p class="card__text">
          Las peticiones pasan por una Vercel Function. La API key vive en el
          servidor y el navegador nunca llega a verla.
        </p>
      </article>
      <article class="card">
        <h2 class="card__title">Sin recargas</h2>
        <p class="card__text">
          Navegacion con la History API: las tres vistas se renderizan en cliente
          manteniendo el estado de la sesion.
        </p>
      </article>
    </section>
  `
}