import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

// Lazy load the ENTIRE analysis app.
// This single change removes ~1MB of vendor code + the 450KB openings.js from the initial load
const AnalysisLayout = lazy(() => import('./analysis/chessapp/sections/layout/index.jsx'))
const GameAnalysis = lazy(() => import('./analysis/chessapp/pages/index.jsx'))

function AnalysisApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <AnalysisLayout>
        <GameAnalysis />
      </AnalysisLayout>
    </QueryClientProvider>
  )
}

// Fallback for lazy loading
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, #0f141d 0%, #182232 55%, #111827 100%)' }}>
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 rounded-full border-4 border-t-[#0bb0e5] border-white/10 animate-spin" />
      <span className="text-sm text-cyan-200/60 font-medium tracking-wider animate-pulse">LOADING ANALYSIS ENGINE...</span>
    </div>
  </div>
);

// Get the router basename which allows deep links on Netlify subdirectories
const basename = import.meta.env.BASE_URL || '/'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter basename={basename}>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/analysis" element={<AnalysisApp />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
