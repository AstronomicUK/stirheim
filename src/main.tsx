import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { isSupabaseConfigured } from './api/supabase'
import { startSessionListener } from './app/session'
import App from './App.tsx'

// Start listening before the first render so the auth gate never sees a stale state, and so
// StrictMode's double effects cannot subscribe twice.
if (isSupabaseConfigured()) startSessionListener()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
