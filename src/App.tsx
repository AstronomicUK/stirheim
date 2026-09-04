import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router'
import { isSupabaseConfigured } from './api/supabase'
import { NotConfigured } from './app/NotConfigured'
import { queryClient } from './app/queryClient'
import { router } from './app/router'

export default function App() {
  if (!isSupabaseConfigured()) return <NotConfigured />
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
