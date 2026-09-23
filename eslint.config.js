// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
    rules: {
      // These effects start asynchronous remote-data loads; state is not changed
      // synchronously in the effect body.
      "react-hooks/set-state-in-effect": "off",
    },
  }
]);
