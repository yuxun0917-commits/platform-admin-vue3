import { request } from '../request';

/** GET /dict/page - 字典分页列表 */
export function fetchDictPage(params: Api.Dict.DictPageParams) {
  return request<Api.Dict.DictPageResult>({
    url: '/dict/page',
    method: 'get',
    params
  });
}

/** GET /dict/view - 字典详情 */
export function fetchDictView(id: number) {
  return request<Api.Dict.DictVO>({
    url: '/dict/view',
    method: 'get',
    params: { id }
  });
}

/** GET /dict/enums - 字典相关枚举列表 */
export function fetchDictEnums() {
  return request<Api.Common.EnumOption[]>({
    url: '/dict/enums',
    method: 'get'
  });
}

/** GET /dict/select-list - 字典选择列表（id + 名称） */
export function fetchDictSelectList(params?: { page?: number; pageSize?: number; keyword?: string }) {
  return request<Api.Common.BackendPagingResult<Api.Dict.DictVO>>({
    url: '/dict/select-list',
    method: 'get',
    params
  });
}

/** POST /dict/add - 新增字典 */
export function fetchDictAdd(data: Api.Dict.DictSaveVO) {
  return request<null>({
    url: '/dict/add',
    method: 'post',
    data
  });
}

/** POST /dict/edit - 编辑字典 */
export function fetchDictEdit(data: Api.Dict.DictEditVO) {
  return request<null>({
    url: '/dict/edit',
    method: 'post',
    data
  });
}

/** POST /dict/delete - 删除字典（单参数 JSON body {id}） */
export function fetchDictDelete(id: number) {
  return request<null>({
    url: '/dict/delete',
    method: 'post',
    data: { id }
  });
}

/** GET /dictItem/page - 字典项分页列表（按 dictId 过滤） */
export function fetchDictItemPage(params: Api.Dict.DictItemPageParams) {
  return request<Api.Dict.DictItemPageResult>({
    url: '/dictItem/page',
    method: 'get',
    params
  });
}

/** GET /dictItem/view - 字典项详情 */
export function fetchDictItemView(id: number) {
  return request<Api.Dict.DictItemVO>({
    url: '/dictItem/view',
    method: 'get',
    params: { id }
  });
}

/** POST /dictItem/add - 新增字典项 */
export function fetchDictItemAdd(data: Api.Dict.DictItemSaveVO) {
  return request<null>({
    url: '/dictItem/add',
    method: 'post',
    data
  });
}

/** POST /dictItem/edit - 编辑字典项 */
export function fetchDictItemEdit(data: Api.Dict.DictItemEditVO) {
  return request<null>({
    url: '/dictItem/edit',
    method: 'post',
    data
  });
}

/** POST /dictItem/delete - 删除字典项（单参数 JSON body {id}） */
export function fetchDictItemDelete(id: number) {
  return request<null>({
    url: '/dictItem/delete',
    method: 'post',
    data: { id }
  });
}
