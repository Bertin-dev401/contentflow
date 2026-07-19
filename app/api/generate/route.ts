import { NextRequest, NextResponse } from 'next/server'
import { generateCaption, generateHashtags } from '@/lib/openai'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, platform, title, caption } = body

    if (!type || !platform || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['caption', 'hashtags'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    const opts = { platform, title, caption }

    const result = type === 'caption'
      ? await generateCaption(opts)
      : await generateHashtags(opts)

    return NextResponse.json({ result })
  } catch (err: any) {
    console.error('[/api/generate]', err)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
