import { lazy, type ComponentType } from 'react'

/**
 * Route-level code splitting: each screen ships in its own chunk and loads on first visit.
 * `AppShell` renders the Suspense fallback around the outlet.
 */
function lazyPage<K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) {
  return lazy(async () => ({ default: (await load())[name] }))
}

import { createBrowserRouter, Navigate } from 'react-router'
import { AppShell } from './AppShell'

const AccountPage = lazyPage(() => import('../features/account/AccountPage'), 'AccountPage')
const AdvancesPage = lazyPage(() => import('../features/advances/AdvancesPage'), 'AdvancesPage')
const ForgotPasswordPage = lazyPage(() => import('../features/account/ForgotPasswordPage'), 'ForgotPasswordPage')
const ResetPasswordPage = lazyPage(() => import('../features/account/ResetPasswordPage'), 'ResetPasswordPage')
const SignInPage = lazyPage(() => import('../features/account/SignInPage'), 'SignInPage')
const SignUpPage = lazyPage(() => import('../features/account/SignUpPage'), 'SignUpPage')
const CampaignListPage = lazyPage(() => import('../features/campaign/CampaignListPage'), 'CampaignListPage')
const CampaignPage = lazyPage(() => import('../features/campaign/CampaignPage'), 'CampaignPage')
const CampaignSettingsPage = lazyPage(() => import('../features/campaign/CampaignSettingsPage'), 'CampaignSettingsPage')
const ImportPage = lazyPage(() => import('../features/importer/ImportPage'), 'ImportPage')
const RosterImportPage = lazyPage(() => import('../features/importer/RosterImportPage'), 'RosterImportPage')
const JoinCampaignPage = lazyPage(() => import('../features/campaign/JoinCampaignPage'), 'JoinCampaignPage')
const NewCampaignPage = lazyPage(() => import('../features/campaign/NewCampaignPage'), 'NewCampaignPage')
const BattlePage = lazyPage(() => import('../features/match/BattlePage'), 'BattlePage')
const MatchPage = lazyPage(() => import('../features/match/MatchPage'), 'MatchPage')
const NewMatchPage = lazyPage(() => import('../features/match/NewMatchPage'), 'NewMatchPage')
const PostBattlePage = lazyPage(() => import('../features/postBattle/PostBattlePage'), 'PostBattlePage')
const RecruitmentPage = lazyPage(() => import('../features/recruitment/RecruitmentPage'), 'RecruitmentPage')
const BattleRecordsPage = lazyPage(() => import('../features/records/BattleRecordsPage'), 'BattleRecordsPage')
const BuilderPage = lazyPage(() => import('../features/roster/BuilderPage'), 'BuilderPage')
const EditWarbandPage = lazyPage(() => import('../features/roster/EditWarbandPage'), 'EditWarbandPage')
const NewWarbandPage = lazyPage(() => import('../features/roster/NewWarbandPage'), 'NewWarbandPage')
const PrintPage = lazyPage(() => import('../features/roster/PrintPage'), 'PrintPage')
const WarbandListPage = lazyPage(() => import('../features/roster/WarbandListPage'), 'WarbandListPage')
const WarbandPage = lazyPage(() => import('../features/roster/WarbandPage'), 'WarbandPage')
const ScenarioFormPage = lazyPage(() => import('../features/scenarios/ScenarioFormPage'), 'ScenarioFormPage')
const ScenarioLibraryPage = lazyPage(() => import('../features/scenarios/ScenarioLibraryPage'), 'ScenarioLibraryPage')
const ScenarioPage = lazyPage(() => import('../features/scenarios/ScenarioPage'), 'ScenarioPage')
const TradingPage = lazyPage(() => import('../features/trading/TradingPage'), 'TradingPage')
const HelpPage = lazyPage(() => import('../features/help/HelpPage'), 'HelpPage')

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
      { path: 'warbands/import', element: <RequireAuth><RosterImportPage /></RequireAuth> },
      { path: 'warbands/new/:templateId', element: <RequireAuth><BuilderPage /></RequireAuth> },
      { path: 'warbands/:id', element: <RequireAuth><WarbandPage /></RequireAuth> },
      { path: 'warbands/:id/edit', element: <RequireAuth><EditWarbandPage /></RequireAuth> },
      { path: 'warbands/:id/print', element: <RequireAuth><PrintPage /></RequireAuth> },
      { path: 'warbands/:id/advances', element: <RequireAuth><AdvancesPage /></RequireAuth> },
      { path: 'warbands/:id/trade', element: <RequireAuth><TradingPage /></RequireAuth> },
      { path: 'warbands/:id/recruit', element: <RequireAuth><RecruitmentPage /></RequireAuth> },
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
      { path: 'campaigns/:id/import', element: <RequireAuth><ImportPage /></RequireAuth> },
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
      { path: 'help', element: <RequireAuth><HelpPage /></RequireAuth> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
