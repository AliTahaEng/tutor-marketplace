import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { CircuitBreaker } from '../circuit-breaker/CircuitBreaker'
import type { IStorageProvider, StorageBucket, UploadResult } from '../interfaces/IStorageProvider'

interface SupabaseStorageConfig {
  supabaseUrl: string
  serviceRoleKey: string
}

export class SupabaseStorageAdapter implements IStorageProvider {
  private readonly supabase: SupabaseClient
  private readonly cb: CircuitBreaker

  constructor(config: SupabaseStorageConfig) {
    this.supabase = createClient(config.supabaseUrl, config.serviceRoleKey)
    this.cb = new CircuitBreaker({ failureThreshold: 5, resetTimeoutMs: 30_000 })
  }

  async upload(bucket: StorageBucket, path: string, file: Blob, contentType: string): Promise<UploadResult> {
    return this.cb.execute(async () => {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .upload(path, file, { contentType, upsert: true })

      if (error) throw new Error(`Storage upload failed: ${error.message}`)

      // Private buckets don't have public URLs
      const isPrivate = bucket === 'tutor-documents' || bucket === 'dispute-evidence'
      const publicUrl = isPrivate
        ? null
        : this.supabase.storage.from(bucket).getPublicUrl(data.path).data.publicUrl

      return { path: data.path, publicUrl }
    })
  }

  async getSignedUrl(bucket: StorageBucket, path: string, expiresInSeconds: number): Promise<string> {
    return this.cb.execute(async () => {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresInSeconds)

      if (error || !data) throw new Error(`Failed to get signed URL: ${error?.message}`)
      return data.signedUrl
    })
  }

  async delete(bucket: StorageBucket, path: string): Promise<void> {
    await this.cb.execute(async () => {
      const { error } = await this.supabase.storage.from(bucket).remove([path])
      if (error) throw new Error(`Storage delete failed: ${error.message}`)
    })
  }

  async listFiles(bucket: StorageBucket, prefix: string): Promise<string[]> {
    return this.cb.execute(async () => {
      const { data, error } = await this.supabase.storage.from(bucket).list(prefix)
      if (error) throw new Error(`Storage list failed: ${error.message}`)
      return (data ?? []).map(f => `${prefix}/${f.name}`)
    })
  }
}
