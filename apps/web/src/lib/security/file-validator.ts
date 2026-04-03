const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  // 10MB

export const ALLOWED_DOCUMENT_TYPES = {
  mimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
  extensions: ['.jpg', '.jpeg', '.png', '.pdf'],
}

export const ALLOWED_PHOTO_TYPES = {
  mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  extensions: ['.jpg', '.jpeg', '.png', '.webp'],
}

interface AllowedTypes {
  mimeTypes: string[]
  extensions: string[]
}

export function validateUploadedFile(file: File, allowed: AllowedTypes): void {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File must be under 10MB (got ${(file.size / 1024 / 1024).toFixed(1)}MB)`)
  }

  if (!allowed.mimeTypes.includes(file.type)) {
    throw new Error(`File type not allowed: ${file.type}. Allowed: ${allowed.mimeTypes.join(', ')}`)
  }

  const name = file.name.toLowerCase()
  const hasAllowedExtension = allowed.extensions.some(ext => name.endsWith(ext))
  if (!hasAllowedExtension) {
    throw new Error(`File extension not allowed. Allowed: ${allowed.extensions.join(', ')}`)
  }

  // Block double extensions like photo.jpg.exe
  const parts = name.split('.')
  if (parts.length > 2) {
    throw new Error('File extension not allowed: double extensions are not permitted')
  }
}
