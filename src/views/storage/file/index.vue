<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { Modal } from 'ant-design-vue';
import type { TablePaginationConfig } from 'ant-design-vue';
import {
  fetchAttachmentBlob,
  fetchAttachmentDelete,
  fetchAttachmentPage,
  fetchStorageConfigSelectList
} from '@/service/api';
import FileUploadModal from './modules/file-upload-modal.vue';
import FilePreviewModal from './modules/file-preview-modal.vue';

defineOptions({
  name: 'StorageFile'
});

interface SearchParams {
  keyword: string;
  configId: number | undefined;
  bizType: string;
}

const searchParams = reactive<SearchParams>({
  keyword: '',
  configId: undefined,
  bizType: ''
});

const tableData = ref<Api.Attachment.AttachmentVO[]>([]);
const loading = ref(false);
const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: total => `共 ${total} 条`
});

const configOptions = ref<{ value: number; label: string }[]>([]);

async function loadConfigOptions() {
  const { data, error } = await fetchStorageConfigSelectList({ page: 1, pageSize: 100 });
  if (!error && data) {
    configOptions.value = data.records.map(item => ({ value: item.id, label: item.configName }));
  }
}

async function getData() {
  loading.value = true;
  const { data, error } = await fetchAttachmentPage({
    page: pagination.current ?? 1,
    pageSize: pagination.pageSize ?? 10,
    keyword: searchParams.keyword || undefined,
    configId: searchParams.configId,
    bizType: searchParams.bizType || undefined
  });

  if (!error && data) {
    tableData.value = data.records;
    pagination.total = data.total;
    pagination.current = data.page;
    pagination.pageSize = data.pageSize;
  }

  loading.value = false;
}

function handleSearch() {
  pagination.current = 1;
  getData();
}

function handleReset() {
  searchParams.keyword = '';
  searchParams.configId = undefined;
  searchParams.bizType = '';
  pagination.current = 1;
  getData();
}

function handleTableChange(pag: TablePaginationConfig) {
  pagination.current = pag.current ?? 1;
  pagination.pageSize = pag.pageSize ?? 10;
  getData();
}

const uploadState = reactive({
  visible: false
});

const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg'];
function isImage(row: Api.Attachment.AttachmentVO): boolean {
  if (row.contentType && row.contentType.startsWith('image/')) return true;
  return imageExts.includes((row.fileExt || '').toLowerCase());
}

