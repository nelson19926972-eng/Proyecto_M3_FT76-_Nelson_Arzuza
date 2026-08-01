export function notFoundView() {
    const app = document.querySelector('#app');

    app.innerHTML = `
    <section class="prose" aria-labelledby="nf-title">
      <h1 class="prose__title" id="nf-title">404 &mdash; Ruta no encontrada</h1>
      <p>Ese camino no existe. Vuelve al principio.</p>
      <p class="prose__cta"><a class="btn btn--primary" href="/" data-link>Volver al inicio</a></p>
    </section>
  `
}