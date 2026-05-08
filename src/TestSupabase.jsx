import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

export default function TestSupabase() {
  const [status, setStatus] = useState('Connecting...')
  
  useEffect(() => {
    supabase.from('price_cache').select('count').then(({ error }) => {
      setStatus(error ? `❌ Error: ${error.message}` : '✅ Connected!')
    })
  }, [])
  
  return <div className="p-10 text-white">{status}</div>
}