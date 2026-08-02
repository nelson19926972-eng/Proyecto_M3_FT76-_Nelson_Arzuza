import { router } from './router.js';
import { setupLinkInterception, setupMobileNav } from './navigation.js';

window.addEventListener("popstate", router);
setupLinkInterception();
setupMobileNav();
router();