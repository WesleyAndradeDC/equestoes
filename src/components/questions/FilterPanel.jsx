import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Filter, X, Search, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const DISCIPLINES = [
  'Língua Portuguesa',
  'Matemática e Raciocínio Lógico',
  'Informática',
  'Direito Constitucional',
  'Direito Administrativo',
  'Atualidades',
  'Ética no Serviço Público',
  'Direito Penal',
  'Direito Processual Penal',
  'Direitos Humanos',
  'Administração Pública',
  'Administração Financeira e Orçamentária',
  'Contabilidade',
  'Arquivologia',
  'Matemática Financeira',
  'Conhecimentos Bancários',
  'Legislação Especial'
];

function SearchableSelect({ value, onValueChange, options, placeholder, label }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    return options.filter(opt => 
      opt.toLowerCase().includes(search.toLowerCase())
    );
  }, [options, search]);

  // Truncate display value for long text
  const truncateText = (text, maxLength = 25) => {
    if (!text) return placeholder;
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const displayValue = truncateText(value) || placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-white dark:bg-slate-700 dark:border-slate-600 text-left font-normal h-10"
        >
          <span className={`truncate ${value ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>
            {displayValue}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start" sideOffset={4}>
        <div className="p-2 border-b border-slate-200 dark:border-slate-700">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder={`Buscar ${label.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
        </div>
        <div className="max-h-48 overflow-y-auto">
          {filteredOptions.length === 0 ? (
            <p className="p-3 text-sm text-slate-500 dark:text-slate-400 text-center">
              Nenhum resultado
            </p>
          ) : (
            filteredOptions.map((option) => (
              <button
                key={option}
                onClick={() => {
                  onValueChange(option === value ? null : option);
                  setOpen(false);
                  setSearch('');
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-0 ${
                  option === value ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium' : 'text-slate-700 dark:text-slate-200'
                }`}
                title={option}
              >
                <span className="line-clamp-2">{option}</span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function FilterPanel({ filters, onFilterChange, onClearFilters, availableSubjects = [], subjectsByDiscipline = {} }) {
  const handleDisciplineChange = (discipline) => {
    // Quando muda a disciplina, limpa o assunto selecionado
    onFilterChange({ ...filters, discipline, subject: null });
  };

  // Filtra os assuntos baseado na disciplina selecionada
  const filteredSubjects = useMemo(() => {
    if (filters.discipline && subjectsByDiscipline[filters.discipline]) {
      return subjectsByDiscipline[filters.discipline];
    }
    return availableSubjects;
  }, [filters.discipline, subjectsByDiscipline, availableSubjects]);

  const hasActiveFilters = filters.difficulty || filters.status || filters.discipline || filters.subject || filters.question_type;

  return (
    <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-md border-slate-200 dark:border-slate-700">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-purple-600 dark:text-white" />
            <CardTitle className="text-lg dark:text-slate-100">Filtros Avançados</CardTitle>
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-slate-500 hover:text-slate-700"
            >
              <X className="w-4 h-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Difficulty Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nível de Dificuldade</Label>
          <SearchableSelect
            value={filters.difficulty}
            onValueChange={(value) => onFilterChange({ ...filters, difficulty: value })}
            options={['Fácil', 'Médio', 'Difícil']}
            placeholder="Todos os níveis"
            label="nível"
          />
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Status de Resolução</Label>
          <SearchableSelect
            value={filters.status === 'not_answered' ? 'Não Resolvidas' : 
                   filters.status === 'correct' ? 'Acertadas' : 
                   filters.status === 'incorrect' ? 'Erradas' : null}
            onValueChange={(value) => {
              let statusValue = null;
              if (value === 'Não Resolvidas') statusValue = 'not_answered';
              else if (value === 'Acertadas') statusValue = 'correct';
              else if (value === 'Erradas') statusValue = 'incorrect';
              onFilterChange({ ...filters, status: statusValue });
            }}
            options={['Não Resolvidas', 'Acertadas', 'Erradas']}
            placeholder="Todas"
            label="status"
          />
        </div>

        {/* Discipline Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Disciplina</Label>
          <SearchableSelect
            value={filters.discipline}
            onValueChange={handleDisciplineChange}
            options={DISCIPLINES}
            placeholder="Todas as disciplinas"
            label="disciplina"
          />
        </div>

        {/* Subject Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Assunto
            {filters.discipline && (
              <span className="ml-1 text-xs text-purple-600 dark:text-purple-400">
                ({filters.discipline})
              </span>
            )}
          </Label>
          <SearchableSelect
            value={filters.subject}
            onValueChange={(value) => onFilterChange({ ...filters, subject: value })}
            options={filteredSubjects}
            placeholder={filteredSubjects.length > 0 ? "Todos os assuntos" : "Nenhum assunto disponível"}
            label="assunto"
          />
        </div>

        {/* Question Type Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tipo de Questão</Label>
          <SearchableSelect
            value={filters.question_type}
            onValueChange={(value) => onFilterChange({ ...filters, question_type: value })}
            options={['Múltipla Escolha', 'Certo ou Errado']}
            placeholder="Todos os tipos"
            label="tipo"
          />
        </div>
      </CardContent>
    </Card>
  );
}