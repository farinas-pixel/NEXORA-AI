const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const tseslint = require('@typescript-eslint/eslint-plugin');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      "dist/*",
      "server/*",
      "test/*",
      "node_modules/*",
      ".expo/*",
      "web-build/*",
    ],
  },
  {
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      "react/no-unescaped-entities": "off",
      "react-hooks/refs": "off",
      "react-hooks/immutability": "off",
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/array-type": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
]);
