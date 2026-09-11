import { useSearchParams } from 'react-router'

export function useCampaignSection(options: readonly string[]) {
  const [params, setParams] = useSearchParams()
  const requested = params.get('section')
  const section = requested && options.includes(requested) ? requested : options[0]
  const select = (value: string) => setParams(current => {
    const next = new URLSearchParams(current)
    next.set('section', value)
    return next
  }, { replace: true, preventScrollReset: true })
  return [section, select] as const
}