function formatSize(bytes: number): string {
  if (!bytes || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(2)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

const previewLoading = ref(false);
const previewState = reactive({
  visible: false,
  url: '',
  name: '',
  downloadName: '',
  contentType: ''
});

function revokePreviewUrl() {
  if (previewState.url.startsWith('blob:')) {
    URL.revokeObjectURL(previewState.url);
  }
}

/** 内联预览：走后端 /attachment/preview 取流（图片/PDF 浏览器内联） */
async function handlePreview(row: Api.Attachment.AttachmentVO) {
  previewLoading.value = true;
  try {
    const { blob, fileName, contentType } = await fetchAttachmentBlob(row.id, 'preview');
    revokePreviewUrl();
    previewState.url = URL.createObjectURL(blob);
    previewState.name = row.fileName;
    previewState.downloadName = fileName;
    previewState.contentType = contentType;
    previewState.visible = true;
  } catch (e) {
    window.$message?.error((e as Error).message || '预览失败');
  } finally {
    previewLoading.value = false;
  }
}

/** 强制下载：走后端 /attachment/download 取流；文件名优先用列表行的原始 fileName */
async function handleDownload(row: Api.Attachment.AttachmentVO) {
  try {
    const { blob, fileName } = await fetchAttachmentBlob(row.id, 'download');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // 列表行已含原始文件名（最可靠，与 CORS 是否暴露响应头无关）；fileName 为后端 Filename 头解析值，作为兜底
    a.download = fileName && !fileName.startsWith('file-') ? fileName : row.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) {
    window.$message?.error((e as Error).message || '下载失败');
  }
}

function handleDelete(row: Api.Attachment.AttachmentVO) {
  Modal.confirm({
    title: '确认删除',
    content: `确定删除文件 "${row.fileName}" 吗？将同时删除物理文件。`,
    okText: '确认',
    cancelText: '取消',
    async onOk() {
      const { error } = await fetchAttachmentDelete(row.id);
      if (!error) {
        window.$message?.success('删除成功');
        getData();
      }
    }
  });
}

const columns = [
  {
    title: '文件名',
    dataIndex: 'fileName',
    key: 'fileName',
    align: 'center' as const,
    ellipsis: true,
    width: 220
  },
  {
    title: '存储配置',
    dataIndex: 'configName',
    key: 'configName',
    align: 'center' as const,
    width: 140
  },
  {
    title: '文件类型',
    dataIndex: 'fileExt',
    key: 'fileExt',
    align: 'center' as const,
    width: 100
  },
  {
    title: '文件大小',
    dataIndex: 'fileSize',
    key: 'fileSize',
    align: 'center' as const,
    width: 120
  },
  {
    title: '业务类型',
    dataIndex: 'bizType',
    key: 'bizType',
    align: 'center' as const,
    width: 120
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    key: 'createTime',
    align: 'center' as const,
    width: 170
  },
  {
    title: '操作',
    key: 'action',
    align: 'center' as const,
    fixed: 'right' as const,
    width: 200
  }
];

onMounted(() => {
  loadConfigOptions();
  getData();
});

watch(
  () => previewState.visible,
  visible => {
    if (!visible) revokePreviewUrl();
  }
);

onBeforeUnmount(revokePreviewUrl);
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <ACard :bordered="false" class="card-wrapper">
      <AForm layout="inline" :model="searchParams">
        <AFormItem label="文件名">
          <AInput
            v-model:value="searchParams.keyword"
            placeholder="请输入文件名"
            allow-clear
            @press-enter="handleSearch"
          />
        </AFormItem>
        <AFormItem label="存储配置">
          <ASelect
            v-model:value="searchParams.configId"
            placeholder="请选择存储配置"
            allow-clear
            class="w-160px"
            :options="configOptions"
            :field-names="{ value: 'value', label: 'label' }"
          />
        </AFormItem>
        <AFormItem label="业务类型">
          <AInput
            v-model:value="searchParams.bizType"
            placeholder="如 avatar/article"
            allow-clear
            @press-enter="handleSearch"
          />
        </AFormItem>
        <AFormItem>
          <ASpace>
            <AButton type="primary" @click="handleSearch">查询</AButton>
            <AButton @click="handleReset">重置</AButton>
          </ASpace>
        </AFormItem>
      </AForm>
    </ACard>

    <ACard :bordered="false" class="flex-1-hidden card-wrapper">
      <div class="mb-16px">
        <AButton type="primary" @click="uploadState.visible = true">上传文件</AButton>
      </div>
      <ATable
        :columns="columns"
        :data-source="tableData"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        size="small"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'fileName'">
            <span>{{ (record as Api.Attachment.AttachmentVO).fileName }}</span>
          </template>
          <template v-if="column.key === 'fileExt'">
            <ATag v-if="(record as Api.Attachment.AttachmentVO).fileExt" color="blue">
              {{ (record as Api.Attachment.AttachmentVO).fileExt.toUpperCase() }}
            </ATag>
            <span v-else>—</span>
          </template>
          <template v-if="column.key === 'fileSize'">
            {{ formatSize((record as Api.Attachment.AttachmentVO).fileSize) }}
          </template>
          <template v-if="column.key === 'bizType'">
            {{ (record as Api.Attachment.AttachmentVO).bizType || '—' }}
          </template>
          <template v-if="column.key === 'action'">
            <ASpace>
              <AButton
                v-if="isImage(record as Api.Attachment.AttachmentVO)"
                type="link"
                size="small"
                :loading="previewLoading"
                @click="handlePreview(record as Api.Attachment.AttachmentVO)"
              >
                预览
              </AButton>
              <AButton type="link" size="small" @click="handleDownload(record as Api.Attachment.AttachmentVO)">
                下载
              </AButton>
              <AButton type="link" size="small" danger @click="handleDelete(record as Api.Attachment.AttachmentVO)">
                删除
              </AButton>
            </ASpace>
          </template>
        </template>
      </ATable>
    </ACard>

    <FileUploadModal v-model:visible="uploadState.visible" @submitted="getData" />
    <FilePreviewModal
      v-model:visible="previewState.visible"
      :url="previewState.url"
      :name="previewState.name"
      :download-name="previewState.downloadName"
      :content-type="previewState.contentType"
    />
  </div>
</template>

<style scoped></style>
