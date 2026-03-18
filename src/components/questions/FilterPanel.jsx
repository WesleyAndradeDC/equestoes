import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Filter, X, Search, ChevronDown, SlidersHorizontal, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

function SearchableSelect({ value, onValueChange, options, placeholder, label }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    return options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));
  }, [options, search]);

  const truncateText = (text, maxLength = 22) => {
    if (!text) return placeholder;
    return text.length > maxLength ? text.substring(0, maxLength) + '…' : text;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={`justify-between font-normal h-9 text-sm min-w-[140px] ${
            value
              ? 'bg-[#2f456d] text-white border-[#2f456d] hover:bg-[#243756] hover:text-white dark:bg-[#2f456d] dark:text-white dark:border-[#2f456d]'
              : 'bg-white dark:bg-slate-800 dark:border-slate-600 text-slate-700 dark:text-slate-200'
          }`}
        >
          <span className="truncate">{truncateText(value) || placeholder}</span>
          <ChevronDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-0" align="start" sideOffset={6}>
        <div className="p-2 border-b border-slate-200 dark:border-slate-700">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder={`Buscar ${label.toLowerCase()}…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-7 h-8 text-sm"
            />
          </div>
        </div>
        <div className="max-h-52 overflow-y-auto">
          {value && (
            <button
              onClick={() => { onValueChange(null); setOpen(false); setSearch(''); }}
              className="w-full text-left px-3 py-2 text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2"
            >
              <X className="w-3 h-3" />
              Limpar seleção
            </button>
          )}
          {filteredOptions.length === 0 ? (
            <p className="p-3 text-sm text-slate-500 dark:text-slate-400 text-center">Nenhum resultado</p>
          ) : (
            filteredOptions.map((option) => (
              <button
                key={option}
                onClick={() => { onValueChange(option === value ? null : option); setOpen(false); setSearch(''); }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-0 ${
                  option === value
                    ? 'bg-[#2f456d]/10 dark:bg-[#2f456d]/30 text-[#2f456d] dark:text-blue-300 font-medium'
                    : 'text-slate-700 dark:text-slate-200'
                }`}
                title={option}
              >
                {option}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function FilterPanel({
  filters,
  onFilterChange,
  onClearFilters,
  availableDisciplines = [],
  availableSubjects = [],
  subjectsByDiscipline = {},
}) {
  const [expanded, setExpanded] = useState(false);

  const handleDisciplineChange = (discipline) => {
    onFilterChange({ ...filters, discipline, subject: null });
  };

  const filteredSubjects = useMemo(() => {
    if (filters.discipline && subjectsByDiscipline[filters.discipline]) {
      return subjectsByDiscipline[filters.discipline];
    }
    return availableSubjects;
  }, [filters.discipline, subjectsByDiscipline, availableSubjects]);

  const activeFilters = [
    filters.difficulty && { key: 'difficulty', label: filters.difficulty },
    filters.status && {
      key: 'status',
      label: filters.status === 'not_answered' ? 'Não Resolvidas' : filters.status === 'correct' ? 'Acertadas' : 'Erradas',
    },
    filters.discipline && { key: 'discipline', label: filters.discipline },
    filters.subject && { key: 'subject', label: filters.subject },
    filters.question_type && { key: 'question_type', label: filters.question_type },
  ].filter(Boolean);

  const hasActiveFilters = activeFilters.length > 0;

  const removeFilter = (key) => {
    const updated = { ...filters, [key]: null };
    if (key === 'discipline') updated.subject = null;
    onFilterChange(updated);
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
      {/* Header bar - always visible */}
      <div className="flex items-center gap-3 px-4 py-3 flex-wrap">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-[#2f456d] dark:hover:text-white transition-colors shrink-0"
        >
          <SlidersHorizontal className="w-4 h-4 text-[#2f456d] dark:text-blue-400" />
          Filtros
          {hasActiveFilters && (
            <span className="ml-0.5 bg-[#f26836] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {activeFilters.length}
            </span>
          )}
          {expanded ? <ChevronUp className="w-3.5 h-3.5 ml-1 opacity-60" /> : <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-60" />}
        </button>

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-600 shrink-0" />

        {/* Active filter badges */}
        <div className="flex flex-wrap gap-1.5 flex-1">
          {activeFilters.map((f) => (
            <Badge
              key={f.key}
              className="bg-[#2f456d]/10 text-[#2f456d] dark:bg-[#2f456d]/30 dark:text-blue-300 border border-[#2f456d]/20 dark:border-[#2f456d]/40 hover:bg-[#2f456d]/20 cursor-pointer transition-colors pr-1 gap-1 text-xs"
              onClick={() => removeFilter(f.key)}
            >
              {f.label}
              <X className="w-3 h-3 opacity-60" />
            </Badge>
          ))}
          {!hasActiveFilters && !expanded && (
            <span className="text-xs text-slate-400 dark:text-slate-500 italic">Nenhum filtro ativo</span>
          )}
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-7 px-2 text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0 gap-1"
          >
            <X className="w-3 h-3" />
            Limpar tudo
          </Button>
        )}
      </div>

      {/* Expanded filter options */}
      {expanded && (
        <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Dificuldade</p>
              <SearchableSelect
                value={filters.difficulty}
                onValueChange={(v) => onFilterChange({ ...filters, difficulty: v })}
                options={['Fácil', 'Médio', 'Difícil']}
                placeholder="Todos os níveis"
                label="nível"
              />
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Status</p>
              <SearchableSelect
                value={
                  filters.status === 'not_answered' ? 'Não Resolvidas'
                  : filters.status === 'correct' ? 'Acertadas'
                  : filters.status === 'incorrect' ? 'Erradas' : null
                }
                onValueChange={(v) => {
                  let s = null;
                  if (v === 'Não Resolvidas') s = 'not_answered';
                  else if (v === 'Acertadas') s = 'correct';
                  else if (v === 'Erradas') s = 'incorrect';
                  onFilterChange({ ...filters, status: s });
                }}
                options={['Não Resolvidas', 'Acertadas', 'Erradas']}
                placeholder="Todas"
                label="status"
              />
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Disciplina</p>
              <SearchableSelect
                value={filters.discipline}
                onValueChange={handleDisciplineChange}
                options={availableDisciplines}
                placeholder={availableDisciplines.length > 0 ? 'Todas as disciplinas' : 'Carregando…'}
                label="disciplina"
              />
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Assunto {filters.discipline && <span className="normal-case font-normal">({filters.discipline.split(' ')[0]})</span>}
              </p>
              <SearchableSelect
                value={filters.subject}
                onValueChange={(v) => onFilterChange({ ...filters, subject: v })}
                options={filteredSubjects}
                placeholder={filteredSubjects.length > 0 ? 'Todos os assuntos' : 'Sem assuntos'}
                label="assunto"
              />
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Tipo</p>
              <SearchableSelect
                value={filters.question_type}
                onValueChange={(v) => onFilterChange({ ...filters, question_type: v })}
                options={['Múltipla Escolha', 'Certo ou Errado']}
                placeholder="Todos os tipos"
                label="tipo"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
