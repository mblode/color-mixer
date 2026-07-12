import core from "ultracite/oxlint/core";
import next from "ultracite/oxlint/next";
import react from "ultracite/oxlint/react";

export default {
  extends: [core, next, react],
  ignorePatterns: core.ignorePatterns,
  // Ultracite/oxlint rules relaxed for this codebase. It's a low-level WebGPU
  // fluid-simulation + brush engine, so numeric/bitwise/loop-heavy code and
  // custom `.filter()` methods trip several stylistic rules with no safe
  // autofix; these are deferred rather than mechanically rewritten. Genuine
  // findings (e.g. jsx-no-target-blank) are fixed in the source.
  rules: {
    // Custom class methods named `filter(a, b)` are misread as Array#filter
    // with a thisArg — false positives across the brush/one-euro code.
    "no-array-method-this-argument": "off",
    // Reordering object keys is churn with no behavioural benefit.
    "sort-keys": "off",
    // Codebase uses `function` declarations and forward references throughout.
    "func-style": "off",
    "no-use-before-define": "off",
    // Low-level numeric code: bitwise ops, index loops and integer literals
    // read more clearly in their existing form.
    "no-bitwise": "off",
    "no-plusplus": "off",
    "numeric-separators-style": "off",
    "prefer-destructuring": "off",
    "prefer-math-trunc": "off",
    // Stylistic import/type/method-shape preferences without behavioural impact.
    "consistent-type-specifier-style": "off",
    "method-signature-style": "off",
    "array-type": "off",
    "no-inline-comments": "off",
    "class-methods-use-this": "off",
    "max-classes-per-file": "off",
    // Assorted unicorn/promise/regex stylistic rules deferred as mechanical.
    "no-non-null-assertion": "off",
    "prefer-spread": "off",
    "unicorn/prefer-spread": "off",
    "no-array-sort": "off",
    "prefer-await-to-then": "off",
    "prefer-await-to-callbacks": "off",
    "require-unicode-regexp": "off",
    "prefer-named-capture-group": "off",
    "no-zero-fractions": "off",
    "no-useless-undefined": "off",
    "no-immediate-mutation": "off",
    "consistent-function-scoping": "off",
    "prefer-promise-reject-errors": "off",
    "newline-after-import": "off",
    // Present and intentional: react-compiler effect hint, dangerouslySetInnerHTML
    // and a fixed-size external <img>. Matches the recipe's precedent.
    "react-compiler": "off",
    "no-danger": "off",
    "no-img-element": "off",
    // Prop-spreading wrapper components receive their accessible heading text
    // from callers, which the static rule cannot observe.
    "jsx-a11y/heading-has-content": "off",
  },
};
