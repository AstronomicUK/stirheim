import type { ReactNode } from 'react'

type Tone = 'info' | 'error' | 'success' | 'warn'

export interface NoticeProps {
  tone?: Tone
  title?: string
  children: ReactNode
}

const tones: Record<Tone, string> = {
  info: 'border-border bg-surface-low text-ink',
  error: 'border-accent-strong/60 bg-accent/10 text-ink',
  success: 'border-ok/60 bg-ok/10 text-ink',
  warn: 'border-warn/60 bg-warn/10 text-ink',
}

export function Notice({ tone = 'info', title, children }: NoticeProps) {
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-md border px-4 py-3 text-sm leading-relaxed ${tones[tone]}`}>
      {title ? <p className="mb-1 font-medium">{title}</p> : null}
      <div className="text-ink-dim">{children}</div>
    </div>
  )
}
