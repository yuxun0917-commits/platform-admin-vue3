import { request } from '../request';

/** GET /role/select-list - 角色选择列表 */
export function fetchRoleSelectList(params?: Api.Role.RoleSelectParams) {
  return request<Api.Common.BackendPagingResult<Api.Role.RoleSelectVO>>({
    url: '/role/select-list',
    method: 'get',
    params
  });
}

/** GET /role/page - 角色分页列表 */
export function fetchRolePage(params: Api.Role.RolePageParams) {
  return request<Api.Role.RolePageResult>({
    url: '/role/page',
    method: 'get',
    params
  });
}

/** GET /role/view - 角色详情 */
export function fetchRoleView(id: number) {
  return request<Api.Role.RoleVO>({
    url: '/role/view',
    method: 'get',
    params: { id }
  });
}

/** GET /role/enums - 角色相关枚举列表 */
export function fetchRoleEnums() {
  return request<Api.Common.EnumOption[]>({
    url: '/role/enums',
    method: 'get'
  });
}

/** POST /role/add - 新增角色 */
export function fetchRoleAdd(data: Api.Role.RoleSaveVO) {
  return request<null>({
    url: '/role/add',
    method: 'post',
    data
  });
}

/** POST /role/edit - 编辑角色 */
export function fetchRoleEdit(data: Api.Role.RoleEditVO) {
  return request<null>({
    url: '/role/edit',
    method: 'post',
    data
  });
}

/** POST /role/delete - 删除角色（单参数 JSON body {id}） */
export function fetchRoleDelete(id: number) {
  return request<null>({
    url: '/role/delete',
    method: 'post',
    data: { id }
  });
}

/** POST /role/editStatus - 切换角色状态（单参数 JSON body {id}） */
export function fetchRoleEditStatus(id: number) {
  return request<null>({
    url: '/role/editStatus',
    method: 'post',
    data: { id }
  });
}

/** POST /role/sort - 批量排序角色 */
export function fetchRoleSort(data: Api.Role.RoleSortParams) {
  return request<null>({
    url: '/role/sort',
    method: 'post',
    data
  });
}

/** POST /role/assignMenus - 分配角色菜单 */
export function fetchRoleAssignMenus(data: Api.Role.RoleMenuAssign) {
  return request<null>({
    url: '/role/assignMenus',
    method: 'post',
    data
  });
}

/** GET /role/menuIds - 获取角色已分配菜单 id 列表 */
export function fetchRoleMenuIds(id: number) {
  return request<number[]>({
    url: '/role/menuIds',
    method: 'get',
    params: { id }
  });
}

/**
 * GET /menu/tree - 菜单树（分配菜单 / 菜单管理共用）
 *
 * 返回全量菜单树，字段对齐 Api.Menu.MenuVO（含 isHidden/isCache/isExternal 等）。
 * 早期返回 Api.Role.MenuTreeOption[]（子集），现已升级为 MenuVO 以支撑菜单管理页。
 */
export function fetchMenuTree() {
  return request<Api.Menu.MenuVO[]>({
    url: '/menu/tree',
    method: 'get'
  });
}
