import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { auth } from './firebase'
import { ensureUserDoc } from './firestore'

export async function signUp(email: string, password: string): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  await ensureUserDoc(cred.user.uid, email)
  return cred.user
}

export async function signIn(email: string, password: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email, password)
  await ensureUserDoc(cred.user.uid, cred.user.email ?? '')
  return cred.user
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth)
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email)
}

// Resolves once with the current user — useful for server-side guards
export function getCurrentUser(): Promise<User | null> {
  return new Promise(resolve => {
    const unsub = onAuthStateChanged(auth, user => {
      unsub()
      resolve(user)
    })
  })
}
