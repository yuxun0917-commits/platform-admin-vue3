import { localStg } from '@/utils/storage';
import { request } from '../request';

/** GET /attachment/page - 附件分页列表 */
export function fetchAttachmentPage(params?: Api.Attachment.AttachmentPageParams) {
  return request<Api.Attachment.AttachmentPageResult>({
    url: '/attachment/page',
    method: 'get',
    params
  });
}

/** GET /attachment/view - 附件详情（id 支持字符串以兼容 bigint 精度） */
export function fetchAttachmentView(id: number | string) {
  return request<Api.Attachment.AttachmentVO>({
    url: '/attachment/view',
    method: 'get',
    params: { id }
  });
}

/**
 * POST /attachment/upload - 文件上传（multipart）
 *
 * 后端用 @RequestParam 接收 file/bizType/bizId，直接传 FormData 即可，
 * axios 会自动设置 multipart/form-data 的 boundary（instance 无默认 JSON content-type）。
 * 不传 configId，后端自动走 is_default=1 的默认存储配置。
 */
export function fetchAttachmentUpload(params: Api.Attachment.AttachmentUploadParams) {
  const formData = new FormData();
  formData.append('file', params.file);
  if (params.bizType) formData.append('bizType', String(params.bizType));
  if (params.bizId) formData.append('bizId', params.bizId);

  return request<Api.Attachment.AttachmentVO>({
    url: '/attachment/upload',
    method: 'post',
    data: formData
  });
}

/** POST /attachment/delete - 删除附件（同步删除物理文件，@JsonCoverParam id → body） */
export function fetchAttachmentDelete(id: number) {
  return request<null>({
    url: '/attachment/delete',
    method: 'post',
    data: { id }
  });
}

/**
 * GET /attachment/chunk/check - 查询已上传分片（断点续传）
 *
 * 后端用 @RequestParam 接收 identifier/totalChunks，返回已上传序号与是否完成。
 */
export function fetchAttachmentChunkCheck(identifier: string, totalChunks: number) {
  return request<Api.Attachment.AttachmentChunkCheckResult>({
    url: '/attachment/chunk/check',
    method: 'get',
    params: { identifier, totalChunks }
  });
}

/**
 * POST /attachment/chunk/upload - 分片上传单片（multipart，对应 FileChunkController.upload）
 *
 * 后端用 @RequestParam 接收 file/identifier/chunkNumber/totalChunks（无 fileName），
 * 分片按 identifier 聚合到临时目录。返回 { uploaded, uploadedCount, totalChunks }。
 */
export function fetchAttachmentChunkUpload(params: Api.Attachment.AttachmentChunkUploadParams, timeout = 30000) {
  const formData = new FormData();
  formData.append('file', params.file);
  formData.append('identifier', params.identifier);
  formData.append('chunkNumber', String(params.chunkNumber));
  formData.append('totalChunks', String(params.totalChunks));

  return request<Api.Attachment.AttachmentChunkCheckResult>({
    url: '/attachment/chunk/upload',
    method: 'post',
    data: formData,
    timeout
  });
}

/**
 * POST /attachment/chunk/merge - 分片合并（对应 FileChunkController.merge）
 *
 * 后端用 @RequestParam 接收（未标 @JsonCoverParam），故走 query（params）而非 JSON body。
 * 合并后写入存储、落库 sys_attachment 并返回 AttachmentVO（与普通上传返回一致）。
 * 参数：identifier/fileName/totalChunks/bizType/bizId/contentType（无 fileSize，后端用合并文件大小）。
 */
export function fetchAttachmentChunkMerge(params: Api.Attachment.AttachmentChunkMergeParams) {
  const { identifier, fileName, totalChunks, bizType, bizId, contentType } = params;
  return request<Api.Attachment.AttachmentVO>({
    url: '/attachment/chunk/merge',
    method: 'post',
    params: { identifier, fileName, totalChunks, bizType, bizId, contentType }
  });
}

/**
 * GET /attachment/preview | /attachment/download - 取文件流（断 JSON 解包，用原生 fetch + Authorization）
 *
 * 服务端直接把文件写入响应流（Content-Disposition: inline/attachment，含 filename），
 * 不返回 Result JSON，故不能走 createFlatRequest 的 JSON 解包，改用 fetch 取 Blob。
 * 预览走 /preview（inline，图片/PDF 浏览器内联）；下载走 /download（attachment 强制下载）。
 */
export interface AttachmentBlobResult {
  blob: Blob;
  fileName: string;
  contentType: string;
}

function getServiceBaseURL(): string {
  const base = (import.meta.env.VITE_SERVICE_BASE_URL as string | undefined)?.replace(/\/$/, '');
  return base ?? '';
}

function decodeFileName(disposition: string | null, fallback: string): string {
  if (!disposition) return fallback;
  const utf8 = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1]);
    } catch {
      // ignore
    }
  }
  const ascii = disposition.match(/filename="?([^";]+)"?/i);
  return ascii?.[1] ?? fallback;
}

/** 后端单独返回的原始文件名头字段 `Filename`（可能 URL 编码） */
function decodeHeaderFileName(raw: string | null, fallback: string): string {
  if (!raw) return fallback;
  try {
    const decoded = decodeURIComponent(raw);
    return decoded || fallback;
  } catch {
    return raw || fallback;
  }
}

export async function fetchAttachmentBlob(
  id: number,
  action: 'preview' | 'download' = 'preview'
): Promise<AttachmentBlobResult> {
  const url = `${getServiceBaseURL()}/api/attachment/${action}?id=${id}`;
  const token = localStg.get('token');
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { method: 'GET', headers });
  if (!res.ok) {
    throw new Error(`附件${action === 'download' ? '下载' : '预览'}失败（HTTP ${res.status}）`);
  }

  const blob = await res.blob();
  // 优先取后端自定义响应头 `Filename`，否则回退解析 Content-Disposition
  const headerFileName = res.headers.get('Filename');
  const fileName = headerFileName
    ? decodeHeaderFileName(headerFileName, `file-${id}`)
    : decodeFileName(res.headers.get('Content-Disposition'), `file-${id}`);
  const contentType = res.headers.get('Content-Type') || blob.type || 'application/octet-stream';

  return { blob, fileName, contentType };
}
