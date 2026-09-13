'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createPost } from '@/lib/firestore'
import { uploadMedia, validateFile } from '@/lib/storage'
import { Timestamp } from 'firebase/firestore'
import type { Platform } from '@/types/post'

const PLATFORMS: { id: Platform; label: string; limit: number }[] = [
  { id: 'instagram', label: 'Instagram', limit: 2200 },
  { id: 'tiktok',   label: 'TikTok',    limit: 2200 },
  { id: 'youtube',  label: 'YouTube',   limit: 5000 },
]

type Generating = 'caption' | 'hashtags' | null

export default function CreatePage() {
  const { user } = useAuth()
  const router   = useRouter()

  const [platform,   setPlatform]   = useState<Platform>('instagram')
  const [title,      setTitle]      = useState('')
  const [caption,    setCaption]    = useState('')
  const [hashtags,   setHashtags]   = useState('')
  const [schedDate,  setSchedDate]  = useState('')
  const [schedTime,  setSchedTime]  = useState('')
  const [saving,     setSaving]     = useState(false)
  const [generating, setGenerating] = useState<Generating>(null)
  const [toast,      setToast]      = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  // Media state
  const [mediaFile,     setMediaFile]     = useState<File | null>(null)
  const [mediaPreview,  setMediaPreview]  = useState<string | null>(null)
  const [mediaType,     setMediaType]     = useState<'image' | 'video' | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [uploading,     setUploading]     = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const cp         = PLATFORMS.find(p => p.id === platform)!
  const captionLen = caption.length
  const captionPct = captionLen / cp.limit
  const charColor  = captionPct > 0.9 ? '#ef4444' : captionPct > 0.7 ? '#f59e0b' : 'var(--text-2)'

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const error = validateFile(file)
    if (error) { showToast(error, 'error'); return }

    const isImage = file.type.startsWith('image/')
    setMediaFile(file)
    setMediaType(isImage ? 'image' : 'video')
    setMediaPreview(URL.createObjectURL(file))
  }

  const removeMedia = () => {
    setMediaFile(null)
    setMediaPreview(null)
    setMediaType(null)
    setUploadProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const generate = async (type: 'caption' | 'hashtags') => {
    if (!title.trim()) { showToast('Add a title first', 'error'); return }
    setGenerating(type)
    try {
      const res  = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, platform, title, caption }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (type === 'caption') setCaption(data.result.slice(0, cp.limit))
      else setHashtags(data.result)
      showToast(type === 'caption' ? 'Caption ready' : 'Hashtags ready')
    } catch {
      showToast('Generation failed. Try again.', 'error')
    } finally {
      setGenerating(null)
    }
  }

  const handleSchedule = async (status: 'scheduled' | 'draft') => {
    if (!user) return
    if (status === 'scheduled' && (!schedDate || !schedTime)) {
      showToast('Pick a date and time', 'error'); return
    }
    if (!title.trim() || !caption.trim()) {
      showToast('Title and caption are required', 'error'); return
    }

    setSaving(true)
    try {
      let mediaUrl: string | undefined
      let uploadedMediaType: 'image' | 'video' | undefined

      // Upload media first if selected
      if (mediaFile) {
        setUploading(true)
        const result = await uploadMedia(mediaFile, user.uid, pct => setUploadProgress(pct))
        mediaUrl = result.url
        uploadedMediaType = result.mediaType
        setUploading(false)
      }

      const scheduledAt = status === 'scheduled'
        ? Timestamp.fromDate(new Date(`${schedDate}T${schedTime}`))
        : Timestamp.fromDate(new Date())

      await createPost({
        userId: user.uid, platform, title, caption, hashtags,
        scheduledAt, status,
        ...(mediaUrl && { mediaUrl, mediaType: uploadedMediaType }),
      })

      showToast(status === 'scheduled' ? 'Post scheduled' : 'Draft saved')
      setTimeout(() => router.push('/schedule'), 1200)
    } catch {
      showToast('Could not save. Try again.', 'error')
      setUploading(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 580, margin: '0 auto', padding: '32px 20px 96px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.03em', margin: 0 }}>New Post</h1>
        <button
          onClick={() => handleSchedule('draft')}
          disabled={saving}
          style={{ background: 'none', border: 'none', fontSize: 13, color: 'var(--text-2)', cursor: 'pointer', padding: '6px 0' }}
        >
          Save draft
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

        {/* Platform */}
        <Field label="Platform">
          <div style={{ display: 'flex', gap: 8 }}>
            {PLATFORMS.map(p => (
              <button
                key={p.id}
                onClick={() => setPlatform(p.id)}
                style={{
                  flex: 1, padding: '10px 8px', borderRadius: 10,
                  border: platform === p.id ? `1px solid var(--border-mid)` : '0.5px solid var(--border)',
                  background: platform === p.id ? 'var(--surface-2)' : 'var(--surface)',
                  color: platform === p.id ? 'var(--text-1)' : 'var(--text-2)',
                  fontSize: 13, fontWeight: platform === p.id ? 500 : 400,
                  cursor: 'pointer', transition: 'all 0.15s',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </Field>

        {/* Media upload */}
        <Field label="Media">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          {!mediaPreview ? (
            // Upload button
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '100%', padding: '28px 16px',
                background: 'var(--surface)',
                border: '1px dashed var(--border-mid)',
                borderRadius: 12, cursor: 'pointer',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 8,
                transition: 'border-color 0.15s',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <path d="M21 15l-5-5L5 21"/>
              </svg>
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
                Upload photo or video
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                JPG, PNG, GIF, MP4, MOV · Max 10MB image / 200MB video
              </span>
            </button>
          ) : (
            // Preview
            <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: 'var(--surface-2)' }}>
              {mediaType === 'image' ? (
                <img
                  src={mediaPreview}
                  alt="Preview"
                  style={{ width: '100%', maxHeight: 320, objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <video
                  src={mediaPreview}
                  controls
                  style={{ width: '100%', maxHeight: 320, display: 'block' }}
                />
              )}

              {/* Upload progress overlay */}
              {uploading && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(0,0,0,0.5)',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 10,
                }}>
                  <span style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>{uploadProgress}%</span>
                  <div style={{ width: 120, height: 4, background: 'rgba(255,255,255,0.3)', borderRadius: 4 }}>
                    <div style={{ width: `${uploadProgress}%`, height: '100%', background: '#fff', borderRadius: 4, transition: 'width 0.2s' }} />
                  </div>
                </div>
              )}

              {/* Remove button */}
              {!uploading && (
                <button
                  onClick={removeMedia}
                  style={{
                    position: 'absolute', top: 8, right: 8,
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.6)', border: 'none',
                    cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              )}

              {/* File info */}
              <div style={{ padding: '8px 12px', fontSize: 11, color: 'var(--text-2)' }}>
                {mediaFile?.name} · {mediaFile ? (mediaFile.size / (1024 * 1024)).toFixed(1) : 0}MB
              </div>
            </div>
          )}
        </Field>

        {/* Title */}
        <Field label="Title">
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="What's this post about?"
            style={inputStyle}
          />
        </Field>

        {/* Caption */}
        <Field label="Caption" right={
          <span style={{ fontSize: 11, color: charColor, fontVariantNumeric: 'tabular-nums', transition: 'color 0.2s' }}>
            {captionLen} / {cp.limit}
          </span>
        }>
          <textarea
            value={caption}
            onChange={e => setCaption(e.target.value.slice(0, cp.limit))}
            placeholder={`Write your ${cp.label} caption...`}
            rows={5}
            style={{ ...inputStyle, resize: 'none', lineHeight: 1.65 }}
          />
          {captionLen > 0 && (
            <div style={{ height: 2, background: 'var(--border)', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.min(captionPct * 100, 100)}%`,
                background: captionPct > 0.9 ? '#ef4444' : captionPct > 0.7 ? '#f59e0b' : 'var(--text-3)',
                borderRadius: 2, transition: 'width 0.2s, background 0.3s',
              }} />
            </div>
          )}
          <AIButton onClick={() => generate('caption')} loading={generating === 'caption'} disabled={!!generating && generating !== 'caption'}>
            Generate caption
          </AIButton>
        </Field>

        {/* Hashtags */}
        <Field label="Hashtags">
          <input
            type="text"
            value={hashtags}
            onChange={e => setHashtags(e.target.value)}
            placeholder="#contentcreator #growthmindset"
            style={inputStyle}
          />
          <AIButton onClick={() => generate('hashtags')} loading={generating === 'hashtags'} disabled={!!generating && generating !== 'hashtags'}>
            Suggest hashtags
          </AIButton>
        </Field>

        <div style={{ height: 0.5, background: 'var(--border)' }} />

        {/* Schedule */}
        <Field label="Schedule">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)} style={inputStyle} />
            <input type="time" value={schedTime} onChange={e => setSchedTime(e.target.value)} style={inputStyle} />
          </div>
        </Field>

        {/* CTA */}
        <button
          onClick={() => handleSchedule('scheduled')}
          disabled={saving || uploading}
          style={{
            width: '100%', padding: '13px',
            background: 'var(--btn-bg)', color: 'var(--btn-text)',
            border: 'none', borderRadius: 10,
            fontSize: 14, fontWeight: 600,
            cursor: saving || uploading ? 'default' : 'pointer',
            opacity: saving || uploading ? 0.6 : 1,
            transition: 'opacity 0.2s',
            letterSpacing: '-0.01em',
          }}
        >
          {uploading ? `Uploading ${uploadProgress}%...` : saving ? 'Saving...' : 'Schedule Post'}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%',
          transform: 'translateX(-50%)',
          background: toast.type === 'error' ? '#ef4444' : 'var(--btn-bg)',
          color: toast.type === 'error' ? '#fff' : 'var(--btn-text)',
          padding: '10px 18px', borderRadius: 10,
          fontSize: 13, fontWeight: 500,
          boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
          animation: 'slide-up-toast 0.2s ease',
          whiteSpace: 'nowrap', zIndex: 100,
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', display: 'block',
  background: 'var(--surface)',
  border: '0.5px solid var(--border)',
  borderRadius: 10, padding: '11px 13px',
  fontSize: 14, color: 'var(--text-1)',
  outline: 'none', fontFamily: 'var(--font)',
  boxShadow: 'var(--shadow-sm)',
}

function Field({ label, right, children }: { label: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
        <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-2)' }}>
          {label}
        </label>
        {right}
      </div>
      {children}
    </div>
  )
}

function AIButton({ onClick, loading, disabled, children }: {
  onClick: () => void; loading: boolean; disabled: boolean; children: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '7px 13px', borderRadius: 8, marginTop: 8,
        border: '0.5px solid var(--border)',
        background: 'var(--surface)', color: 'var(--text-1)',
        fontSize: 13, fontWeight: 500,
        cursor: disabled || loading ? 'default' : 'pointer',
        opacity: disabled ? 0.38 : 1,
        transition: 'opacity 0.15s',
        boxShadow: 'var(--shadow-sm)',
        fontFamily: 'var(--font)',
      }}
    >
      {loading
        ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 0.7s linear infinite' }}><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
        : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>
      }
      {loading ? 'Working...' : children}
    </button>
  )
}
