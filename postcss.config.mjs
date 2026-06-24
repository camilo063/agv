// Tailwind v4 usa el plugin de PostCSS dedicado. La configuración es CSS-first
// (directiva @theme en app/(app)/styles/globals.css mapeada a theme/design-tokens.css).
// Tailwind NO aplica al admin de Payload (SCSS nativo) — solo al grupo (app).
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}

export default config
