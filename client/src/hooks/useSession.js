import { useState, useEffect, useCallback } from 'react';

const API_BASE = '/api';
const POLL_INTERVAL = 30000; // 30 seconds

export function useSession() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/session`);
      if (!res.ok) throw new Error('Failed to fetch session');
      const data = await res.json();
      setSession(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + polling
  useEffect(() => {
    fetchSession();
    const interval = setInterval(fetchSession, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchSession]);

  const bookSlot = async (slotId, speaker, topic) => {
    try {
      const res = await fetch(`${API_BASE}/session/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId, speaker, topic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await fetchSession();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const cancelSlot = async (slotId) => {
    try {
      const res = await fetch(`${API_BASE}/session/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await fetchSession();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const resetSlots = async () => {
    try {
      const res = await fetch(`${API_BASE}/session/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await fetchSession();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  return { session, loading, error, bookSlot, cancelSlot, resetSlots, refresh: fetchSession };
}
