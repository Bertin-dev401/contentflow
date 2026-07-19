'use client'

import { useAuth } from '@/hooks/useAuth'
import { usePosts } from '@/hooks/usePosts'
import { deletePost, updatePost } from '@/lib/firestore'
import type { Post } from '@/types/post'
import Link from 'next/link'

const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#E1306C',
  tiktok:    '#2DD4BF',
  youtube:   '#FF4040',
}

export default function SchedulePage() {
  const { user }           = useAuth()
  const { posts, loading } = usePosts(user?.uid ?? null)

  const scheduled = posts.filter(p => p.status === 'scheduled')
  const drafts    = posts.filter(p => p.status === 'draft')

  const handleDelete = async (postId: string) => {
    if (!confirm('Delete this post?')) return
    await deletePost(postId)
  }

  const handlePublish = async (post: Post) => {
    await updatePost(post.postId, { status: 'scheduled' })
  }

  if (loading) return <PageShell><Spinner /></PageShell>

  return (
    <PageShell>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.03em', margin: 0 }}>Schedule</h1>
        <Link href="/create" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '8px 14px', borderRadius: 9,
          background: 'var(--btn-bg)', color: 'var(--btn-text)',
          textDecoration: 'none', fontSize: 13, fontWeight: 600,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
          New Post
        </Link>
      </div>

      {posts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-2)' }}>
          <p style={{ fontSize: 14 }}>No posts yet.</p>
          <Link href="/create" style={{ fontSize: 13, color: 'var(--text-1)', fontWeight: 500 }}>Create your first post</Link>
        </div>
      )}

      {scheduled.length > 0 && (
        <Section label="Scheduled">
          {scheduled.map((p, i) => <PostRow key={p.postId} post={p} index={i} onDelete={handleDelete} />)}
        </Section>
      )}

      {drafts.length > 0 && (
        <Section label="Drafts">
          {drafts.map((p, i) => <PostRow key={p.postId} post={p} index={i} onDelete={handleDelete} onPublish={handlePublish} />)}
        </Section>
      )}
    </PageShell>
  )
}

function PageShell({ children }: { children: React.ReactNode }) {
  return <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 20px 96px' }}>{children}</div>
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-2)', marginBottom: 10 }}>{label}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{children}</div>
    </div>
  )
}

function PostRow({ post, index, onDelete, onPublish }: {
  post: Post; index: number;
  onDelete: (id: string) => void;
  onPublish?: (post: Post) => void;
}) {
  const color   = PLATFORM_COLORS[post.platform]
  const dateStr = post.scheduledAt.toDate().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const timeStr = post.scheduledAt.toDate().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '12px 14px',
      background: 'var(--surface)', border: '0.5px solid var(--border)',
      borderRadius: 10, boxShadow: 'var(--shadow-sm)',
      animation: `fade-up 0.3s ease ${index * 0.05}s both`,
    }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 500, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</p>
        <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0 }}>{dateStr} · {timeStr}</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {onPublish && (
          <button onClick={() => onPublish(post)} style={ghostBtn}>Schedule</button>
        )}
        <button onClick={() => onDelete(post.postId)} style={{ ...ghostBtn, color: '#ef4444' }}>Delete</button>
      </div>
    </div>
  )
}

const ghostBtn: React.CSSProperties = {
  background: 'none', border: 'none',
  fontSize: 12, fontWeight: 500,
  color: 'var(--text-2)', cursor: 'pointer',
  padding: '4px 6px',
  fontFamily: 'var(--font)',
}

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2" style={{ animation: 'spin 0.7s linear infinite' }}>
        <path d="M21 12a9 9 0 11-6.219-8.56"/>
      </svg>
    </div>
  )
}
