import { request } from '../request';

/** GET /user/page - 用户分页列表 */
export function fetchUserPage(params?: Api.User.UserPageParams) {
  return request<Api.User.UserPageResult>({
    url: '/user/page',
    method: 'get',
    params
  });
}

/** GET /user/view - 用户详情 */
export function fetchUserView(id: number) {
  return request<Api.User.UserVO>({
    url: '/user/view',
    method: 'get',
    params: { id }
  });
}

/** POST /user/add - 添加用户 */
export function fetchUserAdd(data: Api.User.UserSaveVO) {
  return request<null>({
    url: '/user/add',
    method: 'post',
    data
  });
}

/** POST /user/edit - 编辑用户基本信息 */
export function fetchUserEdit(data: Api.User.UserEditVO) {
  return request<null>({
    url: '/user/edit',
    method: 'post',
    data
  });
}

/** POST /user/delete - 删除用户（逻辑删除） */
export function fetchUserDelete(id: number) {
  return request<null>({
    url: '/user/delete',
    method: 'post',
    data: { id }
  });
}

/** POST /user/editStatus - 切换用户状态 */
export function fetchUserEditStatus(id: number) {
  return request<null>({
    url: '/user/editStatus',
    method: 'post',
    data: { id }
  });
}

/** POST /user/changePassword - 修改密码 */
export function fetchUserChangePassword(data: Api.User.UserPasswordVO) {
  return request<null>({
    url: '/user/changePassword',
    method: 'post',
    data
  });
}

/** POST /user/reset-pwd - 自主修改密码（强制改密自救，免权限、免二次认证，用户ID取自登录态） */
export function fetchUserResetPwd(data: Api.User.UserPasswordVO) {
  return request<null>({
    url: '/user/reset-pwd',
    method: 'post',
    data
  });
}

/** GET /user/enums - 用户相关枚举列表 */
export function fetchUserEnums() {
  return request<Api.User.EnumOption[]>({
    url: '/user/enums',
    method: 'get'
  });
}

/** GET /user/select-list - 用户选择列表 */
export function fetchUserSelectList(params?: Pick<Api.User.UserPageParams, 'page' | 'pageSize' | 'keyword'>) {
  return request<Api.User.UserPageResult<Api.User.UserSelectVO>>({
    url: '/user/select-list',
    method: 'get',
    params
  });
}
