import { request } from '../request';

/** GET /job/page - 定时任务分页列表 */
export function fetchJobPage(params: Api.Job.SysJobPageParams) {
  return request<Api.Job.SysJobPageResult>({
    url: '/job/page',
    method: 'get',
    params
  });
}

/** GET /job/view - 定时任务详情 */
export function fetchJobView(id: number) {
  return request<Api.Job.SysJobVO>({
    url: '/job/view',
    method: 'get',
    params: { id }
  });
}

/** GET /job/enums - 定时任务相关枚举（{ jobStatus, misfirePolicy, concurrent }） */
export function fetchJobEnums() {
  return request<Api.Job.SysJobEnums>({
    url: '/job/enums',
    method: 'get'
  });
}

/** POST /job/add - 新增定时任务 */
export function fetchJobAdd(data: Api.Job.SysJobSaveVO) {
  return request<null>({
    url: '/job/add',
    method: 'post',
    data
  });
}

/** POST /job/edit - 编辑定时任务 */
export function fetchJobEdit(data: Api.Job.SysJobEditVO) {
  return request<null>({
    url: '/job/edit',
    method: 'post',
    data
  });
}

/** POST /job/delete - 删除定时任务（@JsonCoverParam，JSON body {id}） */
export function fetchJobDelete(id: number) {
  return request<null>({
    url: '/job/delete',
    method: 'post',
    data: { id }
  });
}

/** POST /job/changeStatus - 切换任务状态（启用/暂停，@JsonCoverParam，JSON body {id}） */
export function fetchJobChangeStatus(id: number) {
  return request<null>({
    url: '/job/changeStatus',
    method: 'post',
    data: { id }
  });
}

/** POST /job/run - 立即执行一次（@JsonCoverParam，JSON body {id}） */
export function fetchJobRun(id: number) {
  return request<null>({
    url: '/job/run',
    method: 'post',
    data: { id }
  });
}
