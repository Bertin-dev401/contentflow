import { Timestamp } from 'firebase/firestore'

export interface AppUser {
  uid: string
  email: string
  displayName?: string
  createdAt: Timestamp
  timezone: string           // e.g. "Africa/Kigali"
  notificationsEnabled: boolean
  fcmToken?: string          // updated on each login
}
