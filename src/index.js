import Router from './router/index.js';
import tooltip from './components/tooltip/index.js';

tooltip.initialize();

document.body.querySelector('.sidebar__toggler').addEventListener('pointerdown', () => document.body.classList.toggle('is-collapsed-sidebar'));

const router = Router.instance();

router
  .addRoute(/^$/, 'dashboard')
  .addRoute(/^products$/, 'products/list')
  .addRoute(/^products\/add$/, 'products/edit')
  .addRoute(/^products\/([\w()-]+)$/, 'products/edit')
  .addRoute(/^sales$/, 'sales')
  .addRoute(/^categories$/, 'categories')
  .addRoute(/^404\/?$/, 'error404')
  .setNotFoundPagePath('error404')
  .listen();
