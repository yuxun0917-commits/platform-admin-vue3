declare namespace Api.User {
  /** 用户状态：0 禁用，1 正常 */
  type Status = 0 | 1;

  /** 性别：0 未知，1 男，2 女 */
  type Gender = 0 | 1 | 2;

  /**
   * 用户展示 VO
   *
   * 与后端 `com.platform.admin.vo.user.UserVO` 字段对齐
   */
  interface UserVO {
    /** 用户ID */
    id: number;
    /** 用户名 */
    username: string;
    /** 用户昵称 */
    nickname: string;
    /** 头像URL */
    avatar?: string;
    /** 性别（0未知 1男 2女） */
    gender?: Gender;
    /** 出生日期（yyyy-MM-dd） */
    birthday?: string;
    /** 邮箱 */
    email?: string;
    /** 手机号 */
    phone?: string;
    /** 部门ID */
    deptId?: number;
    /** 部门名称 */
    deptName?: string;
    /** 岗位ID列表 */
    pIds?: number[];
    /** 角色ID列表 */
    rIds?: number[];
    /** 备注 */
    remark?: string;
    /** 状态（0禁用 1正常） */
    status: Status;
    /** 状态描述 */
    statusText?: string;
    /** 最后登录IP */
    loginIp?: string;
    /** 最后登录时间 */
    loginDate?: string;
    /** 创建时间 */
    createTime?: string;
  }

  /**
   * 用户添加 VO
   *
   * 与后端 `com.platform.admin.vo.user.UserSaveVO` 字段对齐
   */
  interface UserSaveVO {
    /** 用户名 */
    username: string;
    /** 用户昵称 */
    nickname: string;
    /** 头像URL */
    avatar?: string;
    /** 性别（0未知 1男 2女） */
    gender?: Gender;
    /** 出生日期（yyyy-MM-dd） */
    birthday?: string;
    /** 邮箱 */
    email?: string;
    /** 手机号 */
    phone?: string;
    /** 部门ID */
    deptId: number;
    /** 岗位ID列表 */
    pIds?: number[];
    /** 角色ID列表 */
    rIds?: number[];
    /** 备注 */
    remark?: string;
  }

  /**
   * 用户编辑 VO
   *
   * 与后端 `com.platform.admin.vo.user.UserEditVO` 字段对齐
   */
  interface UserEditVO {
    /** 用户ID */
    id: number;
    /** 用户昵称 */
    nickname?: string;
    /** 头像URL */
    avatar?: string;
    /** 性别（0未知 1男 2女） */
    gender?: Gender;
    /** 出生日期（yyyy-MM-dd） */
    birthday?: string;
    /** 部门ID */
    deptId?: number;
    /** 岗位ID列表 */
    pIds?: number[];
    /** 角色ID列表 */
    rIds?: number[];
    /** 备注 */
    remark?: string;
  }

  /**
   * 修改密码 VO
   *
   * 与后端 `com.platform.admin.vo.user.UserPasswordVO` 字段对齐
   */
  interface UserPasswordVO {
    /** 用户ID */
    id: number;
    /** 旧密码 */
    oldPassword: string;
    /** 新密码 */
    newPassword: string;
    /** 确认新密码 */
    confirmPassword: string;
  }

  /** 用户选择列表 VO（id + 昵称 + 部门名称） */
  interface UserSelectVO {
    /** 用户ID */
    id: number;
    /** 用户昵称 */
    nickname: string;
    /** 部门名称 */
    deptName?: string;
  }

  /** GET /user/page 查询参数 */
  interface UserPageParams {
    /** 当前页码 */
    page?: number;
    /** 每页条数 */
    pageSize?: number;
    /** 状态筛选（0禁用 1正常） */
    status?: Status;
    /** 关键词（模糊匹配昵称/部门名称） */
    keyword?: string;
  }

  /** 后端分页结果 */
  interface UserPageResult<T = UserVO> {
    /** 数据列表 */
    records: T[];
    /** 总记录数 */
    total: number;
    /** 当前页码 */
    page: number;
    /** 每页条数 */
    pageSize: number;
  }

  /** GET /user/enums 返回的枚举选项 */
  interface EnumOption {
    /** 枚举编码 */
    code: number;
    /** 枚举描述 */
    desc: string;
  }
}
