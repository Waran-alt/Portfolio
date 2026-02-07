import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      globals: { ...globals.node },
      ecmaVersion: 2022,
      sourceType: "module",
    },
  },
];
