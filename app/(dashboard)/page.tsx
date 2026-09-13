'use client'

import { useAuth } from '@/hooks/useAuth'
import { usePosts } from '@/hooks/usePosts'
import { useTasks } from '@/hooks/useTasks'
import TodayTask from '@/components/dashboard/TodayTask'
import UpcomingPosts from '@/components/dashboard/UpcomingPosts'
import InsightCard from '@/components/dashboard/InsightCard'
import { getInsights } from '@/lib/openai'
import Link from 'next/link'

export default function DashboardPage() {
  const { user }              = useAuth()
  const { posts, loading }    = usePosts(user?.uid ?? null)
  const { todayTask, toggle } = useTasks(user?.uid ?? null)

  const now  = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const dateStr  = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  const shortCaptionCount = posts.filter(p => p.caption.length < 100).length
  const insights = getInsights({
    postsThisWeek: posts.length,
    shortCaptionCount,
    platform: 'instagram',
  })

  return (
    <div style={{ padding: '32px 28px', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 4 }}>{dateStr}</p>
          <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.03em', margin: 0 }}>{greeting}</h1>
        </div>
        <Link href="/create" style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          padding: '9px 16px', borderRadius: 9,
          background: 'var(--btn-bg)', color: 'var(--btn-text)',
          textDecoration: 'none', fontSize: 13, fontWeight: 600,
          letterSpacing: '-0.01em',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          New Post
        </Link>
      </div>

      {/* Today task */}
      {todayTask && (
        <TodayTask task={todayTask} onToggle={toggle} />
      )}

      {/* Two column */}
      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, marginTop: 20 }}>
        <UpcomingPosts posts={posts} loading={loading} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Stats */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-2)', marginBottom: 10 }}>This week</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Scheduled', value: posts.filter(p => p.status === 'scheduled').length },
                { label: 'Drafts',    value: posts.filter(p => p.status === 'draft').length },
              ].map(s => (
                <div key={s.label} style={{ padding: '12px', background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 10, boxShadow: 'var(--shadow-sm)' }}>
                  <p style={{ fontSize: 22, fontWeight: 600, margin: '0 0 2px', letterSpacing: '-0.04em' }}>{s.value}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-2)', margin: 0 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Insights */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-2)', marginBottom: 10 }}>Insights</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {insights.map((text, i) => (
                <InsightCard key={i} text={text} index={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
