declare namespace Api {
  namespace SysLog {
    /** 操作日志 VO */
    interface SysLogVO {
      /** 日志编号 */
      id: number;
      /** 操作模块（标题） */
      title: string;
      /** 调用方法全限定名 */
      method: string;
      /** 请求地址 */
      requestUrl: string;
      /** 请求方式 GET/POST/... */
      requestMethod: string;
      /** 请求参数（JSON 字符串） */
      requestParam: string;
      /** 响应数据（JSON 字符串） */
      responseData: string;
      /** 操作人员 ID */
      operId: number;
      /** 操作人员姓名 */
      operName: string;
      /** 操作 IP */
      operIp: string;
      /** 操作地点 */
      operLocation: string;
      /** 浏览器 */
      browser: string;
      /** 操作系统 */
      os: string;
      /** 操作状态：0 异常 / 1 正常 */
      status: number;
      /** 操作状态文本 */
      statusText: string;
      /** 异常信息 */
      errorMsg: string;
      /** 耗时（毫秒） */
      costTime: number;
      /** 操作时间 */
      operTime: string;
    }

    /** 分页查询参数 */
    interface SysLogPageParams {
      page: number;
      pageSize: number;
      /** 操作状态筛选：0 异常 / 1 正常 */
      status?: number | null;
      /** 关键词：匹配操作模块标题 / 操作人员姓名 */
      keyword?: string | null;
    }

    /** 分页结果 */
    interface SysLogPageResult {
      records: SysLogVO[];
      total: number;
      page: number;
      pageSize: number;
    }

    /** 状态枚举项 */
    interface SysLogStatusEnumItem {
      code: number;
      desc: string;
    }

    /** /sysLog/enums 返回数组 */
    type SysLogStatusEnum = SysLogStatusEnumItem[];
  }
}
