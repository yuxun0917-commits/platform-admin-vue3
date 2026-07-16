import { request } from '../request';

/**
 * 注意：/menu/tree 的 fetchMenuTree 已在 role.ts 中导出（分配菜单页复用），
 * 本模块不再重复导出，避免与 role.ts 的 fetchMenuTree 产生命名冲突。
 */

/** GET /menu/view - 菜单详情 */
export function fetchMenuView(id: number) {
  return request<Api.Menu.MenuVO>({
    url: '/menu/view',
    method: 'get',
    params: { id }
  });
}

/** POST /menu/add - 新增菜单 */
export function fetchMenuAdd(data: Api.Menu.MenuSaveVO) {
  return request<null>({
    url: '/menu/add',
    method: 'post',
    data
  });
}

/** POST /menu/edit - 编辑菜单 */
export function fetchMenuEdit(data: Api.Menu.MenuEditVO) {
  return request<null>({
    url: '/menu/edit',
    method: 'post',
    data
  });
}

/** POST /menu/delete - 删除菜单（单参数 JSON body {id}） */
export function fetchMenuDelete(id: number) {
  return request<null>({
    url: '/menu/delete',
    method: 'post',
    data: { id }
  });
}

/** POST /menu/editStatus - 切换菜单状态（单参数 JSON body {id}） */
export function fetchMenuEditStatus(id: number) {
  return request<null>({
    url: '/menu/editStatus',
    method: 'post',
    data: { id }
  });
}

/** POST /menu/sort - 菜单排序（按父级分组） */
export function fetchMenuSort(data: Api.Menu.MenuSortParams) {
  return request<null>({
    url: '/menu/sort',
    method: 'post',
    data
  });
}
