import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist', 'node_modules'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true }, // 👈 Ye batata hai ke JSX allowed hai
        sourceType: 'module',
      },
    },
    plugins: {
      react, // 👈 React plugin add kiya
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules, // 👈 React base rules
      ...reactHooks.configs.recommended.rules,
      
      'no-unused-vars': 'off',
      'react/react-in-jsx-scope': 'off',    // Vite mein React import karna zaroori nahi har jagah
      'react/prop-types': 'off',           // Prop types ka error band
      'react/no-unknown-property': 'off',
      'no-undef': 'warn',
      
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
    settings: {
      react: { version: 'detect' }, // 👈 React version auto-detect karega
    },
  },
]