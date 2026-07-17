import { request } from '../request';

/** GET /storage-config/page - 存储配置分页列表 */
export function fetchStorageConfigPage(params?: Api.StorageConfig.ConfigPageParams) {
  return request<Api.StorageConfig.ConfigPageResult>({
    url: '/storage-config/page',
    method: 'get',
    params
  });
}

/** GET /storage-config/view - 存储配置详情(密钥脱敏) */
export function fetchStorageConfigView(id: number) {
  return request<Api.StorageConfig.ConfigVO>({
    url: '/storage-config/view',
    method: 'get',
    params: { id }
  });
}

/** POST /storage-config/add - 新增存储配置 */
export function fetchStorageConfigAdd(data: Api.StorageConfig.ConfigSaveVO) {
  return request<null>({
    url: '/storage-config/add',
    method: 'post',
    data
  });
}

/** POST /storage-config/edit - 编辑存储配置 */
export function fetchStorageConfigEdit(data: Api.StorageConfig.ConfigEditVO) {
  return request<null>({
    url: '/storage-config/edit',
    method: 'post',
    data
  });
}

/** POST /storage-config/delete - 删除存储配置(逻辑删除，@JsonCoverParam id) */
export function fetchStorageConfigDelete(id: number) {
  return request<null>({
    url: '/storage-config/delete',
    method: 'post',
    data: { id }
  });
}

/** POST /storage-config/set-default - 设为默认存储(id 走 query 参数) */
export function fetchStorageConfigSetDefault(id: number) {
  return request<null>({
    url: '/storage-config/set-default',
    method: 'post',
    params: { id }
  });
}

/** POST /storage-config/edit-status - 启停存储配置(id/status 走 query 参数) */
export function fetchStorageConfigEditStatus(id: number, status: number) {
  return request<null>({
    url: '/storage-config/edit-status',
    method: 'post',
    params: { id, status }
  });
}

/** GET /storage-config/enums - 存储类型与状态枚举 */
export function fetchStorageConfigEnums() {
  return request<Api.StorageConfig.ConfigEnums>({
    url: '/storage-config/enums',
    method: 'get'
  });
}

/** GET /storage-config/select-list - 存储配置选择列表(id+名称)，用于上传时选择存储 */
export function fetchStorageConfigSelectList(params?: { page?: number; pageSize?: number; keyword?: string }) {
  return request<Api.Common.BackendPagingResult<Api.StorageConfig.ConfigVO>>({
    url: '/storage-config/select-list',
    method: 'get',
    params
  });
}
