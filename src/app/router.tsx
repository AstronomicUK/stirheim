import { createBrowserRouter, Navigate } from 'react-router'
import { AccountPage } from '../features/account/AccountPage'
import { ForgotPasswordPage } from '../features/account/ForgotPasswordPage'
import { ResetPasswordPage } from '../features/account/ResetPasswordPage'
import { SignInPage } from '../features/account/SignInPage'
import { SignUpPage } from '../features/account/SignUpPage'
import { CampaignListPage } from '../features/campaign/CampaignListPage'
import { CampaignPage } from '../features/campaign/CampaignPage'
import { CampaignSettingsPage } from '../features/campaign/CampaignSettingsPage'
import { JoinCampaignPage } from '../features/campaign/JoinCampaignPage'
import { NewCampaignPage } from '../features/campaign/NewCampaignPage'
import { BattlePage } from '../features/match/BattlePage'
import { MatchPage } from '../features/match/MatchPage'
import { NewMatchPage } from '../features/match/NewMatchPage'
import { PostBattlePage } from '../features/postBattle/PostBattlePage'
import { BattleRecordsPage } from '../features/records/BattleRecordsPage'
import { BuilderPage } from '../features/roster/BuilderPage'
import { EditWarbandPage } from '../features/roster/EditWarbandPage'
import { NewWarbandPage } from '../features/roster/NewWarbandPage'
import { PrintPage } from '../features/roster/PrintPage'
import { WarbandListPage } from '../features/roster/WarbandListPage'
import { WarbandPage } from '../features/roster/WarbandPage'
import { ScenarioFormPage } from '../features/scenarios/ScenarioFormPage'
import { ScenarioLibraryPage } from '../features/scenarios/ScenarioLibraryPage'
import { ScenarioPage } from '../features/scenarios/ScenarioPage'
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
      { path: 'campaigns', element: <RequireAuth><CampaignListPage /></RequireAuth> },
      { path: 'campaigns/new', element: <RequireAuth><NewCampaignPage /></RequireAuth> },
      { path: 'campaigns/join', element: <RequireAuth><JoinCampaignPage /></RequireAuth> },
      { path: 'campaigns/join/:code', element: <RequireAuth><JoinCampaignPage /></RequireAuth> },
      { path: 'campaigns/:id', element: <RequireAuth><CampaignPage /></RequireAuth> },
      { path: 'campaigns/:id/settings', element: <RequireAuth><CampaignSettingsPage /></RequireAuth> },
      { path: 'campaigns/:id/matches/new', element: <RequireAuth><NewMatchPage /></RequireAuth> },
      { path: 'matches/:id', element: <RequireAuth><MatchPage /></RequireAuth> },
      { path: 'matches/:id/battle', element: <RequireAuth><BattlePage /></RequireAuth> },
      { path: 'matches/:id/report/:warbandId', element: <RequireAuth><PostBattlePage /></RequireAuth> },
      { path: 'campaigns/:id/records', element: <RequireAuth><BattleRecordsPage /></RequireAuth> },
      { path: 'scenarios', element: <RequireAuth><ScenarioLibraryPage /></RequireAuth> },
      { path: 'scenarios/new', element: <RequireAuth><ScenarioFormPage /></RequireAuth> },
      { path: 'scenarios/custom/:id/edit', element: <RequireAuth><ScenarioFormPage /></RequireAuth> },
      { path: 'scenarios/:kind/:id', element: <RequireAuth><ScenarioPage /></RequireAuth> },
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
