import { useState, useEffect } from 'react'
import LandingPage from './pages/LandingPage'
import MarketOverview from './pages/MarketOverview'
import StockDetail from './pages/StockDetail'
import TestSupabase from './TestSupabase'

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

  if (page === 'test') return <TestSupabase />
  if (page === 'market') return <MarketOverview />
  if (page === 'stock') return <StockDetail />
  return <LandingPage />
}

export default App
