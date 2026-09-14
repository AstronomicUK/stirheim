/** Keep the production version aligned with the release published after deployment verification. */
export const APP_VERSION: string = import.meta.env.VITE_APP_VERSION ?? (import.meta.env.DEV ? 'Development preview' : '2026.09.14.1')
