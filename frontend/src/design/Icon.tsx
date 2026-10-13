import type { CSSProperties } from 'react'

interface IconProps {
  name: string
  size?: number
  fill?: boolean
  weight?: number
  color?: string
  style?: CSSProperties
}

/** Ícone Material Symbols Rounded (mesma fonte do protótipo). */
export function Icon({ name, size = 20, fill = false, weight, color, style }: IconProps) {
  const settings = [`'FILL' ${fill ? 1 : 0}`]
  if (weight) settings.push(`'wght' ${weight}`)
  return (
    <span aria-hidden="true" className="sb-icon"
      style={{
        fontFamily: "'Material Symbols Rounded'",
        fontSize: size,
        lineHeight: 1,
        color,
        fontVariationSettings: settings.join(','),
        // Material Symbols renderiza por ligadura: 'liga' precisa estar ligado e o
        // letter-spacing precisa ser normal (herdar espaçamento quebra a ligadura).
        fontFeatureSettings: "'liga'",
        letterSpacing: 'normal',
        whiteSpace: 'nowrap',
        display: 'inline-block',
        userSelect: 'none',
        ...style,
      }}
    >
      {name}
    </span>
  )
}
