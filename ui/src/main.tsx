import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import LandingPage from './LandingPage.tsx'
import FeedbackViewer from './admin/FeedbackViewer.tsx'
import { Analytics } from '@vercel/analytics/react'
import { assertScenarioRegistryComplete } from './core/scenarioRegistry'

assertScenarioRegistryComplete()

const pathname = window.location.pathname.replace(/\/+$/, '') || '/'

const isFeedbackViewer = pathname === '/admin/feedback'
const isSimulator = pathname === '/simulator'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
        {isFeedbackViewer ? (
      <FeedbackViewer />
    ) : isSimulator ? (
      <App />
    ) : (
      <LandingPage />
    )}
    <Analytics />
  </StrictMode>,
)