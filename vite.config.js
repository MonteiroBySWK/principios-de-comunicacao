const { defineConfig } = require("vite");

module.exports = defineConfig({
  base: process.env.BASE_URL || "/",
  server: {
    open: "/src/index.html",
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: "src/index.html",
    },
  },
});
