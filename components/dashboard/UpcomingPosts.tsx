import type { Post } from '@/types/post'

const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#E1306C',
  tiktok:    '#2DD4BF',
  youtube:   '#FF4040',
}

export default function UpcomingPosts({ posts, loading }: { posts: Post[]; loading: boolean }) {
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-2)', marginBottom: 10 }}>
        Upcoming Posts
      </p>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2" style={{ animation: 'spin 0.7s linear infinite' }}>
            <path d="M21 12a9 9 0 11-6.219-8.56"/>
          </svg>
        </div>
      )}

      {!loading && posts.length === 0 && (
        <div style={{ padding: '28px 0', color: 'var(--text-2)', fontSize: 13 }}>
          No upcoming posts.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {posts.map((post, i) => {
          const color   = PLATFORM_COLORS[post.platform]
          const date    = post.scheduledAt.toDate()
          const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
          const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
          const isDraft = post.status === 'draft'

          return (
            <div key={post.postId} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px',
              background: 'var(--surface)', border: '0.5px solid var(--border)',
              borderRadius: 10, boxShadow: 'var(--shadow-sm)',
              animation: `fade-up 0.3s ease ${i * 0.06}s both`,
            }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 500, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {post.title}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0 }}>
                  {dateStr} · {timeStr}
                </p>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 500, padding: '3px 9px', borderRadius: 20,
                background: isDraft ? 'var(--surface-2)' : `${color}16`,
                color: isDraft ? 'var(--text-2)' : color,
                border: isDraft ? '0.5px solid var(--border)' : `0.5px solid ${color}30`,
                flexShrink: 0,
              }}>
                {isDraft ? 'Draft' : 'Scheduled'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
