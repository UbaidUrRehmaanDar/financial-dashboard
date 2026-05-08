import { useState, useEffect } from 'react'
import LandingPage from './pages/LandingPage'
import MarketOverview from './pages/MarketOverview'

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

  if (page === 'market') return <MarketOverview />
  return <LandingPage />
}

export default App
