import type { RouteComponent, RouteRecordRaw } from 'vue-router';
import type { RouteKey, RoutePath } from '@elegant-router/types';
import { useSvgIcon } from '@/hooks/common/icon';
import { $t } from '@/locales';
import BaseLayout from '@/layouts/base-layout/index.vue';

/**
 * Transform backend menu tree (MenuTreeVO) into Vue routes and global menus.
 *
 * Backend convention (see sql/platform_db.sql `sys_menu`):
 * - menuType: 1 directory, 2 menu, 3 button
 * - path: vue-router path, RELATIVE to parent (e.g. "user" under directory "system" => "/system/user")
 * - component: view path relative to src/views, e.g. "system/user/index" => src/views/system/user/index.vue
 * - isHidden: 0 shown, 1 hidden
 * - isCache: 1 cache, 0 not
 * - isExternal: 1 external link
 * - buttons (menuType === 3) are dropped from routing/menus
 */

/**
 * All view files under src/views.
 *
 * NOTE: Vite resolves the glob pattern and returns keys as **project-root-absolute**
 * paths, e.g. `/src/views/system/user/index.vue` — NOT `@/views/...`. Matching against
 * `@/views/...` keys would therefore never hit. We normalize every key below so lookups
 * are prefix-agnostic.
 */
const viewModules = import.meta.glob('/src/views/**/*.vue');

/**
 * Normalize a raw path/component string to a canonical form for matching:
 * strip the `@/views/` or `/src/views/` (or leading `/`) prefix, the `.vue` suffix,
 * and a trailing `/index`. e.g.
 *   "/src/views/system/user/index.vue" -> "system/user"
 *   "system/user/index"                -> "system/user"
 *   "system/user"                      -> "system/user"
 */
