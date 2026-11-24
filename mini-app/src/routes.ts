import {
  createHashRouter,
  createPanel,
  createRoot,
  createView,
  RoutesConfig,
} from '@vkontakte/vk-mini-apps-router';

export const DEFAULT_ROOT = 'default_root';
export const DEFAULT_VIEW = 'default_view';

export const DEFAULT_VIEW_PANELS = {
  LEADERBOARD: 'leaderboard',
  TASKS: 'tasks',
  SHOP: 'shop',
  ADMIN: 'admin',
} as const;

export const routes = RoutesConfig.create([
  createRoot(DEFAULT_ROOT, [
    createView(DEFAULT_VIEW, [
      createPanel(DEFAULT_VIEW_PANELS.LEADERBOARD, '/', []),
      createPanel(DEFAULT_VIEW_PANELS.TASKS, `/${DEFAULT_VIEW_PANELS.TASKS}`, []),
      createPanel(DEFAULT_VIEW_PANELS.SHOP, `/${DEFAULT_VIEW_PANELS.SHOP}`, []),
      createPanel(DEFAULT_VIEW_PANELS.ADMIN, `/${DEFAULT_VIEW_PANELS.ADMIN}`, []),
    ]),
  ]),
]);

export const router = createHashRouter(routes.getRoutes());
