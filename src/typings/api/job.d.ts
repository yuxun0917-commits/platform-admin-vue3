declare namespace Api {
  namespace Job {
    /** 定时任务 VO（/job/view、/job/page 列表项） */
    interface SysJobVO {
      /** 任务ID */
      id: number;
      /** 任务名称 */
      jobName: string;
      /** 任务组名 */
      jobGroup: string;
      /** 调用目标字符串 */
      invokeTarget: string;
      /** cron执行表达式 */
      cronExpression: string;
      /** 错失触发策略（0不补跑 1补跑） */
      misfirePolicy: number;
      /** 错失触发策略描述 */
      misfirePolicyText: string;
      /** 是否并发（0禁止 1允许） */
      concurrent: number;
      /** 是否并发描述 */
      concurrentText: string;
      /** 状态（1正常 0暂停） */
      status: number;
      /** 状态描述 */
      statusText: string;
      /** 备注 */
      remark: string;
      /** 创建时间 */
      createTime: string;
      /** 更新时间 */
      updateTime: string;
    }

    /** 定时任务分页查询参数 */
    interface SysJobPageParams {
      /** 页码 */
      page: number;
      /** 页大小 */
      pageSize: number;
      /** 状态（1正常 0暂停），可选 */
      status?: number;
      /** 关键词（匹配任务名称、任务组名） */
      keyword?: string;
    }

    /** 定时任务分页结果 */
    interface SysJobPageResult {
      records: SysJobVO[];
      total: number;
      page: number;
      pageSize: number;
    }

    /** 定时任务相关枚举（/job/enums 返回对象，分组） */
    interface SysJobEnums {
      /** 任务状态枚举 */
      jobStatus: Api.Common.EnumOption[];
      /** 错失触发策略枚举 */
      misfirePolicy: Api.Common.EnumOption[];
      /** 是否并发枚举 */
      concurrent: Api.Common.EnumOption[];
    }

    /** 新增定时任务入参 */
    interface SysJobSaveVO {
      /** 任务名称 */
      jobName: string;
      /** 任务组名（为空默认 DEFAULT） */
      jobGroup?: string;
      /** 调用目标字符串 */
      invokeTarget: string;
      /** cron执行表达式 */
      cronExpression: string;
      /** 错失触发策略（0不补跑 1补跑） */
      misfirePolicy: number;
      /** 是否并发（0禁止 1允许） */
      concurrent: number;
      /** 状态（1正常 0暂停） */
      status: number;
      /** 备注 */
      remark?: string;
    }

    /** 编辑定时任务入参 */
    interface SysJobEditVO extends SysJobSaveVO {
      /** 任务ID */
      id: number;
    }
  }
}
