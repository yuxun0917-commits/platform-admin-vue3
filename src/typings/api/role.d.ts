declare namespace Api.Role {
  /** 角色状态（0禁用 1正常） */
  type Status = Api.Common.EnableStatus;

  /** 角色选择列表 VO（id + 角色名称） */
  interface RoleSelectVO {
    /** 角色ID */
    id: number;
    /** 角色名称 */
    roleName: string;
  }

  /** 角色展示 VO */
  interface RoleVO {
    /** 角色ID */
    id: number;
    /** 角色名称 */
    roleName: string;
    /** 角色标识 */
    roleCode: string;
    /** 排序 */
    displayOrder: number;
    /** 状态（0禁用 1正常） */
    status: Api.Common.EnableStatus;
    /** 状态描述 */
    statusText?: string;
    /** 备注 */
    remark?: string;
    /** 创建时间 */
    createTime?: string;
  }

  /** 新增角色 VO */
  interface RoleSaveVO {
    /** 角色名称 */
    roleName: string;
    /** 角色标识 */
    roleCode: string;
    /** 状态（0禁用 1正常） */
    status: Api.Common.EnableStatus;
    /** 备注 */
    remark?: string;
  }

  /** 编辑角色 VO（后端仅接收 id/roleName/remark；状态走 editStatus，roleCode 不可改） */
  interface RoleEditVO {
    /** 角色ID */
    id: number;
    /** 角色名称 */
    roleName: string;
    /** 备注 */
    remark?: string;
  }

  /** 分配角色菜单 */
  interface RoleMenuAssign {
    /** 角色ID */
    roleId: number;
    /** 菜单ID列表 */
    menuIds: number[];
  }

  /** 批量排序角色 */
  interface RoleSortParams {
    /** 起始排序值 */
    startOrder: number;
    /** 按目标顺序的角色ID列表 */
    ids: number[];
  }

  /** GET /role/page 查询参数 */
  interface RolePageParams {
    /** 当前页码 */
    page: number;
    /** 每页条数 */
    pageSize: number;
    /** 关键词（模糊匹配角色名称） */
    keyword?: string;
    /** 状态（0禁用 1正常） */
    status?: Api.Common.EnableStatus;
  }

  /** GET /role/page 返回 */
  type RolePageResult<T = RoleVO> = Api.Common.BackendPagingResult<T>;

  /** 菜单树节点（来自 /menu/tree，用于分配菜单） */
  interface MenuTreeOption {
    /** 菜单ID */
    id: number;
    /** 父菜单ID */
    parentId: number;
    /** 菜单名称 */
    menuName: string;
    /** 菜单类型（1目录 2菜单 3按钮） */
    menuType: number;
    /** 路由地址 */
    path?: string;
    /** 组件路径 */
    component?: string;
    /** 图标 */
    icon?: string;
    /** 权限标识 */
    perms?: string;
    /** 排序 */
    displayOrder?: number;
    /** 状态 */
    status?: number;
    /** 状态描述 */
    statusText?: string;
    /** 菜单类型描述 */
    menuTypeText?: string;
    /** 子菜单 */
    children?: MenuTreeOption[];
  }

  /** GET /role/select-list 查询参数 */
  interface RoleSelectParams {
    /** 当前页码 */
    page?: number;
    /** 每页条数 */
    pageSize?: number;
    /** 关键词（模糊匹配角色名称） */
    keyword?: string;
  }
}
