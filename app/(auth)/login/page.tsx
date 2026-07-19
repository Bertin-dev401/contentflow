'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signIn(email, password)
      router.push('/')
    } catch (err: any) {
      setError(friendlyError(err.code))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: 380 }}>
      {/* Logo */}
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
        Welcome back
      </h1>
      <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 28 }}>
        Sign in to your account
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field label="Email">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoFocus
          />
        </Field>

        <Field label="Password">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </Field>

        {error && (
          <p style={{ fontSize: 13, color: '#ef4444', margin: 0 }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', padding: '12px',
            background: 'var(--btn-bg)', color: 'var(--btn-text)',
            border: 'none', borderRadius: 10,
            fontSize: 14, fontWeight: 600, cursor: loading ? 'default' : 'pointer',
            opacity: loading ? 0.6 : 1,
            marginTop: 4,
            letterSpacing: '-0.01em',
          }}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 20, textAlign: 'center' }}>
        No account?{' '}
        <Link href="/signup" style={{ color: 'var(--text-1)', fontWeight: 500 }}>
          Create one
        </Link>
      </p>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{
        fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
        textTransform: 'uppercase', color: 'var(--text-2)',
      }}>
        {label}
      </label>
      <style>{`
        input[type=email], input[type=password] {
          width: 100%; padding: 11px 13px;
          background: var(--surface); color: var(--text-1);
          border: 0.5px solid var(--border); border-radius: 10px;
          font-size: 14px; font-family: var(--font);
          outline: none; transition: border 0.15s, box-shadow 0.15s;
          box-shadow: var(--shadow-sm);
        }
        input[type=email]:focus, input[type=password]:focus {
          border-color: var(--border-mid);
          box-shadow: 0 0 0 3px rgba(0,0,0,0.04), var(--shadow-sm);
        }
      `}</style>
      {children}
    </div>
  )
}

function friendlyError(code: string): string {
  const map: Record<string, string> = {
    'auth/invalid-credential':        'Email or password is incorrect.',
    'auth/user-not-found':            'No account with that email.',
    'auth/wrong-password':            'Incorrect password.',
    'auth/too-many-requests':         'Too many attempts. Try again later.',
    'auth/network-request-failed':    'Network error. Check your connection.',
  }
  return map[code] ?? 'Something went wrong. Try again.'
}
