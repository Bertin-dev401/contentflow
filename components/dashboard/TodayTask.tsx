'use client'

import type { Task } from '@/types/task'

export default function TodayTask({ task, onToggle }: { task: Task; onToggle: () => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 16px',
      background: 'var(--green-dim)',
      border: '0.5px solid rgba(34,197,94,0.18)',
      borderRadius: 12,
      marginBottom: 4,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: '#22c55e', flexShrink: 0,
          animation: task.completed ? 'none' : 'pulse-dot 2s ease infinite',
        }} />
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#22c55e', margin: '0 0 2px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Today
          </p>
          <p style={{
            fontSize: 14, margin: 0, fontWeight: task.completed ? 400 : 500,
            textDecoration: task.completed ? 'line-through' : 'none',
            opacity: task.completed ? 0.5 : 1,
            transition: 'all 0.2s',
          }}>
            {task.message}
          </p>
        </div>
      </div>

      <button
        onClick={onToggle}
        style={{
          width: 22, height: 22, borderRadius: 6, flexShrink: 0,
          border: `1.5px solid ${task.completed ? '#22c55e' : 'var(--border-mid)'}`,
          background: task.completed ? '#22c55e' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 0.2s',
        }}
      >
        {task.completed && (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        )}
      </button>
    </div>
  )
}
