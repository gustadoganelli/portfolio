import * as Lucide from 'lucide-react'
import type { ComponentType } from 'react'

// Converte o nome de icone guardado no catalogo (kebab-case) no componente
// React correspondente da biblioteca lucide-react.
// Ex.: "bar-chart-3" -> BarChart3 ; "shield" -> Shield.
export function iconComp(name?: string | null): ComponentType<any> {
  if (!name) return Lucide.Tag
  const pascal = name
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('')
  return ((Lucide as any)[pascal] as ComponentType<any>) || Lucide.Tag
}
