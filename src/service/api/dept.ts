import { request } from '../request';

/** GET /dept/select-list - 部门选择列表（原用户模块/角色模块已使用） */
export function fetchDeptSelectList(params?: Api.Dept.DeptSelectParams) {
  return request<Api.Common.BackendPagingResult<Api.Dept.DeptSelectVO>>({
    url: '/dept/select-list',
    method: 'get',
    params
  });
}

/** GET /dept/tree - 部门树（部门管理 / 选择器共用） */
export function fetchDeptTree() {
  return request<Api.Dept.DeptVO[]>({
    url: '/dept/tree',
    method: 'get'
  });
}

/** GET /dept/view - 部门详情 */
export function fetchDeptView(id: number) {
  return request<Api.Dept.DeptVO>({
    url: '/dept/view',
    method: 'get',
    params: { id }
  });
}

/** GET /dept/enums - 部门相关枚举列表（状态） */
export function fetchDeptEnums() {
  return request<Api.Common.EnumOption[]>({
    url: '/dept/enums',
    method: 'get'
  });
}

/** POST /dept/add - 新增部门 */
export function fetchDeptAdd(data: Api.Dept.DeptSaveVO) {
  return request<null>({
    url: '/dept/add',
    method: 'post',
    data
  });
}

/** POST /dept/edit - 编辑部门 */
export function fetchDeptEdit(data: Api.Dept.DeptEditVO) {
  return request<null>({
    url: '/dept/edit',
    method: 'post',
    data
  });
}

/** POST /dept/delete - 删除部门（单参数 JSON body {id}） */
export function fetchDeptDelete(id: number) {
  return request<null>({
    url: '/dept/delete',
    method: 'post',
    data: { id }
  });
}

/** POST /dept/editStatus - 切换部门状态（单参数 JSON body {id}） */
export function fetchDeptEditStatus(id: number) {
  return request<null>({
    url: '/dept/editStatus',
    method: 'post',
    data: { id }
  });
}

/** POST /dept/sort - 批量排序部门（同 parentId 内） */
export function fetchDeptSort(data: Api.Dept.DeptSortParams) {
  return request<null>({
    url: '/dept/sort',
    method: 'post',
    data
  });
}
