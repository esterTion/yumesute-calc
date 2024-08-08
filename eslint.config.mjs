import globals from "globals";
import pluginJs from "@eslint/js";


export default [
  {
    ignores: [
      'main-build.*',
      'dist',
    ]
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        root: 'readonly',
      }
    }
  },
  {
    rules: {
      "no-unused-vars": ["error", {
        "vars": "all",
        "args": "none",
        "caughtErrors": "all",
        "ignoreRestSiblings": false,
        "reportUsedIgnorePattern": false
      }],
      "indent": ["error", 2, {
        "SwitchCase": 1,
      }],
      "eol-last": ["error", "always"],
      "linebreak-style": ["error", "unix"],
    }
  },
  pluginJs.configs.recommended,
];
