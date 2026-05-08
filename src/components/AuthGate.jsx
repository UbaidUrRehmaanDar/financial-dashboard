import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

// Shows a spinner while checking session, redirects to #auth if not logged in,
// renders children if authenticated.
export default function AuthGate({ children }) {
  const [status, setStatus] = useState('checking'); // 'checking' | 'authed' | 'unauthed'

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setStatus(data?.user ? 'authed' : 'unauthed');
    });

    // Keep in sync with sign-in / sign-out events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setStatus(session?.user ? 'authed' : 'unauthed');
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          className="w-8 h-8 border-2 border-border border-t-foreground rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  if (status === 'unauthed') {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="flex flex-col items-center gap-4 text-center max-w-xs"
        >
          <div className="w-14 h-14 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight mb-1">Sign in required</h2>
            <p className="text-sm text-muted-foreground">
              You need to be logged in to access this page.
            </p>
          </div>
          <Button showArrow onClick={() => { window.location.hash = 'auth'; }}>
            Go to Sign In
          </Button>
          <button
            onClick={() => { window.location.hash = ''; }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to home
          </button>
        </motion.div>
      </div>
    );
  }

  return children;
}
