import {
  fetchAttachmentChunkCheck,
  fetchAttachmentChunkMerge,
  fetchAttachmentChunkUpload,
  fetchAttachmentUpload
} from '@/service/api';

/** 单片大小：5MB */
export const CHUNK_SIZE = 5 * 1024 * 1024;

/** 超过该大小改用分片上传：20MB（≤ 阈值走普通上传） */
export const CHUNK_UPLOAD_THRESHOLD = 20 * 1024 * 1024;

/** 分片上传并发数 */
export const DEFAULT_CHUNK_CONCURRENCY = 3;

/** 单分片失败重试次数 */
export const DEFAULT_CHUNK_RETRY = 3;

export interface UploadAutoOptions {
  bizType?: string;
  bizId?: string;
  /** 进度回调，percent 0-100 */
  onProgress?: (percent: number) => void;
  /** 状态回调，用于展示“上传中/合并中”等文案 */
  onStatus?: (status: string) => void;
  /** 单片大小（默认 CHUNK_SIZE） */
  chunkSize?: number;
  /** 分片阈值（默认 CHUNK_UPLOAD_THRESHOLD） */
  threshold?: number;
  /** 分片并发数（默认 3） */
  concurrency?: number;
  /** 单分片失败重试次数（默认 3） */
  retry?: number;
}

/** 生成文件唯一标识（前端生成，后端据其聚合分片） */
export function createFileIdentifier(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

/** 将文件按 chunkSize 切分为 Blob 数组（最后一片可能更小） */
export function splitFileToChunks(file: File, chunkSize: number): Blob[] {
  const chunks: Blob[] = [];
  let start = 0;
  while (start < file.size) {
    const end = Math.min(start + chunkSize, file.size);
    chunks.push(file.slice(start, end));
    start = end;
  }
  return chunks;
}

/** 并发限制执行器（任一任务失败即整体失败） */
async function runWithConcurrency<T>(tasks: Array<() => Promise<T>>, limit: number): Promise<T[]> {
  const results: T[] = Array.from({ length: tasks.length });
  let index = 0;
  async function worker() {
    while (index < tasks.length) {
      const current = index;
      index += 1;
      // eslint-disable-next-line no-await-in-loop
      results[current] = await tasks[current]();
    }
  }
  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

/** 带重试的 Promise 执行器 */
async function withRetry<T>(fn: () => Promise<T>, maxRetry: number): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetry; attempt += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetry) {
        // 指数退避：50ms, 100ms, 200ms...
        // eslint-disable-next-line no-await-in-loop
        await new Promise(resolve => {
          setTimeout(resolve, 50 * 2 ** attempt);
        });
      }
    }
  }
  throw lastError;
}

/** 创建单个分片上传任务（含失败重试） */
interface ChunkTaskContext {
  identifier: string;
  totalChunks: number;
  retry: number;
}

function createChunkUploadTask(
  item: { blob: Blob; chunkNumber: number },
  ctx: ChunkTaskContext,
  onChunkDone: (size: number) => void
): () => Promise<unknown> {
  return () =>
    withRetry(async () => {
      const { data, error } = await fetchAttachmentChunkUpload(
        {
          file: item.blob,
          identifier: ctx.identifier,
          chunkNumber: item.chunkNumber,
          totalChunks: ctx.totalChunks
        },
        30000
      );
      if (error) throw new Error(error.message || `分片 ${item.chunkNumber} 上传失败`);
      if (!data) throw new Error(`分片 ${item.chunkNumber} 上传无响应`);
      onChunkDone(item.blob.size);
      return data;
    }, ctx.retry);
}

/** 合并分片 */
async function mergeChunks(
  file: File,
  options: UploadAutoOptions,
  ctx: { identifier: string; totalChunks: number }
): Promise<Api.Attachment.AttachmentVO> {
  const { data, error } = await fetchAttachmentChunkMerge({
    identifier: ctx.identifier,
    fileName: file.name,
    totalChunks: ctx.totalChunks,
    bizType: options.bizType,
    bizId: options.bizId,
    contentType: file.type || undefined
  });
  if (error || !data) throw new Error(error?.message || '分片合并失败');

  options.onStatus?.('上传完成');
  options.onProgress?.(100);
  return data;
}

/**
 * 分片上传：切片 → 断点续传 → 并发逐片上传（失败重试） → 合并。
 * 进度按已上传字节数 / 总字节数估算，合并阶段单独给出状态提示。
 */
export async function uploadChunks(file: File, options: UploadAutoOptions = {}): Promise<Api.Attachment.AttachmentVO> {
  const chunkSize = options.chunkSize ?? CHUNK_SIZE;
  const concurrency = options.concurrency ?? DEFAULT_CHUNK_CONCURRENCY;
  const retry = options.retry ?? DEFAULT_CHUNK_RETRY;
  const identifier = createFileIdentifier(file);
  const chunks = splitFileToChunks(file, chunkSize);
  const totalChunks = chunks.length;

  options.onStatus?.('查询已上传分片...');
  const { data: checkData, error: checkError } = await fetchAttachmentChunkCheck(identifier, totalChunks);
  if (checkError || !checkData) {
    throw new Error(checkError?.message || '查询分片状态失败');
  }

  const uploadedSet = new Set(checkData.uploaded);
  const finished = checkData.finished || uploadedSet.size === totalChunks;

  let uploadedBytes = 0;
  for (let i = 1; i <= totalChunks; i += 1) {
    if (uploadedSet.has(i)) {
      uploadedBytes += chunks[i - 1].size;
    }
  }

  const reportProgress = () => {
    const percent = Math.floor((uploadedBytes / file.size) * 100);
    options.onProgress?.(Math.min(percent, 99));
  };
  reportProgress();

  if (!finished) {
    const pendingChunks = chunks
      .map((blob, i) => ({ blob, chunkNumber: i + 1 }))
      .filter(item => !uploadedSet.has(item.chunkNumber));

    if (pendingChunks.length > 0) {
      options.onStatus?.('上传分片中...');
      const tasks = pendingChunks.map(item =>
        createChunkUploadTask(item, { identifier, totalChunks, retry }, size => {
          uploadedBytes += size;
          reportProgress();
        })
      );
      await runWithConcurrency(tasks, concurrency);
    }
  }

  options.onStatus?.('合并分片中...');
  options.onProgress?.(99);
  return mergeChunks(file, options, { identifier, totalChunks });
}

/**
 * 自动选择上传方式：
 * - 文件大小 ≤ 阈值 → 普通上传（/attachment/upload）
 * - 文件大小 > 阈值 → 分片上传（切片 + 并发 + 重试 + 合并）
 */
export async function uploadFileAuto(
  file: File,
  options: UploadAutoOptions = {}
): Promise<Api.Attachment.AttachmentVO> {
  const threshold = options.threshold ?? CHUNK_UPLOAD_THRESHOLD;

  if (file.size <= threshold) {
    options.onStatus?.('上传中...');
    const { data, error } = await fetchAttachmentUpload({
      file,
      bizType: options.bizType,
      bizId: options.bizId
    });
    if (error || !data) throw new Error(error?.message || '上传失败');
    options.onStatus?.('上传完成');
    options.onProgress?.(100);
    return data;
  }

  return uploadChunks(file, options);
}

/** 是否需要走分片上传（供 UI 提示用） */
export function shouldUseChunkUpload(fileSize: number, threshold = CHUNK_UPLOAD_THRESHOLD): boolean {
  return fileSize > threshold;
}
