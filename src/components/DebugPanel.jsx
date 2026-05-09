import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export default function DebugPanel() {
  const [visible, setVisible] = useState(false);
  const [userId, setUserId] = useState(null);
  const [lastPayload, setLastPayload] = useState(null);
  const [lastError, setLastError] = useState(null);
  const [lastApiCall, setLastApiCall] = useState(null);
  const [lastDbOperation, setLastDbOperation] = useState(null);
  const [rlsStatus, setRlsStatus] = useState('unknown');

  useEffect(() => {
    if (!import.meta.env.DEV) return undefined;

    const onKeyDown = (e) => {
      const tag = e.target?.tagName?.toLowerCase?.();
      if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return;
      if (e.ctrlKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setVisible((v) => !v);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!import.meta.env.DEV) return undefined;

    const handler = (e) => {
      const detail = e.detail || {};
      if (detail.userId !== undefined) setUserId(detail.userId);
      if (detail.lastPayload !== undefined) setLastPayload(detail.lastPayload);
      if (detail.lastError !== undefined) setLastError(detail.lastError);
      if (detail.lastApiCall !== undefined) setLastApiCall(detail.lastApiCall);
      if (detail.lastDbOperation !== undefined) setLastDbOperation(detail.lastDbOperation);
    };

    window.addEventListener('debug:update', handler);
    return () => window.removeEventListener('debug:update', handler);
  }, []);

  useEffect(() => {
    if (!import.meta.env.DEV) return undefined;

    let unsubscribe = null;

    const hydrateSession = async () => {
      console.log('Supabase auth.getSession: start (DebugPanel)');
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('❌ Supabase getSession Error (DebugPanel):', error);
        setLastError(error);
      } else {
        console.log('✅ Supabase getSession (DebugPanel):', session);
        setUserId(session?.user?.id ?? null);
      }
      await checkRls(session?.access_token);

      const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        setUserId(nextSession?.user?.id ?? null);
        checkRls(nextSession?.access_token);
      });
      unsubscribe = data?.subscription?.unsubscribe;
    };

    hydrateSession();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const checkRls = async (accessToken) => {
    if (!supabaseUrl || !supabaseKey) {
      setRlsStatus('missing env');
      return;
    }

    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/portfolio?select=id&limit=1`, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${accessToken || supabaseKey}`,
        },
      });

      if (res.ok) {
        setRlsStatus('ok');
        return;
      }

      if (res.status === 401 || res.status === 403) {
        setRlsStatus('blocked');
        return;
      }

      setRlsStatus(`error ${res.status}`);
    } catch (err) {
      setRlsStatus('error');
      setLastError(err);
    }
  };

  if (!import.meta.env.DEV) return null;
  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-[360px] max-w-[90vw] rounded-xl border border-border bg-card/95 p-4 text-xs shadow-2xl backdrop-blur">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold tracking-wide">Debug Panel</div>
        <button
          onClick={() => setVisible(false)}
          className="rounded-md px-2 py-1 text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-colors"
        >
          Close
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-muted-foreground">User ID</span>
          <span className="font-mono">{userId || 'null'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Last API Call</span>
          <span className="font-mono">{lastApiCall || 'none'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Last DB Operation</span>
          <span className="font-mono">{lastDbOperation || 'none'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">RLS Status</span>
          <span className="font-mono">{rlsStatus || 'unknown'}</span>
        </div>
      </div>

      <div className="mt-3">
        <div className="text-muted-foreground mb-1">Last Insert</div>
        <pre className="whitespace-pre-wrap break-words rounded-md bg-background/60 p-2 font-mono">
          {lastPayload ? JSON.stringify(lastPayload, null, 2) : 'none'}
        </pre>
      </div>

      <div className="mt-3">
        <div className="text-muted-foreground mb-1">Last Error</div>
        <pre className="whitespace-pre-wrap break-words rounded-md bg-background/60 p-2 font-mono text-rose-400">
          {lastError ? JSON.stringify(lastError, null, 2) : 'none'}
        </pre>
      </div>
    </div>
  );
}
