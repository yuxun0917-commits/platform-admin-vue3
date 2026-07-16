import { request } from '../request';

/** GET /jobLog/page - 任务日志分页列表（以任务维度查询，jobId 必填） */
export function fetchJobLogPage(params: Api.JobLog.SysJobLogPageParams) {
  return request<Api.JobLog.SysJobLogPageResult>({
    url: '/jobLog/page',
    method: 'get',
    params
  });
}

/** GET /jobLog/view - 任务日志详情 */
export function fetchJobLogView(id: number) {
  return request<Api.JobLog.SysJobLogVO>({
    url: '/jobLog/view',
    method: 'get',
    params: { id }
  });
}

/** POST /jobLog/delete - 删除单条日志（@JsonCoverParam，JSON body {id}） */
export function fetchJobLogDelete(id: number) {
  return request<null>({
    url: '/jobLog/delete',
    method: 'post',
    data: { id }
  });
}

/** POST /jobLog/clean - 清空指定任务日志（jobId 为普通参数，走 query） */
export function fetchJobLogClean(jobId: number) {
  return request<null>({
    url: '/jobLog/clean',
    method: 'post',
    params: { jobId }
  });
}
