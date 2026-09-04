import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { useMemo } from 'react'

marked.setOptions({ gfm: true, breaks: false })

export interface MarkdownProps {
  source: string
  className?: string
}

/**
 * Rules text and campaign notes are Markdown (scraped scenarios, GM house rules). Rendered with
 * marked and sanitised with DOMPurify because other members write some of it.
 */
export function Markdown({ source, className = '' }: MarkdownProps) {
  const html = useMemo(() => DOMPurify.sanitize(marked.parse(source, { async: false }) as string), [source])
  if (!source.trim()) return null
  return <div className={`markdown text-ink ${className}`} dangerouslySetInnerHTML={{ __html: html }} />
}
