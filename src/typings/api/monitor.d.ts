declare namespace Api {
  namespace Monitor {
    /** CPU 信息 */
    interface CpuInfo {
      /** CPU 核心数（逻辑） */
      cpuNum: number;
      /** CPU 型号 */
      cpuName: string;
      /** 物理核心数 */
      physicalNum: number;
      /** CPU 插槽数 */
      packageNum: number;
      /** 每核心使用率 (%) */
      perCore: number[];
      /** 系统使用率 (%) */
      sys: number;
      /** 用户使用率 (%) */
      used: number;
      /** 当前空闲率 (%) */
      free: number;
    }

    /** 系统内存信息（字节） */
    interface MemInfo {
      /** 总内存 */
      total: number;
      /** 已用内存 */
      used: number;
      /** 剩余内存 */
      free: number;
      /** 使用率 (%) */
      usage: number;
    }

    /** JVM 信息（字节） */
    interface JvmInfo {
      /** 总内存 */
      total: number;
      /** 已用内存 */
      used: number;
      /** 最大可用内存 */
      max: number;
      /** 剩余内存 */
      free: number;
      /** 使用率 (%) */
      usage: number;
      /** JDK 版本 */
      version: string;
      /** JDK 安装路径 */
      home: string;
      /** 启动时间（时间戳） */
      startTime: number;
      /** 运行时长 */
      runTime: string;
    }

    /** 服务器系统信息 */
    interface SysInfo {
      /** 服务器名称 */
      computerName: string;
      /** 服务器 IP */
      computerIp: string;
      /** 用户目录 */
      userDir: string;
      /** 操作系统名称 */
      osName: string;
      /** 系统架构 */
      osArch: string;
      /** 操作系统版本 */
      osVersion: string;
      /** 系统已运行时长 */
      systemUptime: string;
      /** 系统启动时间（时间戳） */
      bootTime?: number;
      /** 硬件型号 */
      computerModel: string;
      /** 系统进程总数 */
      processCount: number;
    }

    /** 磁盘分区信息 */
    interface SysFile {
      /** 盘符路径 */
      dirName: string;
      /** 盘符名称 */
      name: string;
      /** 文件系统类型 */
      type: string;
      /** 总大小（字节） */
      total: number;
      /** 已用（字节） */
      used: number;
      /** 可用（字节） */
      free: number;
      /** 总大小（GB） */
      totalGb: number;
      /** 已用（GB） */
      usedGb: number;
      /** 可用（GB） */
      freeGb: number;
      /** 使用率 (%) */
      usage: number;
    }

    /** Redis 信息 */
    interface RedisInfo {
      version: string;
      mode: string;
      port: string;
      uptime: string;
      connectedClients: string;
      usedMemory: string;
      maxMemory: string;
      commandsProcessed: string;
      hitRate: string;
    }

    /** 消息队列信息 */
    interface MqInfo {
      name: string;
      version: string;
      host: string;
      port: string;
      clusterName: string;
      status: string;
      queueCount: number;
      messageCount: number;
      consumerCount: number;
    }

    /** 服务监控数据 */
    interface ServerMonitorVO {
      cpu: CpuInfo;
      mem: MemInfo;
      jvm: JvmInfo;
      sys: SysInfo;
      sysFiles: SysFile[];
      redis: RedisInfo;
      mq: MqInfo;
    }
  }
}
