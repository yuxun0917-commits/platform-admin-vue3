declare namespace Api {
  namespace Notice {
    /** 通知 VO */
    interface NoticeVO {
      /** 通知ID */
      id: number;
      /** 通知标题 */
      title: string;
      /** 展示位置（1后台 2前台） */
      position: number;
      /** 展示位置文本（如 后台/前台） */
      positionText?: string;
      /** 通知内容 */
      content: string;
      /** 状态（0禁用 1正常） */
      status: Api.Common.EnableStatus;
      /** 状态文本（禁用/正常） */
      statusText?: string;
      /** 备注 */
      remark?: string;
      /** 创建时间 */
      createTime?: string;
    }

    /** 新增通知 VO */
    interface NoticeSaveVO {
      /** 通知标题 */
      title: string;
      /** 通知内容 */
      content: string;
      /** 展示位置（1后台 2前台） */
      position: number;
      /** 状态（0禁用 1正常） */
      status: Api.Common.EnableStatus;
      /** 备注 */
      remark?: string;
    }

    /** 编辑通知 VO */
    interface NoticeEditVO {
      /** 通知ID */
      id: number;
      /** 通知标题 */
      title: string;
      /** 通知内容 */
      content: string;
      /** 展示位置（1后台 2前台） */
      position: number;
      /** 状态（0禁用 1正常） */
      status: Api.Common.EnableStatus;
      /** 备注 */
      remark?: string;
    }

    /** GET /notice/page 查询参数 */
    interface NoticePageParams {
      /** 当前页码 */
      page: number;
      /** 每页条数 */
      pageSize: number;
      /** 关键词（模糊匹配标题/内容） */
      keyword?: string;
      /** 状态（0禁用 1正常） */
      status?: Api.Common.EnableStatus;
    }

    /** GET /notice/page 返回 */
    type NoticePageResult<T = NoticeVO> = Api.Common.BackendPagingResult<T>;

    /** GET /notice/enums 状态枚举项 */
    interface NoticeStatusEnum {
      /** 状态码（0禁用 1正常） */
      code: Api.Common.EnableStatus;
      /** 描述 */
      desc: string;
    }

    /** GET /notice/enums 返回 */
    interface NoticeEnumsResult {
      /** 状态枚举 */
      status: Api.Notice.NoticeStatusEnum[];
    }
  }
}
