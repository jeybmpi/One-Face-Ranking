import { useState } from 'react';
import Header from '../components/Header';
import RankingList from '../components/RankingList';
import { useCompetitors, useRounds } from '../hooks/useLiveData';
import { rankCompetitors } from '../lib/time';

export default function Ranking() {
  const { rounds, loading, error: roundsError } = useRounds();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const activeRound = rounds.find((r) => r.id === selectedId) ?? rounds[0];
  const { competitors, error: compError } = useCompetitors(activeRound?.id);
  const ranked = rankCompetitors(competitors);
  const error = roundsError || compError;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-4 md:p-8">
      <Header to="/ranking" />

      <div className="max-w-3xl mx-auto">
        {rounds.length > 1 && (
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {rounds.map((round) => (
              <button
                key={round.id}
                type="button"
                onClick={() => setSelectedId(round.id)}
                className={`px-5 py-2 rounded-lg font-semibold transition-colors ${
                  activeRound?.id === round.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {round.name}
              </button>
            ))}
          </div>
        )}

        <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 shadow-xl">
          <h2 className="text-3xl font-bold mb-8 text-center text-emerald-400">
            Ranking{activeRound ? ` - ${activeRound.name}` : ''}
          </h2>
          {error && <p className="text-sm text-red-400 text-center mb-4">{error}</p>}
          {loading ? (
            <p className="text-gray-500 text-center py-8 text-lg">Cargando...</p>
          ) : (
            <RankingList
              items={ranked}
              large
              emptyText="No hay resultados disponibles en esta ronda."
            />
          )}
        </div>
      </div>
    </div>
  );
}
