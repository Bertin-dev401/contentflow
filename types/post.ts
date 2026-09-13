import { Timestamp } from 'firebase/firestore'

export type Platform = 'instagram' | 'tiktok' | 'youtube'
export type PostStatus = 'draft' | 'scheduled' | 'reminded'

export interface Post {
  postId: string
  userId: string
  platform: Platform
  title: string
  caption: string
  hashtags: string
  mediaUrl?: string        // Firebase Storage download URL
  mediaType?: 'image' | 'video'
  scheduledAt: Timestamp
  status: PostStatus
  createdAt: Timestamp
  updatedAt: Timestamp
}

// What we send to Firestore on create — no IDs yet
export type CreatePostInput = Omit<Post, 'postId' | 'createdAt' | 'updatedAt'>
