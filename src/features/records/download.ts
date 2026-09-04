// Hand the browser a file to save: a Blob behind a temporary <a download> click. DOM only, so
// not unit tested; the CSV text itself comes from the pure csv.ts.

/** Offers `text` as a download. UTF-8 with a BOM so spreadsheets read accented names correctly. */
export function downloadTextFile(text: string, fileName: string, mime = 'text/csv;charset=utf-8'): void {
  if (typeof document === 'undefined') return
  const blob = new Blob(['\uFEFF', text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Give the browser a moment to start the download before the URL goes away.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
