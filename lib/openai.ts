// This runs ONLY in Next.js API routes (server-side).
// Never call OpenAI directly from the browser — the key would be exposed.

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

interface GenerateOptions {
  platform: 'instagram' | 'tiktok' | 'youtube'
  title: string
  caption?: string
}

// Shared fetch wrapper
async function callOpenAI(prompt: string): Promise<string> {
  const res = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',   // fast and cheap — perfect for MVP
      max_tokens: 500,
      temperature: 0.8,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error?.error?.message || `OpenAI error: ${res.status}`)
  }

  const data = await res.json()
  return (data.choices?.[0]?.message?.content ?? '').trim()
}

// ─── CAPTION ─────────────────────────────────────────────────────────────────

const CHAR_LIMITS: Record<string, number> = {
  instagram: 400,
  tiktok: 150,
  youtube: 500,
}

export async function generateCaption(opts: GenerateOptions): Promise<string> {
  const limit = CHAR_LIMITS[opts.platform]
  const prompt = `Write an engaging ${opts.platform} caption for a post titled "${opts.title}".
Hook first. Conversational. Platform-appropriate tone.
Keep it under ${limit} characters.
Return ONLY the caption. No quotes, no explanation, no hashtags.`

  const result = await callOpenAI(prompt)
  return result.slice(0, limit)
}

// ─── HASHTAGS ─────────────────────────────────────────────────────────────────

export async function generateHashtags(opts: GenerateOptions): Promise<string> {
  const context = opts.caption
    ? `Caption: "${opts.caption.slice(0, 200)}"`
    : ''

  const prompt = `Suggest 10 relevant hashtags for a ${opts.platform} post.
Title: "${opts.title}"
${context}
Return ONLY space-separated hashtags starting with #. No explanation, no numbering.`

  return await callOpenAI(prompt)
}

// ─── INSIGHTS ─────────────────────────────────────────────────────────────────
// Simple logic-based insights — no AI call needed for MVP.
// Kept here so the insights module has one home.

interface InsightContext {
  postsThisWeek: number
  mostActiveHour?: number     // 0–23
  shortCaptionCount: number   // captions < 100 chars
  platform: string
}

export function getInsights(ctx: InsightContext): string[] {
  const insights: string[] = []

  if (ctx.postsThisWeek === 0) {
    insights.push("You haven't posted this week. Consistency matters more than perfection.")
  }

  if (ctx.mostActiveHour !== undefined) {
    const hour = ctx.mostActiveHour
    if (hour < 12) insights.push('Your scheduled posts lean early morning. Try adding an evening slot.')
    if (hour >= 12 && hour < 17) insights.push('Afternoon posts often get buried. Consider scheduling for 7–9 PM.')
    if (hour >= 17) insights.push('Your evening posts tend to perform better. Keep that cadence.')
  }

  if (ctx.shortCaptionCount > 2) {
    insights.push('Several captions are under 100 characters. A stronger hook could improve engagement.')
  }

  if (insights.length === 0) {
    insights.push("You're on track. Keep the consistency going.")
  }

  return insights
}
