import React, { useState, useEffect, useRef } from 'react';
import { Pencil, X, Plus, Trophy } from 'lucide-react';

type Competitor = {
  id: string;
  name: string;
  val1: string;
  val2: string;
  bestStr: string;
  bestNum: number | 'DNF';
};

type Round = {
  id: string;
  name: string;
  competitors: Competitor[];
};

const parseTime = (val: string): number | 'DNF' | 'DNS' => {
  if (!val) return 'DNF';
  const formatted = val.trim().toUpperCase().replace(',', '.');

  if (formatted === 'DNF') return 'DNF';
  if (formatted === 'DNS') return 'DNS';

  const match = formatted.match(/^(?:(\d+):)?(\d+(?:\.\d+)?)$/);
  if (match) {
    const mins = match[1] ? parseInt(match[1], 10) : 0;
    const secs = parseFloat(match[2]);
    return mins * 60 + secs;
  }

  return 'DNF';
};

const formatTimeStr = (val: number | 'DNF' | 'DNS'): string => {
  if (val === 'DNF' || val === 'DNS') return val;
  const mins = Math.floor(val / 60);
  const secs = val % 60;
  if (mins > 0) {
    return `${mins}:${secs < 10 ? '0' : ''}${secs.toFixed(2)}`;
  }
  return secs.toFixed(2);
};

const calculateBest = (v1: string, v2: string): { num: number | 'DNF', str: string } => {
  const p1 = parseTime(v1);
  const p2 = parseTime(v2);

  const isNum1 = typeof p1 === 'number';
  const isNum2 = typeof p2 === 'number';

  if (isNum1 && isNum2) {
    const bestNum = Math.min(p1 as number, p2 as number);
    return { num: bestNum, str: formatTimeStr(bestNum) };
  } else if (isNum1) {
    return { num: p1 as number, str: formatTimeStr(p1) };
  } else if (isNum2) {
    return { num: p2 as number, str: formatTimeStr(p2) };
  } else {
    return { num: 'DNF', str: 'DNF' };
  }
};

