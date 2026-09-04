import { createBrowserRouter, Navigate } from 'react-router'
import { AccountPage } from '../features/account/AccountPage'
import { ForgotPasswordPage } from '../features/account/ForgotPasswordPage'
import { ResetPasswordPage } from '../features/account/ResetPasswordPage'
import { SignInPage } from '../features/account/SignInPage'
import { SignUpPage } from '../features/account/SignUpPage'
import { BuilderPage } from '../features/roster/BuilderPage'
import { EditWarbandPage } from '../features/roster/EditWarbandPage'
import { NewWarbandPage } from '../features/roster/NewWarbandPage'
import { PrintPage } from '../features/roster/PrintPage'
import { WarbandListPage } from '../features/roster/WarbandListPage'
import { WarbandPage } from '../features/roster/WarbandPage'
import { AppShell } from './AppShell'
import { NotFoundPage } from './NotFoundPage'
import { RequireAuth, RequireGuest } from './RequireAuth'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: (
          <RequireAuth>
            <WarbandListPage />
          </RequireAuth>
        ),
      },
      { path: 'warbands', element: <Navigate to="/" replace /> },
      { path: 'warbands/new', element: <RequireAuth><NewWarbandPage /></RequireAuth> },
      { path: 'warbands/new/:templateId', element: <RequireAuth><BuilderPage /></RequireAuth> },
      { path: 'warbands/:id', element: <RequireAuth><WarbandPage /></RequireAuth> },
      { path: 'warbands/:id/edit', element: <RequireAuth><EditWarbandPage /></RequireAuth> },
      { path: 'warbands/:id/print', element: <RequireAuth><PrintPage /></RequireAuth> },
      {
        path: 'account',
        element: (
          <RequireAuth>
            <AccountPage />
          </RequireAuth>
        ),
      },
      {
        path: 'sign-in',
        element: (
          <RequireGuest>
            <SignInPage />
          </RequireGuest>
        ),
      },
      {
        path: 'sign-up',
        element: (
          <RequireGuest>
            <SignUpPage />
          </RequireGuest>
        ),
      },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      // No guest gate: the recovery link signs the user in before this screen renders.
      { path: 'reset-password', element: <ResetPasswordPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
