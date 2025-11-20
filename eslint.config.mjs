// eslint.config.js
import { defineConfig } from 'eslint/config';
import tinymceEslintPlugin from '@tinymce/eslint-plugin';
import js from '@eslint/js';

export default defineConfig([
  {
    files: [
      "**/*.ts"
    ],
    plugins: {
        "@tinymce": tinymceEslintPlugin
    },
    extends: [ '@tinymce/standard' ],
    languageOptions: {
      parserOptions: {
        sourceType: "module",
        project: [
            "./tsconfig.json"
        ]
      },
    },
    rules: {}
  },
  {
    files: [
      "rollup.config.js",
      "src/**/*.js"
    ],
    plugins: { js },
    env: {
      es6: true,
      node: true,
      browser: true
    },
    extends: [ "js/recommended" ],
    parser: "espree",
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module"
      }
    },
    rules: {
      "indent": [ "error", 2, { "SwitchCase": 1 } ],
      "no-shadow": "error",
      "no-unused-vars": [ "error", { "argsIgnorePattern": "^_" } ],
      "object-curly-spacing": [ "error", "always", { "arraysInObjects": false, "objectsInObjects": false } ],
      "quotes": [ "error", "single" ],
      "semi": "error"
    }
  }
]);