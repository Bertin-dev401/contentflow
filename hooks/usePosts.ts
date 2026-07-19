'use client'

import { useEffect, useState } from 'react'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Post } from '@/types/post'

interface PostsState {
  posts: Post[]
  loading: boolean
  error: string | null
}

export function usePosts(userId: string | null): PostsState {
  const [posts, setPosts]     = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setPosts([])
      setLoading(false)
      return
    }

    const q = query(
      collection(db, 'posts'),
      where('userId', '==', userId),
      where('status', 'in', ['scheduled', 'draft']),
      orderBy('scheduledAt', 'asc')
    )

    const unsub = onSnapshot(
      q,
      snap => {
        setPosts(snap.docs.map(d => ({ postId: d.id, ...d.data() } as Post)))
        setLoading(false)
      },
      err => {
        setError(err.message)
        setLoading(false)
      }
    )

    return unsub
  }, [userId])

  return { posts, loading, error }
}
