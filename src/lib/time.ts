import type { Competitor, RankedCompetitor } from '../types';

const TIME_PATTERN = /^(?:(\d+):)?(\d+(?:\.\d+)?)$/;

const normalize = (val: string): string => val.trim().toUpperCase().replace(',', '.');

export const parseTime = (val: string): number | 'DNF' | 'DNS' => {
  if (!val) return 'DNF';
  const formatted = normalize(val);

  if (formatted === 'DNF') return 'DNF';
  if (formatted === 'DNS') return 'DNS';

  const match = formatted.match(TIME_PATTERN);
  if (!match) return 'DNF';

  const mins = match[1] ? parseInt(match[1], 10) : 0;
  return mins * 60 + parseFloat(match[2]);
};

export const formatTimeStr = (val: number): string => {
  const mins = Math.floor(val / 60);
  const secs = val % 60;
  if (mins > 0) {
    return `${mins}:${secs < 10 ? '0' : ''}${secs.toFixed(2)}`;
  }
  return secs.toFixed(2);
};

export const calculateBest = (v1: string, v2: string): { num: number | null; str: string } => {
  const times = [parseTime(v1), parseTime(v2)].filter(
    (t): t is number => typeof t === 'number'
  );
  if (times.length === 0) return { num: null, str: 'DNF' };

  const best = Math.min(...times);
  return { num: best, str: formatTimeStr(best) };
};

export const formatInputDisplay = (val: string): string => {
  if (!val || !val.trim()) return 'DNF';
  const formatted = normalize(val);

  if (formatted === 'DNF' || formatted === 'DNS') return formatted;
  return TIME_PATTERN.test(formatted) ? formatted : 'DNF';
};

export const rankCompetitors = (list: Competitor[]): RankedCompetitor[] => {
  const sorted = [...list].sort((a, b) => {
    if (a.best_num === null && b.best_num === null) return 0;
    if (a.best_num === null) return 1;
    if (b.best_num === null) return -1;
    return a.best_num - b.best_num;
  });

  let rank = 1;
  return sorted.map((comp, index) => {
    if (index > 0 && comp.best_num !== sorted[index - 1].best_num) {
      rank = index + 1;
    }
    return { ...comp, rank };
  });
};
