'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { signOut } from '@/lib/auth'

export default function SettingsPage() {
  const { user }   = useAuth()
  const router     = useRouter()

  const [currentPw,  setCurrentPw]  = useState('')
  const [newPw,      setNewPw]      = useState('')
  const [confirmPw,  setConfirmPw]  = useState('')
  const [pwLoading,  setPwLoading]  = useState(false)
  const [pwMsg,      setPwMsg]      = useState<{ text: string; ok: boolean } | null>(null)

  const [deletePw,   setDeletePw]   = useState('')
  const [delLoading, setDelLoading] = useState(false)
  const [delError,   setDelError]   = useState<string | null>(null)
  const [showDelete, setShowDelete] = useState(false)

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwMsg(null)
    if (newPw !== confirmPw) { setPwMsg({ text: 'Passwords do not match.', ok: false }); return }
    if (newPw.length < 8)    { setPwMsg({ text: 'Password must be at least 8 characters.', ok: false }); return }
    if (!user?.email) return

    setPwLoading(true)
    try {
      // Re-authenticate before sensitive operation
      const cred = EmailAuthProvider.credential(user.email, currentPw)
      await reauthenticateWithCredential(user, cred)
      await updatePassword(user, newPw)
      setPwMsg({ text: 'Password updated successfully.', ok: true })
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
    } catch (err: any) {
      setPwMsg({ text: friendlyError(err.code), ok: false })
    } finally {
      setPwLoading(false)
    }
  }

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setDelError(null)
    if (!user?.email) return

    setDelLoading(true)
    try {
      // Re-authenticate before deleting
      const cred = EmailAuthProvider.credential(user.email, deletePw)
      await reauthenticateWithCredential(user, cred)
      await deleteUser(user)
      router.replace('/login')
    } catch (err: any) {
      setDelError(friendlyError(err.code))
    } finally {
      setDelLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.replace('/login')
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '32px 20px 96px' }}>
      <h1 style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.03em', marginBottom: 32 }}>Settings</h1>

      {/* Account info */}
      <Section title="Account">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-2)', margin: '0 0 2px' }}>Signed in as</p>
            <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>{user?.email}</p>
          </div>
          <button onClick={handleSignOut} style={ghostBtn}>Sign out</button>
        </div>
      </Section>

      <Divider />

      {/* Change password */}
      <Section title="Change password">
        <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Field label="Current password">
            <input className="settings-input" type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••" required />
          </Field>
          <Field label="New password">
            <input className="settings-input" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Min. 8 characters" required />
          </Field>
          <Field label="Confirm new password">
            <input className="settings-input" type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="••••••••" required />
          </Field>

          {pwMsg && (
            <p style={{ fontSize: 13, color: pwMsg.ok ? 'var(--green)' : '#ef4444', margin: 0 }}>{pwMsg.text}</p>
          )}

          <button type="submit" disabled={pwLoading} style={primaryBtn(pwLoading)}>
            {pwLoading ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </Section>

      <Divider />

      {/* Danger zone */}
      <Section title="Danger zone">
        {!showDelete ? (
          <button onClick={() => setShowDelete(true)} style={{ ...ghostBtn, color: '#ef4444' }}>
            Delete account
          </button>
        ) : (
          <form onSubmit={handleDeleteAccount} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0, lineHeight: 1.6 }}>
              This will permanently delete your account and all your posts. Enter your password to confirm.
            </p>
            <Field label="Your password">
              <input className="settings-input" type="password" value={deletePw} onChange={e => setDeletePw(e.target.value)} placeholder="••••••••" required />
            </Field>
            {delError && <p style={{ fontSize: 13, color: '#ef4444', margin: 0 }}>{delError}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setShowDelete(false)} style={ghostBtn}>Cancel</button>
              <button type="submit" disabled={delLoading} style={{ ...primaryBtn(delLoading), background: '#ef4444', flex: 1 }}>
                {delLoading ? 'Deleting...' : 'Delete my account'}
              </button>
            </div>
          </form>
        )}
      </Section>

      {/* Input styles */}
      <style>{`
        .settings-input {
          width: 100%; padding: 11px 13px;
          background: var(--surface); color: var(--text-1);
          border: 0.5px solid var(--border); border-radius: 10px;
          font-size: 14px; font-family: var(--font);
          outline: none; transition: border 0.15s, box-shadow 0.15s;
          box-shadow: var(--shadow-sm);
        }
        .settings-input:focus {
          border-color: var(--border-mid);
          box-shadow: 0 0 0 3px rgba(0,0,0,0.04), var(--shadow-sm);
        }
      `}</style>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-2)', marginBottom: 12 }}>
        {title}
      </p>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-2)' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function Divider() {
  return <div style={{ height: 0.5, background: 'var(--border)', margin: '20px 0' }} />
}

const ghostBtn: React.CSSProperties = {
  background: 'none', border: 'none',
  fontSize: 13, fontWeight: 500,
  color: 'var(--text-2)', cursor: 'pointer',
  padding: '6px 0', fontFamily: 'var(--font)',
}

const primaryBtn = (loading: boolean): React.CSSProperties => ({
  width: '100%', padding: '12px',
  background: 'var(--btn-bg)', color: 'var(--btn-text)',
  border: 'none', borderRadius: 10,
  fontSize: 14, fontWeight: 600,
  cursor: loading ? 'default' : 'pointer',
  opacity: loading ? 0.6 : 1,
  marginTop: 4, letterSpacing: '-0.01em',
  fontFamily: 'var(--font)',
})

function friendlyError(code: string): string {
  const map: Record<string, string> = {
    'auth/wrong-password':         'Incorrect password.',
    'auth/invalid-credential':     'Incorrect password.',
    'auth/too-many-requests':      'Too many attempts. Try again later.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/requires-recent-login':  'Please sign out and sign back in first.',
  }
  return map[code] ?? 'Something went wrong. Try again.'
}
