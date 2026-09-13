'use client'

import { useAuth } from '@/hooks/useAuth'
import { usePosts } from '@/hooks/usePosts'
import { useTasks } from '@/hooks/useTasks'
import { useGoals } from '@/hooks/useGoals'
import TodayTask from '@/components/dashboard/TodayTask'
import UpcomingPosts from '@/components/dashboard/UpcomingPosts'
import InsightCard from '@/components/dashboard/InsightCard'
import { getInsights } from '@/lib/openai'
import Link from 'next/link'
import { useState } from 'react'

export default function DashboardPage() {
  const { user }                        = useAuth()
  const { posts, loading }              = usePosts(user?.uid ?? null)
  const { todayTask, toggle }           = useTasks(user?.uid ?? null)
  const { goals, add, toggle: toggleGoal, remove } = useGoals(user?.uid ?? null)

  const now  = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const dateStr  = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  const [newGoal,  setNewGoal]  = useState('')
  const [adding,   setAdding]   = useState(false)
  const [showInput, setShowInput] = useState(false)

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGoal.trim()) return
    setAdding(true)
    await add(newGoal.trim())
    setNewGoal('')
    setAdding(false)
    setShowInput(false)
  }

  const completedCount = goals.filter(g => g.completed).length
  const allDone = goals.length > 0 && completedCount === goals.length

  const shortCaptionCount = posts.filter(p => p.caption.length < 100).length
  const insights = getInsights({
    postsThisWeek: posts.length,
    shortCaptionCount,
    platform: 'instagram',
  })

  return (
    <div className="dashboard-page" style={{ padding: '32px 28px', maxWidth: 900, margin: '0 auto' }}>

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
      {todayTask && <TodayTask task={todayTask} onToggle={toggle} />}

      {/* Two column grid */}
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

          {/* Weekly goals */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-2)', margin: 0 }}>
                Weekly goals
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {goals.length > 0 && (
                  <span style={{ fontSize: 11, color: 'var(--text-2)' }}>
                    {completedCount}/{goals.length}
                  </span>
                )}
                <button
                  onClick={() => setShowInput(!showInput)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-2)', display: 'flex', padding: 2,
                  }}
                  title="Add goal"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Progress bar */}
            {goals.length > 0 && (
              <div style={{ height: 3, background: 'var(--border)', borderRadius: 3, marginBottom: 10, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${(completedCount / goals.length) * 100}%`,
                  background: allDone ? '#22c55e' : 'var(--btn-bg)',
                  borderRadius: 3, transition: 'width 0.3s ease',
                }} />
              </div>
            )}

            {/* Add goal input */}
            {showInput && (
              <form onSubmit={handleAddGoal} style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <input
                  autoFocus
                  value={newGoal}
                  onChange={e => setNewGoal(e.target.value)}
                  placeholder="e.g. Post 3 times this week"
                  maxLength={200}
                  style={{
                    flex: 1, padding: '8px 10px',
                    background: 'var(--surface)', color: 'var(--text-1)',
                    border: '0.5px solid var(--border-mid)', borderRadius: 8,
                    fontSize: 12, fontFamily: 'var(--font)', outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  disabled={adding || !newGoal.trim()}
                  style={{
                    padding: '8px 12px', borderRadius: 8,
                    background: 'var(--btn-bg)', color: 'var(--btn-text)',
                    border: 'none', fontSize: 12, fontWeight: 600,
                    cursor: adding ? 'default' : 'pointer',
                    opacity: adding ? 0.6 : 1,
                    fontFamily: 'var(--font)',
                  }}
                >
                  Add
                </button>
              </form>
            )}

            {/* Empty state */}
            {goals.length === 0 && !showInput && (
              <button
                onClick={() => setShowInput(true)}
                style={{
                  width: '100%', padding: '12px',
                  background: 'var(--surface)', border: '0.5px dashed var(--border-mid)',
                  borderRadius: 10, cursor: 'pointer',
                  fontSize: 12, color: 'var(--text-2)',
                  fontFamily: 'var(--font)',
                }}
              >
                + Set your goals for this week
              </button>
            )}

            {/* Goals list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {goals.map(goal => (
                <div
                  key={goal.goalId}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 12px',
                    background: goal.completed ? 'var(--green-dim)' : 'var(--surface)',
                    border: goal.completed ? '0.5px solid rgba(34,197,94,0.2)' : '0.5px solid var(--border)',
                    borderRadius: 9, boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.2s',
                  }}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleGoal(goal.goalId, !goal.completed)}
                    style={{
                      width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                      border: `1.5px solid ${goal.completed ? '#22c55e' : 'var(--border-mid)'}`,
                      background: goal.completed ? '#22c55e' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', transition: 'all 0.2s', padding: 0,
                    }}
                  >
                    {goal.completed && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                    )}
                  </button>

                  {/* Goal text */}
                  <span style={{
                    flex: 1, fontSize: 12,
                    color: goal.completed ? 'var(--text-2)' : 'var(--text-1)',
                    textDecoration: goal.completed ? 'line-through' : 'none',
                    transition: 'all 0.2s',
                  }}>
                    {goal.text}
                  </span>

                  {/* Delete */}
                  <button
                    onClick={() => remove(goal.goalId)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-3)', padding: 2, display: 'flex',
                      flexShrink: 0,
                    }}
                    title="Remove goal"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* All done celebration */}
            {allDone && (
              <div style={{
                marginTop: 10, padding: '10px 12px',
                background: 'var(--green-dim)',
                border: '0.5px solid rgba(34,197,94,0.2)',
                borderRadius: 9, textAlign: 'center',
              }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#22c55e', margin: 0 }}>
                  🎉 All goals done! You crushed this week.
                </p>
              </div>
            )}
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
