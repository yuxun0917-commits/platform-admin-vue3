declare namespace Api {
  namespace Attachment {
    /** 业务类型：1头像 2文章图片 3文档 4导入模板 5其他（对应后端 AttachmentBizTypeEnum） */
    type AttachmentBizType = 1 | 2 | 3 | 4 | 5;

    /** 附件展示 VO（sys_attachment 落库后返回） */
    interface AttachmentVO {
      /** 附件ID */
      id: number;
      /** 存储配置ID */
      configId: number | null;
      /** 存储配置名称（展示用，由 configId 关联得到） */
      configName: string | null;
      /** 原始文件名 */
      fileName: string;
      /** 存储键/相对路径 */
      fileKey: string;
      /** 文件访问地址 */
      fileUrl: string;
      /** 预览地址（后端直出，可直接用于 img/iframe src，无需再取流） */
      previewUrl?: string;
      /** 扩展名（不含点） */
      fileExt: string;
      /** MIME类型 */
      contentType: string;
      /** 文件大小（字节） */
      fileSize: number;
      /** 业务类型（1头像 2文章图片 3文档 4导入模板 5其他） */
      bizType: AttachmentBizType;
      /** 业务ID（关联具体业务记录，如用户ID；Long 用字符串避免精度丢失） */
      bizId: string;
      /** 备注 */
      remark: string;
      /** 创建时间 */
      createTime: string;
    }

    /** GET /attachment/page 查询参数 */
    interface AttachmentPageParams {
      /** 当前页码 */
      page: number;
      /** 每页条数 */
      pageSize: number;
      /** 存储配置ID（按存储筛选） */
      configId?: number | null;
      /** 业务类型（1头像 2文章图片 3文档 4导入模板 5其他） */
      bizType?: AttachmentBizType;
      /** 关键词（按文件名模糊匹配） */
      keyword?: string;
    }

    /** GET /attachment/page 返回 */
    type AttachmentPageResult = Api.Common.BackendPagingResult<AttachmentVO>;

    /** 文件上传参数（multipart） */
    interface AttachmentUploadParams {
      /** 上传文件 */
      file: File;
      /** 业务类型（1头像 2文章图片 3文档 4导入模板 5其他） */
      bizType?: AttachmentBizType;
      /** 业务ID */
      bizId?: string;
    }

    /** 分片上传单片参数（multipart，对应后端 FileChunkController.upload） */
    interface AttachmentChunkUploadParams {
      /** 单片二进制 */
      file: Blob;
      /** 文件唯一标识（前端生成，后端据此聚合分片） */
      identifier: string;
      /** 当前片序号（从 1 开始） */
      chunkNumber: number;
      /** 总分片数 */
      totalChunks: number;
    }

    /** 分片合并参数（对应后端 FileChunkController.merge） */
    interface AttachmentChunkMergeParams {
      /** 文件唯一标识 */
      identifier: string;
      /** 原始文件名 */
      fileName: string;
      /** 总分片数 */
      totalChunks: number;
      /** 业务类型（1头像 2文章图片 3文档 4导入模板 5其他） */
      bizType?: AttachmentBizType;
      /** 业务ID */
      bizId?: string;
      /** MIME 类型（可选，后端默认 application/octet-stream） */
      contentType?: string;
    }

    /** GET /attachment/chunk/check 返回（断点续传） */
    interface AttachmentChunkCheckResult {
      /** 已上传的分片序号列表 */
      uploaded: number[];
      /** 已上传分片数 */
      uploadedCount: number;
      /** 总分片数 */
      totalChunks: number;
      /** 是否已全部上传完成 */
      finished: boolean;
    }
  }
}
