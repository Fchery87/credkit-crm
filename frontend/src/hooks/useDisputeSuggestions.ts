import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api-client';

export interface DisputeSuggestion {
  item_type: string;
  bureaus: string[];
  furnisher?: string | null;
  account_ref?: string | null;
  reason_codes: string[];
  evidence: Record<string, unknown>;
}

export interface DisputeSuggestionsResponse {
  suggestions: DisputeSuggestion[];
  run_id: string | null;
}

export const useDisputeSuggestions = (clientId?: string) => {
  const { token } = useAuth();
  const [suggestions, setSuggestions] = useState<DisputeSuggestion[]>([]);
  const [runId, setRunId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async () => {
    if (!token || !clientId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data: DisputeSuggestionsResponse = await apiClient.getDisputeSuggestions(clientId);
      setSuggestions(data.suggestions || []);
      setRunId(data.run_id ?? null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch suggestions';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [token, clientId]);

  useEffect(() => {
    setSuggestions([]);
    setRunId(null);
    if (!clientId || !token) {
      return;
    }
    fetchSuggestions();
  }, [clientId, token, fetchSuggestions]);

  return {
    suggestions,
    runId,
    loading,
    error,
    refresh: fetchSuggestions,
  };
};
