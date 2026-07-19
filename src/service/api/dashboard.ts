import { request } from '../request';

/** GET /dashboard/core-metrics - 核心指标（本周新增/今日登录/在线用户/公告数） */
export function fetchDashboardCoreMetrics() {
  return request<Api.Dashboard.CoreMetrics>({
    url: '/dashboard/core-metrics',
    method: 'get'
  });
}

/** GET /dashboard/health - 服务器健康度（CPU/内存/磁盘/网络利用率） */
export function fetchDashboardHealth() {
  return request<Api.Dashboard.Health>({
    url: '/dashboard/health',
    method: 'get'
  });
}

/** GET /dashboard/login-trend - 近 7 天登录趋势 */
export function fetchDashboardLoginTrend() {
  return request<Api.Dashboard.LoginTrendItem[]>({
    url: '/dashboard/login-trend',
    method: 'get'
  });
}

/** GET /dashboard/ops-overview - 运维概览（登录失败/操作异常/任务失败/暂停任务） */
export function fetchDashboardOpsOverview() {
  return request<Api.Dashboard.OpsOverview>({
    url: '/dashboard/ops-overview',
    method: 'get'
  });
}

/** GET /dashboard/recent-logins - 最近登录 */
export function fetchDashboardRecentLogins() {
  return request<Api.Dashboard.LoginLog[]>({
    url: '/dashboard/recent-logins',
    method: 'get'
  });
}

/** GET /dashboard/notices - 最新公告 */
export function fetchDashboardNotices() {
  return request<Api.Dashboard.Notice[]>({
    url: '/dashboard/notices',
    method: 'get'
  });
}
