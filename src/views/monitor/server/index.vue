<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import type { TableColumnType } from 'ant-design-vue';
import { fetchServerMonitor } from '@/service/api';

const loading = ref(false);
const data = ref<Api.Monitor.ServerMonitorVO | null>(null);
let timer: number | undefined;

/** 字节转 GB */
function toGB(bytes: number) {
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

/** 使用率颜色：<50 绿 / <80 橙 / >=80 红 */
function usageColor(v: number) {
  if (v < 50) return '#52c41a';
  if (v < 80) return '#faad14';
  return '#ff4d4f';
}

/** 时间戳格式化 */
function formatTime(ts: number) {
  if (!ts) return '-';
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

const diskColumns: TableColumnType[] = [
  { title: '盘符', dataIndex: 'dirName', key: 'dirName', width: 90, align: 'center' },
  { title: '文件系统', dataIndex: 'name', key: 'name', width: 160, ellipsis: true, align: 'center' },
  { title: '类型', dataIndex: 'type', key: 'type', width: 80, align: 'center' },
  { title: '总大小', key: 'total', width: 150, align: 'center' },
  { title: '已用', key: 'used', width: 100, align: 'center' },
  { title: '可用', key: 'free', width: 100, align: 'center' },
  { title: '使用率', key: 'usage', width: 220, align: 'center' }
];

async function load(spinning = true) {
  if (spinning) loading.value = true;
  try {
    const { data: resp, error } = await fetchServerMonitor();
    if (!error && resp) {
      data.value = resp;
    }
  } finally {
    if (spinning) loading.value = false;
  }
}

onMounted(() => {
  load();
  timer = window.setInterval(() => load(false), 10000);
});
onUnmounted(() => {
  if (timer) window.clearInterval(timer);
});
</script>

<template>
  <div class="min-h-full">
    <ASpin :spinning="loading" class="w-full">
      <div v-if="data" class="grid grid-cols-1 gap-16px md:grid-cols-2">
        <!-- 服务器信息 -->
        <ACard title="服务器信息" :bordered="false" class="h-full">
          <ADescriptions :column="1" size="small" class="info-desc">
            <ADescriptionsItem label="服务器名称">{{ data.sys.computerName }}</ADescriptionsItem>
            <ADescriptionsItem label="IP 地址">{{ data.sys.computerIp }}</ADescriptionsItem>
            <ADescriptionsItem label="操作系统">{{ data.sys.osName }} {{ data.sys.osVersion }}</ADescriptionsItem>
            <ADescriptionsItem label="系统架构">{{ data.sys.osArch }}</ADescriptionsItem>
            <ADescriptionsItem label="用户目录">{{ data.sys.userDir }}</ADescriptionsItem>
          </ADescriptions>
        </ACard>

        <!-- Redis 信息 -->
        <ACard title="Redis 信息" :bordered="false" class="h-full">
          <ADescriptions :column="1" size="small" class="info-desc">
            <ADescriptionsItem label="版本">{{ data.redis.version }}</ADescriptionsItem>
            <ADescriptionsItem label="模式">{{ data.redis.mode }}</ADescriptionsItem>
            <ADescriptionsItem label="端口">{{ data.redis.port }}</ADescriptionsItem>
            <ADescriptionsItem label="运行时长">{{ data.redis.uptime }} 秒</ADescriptionsItem>
            <ADescriptionsItem label="连接客户端">{{ data.redis.connectedClients }}</ADescriptionsItem>
            <ADescriptionsItem label="使用内存">{{ data.redis.usedMemory }}</ADescriptionsItem>
            <ADescriptionsItem label="最大内存">{{ data.redis.maxMemory }}</ADescriptionsItem>
            <ADescriptionsItem label="累计命令">{{ data.redis.commandsProcessed }}</ADescriptionsItem>
            <ADescriptionsItem label="命中率">{{ data.redis.hitRate }}%</ADescriptionsItem>
          </ADescriptions>
        </ACard>

        <!-- CPU 信息 -->
        <ACard title="CPU 信息" :bordered="false" class="h-full">
          <ADescriptions :column="1" size="small" class="info-desc">
            <ADescriptionsItem label="CPU 核心数">{{ data.cpu.cpuNum }}</ADescriptionsItem>
          </ADescriptions>
          <div class="mt-12px flex items-center gap-12px">
            <span class="w-72px shrink-0 text-13px text-gray-500">使用率</span>
            <AProgress class="flex-1" :percent="data.cpu.sys" :stroke-color="usageColor(data.cpu.sys)" />
          </div>
        </ACard>

        <!-- 内存信息 -->
        <ACard title="内存信息" :bordered="false" class="h-full">
          <ADescriptions :column="1" size="small" class="info-desc">
            <ADescriptionsItem label="总内存">{{ toGB(data.mem.total) }}</ADescriptionsItem>
            <ADescriptionsItem label="已用内存">{{ toGB(data.mem.used) }}</ADescriptionsItem>
            <ADescriptionsItem label="剩余内存">{{ toGB(data.mem.free) }}</ADescriptionsItem>
          </ADescriptions>
          <div class="mt-12px flex items-center gap-12px">
            <span class="w-72px shrink-0 text-13px text-gray-500">使用率</span>
            <AProgress class="flex-1" :percent="data.mem.usage" :stroke-color="usageColor(data.mem.usage)" />
          </div>
        </ACard>

        <!-- JVM 信息 -->
        <ACard title="JVM 信息" :bordered="false" class="h-full">
          <ADescriptions :column="1" size="small" class="info-desc">
            <ADescriptionsItem label="总内存">{{ toGB(data.jvm.total) }}</ADescriptionsItem>
            <ADescriptionsItem label="已用内存">{{ toGB(data.jvm.used) }}</ADescriptionsItem>
            <ADescriptionsItem label="最大可用">{{ toGB(data.jvm.max) }}</ADescriptionsItem>
            <ADescriptionsItem label="剩余内存">{{ toGB(data.jvm.free) }}</ADescriptionsItem>
            <ADescriptionsItem label="JDK 版本">{{ data.jvm.version }}</ADescriptionsItem>
            <ADescriptionsItem label="启动时间">{{ formatTime(data.jvm.startTime) }}</ADescriptionsItem>
            <ADescriptionsItem label="运行时长">{{ data.jvm.runTime }}</ADescriptionsItem>
          </ADescriptions>
          <div class="mt-12px flex items-center gap-12px">
            <span class="w-72px shrink-0 text-13px text-gray-500">使用率</span>
            <AProgress class="flex-1" :percent="data.jvm.usage" :stroke-color="usageColor(data.jvm.usage)" />
          </div>
        </ACard>

        <!-- 消息队列信息 -->
        <ACard title="消息队列信息" :bordered="false" class="h-full">
          <ADescriptions :column="1" size="small" class="info-desc">
            <ADescriptionsItem label="名称">{{ data.mq.name }}</ADescriptionsItem>
            <ADescriptionsItem label="版本">{{ data.mq.version }}</ADescriptionsItem>
            <ADescriptionsItem label="主机">{{ data.mq.host }}:{{ data.mq.port }}</ADescriptionsItem>
            <ADescriptionsItem label="集群名称">{{ data.mq.clusterName }}</ADescriptionsItem>
            <ADescriptionsItem label="状态">
              <ATag :color="data.mq.status === '在线' ? 'success' : 'error'">{{ data.mq.status }}</ATag>
            </ADescriptionsItem>
            <ADescriptionsItem label="队列数">{{ data.mq.queueCount }}</ADescriptionsItem>
            <ADescriptionsItem label="消息数">{{ data.mq.messageCount }}</ADescriptionsItem>
            <ADescriptionsItem label="消费者数">{{ data.mq.consumerCount }}</ADescriptionsItem>
          </ADescriptions>
        </ACard>

        <!-- 磁盘状态（跨整行） -->
        <ACard title="磁盘状态" :bordered="false" class="md:col-span-2">
          <ATable
            :columns="diskColumns"
            :data-source="data.sysFiles"
            :pagination="false"
            size="small"
            row-key="dirName"
            :scroll="{ x: 900 }"
            class="disk-table"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'total'">{{ record.usedGb }} / {{ record.totalGb }} GB</template>
              <template v-else-if="column.key === 'used'">{{ record.usedGb }} GB</template>
              <template v-else-if="column.key === 'free'">{{ record.freeGb }} GB</template>
              <template v-else-if="column.key === 'usage'">
                <div class="flex items-center justify-center gap-8px">
                  <AProgress
                    :percent="record.usage"
                    :stroke-color="usageColor(record.usage)"
                    :show-info="false"
                    class="w-65%"
                  />
                  <span class="whitespace-nowrap text-13px font-medium">{{ record.usage }}%</span>
                </div>
              </template>
            </template>
          </ATable>
        </ACard>
      </div>
    </ASpin>
  </div>
</template>

<style scoped>
.disk-table :deep(.ant-table) {
  background: transparent;
}

.disk-table :deep(.ant-table-thead > tr > th) {
  background: transparent;
  color: inherit;
  border-bottom: 1px solid rgba(128, 128, 128, 0.15);
}

.disk-table :deep(.ant-table-tbody > tr > td) {
  background: transparent;
  color: inherit;
  border-bottom: 1px solid rgba(128, 128, 128, 0.1);
}

.disk-table :deep(.ant-table-tbody > tr:last-child > td) {
  border-bottom: none;
}

.info-desc :deep(.ant-descriptions-item-label) {
  width: 110px;
  color: rgba(128, 128, 128, 0.9);
}

.info-desc :deep(.ant-descriptions-item-content) {
  color: inherit;
}

.info-desc :deep(.ant-descriptions-item) {
  padding-bottom: 8px;
}
</style>
