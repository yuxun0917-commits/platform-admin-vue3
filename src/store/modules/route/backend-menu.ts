import type { RouteComponent, RouteRecordRaw } from 'vue-router';
import type { RouteKey, RoutePath } from '@elegant-router/types';
import { useSvgIcon } from '@/hooks/common/icon';
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

/** All view files under src/views, keyed by '@/views/...' path */
const viewModules = import.meta.glob('@/views/**/*.vue');
const viewKeys = Object.keys(viewModules);

/** Fallback component for menus whose view file has not been built yet */
function comingSoon(): RouteComponent {
  return () => import('@/views/_builtin/coming-soon/index.vue');
}

/**
 * Build candidate view module keys from a backend component string.
 *
 * The backend `component` may be written in several equivalent ways, e.g.
 *   "system/user/index" | "system/user" | "manage/user/index" | "user/index" | "user"
 * We try them all, plus a fuzzy match on the last meaningful path segment,
 * so the frontend view is located regardless of the exact prefix the backend
 * menu table uses.
 */
function buildComponentCandidates(component?: string | null): string[] {
  if (!component) return [];

  const raw = component
    .replace(/^@\/views\//, '')
    .replace(/^\/+/, '')
    .replace(/\.vue$/, '');

  const variants = new Set<string>([raw]);

  // strip common top-level prefixes the backend may prepend
  for (const prefix of ['system/', 'manage/', 'module/', 'modules/', 'admin/', 'views/', 'web/']) {
    if (raw.startsWith(prefix)) variants.add(raw.slice(prefix.length));
  }

  const keys: string[] = [];
  for (const v of variants) {
    if (v) {
      keys.push(`@/views/${v}.vue`);
      keys.push(`@/views/${v}/index.vue`);
    }
  }

  // fuzzy: match by the last non-"index" segment, e.g. "system/user/index" -> "user"
  const lastName = raw
    .split('/')
    .filter(Boolean)
    .filter(s => s !== 'index')
    .pop();

  if (lastName) {
    for (const k of viewKeys) {
      if (k.endsWith(`/${lastName}/index.vue`) || k.endsWith(`/${lastName}.vue`)) {
        keys.push(k);
      }
    }
  }

  return keys;
}

/**
 * Resolve a backend component string to a lazy Vue component.
 */
function resolveViewComponent(component?: string | null): RouteComponent {
  const candidates = buildComponentCandidates(component);

  for (const key of candidates) {
    const loader = viewModules[key];
    if (loader) return loader as RouteComponent;
  }

  if (component) {
    // eslint-disable-next-line no-console
    console.warn(`[backend-menu] 未找到视图组件: component="${component}"`);
  }

  return comingSoon();
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
    route.component = resolveViewComponent(menu.component);
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
function buildGlobalMenu(menu: Api.Auth.MenuTree, parentPath: string): App.Global.Menu | null {
  if (menu.menuType === 3) return null;
  if (menu.isHidden === 1) return null;

  const fullPath = normalizePath(parentPath, menu.path);
  const name = routeNameFromPath(fullPath);

  const { SvgIconVNode } = useSvgIcon();

  const menuItem: App.Global.Menu = {
    key: name,
    label: menu.menuName,
    routeKey: name as unknown as RouteKey,
    routePath: fullPath as unknown as RoutePath,
    icon: SvgIconVNode({ icon: menu.icon || import.meta.env.VITE_MENU_ICON, fontSize: 20 }),
    title: menu.menuName
  };

  if (menu.children?.length) {
    const childMenus = menu.children
      .map(child => buildGlobalMenu(child, fullPath))
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
