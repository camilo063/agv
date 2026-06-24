import React from 'react'

/* Button del sistema de diseño (variantes Primary/Secondary/Danger × LG/MD/SM).
   Consume tokens vía Tailwind (no estilos inline). Subset mínimo para el shell;
   las variantes completas (Hover/Pressed/Disabled) se extraen del Figma canónico
   cuando se cierre D-10. Ver 04-sistema-de-diseno.md (nodeId Buttons: 9:1226). */
type Variant = 'primary' | 'secondary' | 'danger'
type Size = 'lg' | 'md' | 'sm'

const base =
  'inline-flex items-center justify-center rounded-xl font-bold transition-colors disabled:opacity-50 disabled:pointer-events-none'

const variants: Record<Variant, string> = {
  primary: 'bg-brand-primary text-white hover:bg-brand-secondary',
  secondary: 'bg-brand-light text-brand-primary hover:bg-brand-surface',
  danger: 'bg-error-bg text-error-text hover:opacity-90',
}

const sizes: Record<Size, string> = {
  lg: 'h-14 px-6 text-lg',
  md: 'h-12 px-5 text-base',
  sm: 'h-10 px-4 text-sm',
}

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
}

export function Button({ variant = 'primary', size = 'md', className = '', ...props }: ButtonProps) {
  return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />
}
