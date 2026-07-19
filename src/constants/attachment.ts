/**
 * 附件业务类型枚举
 *
 * 与后端 `AttachmentBizTypeEnum` 对齐：1头像 2文章图片 3文档 4导入模板 5其他
 * 后端字段 `biz_type` 为 tinyint，故前端以数字枚举传参与展示。
 */
export enum AttachmentBizType {
  /** 头像 */
  Avatar = 1,
  /** 文章图片 */
  Article = 2,
  /** 文档 */
  Document = 3,
  /** 导入模板 */
  ImportTemplate = 4,
  /** 其他 */
  Other = 5
}

/** 业务类型下拉选项（存储/上传筛选用） */
export const attachmentBizTypeOptions = [
  { value: AttachmentBizType.Avatar, label: '头像' },
  { value: AttachmentBizType.Article, label: '文章图片' },
  { value: AttachmentBizType.Document, label: '文档' },
  { value: AttachmentBizType.ImportTemplate, label: '导入模板' },
  { value: AttachmentBizType.Other, label: '其他' }
];

/** 业务类型中文文案（表格列渲染用） */
export function getAttachmentBizTypeText(type?: number): string {
  if (type === undefined) return '—';
  const found = attachmentBizTypeOptions.find(item => item.value === type);
  return found ? found.label : '—';
}
