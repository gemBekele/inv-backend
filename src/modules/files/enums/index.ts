export enum FileType {
  IMAGE = 'image',
  PDF = 'pdf',
  DOCUMENT = 'document',
  VIDEO = 'video',
  AUDIO = 'audio',
  ARCHIVE = 'archive',
  OTHER = 'other'
}

export enum FileStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PROCESSING = 'processing',
  DELETED = 'deleted',
  ERROR = 'error'
}

export enum FileStorageType {
  LOCAL = 'local',
  S3 = 's3',
  MINIO = 'minio',
  GOOGLE_CLOUD = 'google_cloud',
  AZURE = 'azure'
}

export enum FileEntityType {
  PRODUCT = 'product',
  USER = 'user',
  COMPANY = 'company',
  CUSTOMER = 'customer',
  SUPPLIER = 'supplier',
  EXPENSE = 'expense',
  GENERAL = 'general'
}