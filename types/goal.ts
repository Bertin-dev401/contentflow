import { Timestamp } from 'firebase/firestore'

export interface Goal {
  goalId:    string
  userId:    string
  text:      string       // what the user typed
  completed: boolean
  weekStart: string       // "2025-04-28" — Monday of the week this goal belongs to
  createdAt: Timestamp
}
