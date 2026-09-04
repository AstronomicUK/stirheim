import { Link } from 'react-router'
import { PageHeader } from '../ui'

export function NotFoundPage() {
  return (
    <>
      <PageHeader eyebrow="Nothing here" title="Page not found" description="That address is not in the ledger." />
      <Link to="/" className="text-brass underline-offset-4 hover:underline">
        Back to the start
      </Link>
    </>
  )
}
