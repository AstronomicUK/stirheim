import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../api/supabase'
import { useSession } from '../../app/session'
import { findWarbandTemplate } from '../../rules/data/warbandTemplates'
import { Notice, PageHeader, Spinner } from '../../ui'

interface WarbandSummary {
  id: string
  name: string
  type_rules_id: string
}

async function fetchVisibleWarbands(): Promise<WarbandSummary[]> {
  const { data, error } = await supabase.from('warbands').select('id, name, type_rules_id').order('name')
  if (error) throw new Error(error.message)
  return data
}

export function HomePage() {
  const user = useSession((s) => s.user)
  const profile = useSession((s) => s.profile)
  const warbands = useQuery({
    queryKey: ['warbands', 'visible', user?.id],
    queryFn: fetchVisibleWarbands,
    enabled: Boolean(user),
  })

  const greeting = profile ? `Welcome, ${profile.display_name}` : 'Welcome'

  return (
    <>
      <PageHeader
        eyebrow="Home"
        title={greeting}
        description="Your warbands and the campaigns they fight in will gather here."
      />

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-headline text-xl font-semibold text-ink">Warbands you can see</h2>
          {warbands.data ? <span className="text-sm text-ink-dim">{warbands.data.length}</span> : null}
        </div>

        {warbands.isPending ? (
          <div className="flex justify-center py-8">
            <Spinner label="Loading warbands" />
          </div>
        ) : warbands.isError ? (
          <Notice tone="error" title="Could not load warbands">
            {warbands.error.message}
          </Notice>
        ) : warbands.data.length === 0 ? (
          <Notice>No warbands yet. Rosters arrive in Phase 4; for now this list proves the connection.</Notice>
        ) : (
          <ul className="flex flex-col divide-y divide-border rounded-md border border-border bg-surface-low">
            {warbands.data.map((w) => (
              <li key={w.id} className="flex flex-col gap-0.5 px-4 py-3">
                <span className="text-ink">{w.name}</span>
                <span className="text-sm text-ink-dim">{findWarbandTemplate(w.type_rules_id)?.name ?? w.type_rules_id}</span>
              </li>
            ))}
          </ul>
        )}

        <p className="text-sm leading-relaxed text-ink-dim">
          This shows every warband you own or share a campaign with. Building and editing rosters arrives in Phase 4.
        </p>
      </section>
    </>
  )
}
