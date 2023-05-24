process.env.ESLINT_TSCONFIG = "tsconfig.json";

module.exports = {
  extends: "@antfu",
  rules: {
    "curly": ["error", "all"],
    "@typescript-eslint/semi": ["error", "always"],
    "@typescript-eslint/quotes": ["error", "double", { avoidEscape: true }],
    "@typescript-eslint/brace-style": ["error", "1tbs"],
  },
};
