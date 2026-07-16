declare namespace Api.Post {
  /** 岗位状态（0禁用 1正常） */
  type Status = Api.Common.EnableStatus;

  /** 岗位展示 VO */
  interface PostVO {
    /** 岗位ID */
    id: number;
    /** 岗位编码 */
    postCode: string;
    /** 岗位名称 */
    postName: string;
    /** 显示顺序 */
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

  /** 新增岗位 VO */
  interface PostSaveVO {
    /** 岗位编码 */
    postCode: string;
    /** 岗位名称 */
    postName: string;
    /** 显示顺序 */
    displayOrder: number;
    /** 状态（0禁用 1正常） */
    status: Api.Common.EnableStatus;
    /** 备注 */
    remark?: string;
  }

  /** 编辑岗位 VO（后端接收 id/postCode/postName/displayOrder/status/remark） */
  interface PostEditVO {
    /** 岗位ID */
    id: number;
    /** 岗位编码 */
    postCode: string;
    /** 岗位名称 */
    postName: string;
    /** 显示顺序 */
    displayOrder: number;
    /** 状态（0禁用 1正常） */
    status: Api.Common.EnableStatus;
    /** 备注 */
    remark?: string;
  }

  /** 批量排序岗位（按目标顺序的 id 列表 + 起始排序值） */
  interface PostSortParams {
    /** 起始排序值 */
    startOrder: number;
    /** 按目标顺序的岗位ID列表 */
    ids: number[];
  }

  /** GET /post/page 查询参数 */
  interface PostPageParams {
    /** 当前页码 */
    page: number;
    /** 每页条数 */
    pageSize: number;
    /** 关键词（模糊匹配岗位名称/编码） */
    keyword?: string;
    /** 状态（0禁用 1正常），查询参数放宽 number 以匹配搜索模型 */
    status?: number;
  }

  /** GET /post/page 返回 */
  type PostPageResult<T = PostVO> = Api.Common.BackendPagingResult<T>;

  /** 岗位选择列表 VO（id + 岗位名称） */
  interface PostSelectVO {
    /** 岗位ID */
    id: number;
    /** 岗位名称 */
    postName: string;
  }

  /** GET /post/select-list 查询参数 */
  interface PostSelectParams {
    /** 当前页码 */
    page?: number;
    /** 每页条数 */
    pageSize?: number;
    /** 关键词（模糊匹配岗位名称） */
    keyword?: string;
  }
}
