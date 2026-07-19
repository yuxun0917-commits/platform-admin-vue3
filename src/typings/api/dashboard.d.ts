declare namespace Api {
  namespace Dashboard {
    /** 仪表盘核心指标（GET /dashboard/core-metrics） */
    interface CoreMetrics {
      /** 本周新增用户 */
      weekNewUser: number;
      /** 今日登录 */
      todayLogin: number;
      /** 在线用户 */
      onlineUser: number;
      /** 系统公告数 */
      noticeCount: number;
    }

    /** 仪表盘服务器健康度（GET /dashboard/health） */
    interface Health {
      /** CPU 使用率（%） */
      cpuUsage: number;
      /** 系统内存使用率（%） */
      memoryUsage: number;
      /** 磁盘最大使用率（%） */
      diskUsage: number;
      /** 网络利用率（%）；不支持时为 null */
      networkUsage: number | null;
    }

    /** 仪表盘运维概览（GET /dashboard/ops-overview） */
    interface OpsOverview {
      /** 登录失败 */
      loginFail: number;
      /** 操作异常 */
      operateException: number;
      /** 任务失败 */
      jobFail: number;
      /** 暂停任务 */
      jobPause: number;
    }

    /** 登录趋势项（GET /dashboard/login-trend 数组元素） */
    interface LoginTrendItem {
      /** 登录日期（yyyy-MM-dd） */
      loginDate: string;
      /** 登录次数 */
      count: number;
    }

    /** 最近登录（GET /dashboard/recent-logins 数组元素，SySLoginLogVO） */
    interface LoginLog {
      /** 日志ID */
      id: number;
      /** 用户名 */
      username: string;
      /** 登录IP */
      loginIp: string;
      /** 登录地点 */
      loginLocation?: string;
      /** 浏览器 */
      browser?: string;
      /** 操作系统 */
      os?: string;
      /** 登录状态（1成功 0失败） */
      status?: number;
      /** 状态描述 */
      statusText?: string;
      /** 登录时间 */
      loginTime: string;
    }

    /** 最新公告（GET /dashboard/notices 数组元素，NoticeVO） */
    interface Notice {
      /** 通知ID */
      id: number;
      /** 通知标题 */
      title: string;
      /** 展示位置描述 */
      positionText?: string;
      /** 通知内容 */
      content?: string;
      /** 状态描述 */
      statusText?: string;
      /** 创建时间 */
      createTime?: string;
      /** 更新时间 */
      updateTime?: string;
    }
  }
}
