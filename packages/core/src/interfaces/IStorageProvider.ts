export type StorageBucket = 'tutor-documents' | 'profile-photos' | 'dispute-evidence'

export interface UploadResult {
  path: string
  publicUrl: string | null
}

export interface IStorageProvider {
  upload(bucket: StorageBucket, path: string, file: Blob, contentType: string): Promise<UploadResult>
  getSignedUrl(bucket: StorageBucket, path: string, expiresInSeconds: number): Promise<string>
  delete(bucket: StorageBucket, path: string): Promise<void>
  listFiles(bucket: StorageBucket, prefix: string): Promise<string[]>
}
