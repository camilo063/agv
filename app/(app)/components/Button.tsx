import React from 'react'

/* Button del sistema de diseño — specs EXACTAS del Figma (nodo 9:1226):
   - LG: px-32/py-16, radio 8 · MD: px-24/py-12, radio 8 · SM: px-16/py-4, radio 4.
   - Borde 1.5px en todas las variantes.
   - Primary: fondo brand-primary, texto blanco; hover → brand-secondary.
   - Secondary: fondo BLANCO, borde/texto brand-primary; hover → fondo brand-light
     + borde brand-secondary; pressed → fondo brand-light + borde brand-primary.
   - Danger: fondo blanco, borde/texto error-text; hover/pressed → fondo error-bg.
   - Disabled: fondo border(#E8E8E8), texto placeholder, sin borde visible. */
type Variant = 'primary' | 'secondary' | 'danger'
type Size = 'lg' | 'md' | 'sm'

const base =
  'inline-flex items-center justify-center border-[1.5px] font-bold transition-colors disabled:pointer-events-none disabled:border-transparent disabled:bg-border disabled:text-placeholder'

const variants: Record<Variant, string> = {
  primary:
    'border-brand-primary bg-brand-primary text-white hover:border-brand-secondary hover:bg-brand-secondary active:border-brand-primary active:bg-brand-primary',
  secondary:
    'border-brand-primary bg-white text-brand-primary hover:border-brand-secondary hover:bg-brand-light active:border-brand-primary active:bg-brand-light',
  danger: 'border-error-text bg-white text-error-text hover:bg-error-bg active:bg-error-bg',
}

const sizes: Record<Size, string> = {
  lg: 'rounded-lg px-8 py-4 text-lg',
  md: 'rounded-lg px-6 py-3 text-lg',
  sm: 'rounded px-4 py-1 text-sm',
}

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
}

export function Button({ variant = 'primary', size = 'md', className = '', ...props }: ButtonProps) {
  return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />
}

/* Mismos estilos para enlaces con apariencia de botón (evita duplicar clases). */
export function botonCls(variant: Variant = 'primary', size: Size = 'md', extra = ''): string {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`
}
