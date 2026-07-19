const COLORS = ['#E1306C', '#f59e0b', '#2DD4BF', '#667eea']

export default function InsightCard({ text, index }: { text: string; index: number }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 8,
      padding: '10px 12px',
      background: 'var(--surface)', border: '0.5px solid var(--border)',
      borderRadius: 10, boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ width: 5, height: 5, borderRadius: '50%', background: COLORS[index % COLORS.length], marginTop: 5, flexShrink: 0 }} />
      <span style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.65 }}>{text}</span>
    </div>
  )
}
