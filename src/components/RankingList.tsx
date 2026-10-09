import { Trophy } from 'lucide-react';
import type { RankedCompetitor } from '../types';

type Props = {
  items: RankedCompetitor[];
  large?: boolean;
  emptyText: string;
};

const trophyColor = (rank: number, large: boolean): string => {
  if (rank === 1) return 'text-yellow-400';
  if (rank === 2) return large ? 'text-gray-300' : 'text-gray-400';
  return 'text-amber-600';
};

export default function RankingList({ items, large = false, emptyText }: Props) {
  if (items.length === 0) {
    return (
      <p className={`text-gray-500 text-center ${large ? 'py-8 text-lg' : 'py-4'}`}>
        {emptyText}
      </p>
    );
  }

  return (
    <div className={large ? 'space-y-4' : 'space-y-3'}>
      {items.map((comp) => {
        const failed = comp.best_str === 'DNF' || comp.best_str === 'DNS';
        return (
          <div
            key={comp.id}
            className={
              large
                ? 'flex items-center justify-between p-4 bg-gray-900 rounded-xl border border-gray-700 shadow-sm hover:border-gray-600 transition-colors'
                : 'flex items-center justify-between p-3 bg-gray-900 rounded-lg border border-gray-700'
            }
          >
            <div className={`flex items-center ${large ? 'gap-6' : 'gap-4'}`}>
              {large ? (
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    comp.rank > 3 ? 'bg-gray-800 border border-gray-700' : ''
                  }`}
                >
                  {comp.rank <= 3 ? (
                    <Trophy size={28} className={trophyColor(comp.rank, true)} />
                  ) : (
                    <span className="font-bold text-xl text-gray-500">{comp.rank}</span>
                  )}
                </div>
              ) : (
                <span className="w-6 flex justify-center">
                  {comp.rank <= 3 ? (
                    <Trophy size={20} className={trophyColor(comp.rank, false)} />
                  ) : (
                    <span className="font-bold text-gray-500">{comp.rank}</span>
                  )}
                </span>
              )}
              <span className={`font-medium ${large ? 'text-xl text-gray-100' : 'text-lg'}`}>
                {comp.name}
              </span>
            </div>
            <span
              className={`font-mono font-bold ${
                large ? 'text-2xl tracking-wider' : 'text-lg'
              } ${failed ? 'text-red-400' : 'text-emerald-400'}`}
            >
              {comp.best_str}
            </span>
          </div>
        );
      })}
    </div>
  );
}
