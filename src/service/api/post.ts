import { request } from '../request';

/** GET /post/select-list - 岗位选择列表 */
export function fetchPostSelectList(params?: Api.Post.PostSelectParams) {
  return request<Api.Common.BackendPagingResult<Api.Post.PostSelectVO>>({
    url: '/post/select-list',
    method: 'get',
    params
  });
}

/** GET /post/page - 岗位分页列表 */
export function fetchPostPage(params: Api.Post.PostPageParams) {
  return request<Api.Post.PostPageResult>({
    url: '/post/page',
    method: 'get',
    params
  });
}

/** GET /post/view - 岗位详情 */
export function fetchPostView(id: number) {
  return request<Api.Post.PostVO>({
    url: '/post/view',
    method: 'get',
    params: { id }
  });
}

/** GET /post/enums - 岗位相关枚举列表 */
export function fetchPostEnums() {
  return request<Api.Common.EnumOption[]>({
    url: '/post/enums',
    method: 'get'
  });
}

/** POST /post/add - 新增岗位 */
export function fetchPostAdd(data: Api.Post.PostSaveVO) {
  return request<null>({
    url: '/post/add',
    method: 'post',
    data
  });
}

/** POST /post/edit - 编辑岗位 */
export function fetchPostEdit(data: Api.Post.PostEditVO) {
  return request<null>({
    url: '/post/edit',
    method: 'post',
    data
  });
}

/** POST /post/delete - 删除岗位（单参数 JSON body {id}） */
export function fetchPostDelete(id: number) {
  return request<null>({
    url: '/post/delete',
    method: 'post',
    data: { id }
  });
}

/** POST /post/sort - 批量排序岗位（无 editStatus，状态走 edit） */
export function fetchPostSort(data: Api.Post.PostSortParams) {
  return request<null>({
    url: '/post/sort',
    method: 'post',
    data
  });
}
