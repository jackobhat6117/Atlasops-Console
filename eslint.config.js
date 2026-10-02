import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// Feature-Sliced Design boundaries, enforced at lint time:
// 1. A layer may only import from layers below it:
//    app → pages → widgets → features → entities → shared
// 2. Other slices are imported only through their public API (index.ts), never deep paths.
//    Exception: the `@x` cross-import convention between entities.
// 3. Slices on the same layer don't import each other. Inside a slice, use relative imports.
// 4. Application code never imports test or mock infrastructure.
const LAYERS = ['app', 'pages', 'widgets', 'features', 'entities', 'shared']

const deepImport = {
  regex: '^@/((pages|widgets|features|entities)/[^/]+/(?!@x/)|shared/[^/]+/)',
  message: 'Import slices through their public API (index.ts), not internal paths.',
}

const infrastructure = {
  regex: '^@/(mocks|test)(/|$)',
  message: 'Application code must not depend on mocks or test utilities.',
}

function layerRules(layer) {
  const higher = LAYERS.slice(0, LAYERS.indexOf(layer))
  const patterns = [deepImport, infrastructure]
  if (higher.length) {
    patterns.push({
      regex: `^@/(${higher.join('|')})(/|$)`,
      message: `The ${layer} layer may only import from layers below it (${LAYERS.slice(LAYERS.indexOf(layer) + 1).join(', ') || 'none'}).`,
    })
  }
  if (layer !== 'app' && layer !== 'shared') {
    patterns.push({
      regex: layer === 'entities' ? '^@/entities/(?![^/]+/@x/)' : `^@/${layer}/`,
      message: `Slices in ${layer} must not import each other${layer === 'entities' ? ' (use the @x convention)' : ''}. Use relative imports inside a slice.`,
    })
  }
  return {
    files: [`src/${layer}/**/*.{ts,tsx}`],
    ignores: ['**/*.test.{ts,tsx}'],
    rules: { 'no-restricted-imports': ['error', { patterns }] },
  }
}

export default defineConfig([
  globalIgnores(['dist', 'public/mockServiceWorker.js']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  ...LAYERS.map(layerRules),
])
