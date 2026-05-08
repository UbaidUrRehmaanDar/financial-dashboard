import { useState, useEffect } from 'react'
import LandingPage from './pages/LandingPage'
import MarketOverview from './pages/MarketOverview'
import StockDetail from './pages/StockDetail'
import Portfolio from './pages/Portfolio'
import Watchlist from './pages/Watchlist'
import Charts from './pages/Charts'
import Settings from './pages/Settings'
import Auth from './pages/Auth'
import AuthGate from './components/AuthGate'
import DashboardShell from './layouts/DashboardShell'

function getPage() {
  return window.location.hash.replace('#', '') || 'landing'
}

function App() {
  const [page, setPage] = useState(getPage)

  useEffect(() => {
    const onHash = () => setPage(getPage())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // Pages without shell
  if (page === 'landing' || page === '') return <LandingPage />
  if (page === 'auth')                   return <Auth />

  // Dashboard pages — wrapped in shell + auth gate
  const shell = (content) => (
    <AuthGate>
      <DashboardShell page={page}>
        {content}
      </DashboardShell>
    </AuthGate>
  )

  if (page === 'market')    return shell(<MarketOverview />)
  if (page === 'stock')     return shell(<StockDetail />)
  if (page === 'portfolio') return shell(<Portfolio />)
  if (page === 'watchlist') return shell(<Watchlist />)
  if (page === 'charts')    return shell(<Charts />)
  if (page === 'settings')  return shell(<Settings />)

  return <LandingPage />
}

export default App
