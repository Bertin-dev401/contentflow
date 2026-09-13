'use client'

import { useEffect, useState } from 'react'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { addGoal, toggleGoal, deleteGoal } from '@/lib/firestore'
import type { Goal } from '@/types/goal'

// Returns Monday of current week as "YYYY-MM-DD"
function getWeekStart(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now)
  monday.setDate(diff)
  return monday.toISOString().split('T')[0]
}

interface GoalsState {
  goals:  Goal[]
  loading: boolean
  add:    (text: string) => Promise<void>
  toggle: (goalId: string, completed: boolean) => Promise<void>
  remove: (goalId: string) => Promise<void>
}

export function useGoals(userId: string | null): GoalsState {
  const [goals,   setGoals]   = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }

    const weekStart = getWeekStart()
    const q = query(
      collection(db, 'goals'),
      where('userId',    '==', userId),
      where('weekStart', '==', weekStart),
      orderBy('createdAt', 'asc')
    )

    const unsub = onSnapshot(q, snap => {
      setGoals(snap.docs.map(d => ({ goalId: d.id, ...d.data() } as Goal)))
      setLoading(false)
    })

    return unsub
  }, [userId])

  const add    = async (text: string) => { if (userId) await addGoal(userId, text) }
  const toggle = async (goalId: string, completed: boolean) => { await toggleGoal(goalId, completed) }
  const remove = async (goalId: string) => { await deleteGoal(goalId) }

  return { goals, loading, add, toggle, remove }
}
