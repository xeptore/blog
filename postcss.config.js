const path = require("node:path");

const themeDir = path.join(__dirname, "assets", "css");

/** @type {import('postcss-load-config').Config} */
module.exports = {
  plugins: {
    tailwindcss: {},
    "postcss-import": {
      path: [themeDir],
    },
    "postcss-normalize": {},
    autoprefixer: {
      path: [themeDir],
    },
    cssnano: {
      preset: [
        "default",
        { discardComments: { removeAll: true }, normalizeWhitespace: true },
      ],
    },
    "@fullhuman/postcss-purgecss": {
      content: ["content/**/*.md", "layouts/**/*.html"],
    },
  },
};
