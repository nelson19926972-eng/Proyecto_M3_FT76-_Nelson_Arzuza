import { renderHome } from './views/home.js';
import { renderChat } from './views/chat.js';
import { renderAbout } from './views/about.js';
import { notFoundView } from './views/notFound.js';


const routes = {
    "/": renderHome,
    "/chat": renderChat,
    "/about": renderAbout,
};

export function router() {
    const raw = window.location.pathname;
    const path = normalizePath(raw);
    const render = routes[path] || notFoundView;
    render();
    updateActiveNav(path);
}

function normalizePath(path) {
  return path.length > 1 ? path.replace(/\/$/, "") : path;
}


function updateActiveNav(path) {
    const links = document.querySelectorAll(".nav__link");

    links.forEach((link) => {
        const href = normalizePath(link.getAttribute("href") || "/");
        const isActive = href === path;
        link.classList.toggle("is-active", isActive);
    });
}

export function navigateTo(path) {
  const currentPath = normalizePath(window.location.pathname);
  const nextPath = normalizePath(path);
  if (currentPath === nextPath) return;
  history.pushState(null, "", nextPath);
  router();
}