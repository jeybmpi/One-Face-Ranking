import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Competitor, Round } from '../types';

const POLL_MS = 20000;
let channelCount = 0;

function watchTable(table: string, onChange: () => void) {
  const channel = supabase
    .channel(`live-${table}-${++channelCount}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, onChange)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export function useRounds() {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const { data, error } = await supabase
      .from('rounds')
      .select('*')
      .order('position', { ascending: true });
    if (error) {
      setError(error.message);
    } else {
      setRounds(data as Round[]);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
    const stop = watchTable('rounds', () => void reload());
    const timer = setInterval(() => void reload(), POLL_MS);
    return () => {
      stop();
      clearInterval(timer);
    };
  }, [reload]);

  return { rounds, loading, error, reload };
}

export function useCompetitors(roundId: string | undefined) {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const latestRound = useRef(roundId);

  const reload = useCallback(async () => {
    latestRound.current = roundId;
    if (!roundId) {
      setCompetitors([]);
      return;
    }
    const { data, error } = await supabase
      .from('competitors')
      .select('*')
      .eq('round_id', roundId)
      .order('created_at', { ascending: true });
    if (latestRound.current !== roundId) return;
    if (error) {
      setError(error.message);
    } else {
      setCompetitors(data as Competitor[]);
      setError(null);
    }
  }, [roundId]);

  useEffect(() => {
    void reload();
    const stop = watchTable('competitors', () => void reload());
    const timer = setInterval(() => void reload(), POLL_MS);
    return () => {
      stop();
      clearInterval(timer);
    };
  }, [reload]);

  return { competitors, error, reload };
}
