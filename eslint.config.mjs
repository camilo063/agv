// ESLint flat config (eslint 9 + eslint-config-next 16 nativo flat).
// Nota: Next 16 ya NO corre ESLint durante `next build`; el lint vive en `pnpm lint` y CI.
import nextConfig from 'eslint-config-next'

const base = Array.isArray(nextConfig) ? nextConfig : [nextConfig]

const config = [
  ...base,
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'uploads/**',
      'payload-types.ts',
      'app/(payload)/agv/importMap.js',
    ],
  },
]

export default config
