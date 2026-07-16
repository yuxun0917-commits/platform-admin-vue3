declare namespace Api.Dept {
  /** 部门状态（0禁用 1正常） */
  type Status = Api.Common.EnableStatus;

  /** 部门选择列表 VO（id + 部门名称） */
  interface DeptSelectVO {
    /** 部门ID */
    id: number;
    /** 部门名称 */
    deptName: string;
  }

  /** 部门展示 VO */
  interface DeptVO {
    /** 部门ID */
    id: number;
    /** 父部门ID（0 为顶级） */
    parentId: number;
    /** 部门名称 */
    deptName: string;
    /** 负责人 */
    leader?: string;
    /** 联系电话 */
    phone?: string;
    /** 邮箱 */
    email?: string;
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
    /** 子部门 */
    children?: DeptVO[];
  }

  /** 新增部门 VO */
  interface DeptSaveVO {
    /** 父部门ID（0 为顶级） */
    parentId: number;
    /** 部门名称 */
    deptName: string;
    /** 负责人 */
    leader?: string;
    /** 联系电话 */
    phone?: string;
    /** 邮箱 */
    email?: string;
    /** 排序 */
    displayOrder: number;
    /** 状态（0禁用 1正常） */
    status: Api.Common.EnableStatus;
    /** 备注 */
    remark?: string;
  }

  /** 编辑部门 VO */
  interface DeptEditVO {
    /** 部门ID */
    id: number;
    /** 父部门ID（0 为顶级） */
    parentId: number;
    /** 部门名称 */
    deptName: string;
    /** 负责人 */
    leader?: string;
    /** 联系电话 */
    phone?: string;
    /** 邮箱 */
    email?: string;
    /** 排序 */
    displayOrder: number;
    /** 状态（0禁用 1正常） */
    status: Api.Common.EnableStatus;
    /** 备注 */
    remark?: string;
  }

  /** 批量排序部门 */
  interface DeptSortParams {
    /** 父部门ID */
    parentId: number;
    /** 按目标顺序的部门ID列表 */
    ids: number[];
  }

  /** GET /dept/select-list 查询参数 */
  interface DeptSelectParams {
    /** 当前页码 */
    page?: number;
    /** 每页条数 */
    pageSize?: number;
    /** 关键词（模糊匹配部门名称） */
    keyword?: string;
  }
}
