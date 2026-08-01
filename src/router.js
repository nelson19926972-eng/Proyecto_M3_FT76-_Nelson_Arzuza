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
}

function normalizePath(path) {
    return path.length > 1 ? path.replace(/\/$/, "") : path;
}


export function navigateTo(path) {
    if (window.location.pathname === path) return;
    history.pushState(null, "", path);
    router();
}