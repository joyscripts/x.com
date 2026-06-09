import reactRefresh from "eslint-plugin-react-refresh";
import { config as reactConfig } from "@repo/eslint-config/react-internal";

export default [
  ...reactConfig,
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: {
      "react-refresh": reactRefresh,
    },
    rules: {
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
  },
];
