import { request } from '../request';

/** GET /sysConfig/page - 参数配置分页列表 */
export function fetchSysConfigPage(params: Api.SysConfig.SysConfigPageParams) {
  return request<Api.SysConfig.SysConfigPageResult>({
    url: '/sysConfig/page',
    method: 'get',
    params
  });
}

/** GET /sysConfig/view - 参数配置详情 */
export function fetchSysConfigView(id: number) {
  return request<Api.SysConfig.SysConfigVO>({
    url: '/sysConfig/view',
    method: 'get',
    params: { id }
  });
}

/** GET /sysConfig/enums - 枚举（是否内置） */
export function fetchSysConfigEnums() {
  return request<Api.SysConfig.SysConfigEnums>({
    url: '/sysConfig/enums',
    method: 'get'
  });
}

/** POST /sysConfig/add - 新增参数配置 */
export function fetchSysConfigAdd(data: Api.SysConfig.SysConfigSaveVO) {
  return request<null>({
    url: '/sysConfig/add',
    method: 'post',
    data
  });
}

/** POST /sysConfig/edit - 编辑参数配置 */
export function fetchSysConfigEdit(data: Api.SysConfig.SysConfigEditVO) {
  return request<null>({
    url: '/sysConfig/edit',
    method: 'post',
    data
  });
}

/** POST /sysConfig/delete - 删除参数配置（单参数 JSON body {id}） */
export function fetchSysConfigDelete(id: number) {
  return request<null>({
    url: '/sysConfig/delete',
    method: 'post',
    data: { id }
  });
}
