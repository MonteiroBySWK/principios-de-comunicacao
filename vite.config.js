const { defineConfig } = require("vite");

module.exports = defineConfig({
  base: process.env.BASE_URL || "/",
  root: "src",
  server: {
    open: "/",
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
});
