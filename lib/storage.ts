import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { app } from './firebase'

const storage = getStorage(app)

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']
const MAX_IMAGE_SIZE = 10 * 1024 * 1024  // 10MB
const MAX_VIDEO_SIZE = 200 * 1024 * 1024 // 200MB

export type MediaType = 'image' | 'video'

export interface UploadResult {
  url:       string
  mediaType: MediaType
}

export function validateFile(file: File): string | null {
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type)

  if (!isImage && !isVideo) {
    return 'Only JPG, PNG, WebP, GIF, MP4, MOV and WebM files are allowed.'
  }
  if (isImage && file.size > MAX_IMAGE_SIZE) {
    return 'Image must be under 10MB.'
  }
  if (isVideo && file.size > MAX_VIDEO_SIZE) {
    return 'Video must be under 200MB.'
  }
  return null
}

export function uploadMedia(
  file: File,
  userId: string,
  onProgress: (pct: number) => void
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
    const mediaType: MediaType = isImage ? 'image' : 'video'

    // Store under users/{userId}/media/{timestamp}-{filename}
    const path = `users/${userId}/media/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const storageRef = ref(storage, path)

    const task = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
      customMetadata: { userId }, // tag for security reference
    })

    task.on(
      'state_changed',
      snap => {
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100)
        onProgress(pct)
      },
      err => reject(err),
      async () => {
        const url = await getDownloadURL(task.snapshot.ref)
        resolve({ url, mediaType })
      }
    )
  })
}

// Delete media from Storage when a post is deleted
export async function deleteMedia(url: string): Promise<void> {
  try {
    const storageRef = ref(storage, url)
    await deleteObject(storageRef)
  } catch {
    // Ignore — file may already be deleted
  }
}