const formatInputDisplay = (val: string): string => {
  if (!val || !val.trim()) return 'DNF';
  const formatted = val.trim().toUpperCase().replace(',', '.');

  if (formatted === 'DNF' || formatted === 'DNS') return formatted;

  const isValidTime = /^(?:(\d+):)?(\d+(?:\.\d+)?)$/.test(formatted);
  return isValidTime ? formatted : 'DNF';
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'datos' | 'resultados'>('datos');
  const [rounds, setRounds] = useState<Round[]>(() => {
    const saved = localStorage.getItem('competencia_rondas');
    return saved ? JSON.parse(saved) : [{ id: '1', name: 'Ronda 1', competitors: [] }];
  });
  const [activeRoundIndex, setActiveRoundIndex] = useState(0);

  const [name, setName] = useState('');
  const [val1, setVal1] = useState('');
  const [val2, setVal2] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const dato1Ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('competencia_rondas', JSON.stringify(rounds));
  }, [rounds]);

  const activeRound = rounds[activeRoundIndex] || rounds[0];

  const handleAddOrUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (editingId && !name.trim() && !val1.trim() && !val2.trim()) {
      const newCompetitors = activeRound.competitors.filter(c => c.id !== editingId);
      updateCurrentRound(newCompetitors);
      resetForm();
      return;
    }

    if (!name.trim()) return;

    const v1Str = formatInputDisplay(val1);
    const v2Str = formatInputDisplay(val2);
    const best = calculateBest(v1Str, v2Str);

    const newCompetitor: Competitor = {
      id: editingId || Date.now().toString(),
      name,
      val1: v1Str || 'DNF',
      val2: v2Str || 'DNF',
      bestNum: best.num,
      bestStr: best.str,
    };

    let newCompetitors;
    if (editingId) {
      newCompetitors = activeRound.competitors.map(c =>
        c.id === editingId ? newCompetitor : c
      );
    } else {
      newCompetitors = [...activeRound.competitors, newCompetitor];
    }

    updateCurrentRound(newCompetitors);
    resetForm();
  };

  const updateCurrentRound = (competitors: Competitor[]) => {
    const newRounds = [...rounds];
    newRounds[activeRoundIndex] = { ...newRounds[activeRoundIndex], competitors };
    setRounds(newRounds);
  };

  const handleEdit = (comp: Competitor) => {
    setEditingId(comp.id);
    setName(comp.name);
    setVal1(comp.val1);
    setVal2(comp.val2);
  };

  const resetForm = () => {
    setName('');
    setVal1('');
    setVal2('');
    setEditingId(null);
  };

  const addRound = () => {
    const newRounds = [...rounds, {
      id: Date.now().toString(),
      name: `Ronda ${rounds.length + 1}`,
      competitors: []
    }];
    setRounds(newRounds);
    setActiveRoundIndex(newRounds.length - 1);
  };

  const removeRound = (index: number) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta ronda? Los datos se perderán.")) {
      let newRounds = rounds.filter((_, i) => i !== index);
      newRounds = newRounds.map((r, i) => ({ ...r, name: `Ronda ${i + 1}` }));

      if (newRounds.length === 0) {
        newRounds = [{ id: Date.now().toString(), name: 'Ronda 1', competitors: [] }];
      }

      setRounds(newRounds);
      setActiveRoundIndex(Math.min(index, newRounds.length - 1));
    }
  };

  const getSortedRanking = (competitors: Competitor[]) => {
    return [...competitors].sort((a, b) => {
      if (a.bestNum === 'DNF' && b.bestNum === 'DNF') return 0;
      if (a.bestNum === 'DNF') return 1;
      if (b.bestNum === 'DNF') return -1;
      return (a.bestNum as number) - (b.bestNum as number);
    });
  };

  const sortedCompetitors = getSortedRanking(activeRound.competitors);
  let currentRank = 1;
  const rankedCompetitors = sortedCompetitors.map((comp, index) => {
    if (index > 0 && comp.bestNum !== sortedCompetitors[index - 1].bestNum) {
      currentRank = index + 1;
    }
    return { ...comp, rank: currentRank };
  });

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      dato1Ref.current?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-4 md:p-8">

      <div className="max-w-7xl mx-auto flex items-center justify-between mb-8">
        <div
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setActiveTab('datos')}
          title="Ir a Datos Principales"
        >
          <img src="/cubeiconn.svg" alt="Logo" className="w-20 h-20 md:w-32 md:h-32 object-contain" />
          <h1 className="text-2xl md:text-3xl font-bold text-blue-400">CosmoCube Fest Medellín 2026: One Face</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="flex justify-center space-x-4 mb-8">
          <button
            onClick={() => setActiveTab('datos')}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'datos' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Datos
          </button>
          <button
            onClick={() => setActiveTab('resultados')}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'resultados' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Resultados
          </button>
        </div>

        {activeTab === 'datos' && (
          <div className="flex flex-wrap items-center gap-3 mb-8 bg-gray-800 p-4 rounded-xl border border-gray-700">
            <span className="text-gray-400 font-medium">Rondas:</span>
            {rounds.map((round, idx) => (
              <div
                key={round.id}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                  activeRoundIndex === idx ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                onClick={() => setActiveRoundIndex(idx)}
              >
                <span>{round.name}</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeRound(idx); }}
                  className="hover:text-red-400 focus:outline-none"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addRound}
              className="flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors ml-auto"
            >
              <Plus size={18} /> Nueva Ronda
            </button>
          </div>
        )}

        {activeTab === 'datos' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            <div className="space-y-8">
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-gray-200">
                  {editingId ? 'Editar Competidor' : 'Ingresar Datos'} - {activeRound.name}
                </h2>
                <form onSubmit={handleAddOrUpdate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Nombre del Competidor</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={handleNameKeyDown}
                      className="w-full p-2 bg-gray-900 border border-gray-700 rounded text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Ej. Juan Pérez y presiona Enter"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Dato 1</label>
                      <input
                        type="text"
                        ref={dato1Ref}
                        value={val1}
                        onChange={(e) => setVal1(e.target.value)}
                        className="w-full p-2 bg-gray-900 border border-gray-700 rounded text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="1:40.87, DNF, DNS"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Dato 2</label>
                      <input
                        type="text"
                        value={val2}
                        onChange={(e) => setVal2(e.target.value)}
                        className="w-full p-2 bg-gray-900 border border-gray-700 rounded text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="12.5, DNF, DNS"
                      />
                    </div>
                  </div>
                  {editingId && (
                    <p className="text-xs text-yellow-500">
                      * Deja todo en blanco y guarda para eliminar este registro.
                    </p>
                  )}
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
                    >
                      {editingId ? 'Actualizar' : 'Agregar'}
                    </button>
                    {editingId && (
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg overflow-x-auto">
                <h2 className="text-xl font-semibold mb-4 text-gray-200">Historial de Ingresos</h2>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-700 text-gray-400">
                      <th className="py-2">Nombre</th>
                      <th className="py-2">Dato 1</th>
                      <th className="py-2">Dato 2</th>
                      <th className="py-2 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeRound.competitors.length === 0 && (
                      <tr><td colSpan={4} className="py-4 text-center text-gray-500">Sin datos ingresados</td></tr>
                    )}
                    {activeRound.competitors.map((comp) => (
                      <tr key={comp.id} className="border-b border-gray-700/50 hover:bg-gray-750">
                        <td className="py-3 font-medium">{comp.name}</td>
                        <td className="py-3 text-gray-300">{comp.val1}</td>
                        <td className="py-3 text-gray-300">{comp.val2}</td>
                        <td className="py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleEdit(comp)}
                            className="text-red-500 hover:text-red-400 p-1 rounded transition-colors"
                            title="Editar competidor"
                          >
                            <Pencil size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg h-fit">
              <h2 className="text-2xl font-bold mb-6 text-emerald-400 flex justify-between items-center">
                <span>Ranking en Vivo</span>
                <span className="text-sm font-normal text-gray-400 bg-gray-900 px-3 py-1 rounded-full">{activeRound.name}</span>
              </h2>
              <div className="space-y-3">
                {rankedCompetitors.length === 0 && (
                  <p className="text-gray-500 text-center py-4">Aún no hay competidores para el ranking.</p>
                )}
                {rankedCompetitors.map((comp) => (
                  <div key={comp.id} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg border border-gray-700">
                    <div className="flex items-center gap-4">
                      <span className="w-6 flex justify-center">
                        {comp.rank === 1 ? <Trophy size={20} className="text-yellow-400" /> :
                         comp.rank === 2 ? <Trophy size={20} className="text-gray-400" /> :
                         comp.rank === 3 ? <Trophy size={20} className="text-amber-600" /> :
                         <span className="font-bold text-gray-500">{comp.rank}</span>}
                      </span>
                      <span className="font-medium text-lg">{comp.name}</span>
                    </div>
                    <span className={`font-mono font-bold text-lg ${comp.bestStr === 'DNF' || comp.bestStr === 'DNS' ? 'text-red-400' : 'text-emerald-400'}`}>
                      {comp.bestStr}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'resultados' && (
          <div className="max-w-3xl mx-auto bg-gray-800 p-8 rounded-xl border border-gray-700 shadow-xl">
            <h2 className="text-3xl font-bold mb-8 text-center text-emerald-400">
              Ranking Oficial - {activeRound.name}
            </h2>
            <div className="space-y-4">
              {rankedCompetitors.length === 0 && (
                <p className="text-gray-500 text-center py-8 text-lg">No hay resultados disponibles en esta ronda.</p>
              )}
              {rankedCompetitors.map((comp) => (
                <div key={comp.id} className="flex items-center justify-between p-4 bg-gray-900 rounded-xl border border-gray-700 shadow-sm hover:border-gray-600 transition-colors">
                  <div className="flex items-center gap-6">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                      comp.rank > 3 ? 'bg-gray-800 border border-gray-700' : ''
                    }`}>
                      {comp.rank === 1 ? <Trophy size={28} className="text-yellow-400" /> :
                       comp.rank === 2 ? <Trophy size={28} className="text-gray-300" /> :
                       comp.rank === 3 ? <Trophy size={28} className="text-amber-600" /> :
                       <span className="font-bold text-xl text-gray-500">{comp.rank}</span>}
                    </div>
                    <span className="font-medium text-xl text-gray-100">{comp.name}</span>
                  </div>
                  <span className={`font-mono font-bold text-2xl tracking-wider ${comp.bestStr === 'DNF' || comp.bestStr === 'DNS' ? 'text-red-400' : 'text-emerald-400'}`}>
                    {comp.bestStr}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}