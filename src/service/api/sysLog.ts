import { request } from '../request';

/** GET /sysLog/page - 操作日志分页列表 */
export function fetchSysLogPage(params: Api.SysLog.SysLogPageParams) {
  return request<Api.SysLog.SysLogPageResult>({
    url: '/sysLog/page',
    method: 'get',
    params
  });
}

/** GET /sysLog/view - 操作日志详情 */
export function fetchSysLogView(id: number) {
  return request<Api.SysLog.SysLogVO>({
    url: '/sysLog/view',
    method: 'get',
    params: { id }
  });
}

/** GET /sysLog/enums - 操作状态枚举 */
export function fetchSysLogEnums() {
  return request<Api.SysLog.SysLogStatusEnum>({
    url: '/sysLog/enums',
    method: 'get'
  });
}

/**
 * POST /sysLog/delete - 删除单条操作日志
 *
 * 后端方法标注 @JsonCoverParam，参数从 JSON 请求体按参数名解析，
 * 因此必须传 body `{ id }` 而非 query 参数。
 */
export function fetchSysLogDelete(id: number) {
  return request<null>({
    url: '/sysLog/delete',
    method: 'post',
    data: { id }
  });
}

/**
 * POST /sysLog/clean - 清空全部操作日志
 *
 * 同样标注 @JsonCoverParam，需传非空请求体（无实际参数）。
 */
export function fetchSysLogClean() {
  return request<null>({
    url: '/sysLog/clean',
    method: 'post',
    data: {}
  });
}
