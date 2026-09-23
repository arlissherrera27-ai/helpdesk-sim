import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import FeedbackViewer from './admin/FeedbackViewer.tsx'
import { Analytics } from '@vercel/analytics/react'
import { assertScenarioRegistryComplete } from './core/scenarioRegistry'

assertScenarioRegistryComplete()

const isFeedbackViewer =
  window.location.pathname === '/admin/feedback'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isFeedbackViewer ? <FeedbackViewer /> : <App />}
    <Analytics />
  </StrictMode>,
)