import { useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, X, Plus, LogOut } from 'lucide-react';
import Header from '../components/Header';
import Login from '../components/Login';
import RankingList from '../components/RankingList';
import { useCompetitors, useRounds } from '../hooks/useLiveData';
import { useSession } from '../hooks/useSession';
import { supabase } from '../lib/supabase';
import { calculateBest, formatInputDisplay, rankCompetitors } from '../lib/time';
import type { Competitor, Round } from '../types';

function AdminPanel() {
  const { rounds, reload: reloadRounds } = useRounds();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const activeRound: Round | undefined = rounds.find((r) => r.id === selectedId) ?? rounds[0];
  const { competitors, reload: reloadCompetitors } = useCompetitors(activeRound?.id);

  const [name, setName] = useState('');
  const [val1, setVal1] = useState('');
  const [val2, setVal2] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const dato1Ref = useRef<HTMLInputElement>(null);
  const ranked = rankCompetitors(competitors);

  const resetForm = () => {
    setName('');
    setVal1('');
    setVal2('');
    setEditingId(null);
  };

  const selectRound = (id: string) => {
    setSelectedId(id);
    resetForm();
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeRound || busy) return;
    setError(null);

    if (editingId && !name.trim() && !val1.trim() && !val2.trim()) {
      setBusy(true);
      const { error } = await supabase.from('competitors').delete().eq('id', editingId);
      setBusy(false);
      if (error) return setError(error.message);
      await reloadCompetitors();
      resetForm();
      return;
    }

    if (!name.trim()) return;

    const v1 = formatInputDisplay(val1);
    const v2 = formatInputDisplay(val2);
    const best = calculateBest(v1, v2);
    const payload = {
      name: name.trim(),
      val1: v1,
      val2: v2,
      best_num: best.num,
      best_str: best.str,
    };

    setBusy(true);
    const { error } = editingId
      ? await supabase.from('competitors').update(payload).eq('id', editingId)
      : await supabase.from('competitors').insert({ ...payload, round_id: activeRound.id });
    setBusy(false);
    if (error) return setError(error.message);

    await reloadCompetitors();
    resetForm();
  };

  const handleEdit = (comp: Competitor) => {
    setEditingId(comp.id);
    setName(comp.name);
    setVal1(comp.val1);
    setVal2(comp.val2);
  };

  const addRound = async () => {
    setError(null);
    const position = rounds.length ? Math.max(...rounds.map((r) => r.position)) + 1 : 0;
    const { data, error } = await supabase
      .from('rounds')
      .insert({ name: `Ronda ${rounds.length + 1}`, position })
      .select()
      .single();
    if (error) return setError(error.message);
    await reloadRounds();
    selectRound(data.id);
  };

  const removeRound = async (index: number) => {
    const target = rounds[index];
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta ronda? Los datos se perderán.')) {
      return;
    }
    setError(null);

    const { error } = await supabase.from('rounds').delete().eq('id', target.id);
    if (error) return setError(error.message);

    const remaining = rounds.filter((r) => r.id !== target.id);
    if (remaining.length === 0) {
      const { data, error } = await supabase
        .from('rounds')
        .insert({ name: 'Ronda 1', position: 0 })
        .select()
        .single();
      if (error) return setError(error.message);
      await reloadRounds();
      selectRound(data.id);
      return;
    }

    await Promise.all(
      remaining.map((r, i) =>
        supabase.from('rounds').update({ name: `Ronda ${i + 1}`, position: i }).eq('id', r.id)
      )
    );
    await reloadRounds();
    selectRound(remaining[Math.min(index, remaining.length - 1)].id);
  };

  const handleNameKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      dato1Ref.current?.focus();
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <Link to="/ranking" className="text-blue-400 hover:text-blue-300 font-medium">
          Ver ranking público
        </Link>
        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
        >
          <LogOut size={16} /> Cerrar sesión
        </button>
      </div>

      {error && (
        <p className="mb-6 p-3 bg-red-900/40 border border-red-700 text-red-300 rounded-lg text-sm">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-8 bg-gray-800 p-4 rounded-xl border border-gray-700">
        <span className="text-gray-400 font-medium">Rondas:</span>
        {rounds.map((round, idx) => (
          <div
            key={round.id}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${
              activeRound?.id === round.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            onClick={() => selectRound(round.id)}
          >
            <span>{round.name}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                void removeRound(idx);
              }}
              className="hover:text-red-400 focus:outline-none"
            >
              <X size={16} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => void addRound()}
          className="flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors ml-auto"
        >
          <Plus size={18} /> Nueva Ronda
        </button>
      </div>

      {!activeRound ? (
        <p className="text-gray-500 text-center py-8">Crea una ronda para empezar.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-gray-200">
                {editingId ? 'Editar Competidor' : 'Ingresar Datos'} - {activeRound.name}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Nombre del Competidor
                  </label>
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
                    disabled={busy}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-2 px-4 rounded transition-colors"
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
                  {competitors.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-gray-500">
                        Sin datos ingresados
                      </td>
                    </tr>
                  )}
                  {competitors.map((comp) => (
                    <tr key={comp.id} className="border-b border-gray-700/50">
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
              <span className="text-sm font-normal text-gray-400 bg-gray-900 px-3 py-1 rounded-full">
                {activeRound.name}
              </span>
            </h2>
            <RankingList items={ranked} emptyText="Aún no hay competidores para el ranking." />
          </div>
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  const { session, loading } = useSession();

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-4 md:p-8">
      <Header to="/ranking" />
      {loading ? (
        <p className="text-gray-500 text-center py-8">Cargando...</p>
      ) : session ? (
        <AdminPanel />
      ) : (
        <Login />
      )}
    </div>
  );
}