function normalizeViewPath(value: string): string {
  return value
    .replace(/^@\/views\//, '')
    .replace(/^\/src\/views\//, '')
    .replace(/^\/+/, '')
    .replace(/\.vue$/, '')
    .replace(/\/index$/, '');
}

/** canonical view path (e.g. "system/user") -> lazy loader */
const viewMap: Record<string, RouteComponent> = {};
for (const key of Object.keys(viewModules)) {
  viewMap[normalizeViewPath(key)] = viewModules[key] as RouteComponent;
}

/**
 * Resolve a backend component string to a lazy Vue component.
 *
 * The backend `component` may be written several equivalent ways, e.g.
 *   "system/user/index" | "system/user" | "manage/user/index" | "user/index" | "user".
 * We normalize it and try a few common top-level prefix strips against the view map.
 *
 * Returns `undefined` when no matching view file exists (strict matching — no fuzzy /
 * last-segment guessing, and no coming-soon fallback). In that case the route is still
 * registered and the sidebar entry still shows, but no page component is mounted.
 */
function resolveViewComponent(component?: string | null): RouteComponent | undefined {
  if (!component) return undefined;

  const raw = normalizeViewPath(component);

  const variants = new Set<string>([raw]);

  // strip common top-level prefixes the backend may prepend
  for (const prefix of ['system/', 'manage/', 'module/', 'modules/', 'admin/', 'views/', 'web/']) {
    if (raw.startsWith(prefix)) variants.add(raw.slice(prefix.length));
  }

  for (const v of variants) {
    if (v && viewMap[v]) return viewMap[v];
  }

  // eslint-disable-next-line no-console
  console.error(`[backend-menu] 未找到视图组件: component="${component}"`);

  return undefined;
}

/** Build an absolute vue-router path from parent path + node path */
function normalizePath(parentPath: string, path: string): string {
  if (!path) return parentPath;

  // already absolute
  if (path.startsWith('/')) return path;

  const base = parentPath.endsWith('/') ? parentPath.slice(0, -1) : parentPath;

  return `${base}/${path}`;
}

/** Derive a route name from an absolute path, e.g. "/system/user" => "system_user" */
function routeNameFromPath(fullPath: string): string {
  return fullPath.replace(/^\//, '').replace(/\//g, '_') || 'root';
}

/** Build a single Vue route from a backend menu node (recursive) */
function buildRoute(menu: Api.Auth.MenuTree, parentPath: string): RouteRecordRaw | null {
  // buttons are not routes
  if (menu.menuType === 3) return null;
  // hidden menus are excluded entirely
  if (menu.isHidden === 1) return null;

  const fullPath = normalizePath(parentPath, menu.path);
  const name = routeNameFromPath(fullPath);
  const isDir = menu.menuType === 1;

  const route: Record<string, unknown> = {
    path: fullPath,
    name,
    meta: {
      title: menu.menuName,
      icon: menu.icon || undefined,
      order: menu.displayOrder ?? 0,
      keepAlive: menu.isCache === 1,
      constant: false,
      hideInMenu: menu.isHidden === 1
    }
  };

  if (isDir) {
    route.component = BaseLayout;

    if (menu.redirect) {
      route.redirect = normalizePath(fullPath, menu.redirect);
    }
  } else {
    const comp = resolveViewComponent(menu.component);
    // 命中不到 component：仍注册路由并保留侧边菜单，但不挂载页面组件（不渲染具体页面）
    if (comp) {
      route.component = comp;
    }
  }

  if (menu.isExternal === 1) {
    route.meta = { ...(route.meta as Record<string, unknown>), href: fullPath };
  }

  if (menu.children?.length) {
    const childRoutes = menu.children
      .map(child => buildRoute(child, fullPath))
      .filter((item): item is RouteRecordRaw => item !== null);

    if (childRoutes.length) route.children = childRoutes;
  }

  return route as unknown as RouteRecordRaw;
}

/** Build global sidebar menu from a backend menu node (recursive) */
function buildGlobalMenu(menu: Api.Auth.MenuTree, parentPath: string, parentDisabled = false): App.Global.Menu | null {
  if (menu.menuType === 3) return null;
  if (menu.isHidden === 1) return null;

  // 菜单状态为 0（禁用）或父级已禁用时，该节点及整条子树一并禁用（置灰、不可跳转）。
  const disabled = parentDisabled || menu.status === 0;

  const fullPath = normalizePath(parentPath, menu.path);
  const name = routeNameFromPath(fullPath);

  const { SvgIconVNode } = useSvgIcon();

  const menuItem: App.Global.Menu = {
    key: name,
    label: menu.menuName,
    routeKey: name as unknown as RouteKey,
    routePath: fullPath as unknown as RoutePath,
    icon: SvgIconVNode({ icon: menu.icon || import.meta.env.VITE_MENU_ICON, fontSize: 20 }),
    title: menu.menuName,
    disabled
  };

  if (menu.children?.length) {
    const childMenus = menu.children
      .map(child => buildGlobalMenu(child, fullPath, disabled))
      .filter((item): item is App.Global.Menu => item !== null);

    if (childMenus.length) menuItem.children = childMenus;
  }

  return menuItem;
}

/** Transform backend menu tree to Vue routes */
export function transformMenusToRoutes(menus: Api.Auth.MenuTree[]): RouteRecordRaw[] {
  return menus.map(menu => buildRoute(menu, '')).filter((item): item is RouteRecordRaw => item !== null);
}

/** Transform backend menu tree to global sidebar menus */
export function transformMenusToGlobalMenus(menus: Api.Auth.MenuTree[]): App.Global.Menu[] {
  return menus.map(menu => buildGlobalMenu(menu, '')).filter((item): item is App.Global.Menu => item !== null);
}

/**
 * Build the dashboard (home) menu entry.
 *
 * The dashboard is the landing page and, per product requirements, must always be
 * shown in the sidebar without permission gating and must appear as the FIRST item —
 * ahead of the backend-driven menu tree. Its route is registered independently by the
 * static auth routes, so this only contributes the sidebar node.
 */
export function buildDashboardMenu(): App.Global.Menu {
  const { SvgIconVNode } = useSvgIcon();
  const label = $t('route.dashboard');

  return {
    key: 'dashboard',
    label,
    routeKey: 'dashboard' as unknown as RouteKey,
    routePath: '/dashboard' as unknown as RoutePath,
    icon: SvgIconVNode({ icon: 'ep:odometer', fontSize: 20 }),
    title: label
  };
}

/**
 * Recursively sort a backend menu tree by `displayOrder` (ascending).
 *
 * The static/dynamic auth routes are sorted by `meta.order` via `sortRoutesByOrder`
 * and `getGlobalMenusByAuthRoutes`, but the backend-menu path did not sort, so the
 * sidebar rendered in the (unsorted) backend-returned order. This makes the sidebar
 * follow the same `displayOrder` the backend defines, for both top-level and nested
 * menus (directories, their children, etc.).
 */
export function sortMenuTree(menus: Api.Auth.MenuTree[]): Api.Auth.MenuTree[] {
  return [...menus]
    .sort((a, b) => (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0))
    .map(menu => {
      if (menu.children?.length) {
        return { ...menu, children: sortMenuTree(menu.children) };
      }
      return menu;
    });
}
