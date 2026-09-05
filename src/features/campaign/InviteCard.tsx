// The invite code in large type with Copy buttons for the code and the join link, plus the
// phone's share sheet where the browser offers one. Copy uses the clipboard API where allowed and
// otherwise selects the text so the user can copy it by hand.

import { useEffect, useRef, useState } from 'react'
import { Button } from '../../ui'
import { inviteShareData } from '../onboarding/checklist'
import { Card } from './bits'
import { copyText, selectContents } from './clipboard'
import { formatInviteCode, joinLink } from './inviteCode'

type Copied = 'code' | 'link' | 'manual' | null

export interface InviteCardProps {
  code: string
  archived?: boolean
  /** Names the campaign in the share sheet's title. */
  campaignName?: string
}

function canShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function'
}

export function InviteCard({ code, archived = false, campaignName }: InviteCardProps) {
  const codeRef = useRef<HTMLSpanElement>(null)
  const linkRef = useRef<HTMLSpanElement>(null)
  const [copied, setCopied] = useState<Copied>(null)
  const [shareable] = useState(canShare)
  const pretty = formatInviteCode(code)
  const link = joinLink(typeof window !== 'undefined' ? window.location.origin : '', code)

  useEffect(() => {
    if (!copied || copied === 'manual') return
    const t = setTimeout(() => setCopied(null), 2000)
    return () => clearTimeout(t)
  }, [copied])

  async function copy(kind: 'code' | 'link') {
    const ok = await copyText(kind === 'code' ? pretty : link)
    if (ok) {
      setCopied(kind)
    } else {
      selectContents(kind === 'code' ? codeRef.current : linkRef.current)
      setCopied('manual')
    }
  }

  async function share() {
    try {
      await navigator.share(inviteShareData(pretty, link, campaignName))
    } catch (e) {
      // Cancelling the sheet rejects with AbortError; anything else falls back to copying the link.
      if (e instanceof DOMException && e.name === 'AbortError') return
      await copy('link')
    }
  }

  return (
    <Card className="flex flex-col gap-3 px-4 py-4">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-wider text-ink-dim">Invite code</span>
        <span ref={codeRef} className="select-all text-3xl tracking-[0.15em] text-ink tabular-nums">
          {pretty}
        </span>
      </div>
      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={() => void copy('code')}>
          {copied === 'code' ? 'Copied' : 'Copy code'}
        </Button>
        <Button variant="secondary" className="flex-1" onClick={() => void copy('link')}>
          {copied === 'link' ? 'Copied' : 'Copy link'}
        </Button>
        {shareable ? (
          <Button variant="secondary" className="flex-1" onClick={() => void share()}>
            Share
          </Button>
        ) : null}
      </div>
      <p className="break-all text-xs text-ink-dim">
        <span ref={linkRef} className="select-all">
          {link}
        </span>
      </p>
      <p className="text-sm leading-relaxed text-ink-dim" aria-live="polite">
        {copied === 'manual'
          ? 'The clipboard is not available here. The text is selected; copy it by hand.'
          : archived
            ? 'The campaign is archived, so the code does not admit anyone for now.'
            : 'Anyone with the code can enrol one of their warbands.'}
      </p>
    </Card>
  )
}
