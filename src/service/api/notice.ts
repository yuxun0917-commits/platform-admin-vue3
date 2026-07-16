import { request } from '../request';

/** GET /notice/page - 通知分页列表 */
export function fetchNoticePage(params: Api.Notice.NoticePageParams) {
  return request<Api.Notice.NoticePageResult>({
    url: '/notice/page',
    method: 'get',
    params
  });
}

/** GET /notice/view - 通知详情 */
export function fetchNoticeView(id: number) {
  return request<Api.Notice.NoticeVO>({
    url: '/notice/view',
    method: 'get',
    params: { id }
  });
}

/** GET /notice/enums - 通知相关枚举（含状态） */
export function fetchNoticeEnums() {
  return request<Api.Notice.NoticeEnumsResult>({
    url: '/notice/enums',
    method: 'get'
  });
}

/** POST /notice/add - 新增通知 */
export function fetchNoticeAdd(data: Api.Notice.NoticeSaveVO) {
  return request<null>({
    url: '/notice/add',
    method: 'post',
    data
  });
}

/** POST /notice/edit - 编辑通知 */
export function fetchNoticeEdit(data: Api.Notice.NoticeEditVO) {
  return request<null>({
    url: '/notice/edit',
    method: 'post',
    data
  });
}

/** POST /notice/delete - 删除通知（单参数 JSON body {id}） */
export function fetchNoticeDelete(id: number) {
  return request<null>({
    url: '/notice/delete',
    method: 'post',
    data: { id }
  });
}
