import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useAutoRefresh — stable polling hook.
 *
 * IMPORTANT: pass a stable `fetchFn` (wrap with useCallback in the caller,
 * or use string deps to avoid infinite loops).
 *
 * Returns { data, loading, error, lastUpdated, countdown, refreshing, refresh }
 */
export function useAutoRefresh(fetchFn, intervalMs = 30_000, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [countdown, setCountdown] = useState(Math.round(intervalMs / 1000));
  const [refreshing, setRefreshing] = useState(false);

  // Keep ref to latest fetchFn so the interval never goes stale
  const fetchRef = useRef(fetchFn);
  const mountedRef = useRef(true);
  const timerRef = useRef(null);
  const cdTimerRef = useRef(null);

  useEffect(() => { fetchRef.current = fetchFn; }, [fetchFn]);

  const doFetch = useCallback(async (silent = false) => {
    if (!mountedRef.current) return;
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const result = await fetchRef.current();
      if (mountedRef.current) {
        setData(result);
        setLastUpdated(new Date());
        setCountdown(Math.round(intervalMs / 1000));
      }
    } catch (e) {
      if (mountedRef.current) setError(e?.response?.data?.message || e?.message || 'Failed to load');
    } finally {
      if (mountedRef.current) { setLoading(false); setRefreshing(false); }
    }
  }, [intervalMs]);

  // Manual refresh — resets the auto timer too
  const refresh = useCallback(() => {
    clearInterval(timerRef.current);
    clearInterval(cdTimerRef.current);
    doFetch(false).then(() => {
      if (!mountedRef.current) return;
      timerRef.current = setInterval(() => doFetch(true), intervalMs);
      cdTimerRef.current = setInterval(() => {
        setCountdown(prev => (prev <= 1 ? Math.round(intervalMs / 1000) : prev - 1));
      }, 1000);
    });
  }, [doFetch, intervalMs]);

  // Start on mount / when deps change (use primitive deps, not objects)
  useEffect(() => {
    mountedRef.current = true;
    doFetch(false);
    timerRef.current = setInterval(() => doFetch(true), intervalMs);
    cdTimerRef.current = setInterval(() => {
      setCountdown(prev => (prev <= 1 ? Math.round(intervalMs / 1000) : prev - 1));
    }, 1000);
    return () => {
      mountedRef.current = false;
      clearInterval(timerRef.current);
      clearInterval(cdTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs, ...deps]);

  return {
    data: data ?? undefined,  // convert null → undefined so callers' = [] defaults apply
    loading, error, lastUpdated, countdown, refreshing, refresh
  };
}
