declare namespace Api.Dict {
  /** 状态（0禁用 1正常） */
  type Status = Api.Common.EnableStatus;

  /** 字典类型 VO */
  interface DictVO {
    /** 字典ID */
    id: number;
    /** 字典名称 */
    dictName: string;
    /** 字典类型（唯一标识，如 sys_user_gender） */
    dictType: string;
    /** 状态（0禁用 1正常） */
    status: Api.Common.EnableStatus;
    /** 状态描述 */
    statusText?: string;
    /** 备注 */
    remark?: string;
    /** 创建时间 */
    createTime?: string;
  }

  /** 新增字典 VO */
  interface DictSaveVO {
    /** 字典名称 */
    dictName: string;
    /** 字典类型 */
    dictType: string;
    /** 状态（0禁用 1正常） */
    status: Api.Common.EnableStatus;
    /** 备注 */
    remark?: string;
  }

  /** 编辑字典 VO（后端接收 id/...） */
  interface DictEditVO {
    /** 字典ID */
    id: number;
    /** 字典名称 */
    dictName: string;
    /** 字典类型 */
    dictType: string;
    /** 状态（0禁用 1正常） */
    status: Api.Common.EnableStatus;
    /** 备注 */
    remark?: string;
  }

  /** GET /dict/page 查询参数 */
  interface DictPageParams {
    /** 当前页码 */
    page: number;
    /** 每页条数 */
    pageSize: number;
    /** 关键词（模糊匹配字典名称/类型） */
    keyword?: string;
    /** 状态（0禁用 1正常） */
    status?: Api.Common.EnableStatus;
  }

  /** GET /dict/page 返回 */
  type DictPageResult<T = DictVO> = Api.Common.BackendPagingResult<T>;

  /** 字典项 VO */
  interface DictItemVO {
    /** 字典项ID */
    id: number;
    /** 所属字典ID */
    dictId: number;
    /** 所属字典类型 */
    dictType: string;
    /** 字典标签（展示文本） */
    dictLabel: string;
    /** 字典键值（实际值） */
    dictValue: string;
    /** 样式（antd tag color，如 success/info/warning） */
    cssClass?: string;
    /** 显示顺序 */
    displayOrder?: number;
    /** 状态（0禁用 1正常） */
    status: Api.Common.EnableStatus;
    /** 状态描述 */
    statusText?: string;
    /** 备注 */
    remark?: string;
    /** 创建时间 */
    createTime?: string;
  }

  /** 新增字典项 VO */
  interface DictItemSaveVO {
    /** 所属字典ID */
    dictId: number;
    /** 所属字典类型 */
    dictType: string;
    /** 字典标签 */
    dictLabel: string;
    /** 字典键值 */
    dictValue: string;
    /** 样式 */
    cssClass?: string;
    /** 显示顺序 */
    displayOrder?: number;
    /** 状态（0禁用 1正常） */
    status: Api.Common.EnableStatus;
    /** 备注 */
    remark?: string;
  }

  /** 编辑字典项 VO */
  interface DictItemEditVO {
    /** 字典项ID */
    id: number;
    /** 所属字典ID */
    dictId: number;
    /** 所属字典类型 */
    dictType: string;
    /** 字典标签 */
    dictLabel: string;
    /** 字典键值 */
    dictValue: string;
    /** 样式 */
    cssClass?: string;
    /** 显示顺序 */
    displayOrder?: number;
    /** 状态（0禁用 1正常） */
    status: Api.Common.EnableStatus;
    /** 备注 */
    remark?: string;
  }

  /** GET /dictItem/page 查询参数 */
  interface DictItemPageParams {
    /** 当前页码 */
    page: number;
    /** 每页条数 */
    pageSize: number;
    /** 所属字典ID */
    dictId?: number;
    /** 关键词（模糊匹配标签/键值） */
    keyword?: string;
    /** 状态（0禁用 1正常） */
    status?: Api.Common.EnableStatus;
  }

  /** GET /dictItem/page 返回 */
  type DictItemPageResult<T = DictItemVO> = Api.Common.BackendPagingResult<T>;
}
