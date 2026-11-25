import { ChevronsUpDown, Search } from 'lucide-react'
import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { cnjDigits, isCompleteCnj, maskCnj } from '@/lib/cnj'
import type { CommunicationFilters, Court } from '../api'
import { DateRangePicker } from './DateRangePicker'

interface FiltersBarProps {
  filters: CommunicationFilters
  courts: Court[]
  onChange: (changes: Partial<CommunicationFilters>) => void
}

const fieldBox =
  'flex h-9 items-center gap-2 rounded-lg border border-border bg-surface focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-primary/40'

/**
 * Card de filtros: número do processo, tribunal e período.
 * Figma: em linha a partir de 1024px; empilhados (largura total) abaixo disso.
 */
export function FiltersBar({ filters, courts, onChange }: FiltersBarProps) {
  return (
    <Card className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <LawsuitSearch value={filters.numeroProcesso ?? ''} onSearch={(numero) => onChange({ numeroProcesso: numero })} />
      <div className="contents">
        <label className={`${fieldBox} relative pr-2 pl-3 lg:w-[177px] lg:shrink-0`}>
          <span className="sr-only">Tribunal</span>
          <select
            value={filters.tribunal ?? ''}
            onChange={(event) => onChange({ tribunal: event.target.value || undefined })}
            className={`absolute inset-0 cursor-pointer appearance-none bg-transparent pr-7 pl-3 outline-none ${filters.tribunal ? 'text-ink' : 'text-muted'}`}
          >
            <option value="">Selecione um tribunal</option>
            {courts.map((court) => (
              <option key={court.acronym} value={court.acronym} title={court.name}>
                {court.acronym}
              </option>
            ))}
          </select>
          <ChevronsUpDown className="pointer-events-none relative ml-auto size-4" strokeWidth={1.75} aria-hidden />
        </label>
        <div className="lg:shrink-0">
          <DateRangePicker
            value={{ start: filters.dataInicio, end: filters.dataFim }}
            onChange={({ start, end }) => onChange({ dataInicio: start, dataFim: end })}
          />
        </div>
      </div>
    </Card>
  )
}

/**
 * Busca por número do processo: aplica a máscara CNJ enquanto digita e só
 * busca com o número completo (20 dígitos) — ou vazio, para limpar o filtro.
 * Evita uma chamada à API a cada tecla e respostas 400 de números parciais.
 */
function LawsuitSearch({ value, onSearch }: { value: string; onSearch: (numero: string | undefined) => void }) {
  const [text, setText] = useState(() => maskCnj(value))
  const [syncedValue, setSyncedValue] = useState(value)

  // Se o filtro mudar por fora (ex.: botão voltar do navegador), o campo
  // acompanha. Ajuste durante o render, padrão recomendado pelo React em vez
  // de useEffect + setState (que renderizaria duas vezes).
  if (value !== syncedValue) {
    setSyncedValue(value)
    if (cnjDigits(text) !== cnjDigits(value)) setText(maskCnj(value))
  }

  const handleChange = (raw: string) => {
    const masked = maskCnj(raw)
    setText(masked)
    if (masked === '') onSearch(undefined)
    else if (isCompleteCnj(masked)) onSearch(masked)
  }

  const partial = text !== '' && !isCompleteCnj(text)

  return (
    <div className="flex flex-1 flex-col gap-1">
      <label className={`${fieldBox} px-3`}>
        <Search className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
        <span className="sr-only">Número do processo</span>
        <input
          type="search"
          inputMode="numeric"
          value={text}
          onChange={(event) => handleChange(event.target.value)}
          placeholder="Buscar por número do processo"
          aria-describedby={partial ? 'lawsuit-search-hint' : undefined}
          className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:cursor-pointer"
        />
      </label>
      {partial && (
        <p id="lawsuit-search-hint" className="text-muted">
          Digite os 20 dígitos do número CNJ para buscar.
        </p>
      )}
    </div>
  )
}
