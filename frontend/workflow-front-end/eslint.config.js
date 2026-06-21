import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// Custom inline plugin — errors on any JSX `style` attribute.
// Use Tailwind classes instead.
const localPlugin = {
  rules: {
    'no-inline-styles': {
      meta: {
        type: 'problem',
        docs: { description: 'Disallow inline style JSX attributes. Use Tailwind classes instead.' },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.type !== 'JSXIdentifier' || node.name.name !== 'style') return
            // Allow style={dynamicStyle(...)} — runtime values Tailwind cannot generate as classes.
            const val = node.value
            if (
              val?.type === 'JSXExpressionContainer' &&
              val.expression.type === 'CallExpression' &&
              val.expression.callee.type === 'Identifier' &&
              val.expression.callee.name === 'dynamicStyle'
            ) return
            context.report({
              node,
              message: 'Inline styles are not allowed. Use Tailwind classes instead. For runtime-computed values use dynamicStyle() from utils/dynamicStyle.',
            })
          },
        }
      },
    },
  },
}

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: ['./tsconfig.app.json', './tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      local: localPlugin,
    },
    rules: {
      'local/no-inline-styles': 'error',
    },
  },
])
