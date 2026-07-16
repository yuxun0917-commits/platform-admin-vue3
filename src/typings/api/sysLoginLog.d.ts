declare namespace Api {
  namespace SysLoginLog {
    /** 登录日志 VO（与后端 SysLoginLogVO 对齐；loginType/status 的文本由后端填充） */
    interface SysLoginLogVO {
      id: number;
      userId: number;
      username: string;
      /** 登录类型：1登录 2登出 3踢下线 */
      loginType: number;
      loginTypeText: string;
      loginIp: string;
      loginLocation: string;
      browser: string;
      os: string;
      /** 登录状态：1成功 0失败 */
      status: number;
      statusText: string;
      loginTime: string;
    }

    /** GET /sysLoginLog/page 查询参数 */
    interface SysLoginLogPageParams {
      page: number;
      pageSize: number;
      /** 登录类型（1登录 2登出 3踢下线） */
      loginType?: number;
      /** 登录状态（1成功 0失败） */
      status?: number;
      /** 模糊匹配：用户名 / 登录IP */
      keyword?: string;
    }

    /** GET /sysLoginLog/page 返回（Paging<SysLoginLog>） */
    interface SysLoginLogPageResult {
      records: SysLoginLogVO[];
      total: number;
      page: number;
      pageSize: number;
    }

    /** 枚举项 */
    interface SysLoginLogEnumItem {
      code: number;
      desc: string;
    }

    /**
     * GET /sysLoginLog/enums 返回对象（注意：非数组，与 /sysLog/enums 不同）
     * { loginType: [...], status: [...] }
     */
    interface SysLoginLogEnums {
      loginType: SysLoginLogEnumItem[];
      status: SysLoginLogEnumItem[];
    }
  }
}
