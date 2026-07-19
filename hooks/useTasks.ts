'use client'

import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { completeTask, getTodayTask } from '@/lib/firestore'
import type { Task } from '@/types/task'

interface TasksState {
  todayTask: Task | null
  loading: boolean
  toggle: () => Promise<void>
}

export function useTasks(userId: string | null): TasksState {
  const [todayTask, setTodayTask] = useState<Task | null>(null)
  const [loading, setLoading]     = useState(true)

  // Ensure today's task exists, then listen for changes
  useEffect(() => {
    if (!userId) { setLoading(false); return }

    let unsub: () => void = () => {}

    getTodayTask(userId).then(task => {
      if (!task) return
      const today = new Date().toISOString().split('T')[0]

      const q = query(
        collection(db, 'tasks'),
        where('userId', '==', userId),
        where('date', '==', today)
      )
      unsub = onSnapshot(q, snap => {
        if (!snap.empty) {
          const d = snap.docs[0]
          setTodayTask({ taskId: d.id, ...d.data() } as Task)
        }
        setLoading(false)
      })
    })

    return () => unsub()
  }, [userId])

  const toggle = async () => {
    if (!todayTask) return
    await completeTask(todayTask.taskId, !todayTask.completed)
  }

  return { todayTask, loading, toggle }
}
