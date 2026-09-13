import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Post, CreatePostInput } from '@/types/post'
import type { Task } from '@/types/task'
import type { AppUser } from '@/types/user'

// ─── POSTS ────────────────────────────────────────────────────────────────────

export async function createPost(input: CreatePostInput): Promise<string> {
  const ref = await addDoc(collection(db, 'posts'), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updatePost(postId: string, data: Partial<Post>): Promise<void> {
  const ref = doc(db, 'posts', postId)
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
}

export async function deletePost(postId: string): Promise<void> {
  await deleteDoc(doc(db, 'posts', postId))
}

// Upcoming posts for a user — ordered by scheduledAt ascending
export async function getUpcomingPosts(userId: string): Promise<Post[]> {
  const q = query(
    collection(db, 'posts'),
    where('userId', '==', userId),
    where('status', 'in', ['scheduled', 'draft']),
    orderBy('scheduledAt', 'asc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ postId: d.id, ...d.data() } as Post))
}

// All posts due for reminder — used by Cloud Functions
// (exported here for reference; Cloud Functions uses the Admin SDK version)
export async function getPostsDueForReminder(userId: string, before: Timestamp): Promise<Post[]> {
  const q = query(
    collection(db, 'posts'),
    where('userId', '==', userId),
    where('status', '==', 'scheduled'),
    where('scheduledAt', '<=', before),
    orderBy('scheduledAt', 'asc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ postId: d.id, ...d.data() } as Post))
}

// ─── TASKS ────────────────────────────────────────────────────────────────────

// Returns today's task for the user. Creates one if it doesn't exist.
export async function getTodayTask(userId: string): Promise<Task | null> {
  const today = new Date().toISOString().split('T')[0]  // "2025-04-23"
  const q = query(
    collection(db, 'tasks'),
    where('userId', '==', userId),
    where('date', '==', today)
  )
  const snap = await getDocs(q)
  if (!snap.empty) {
    const d = snap.docs[0]
    return { taskId: d.id, ...d.data() } as Task
  }
  // Auto-generate today's task
  const newTask = {
    userId,
    date: today,
    message: 'Post at least once today',
    completed: false,
    createdAt: serverTimestamp(),
  }
  const ref = await addDoc(collection(db, 'tasks'), newTask)
  return { taskId: ref.id, ...newTask, createdAt: Timestamp.now() } as Task
}

export async function completeTask(taskId: string, completed: boolean): Promise<void> {
  await updateDoc(doc(db, 'tasks', taskId), { completed })
}

// ─── USERS ────────────────────────────────────────────────────────────────────

export async function getUser(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  return snap.data() as AppUser
}

// Called on first login — safe to call multiple times (only writes if missing)
export async function ensureUserDoc(uid: string, email: string): Promise<void> {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  if (snap.exists()) return
  await updateDoc(ref, {
    uid,
    email,
    createdAt: serverTimestamp(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    notificationsEnabled: false,
  }).catch(async () => {
    // Doc doesn't exist yet — use setDoc
    const { setDoc } = await import('firebase/firestore')
    await setDoc(ref, {
      uid,
      email,
      createdAt: serverTimestamp(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      notificationsEnabled: false,
    })
  })
}

export async function updateFcmToken(uid: string, token: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { fcmToken: token, notificationsEnabled: true })
}

// ─── GOALS ────────────────────────────────────────────────────────────────────

// Returns Monday of the current week as "YYYY-MM-DD"
function getWeekStart(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1) // adjust for Sunday
  const monday = new Date(now.setDate(diff))
  return monday.toISOString().split('T')[0]
}

export async function getWeekGoals(userId: string): Promise<import('@/types/goal').Goal[]> {
  const weekStart = getWeekStart()
  const q = query(
    collection(db, 'goals'),
    where('userId', '==', userId),
    where('weekStart', '==', weekStart),
    orderBy('createdAt', 'asc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ goalId: d.id, ...d.data() } as import('@/types/goal').Goal))
}

export async function addGoal(userId: string, text: string): Promise<string> {
  const ref = await addDoc(collection(db, 'goals'), {
    userId,
    text,
    completed: false,
    weekStart: getWeekStart(),
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function toggleGoal(goalId: string, completed: boolean): Promise<void> {
  await updateDoc(doc(db, 'goals', goalId), { completed })
}

export async function deleteGoal(goalId: string): Promise<void> {
  await deleteDoc(doc(db, 'goals', goalId))
}
