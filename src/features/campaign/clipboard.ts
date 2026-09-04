// Copy to the clipboard where the browser allows it; callers fall back to selecting the text.

export async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Not granted or not available; the caller selects the text instead.
  }
  return false
}

/** Select every character inside an element so the user can copy it by hand. */
export function selectContents(el: Element | null): void {
  if (!el || typeof window === 'undefined') return
  const selection = window.getSelection()
  if (!selection) return
  const range = document.createRange()
  range.selectNodeContents(el)
  selection.removeAllRanges()
  selection.addRange(range)
}
