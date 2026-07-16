import { request } from '../request';

/** GET /monitor/server - 服务监控信息（CPU/内存/JVM/系统/磁盘/Redis/MQ） */
export function fetchServerMonitor() {
  return request<Api.Monitor.ServerMonitorVO>({
    url: '/monitor/server',
    method: 'get'
  });
}
