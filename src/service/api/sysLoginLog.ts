import { request } from '../request';

/** GET /sysLoginLog/page - 登录日志分页列表 */
export function fetchSysLoginLogPage(params: Api.SysLoginLog.SysLoginLogPageParams) {
  return request<Api.SysLoginLog.SysLoginLogPageResult>({
    url: '/sysLoginLog/page',
    method: 'get',
    params
  });
}

/** GET /sysLoginLog/view - 登录日志详情 */
export function fetchSysLoginLogView(id: number) {
  return request<Api.SysLoginLog.SysLoginLogVO>({
    url: '/sysLoginLog/view',
    method: 'get',
    params: { id }
  });
}

/** GET /sysLoginLog/enums - 登录类型 / 登录状态枚举（返回对象 {loginType, status}） */
export function fetchSysLoginLogEnums() {
  return request<Api.SysLoginLog.SysLoginLogEnums>({
    url: '/sysLoginLog/enums',
    method: 'get'
  });
}

/**
 * POST /sysLoginLog/delete - 删除单条登录日志
 *
 * 后端方法标注 @JsonCoverParam，参数从 JSON 请求体按参数名解析，
 * 因此必须传 body `{ id }` 而非 query 参数（否则报「请求体格式错误」）。
 */
export function fetchSysLoginLogDelete(id: number) {
  return request<null>({
    url: '/sysLoginLog/delete',
    method: 'post',
    data: { id }
  });
}

/**
 * POST /sysLoginLog/clean - 清空全部登录日志
 *
 * 同样标注 @JsonCoverParam，需传非空请求体（无实际参数）。
 */
export function fetchSysLoginLogClean() {
  return request<null>({
    url: '/sysLoginLog/clean',
    method: 'post',
    data: {}
  });
}
