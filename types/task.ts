import { Timestamp } from 'firebase/firestore'

export interface Task {
  taskId: string
  userId: string
  date: string          // "2025-04-23" — one per user per day
  message: string
  completed: boolean
  createdAt: Timestamp
}
