import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, ChevronDown, ChevronUp, X } from 'lucide-react';

const COLORS = ['blue', 'emerald', 'violet', 'orange', 'rose', 'cyan', 'amber', 'teal'];
const COLOR_LABELS = {
  blue: 'Azul', emerald: 'Verde', violet: 'Roxo', orange: 'Laranja',
  rose: 'Rosa', cyan: 'Ciano', amber: 'Âmbar', teal: 'Verde-água',
};

/**
 * Editor de disciplinas + assuntos para cronograma oficial (admin).
 * Enter no nome da disciplina → cria e foca input de assuntos na hora.
 */
export default function AdminCronogramaEditor({
  disciplines: initial = [],
  onChange,
}) {
  const [disciplines, setDisciplines] = useState(() =>
    (initial || []).map((d) => ({
      name: d.name || '',
      color: d.color || 'blue',
      difficulty: d.difficulty ?? 3,
      subjects: (d.subjects || []).map((s) =>
        typeof s === 'string' ? { name: s } : { name: s.name || '', id: s.id }
      ),
      _subjectInput: '',
      _open: true,
    }))
  );
  const [newDiscName, setNewDiscName] = useState('');
  const [focusSubjectIdx, setFocusSubjectIdx] = useState(null);
  const subjectInputRefs = useRef({});
  const newDiscInputRef = useRef(null);

  useEffect(() => {
    onChange?.(
      disciplines
        .filter((d) => d.name.trim())
        .map((d, i) => ({
          name: d.name.trim(),
          color: d.color,
          difficulty: d.difficulty,
          display_order: i,
          subjects: d.subjects
            .filter((s) => s.name?.trim())
            .map((s, j) => ({ name: s.name.trim(), display_order: j })),
        }))
    );
  }, [disciplines]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (focusSubjectIdx == null) return;
    const el = subjectInputRefs.current[focusSubjectIdx];
    if (el) {
      el.focus();
      setFocusSubjectIdx(null);
    }
  }, [focusSubjectIdx, disciplines.length]);

  const update = (idx, patch) => {
    setDisciplines((prev) => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)));
  };

  const remove = (idx) => setDisciplines((prev) => prev.filter((_, i) => i !== idx));

  const addDiscipline = () => {
    const name = newDiscName.trim();
    if (!name) return;
    const nextIdx = disciplines.length;
    setDisciplines((prev) => [
      ...prev,
      {
        name,
        color: COLORS[nextIdx % COLORS.length],
        difficulty: 3,
        subjects: [],
        _subjectInput: '',
        _open: true,
      },
    ]);
    setNewDiscName('');
    setFocusSubjectIdx(nextIdx);
  };

  const addSubject = (idx) => {
    setDisciplines((prev) => {
      const text = (prev[idx]?._subjectInput || '').trim();
      if (!text) return prev;
      return prev.map((d, i) =>
        i === idx
          ? { ...d, subjects: [...d.subjects, { name: text }], _subjectInput: '', _open: true }
          : d
      );
    });
    // Mantém foco no input de assuntos pra continuar digitando
    setTimeout(() => subjectInputRefs.current[idx]?.focus(), 0);
  };

  const removeSubject = (dIdx, sIdx) => {
    update(dIdx, {
      subjects: disciplines[dIdx].subjects.filter((_, i) => i !== sIdx),
    });
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold">Disciplinas e assuntos</Label>

      {/* Inserir disciplina: Enter já cria e abre assuntos */}
      <div className="flex gap-2">
        <Input
          ref={newDiscInputRef}
          value={newDiscName}
          onChange={(e) => setNewDiscName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              e.stopPropagation();
              addDiscipline();
            }
          }}
          placeholder="Nome da disciplina + Enter"
          className="h-9 text-sm flex-1"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={addDiscipline}
          disabled={!newDiscName.trim()}
          className="gap-1 h-9 text-xs shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          Adicionar
        </Button>
      </div>
      <p className="text-[11px] text-slate-400 -mt-1">
        Digite o nome e pressione Enter — em seguida já pode cadastrar os assuntos.
      </p>

      {disciplines.length === 0 && (
        <p className="text-xs text-slate-400 py-3 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
          Nenhuma disciplina ainda.
        </p>
      )}

      {disciplines.map((d, idx) => (
        <div key={idx} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/50">
            <button
              type="button"
              onClick={() => update(idx, { _open: !d._open })}
              className="text-slate-400 hover:text-slate-600"
            >
              {d._open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <Input
              value={d.name}
              onChange={(e) => update(idx, { name: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  update(idx, { _open: true });
                  setFocusSubjectIdx(idx);
                }
              }}
              placeholder="Nome da disciplina"
              className="h-8 text-sm flex-1 font-medium"
            />
            <select
              value={d.color}
              onChange={(e) => update(idx, { color: e.target.value })}
              className="h-8 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2"
            >
              {COLORS.map((c) => (
                <option key={c} value={c}>{COLOR_LABELS[c]}</option>
              ))}
            </select>
            <select
              value={d.difficulty}
              onChange={(e) => update(idx, { difficulty: Number(e.target.value) })}
              className="h-8 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2"
              title="Dificuldade"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n}★</option>
              ))}
            </select>
            <Badge variant="outline" className="text-xs shrink-0">{d.subjects.length} assuntos</Badge>
            <button
              type="button"
              onClick={() => remove(idx)}
              className="text-red-400 hover:text-red-600 p-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {d._open && (
            <div className="px-3 py-3 space-y-2">
              <div className="flex flex-wrap gap-1.5 min-h-[24px]">
                {d.subjects.map((s, sIdx) => (
                  <span
                    key={sIdx}
                    className="inline-flex items-center gap-1 text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-full px-2.5 py-1"
                  >
                    {s.name}
                    <button type="button" onClick={() => removeSubject(idx, sIdx)} className="text-slate-400 hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {d.subjects.length === 0 && (
                  <span className="text-xs text-slate-400">Digite um assunto e pressione Enter</span>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  ref={(el) => { subjectInputRefs.current[idx] = el; }}
                  value={d._subjectInput}
                  onChange={(e) => update(idx, { _subjectInput: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                      addSubject(idx);
                    }
                  }}
                  placeholder="Assunto + Enter (pode adicionar vários)"
                  className="h-8 text-sm flex-1"
                />
                <Button type="button" size="sm" variant="outline" onClick={() => addSubject(idx)} className="h-8 px-2">
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function SavingSpinner({ pending, label = 'Salvando...' }) {
  if (!pending) return null;
  return (
    <span className="inline-flex items-center gap-1.5">
      <Loader2 className="w-3.5 h-3.5 animate-spin" />
      {label}
    </span>
  );
}
