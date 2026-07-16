declare namespace Api {
  namespace JobLog {
    /** 定时任务日志 VO */
    interface SysJobLogVO {
      /** 日志ID */
      id: number;
      /** 任务ID */
      jobId: number;
      /** 任务名称 */
      jobName: string;
      /** 任务组名 */
      jobGroup: string;
      /** 调用目标字符串 */
      invokeTarget: string;
      /** 日志信息 */
      jobMessage: string;
      /** 执行状态（1成功 0失败） */
      status: number;
      /** 执行状态描述 */
      statusText: string;
      /** 错误信息 */
      errorMsg?: string;
      /** 耗时（毫秒） */
      costTime: number;
      /** 执行时间 */
      createTime: string;
    }

    /** 任务日志分页查询参数（jobId 必填，以任务维度过滤） */
    interface SysJobLogPageParams {
      jobId: number;
      page: number;
      pageSize: number;
      status?: number;
    }

    /** 任务日志分页结果 */
    interface SysJobLogPageResult {
      records: SysJobLogVO[];
      total: number;
      page: number;
      pageSize: number;
    }
  }
}
