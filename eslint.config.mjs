import globals from "globals";
import pluginJs from "@eslint/js";


export default [
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        root: 'readonly',
      }
    },
    rules: {
      "no-unused-vars": ["error", {
        "vars": "all",
        "args": "none",
        "caughtErrors": "all",
        "ignoreRestSiblings": false,
        "reportUsedIgnorePattern": false
    }]
    }
  },
  pluginJs.configs.recommended,
];