declare namespace Api {
  namespace SysConfig {
    /** 参数配置 VO */
    interface SysConfigVO {
      /** 主键 */
      id: number;
      /** 参数名称 */
      configName: string;
      /** 参数键名 */
      configKey: string;
      /** 参数值 */
      configValue: string;
      /** 是否系统内置（0否 1是） */
      configType: number;
      /** 是否系统内置描述 */
      configTypeText?: string;
      /** 备注 */
      remark?: string;
      /** 创建时间 */
      createTime?: string;
    }

    /** 新增参数配置 VO */
    interface SysConfigSaveVO {
      /** 参数名称 */
      configName: string;
      /** 参数键名 */
      configKey: string;
      /** 参数值 */
      configValue: string;
      /** 是否系统内置（0否 1是） */
      configType: number;
      /** 备注 */
      remark?: string;
    }

    /** 编辑参数配置 VO */
    interface SysConfigEditVO {
      /** 主键 */
      id: number;
      /** 参数名称 */
      configName: string;
      /** 参数键名 */
      configKey: string;
      /** 参数值 */
      configValue: string;
      /** 是否系统内置（0否 1是） */
      configType: number;
      /** 备注 */
      remark?: string;
    }

    /** GET /sysConfig/page 查询参数 */
    interface SysConfigPageParams {
      /** 当前页码 */
      page: number;
      /** 每页条数 */
      pageSize: number;
      /** 关键词（模糊匹配参数名称/键名） */
      keyword?: string;
      /** 是否系统内置（0否 1是） */
      configType?: number;
    }

    /** GET /sysConfig/page 返回 */
    type SysConfigPageResult<T = SysConfigVO> = Api.Common.BackendPagingResult<T>;

    /** GET /sysConfig/enums 返回（是否系统内置枚举：0否 1是） */
    type SysConfigEnums = Array<{ code: number; desc: string }>;
  }
}
