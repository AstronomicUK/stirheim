import { createBrowserRouter } from 'react-router'
import { AccountPage } from '../features/account/AccountPage'
import { ForgotPasswordPage } from '../features/account/ForgotPasswordPage'
import { ResetPasswordPage } from '../features/account/ResetPasswordPage'
import { SignInPage } from '../features/account/SignInPage'
import { SignUpPage } from '../features/account/SignUpPage'
import { HomePage } from '../features/home/HomePage'
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
            <HomePage />
          </RequireAuth>
        ),
      },
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
