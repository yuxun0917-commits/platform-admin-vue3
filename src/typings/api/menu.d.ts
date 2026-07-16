declare namespace Api.Menu {
  /** 菜单类型：1目录 2菜单 3按钮 */
  type MenuType = 1 | 2 | 3;

  /** 菜单状态（0禁用 1正常） */
  type Status = Api.Common.EnableStatus;

  /** 菜单树/详情节点（GET /menu/tree、/menu/view 返回结构） */
  interface MenuVO {
    /** 菜单ID */
    id: number;
    /** 父菜单ID（0 表示根目录） */
    parentId: number;
    /** 菜单名称 */
    menuName: string;
    /** 菜单类型（1目录 2菜单 3按钮） */
    menuType: MenuType;
    /** 路由地址（相对父级） */
    path: string;
    /** 组件路径（相对 src/views，如 system/user/index） */
    component?: string;
    /** 重定向（目录用，相对父级） */
    redirect?: string;
    /** 图标（iconify 名称，如 ep:user） */
    icon?: string;
    /** 权限标识（如 system:user:list） */
    perms?: string;
    /** 显示排序 */
    displayOrder?: number;
    /** 是否隐藏（0显示 1隐藏） */
    isHidden: number;
    /** 是否缓存（0不缓存 1缓存） */
    isCache: number;
    /** 是否外链（0否 1是） */
    isExternal: number;
    /** 状态（0禁用 1正常） */
    status: Api.Common.EnableStatus;
    /** 状态描述 */
    statusText?: string;
    /** 菜单类型描述 */
    menuTypeText?: string;
    /** 创建时间 */
    createTime?: string;
    /** 子菜单 */
    children?: MenuVO[];
  }

  /** 新增 / 编辑共用字段 */
  interface MenuBaseVO {
    /** 父菜单ID（0 表示根目录） */
    parentId: number;
    /** 菜单名称 */
    menuName: string;
    /** 菜单类型（1目录 2菜单 3按钮） */
    menuType: MenuType;
    /** 路由地址（相对父级） */
    path: string;
    /** 组件路径（相对 src/views） */
    component?: string;
    /** 重定向（目录用） */
    redirect?: string;
    /** 图标（iconify 名称） */
    icon?: string;
    /** 权限标识 */
    perms?: string;
    /** 显示排序 */
    displayOrder?: number;
    /** 是否隐藏（0显示 1隐藏） */
    isHidden: number;
    /** 是否缓存（0不缓存 1缓存） */
    isCache: number;
    /** 是否外链（0否 1是） */
    isExternal: number;
    /** 状态（0禁用 1正常） */
    status: Api.Common.EnableStatus;
  }

  /** 新增菜单负载 POST /menu/add */
  type MenuSaveVO = MenuBaseVO;

  /** 编辑菜单负载 POST /menu/edit */
  interface MenuEditVO extends MenuBaseVO {
    /** 菜单ID */
    id: number;
  }

  /** 菜单排序 POST /menu/sort（按父级分组） */
  interface MenuSortParams {
    /** 父菜单ID */
    parentId: number;
    /** 该父级下按目标顺序的菜单ID列表 */
    ids: number[];
  }

  /** GET /menu/select-list 查询参数 */
  interface MenuSelectParams {
    /** 当前页码 */
    page?: number;
    /** 每页条数 */
    pageSize?: number;
    /** 关键词（模糊匹配菜单名称） */
    keyword?: string;
  }

  /** 菜单选择项（GET /menu/select-list 返回 id + 菜单名称） */
  interface MenuSelectVO {
    /** 菜单ID */
    id: number;
    /** 菜单名称 */
    menuName: string;
  }
}
