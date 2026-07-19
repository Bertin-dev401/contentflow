'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signUp } from '@/lib/auth'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    try {
      await signUp(email, password)
      router.push('/')
    } catch (err: any) {
      setError(friendlyError(err.code))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: 380 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 36 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'var(--btn-bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--btn-text)">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
        </div>
        <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.02em' }}>ContentFlow</span>
      </div>

      <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.03em', marginBottom: 6 }}>
        Create your account
      </h1>
      <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 28 }}>
        Start planning your content today
      </p>

      <style>{`
        .auth-input {
          width: 100%; padding: 11px 13px;
          background: var(--surface); color: var(--text-1);
          border: 0.5px solid var(--border); border-radius: 10px;
          font-size: 14px; font-family: var(--font);
          outline: none; transition: border 0.15s, box-shadow 0.15s;
          box-shadow: var(--shadow-sm);
        }
        .auth-input:focus {
          border-color: var(--border-mid);
          box-shadow: 0 0 0 3px rgba(0,0,0,0.04), var(--shadow-sm);
        }
      `}</style>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-2)' }}>
            Email
          </label>
          <input className="auth-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoFocus />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-2)' }}>
            Password
          </label>
          <input className="auth-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" required />
        </div>

        {error && <p style={{ fontSize: 13, color: '#ef4444', margin: 0 }}>{error}</p>}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', padding: '12px',
            background: 'var(--btn-bg)', color: 'var(--btn-text)',
            border: 'none', borderRadius: 10,
            fontSize: 14, fontWeight: 600,
            cursor: loading ? 'default' : 'pointer',
            opacity: loading ? 0.6 : 1,
            marginTop: 4, letterSpacing: '-0.01em',
          }}
        >
          {loading ? 'Creating account...' : 'Get started'}
        </button>
      </form>

      <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 20, textAlign: 'center' }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: 'var(--text-1)', fontWeight: 500 }}>Sign in</Link>
      </p>
    </div>
  )
}

function friendlyError(code: string): string {
  const map: Record<string, string> = {
    'auth/email-already-in-use':   'An account with this email already exists.',
    'auth/invalid-email':          'Invalid email address.',
    'auth/weak-password':          'Password is too weak.',
    'auth/network-request-failed': 'Network error. Check your connection.',
  }
  return map[code] ?? 'Something went wrong. Try again.'
}
