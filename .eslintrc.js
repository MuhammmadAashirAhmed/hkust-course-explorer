// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  root: true,
  extends: [
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-native/all",
    // `expo` must come after `standard` or its globals configuration will be overridden
    "expo",
    // `jsx-runtime` must come after `expo` or it will be overridden
    "plugin:react/jsx-runtime",
    "prettier",
  ],
  plugins: ["reactotron", "prettier"],
  rules: {
    "prettier/prettier": "error",
    // typescript-eslint
    "@typescript-eslint/array-type": 0,
    "@typescript-eslint/ban-ts-comment": 0,
    "@typescript-eslint/no-explicit-any": 0,
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      },
    ],
    "@typescript-eslint/no-var-requires": 0,
    "@typescript-eslint/no-require-imports": 0,
    "@typescript-eslint/no-empty-object-type": 0,
    // eslint
    "no-use-before-define": 0,
    "no-restricted-imports": [
      "error",
      {
        paths: [
          // Prefer named exports from 'react' instead of importing `React`
          {
            name: "react",
            importNames: ["default"],
            message: "Import named exports from 'react' instead.",
          },
          {
            name: "react-native",
            importNames: ["SafeAreaView"],
            message: "Use the SafeAreaView from 'react-native-safe-area-context' instead.",
          },
          {
            name: "react-native",
            importNames: ["Text", "Button", "TextInput"],
            message: "Use the custom wrapper component from '@/components'.",
          },
        ],
      },
    ],
    // react
    "react/prop-types": 0,
    // react-native
    "react-native/no-raw-text": 0,
    // reactotron
    "reactotron/no-tron-in-production": "error",
    // react-hooks: this rule ships as part of the "expo" config as of SDK 57's
    // eslint-config-expo, and flags legitimate ref.current reads inside inline
    // style arrays in the untouched Ignite boilerplate components (Toggle/*,
    // Screen.tsx) that predate this app's own code. Disabled rather than
    // rewriting boilerplate this app doesn't otherwise touch.
    "react-hooks/refs": 0,
    // eslint-config-standard overrides
    "comma-dangle": 0,
    "no-global-assign": 0,
    "quotes": 0,
    "space-before-function-paren": 0,
    // eslint-import
    "import/order": [
      "error",
      {
        "alphabetize": {
          order: "asc",
          caseInsensitive: true,
        },
        "newlines-between": "always",
        "groups": [["builtin", "external"], "internal", "unknown", ["parent", "sibling"], "index"],
        "distinctGroup": false,
        "pathGroups": [
          {
            pattern: "react",
            group: "external",
            position: "before",
          },
          {
            pattern: "react-native",
            group: "external",
            position: "before",
          },
          {
            pattern: "expo{,-*}",
            group: "external",
            position: "before",
          },
          {
            pattern: "@/**",
            group: "unknown",
            position: "after",
          },
        ],
        "pathGroupsExcludedImportTypes": ["react", "react-native", "expo", "expo-*"],
      },
    ],
    "import/newline-after-import": 1,
  },
  overrides: [
    {
      // Build-time Node scripts (run via `node scripts/...`, never bundled into the app).
      files: ["scripts/**/*.js"],
      env: { node: true },
    },
  ],
}
