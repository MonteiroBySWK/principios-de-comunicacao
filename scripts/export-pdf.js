const fs = require("fs");
const http = require("http");
const path = require("path");
const puppeteer = require("puppeteer");

const DIST_DIR = path.resolve(__dirname, "..", "dist");
const OUTPUT_PATH = path.resolve(DIST_DIR, "presentation.pdf");
const PORT = process.env.PDF_PORT ? Number(process.env.PDF_PORT) : 4173;

const contentTypes = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};

const resolveFilePath = (urlPath) => {
  const safePath = decodeURIComponent(urlPath.split("?")[0]);
  const normalizedPath = safePath.endsWith("/") ? `${safePath}index.html` : safePath;
  const filePath = path.resolve(DIST_DIR, `.${normalizedPath}`);
  if (!filePath.startsWith(DIST_DIR)) {
    return null;
  }
  return filePath;
};

const createServer = () =>
  http.createServer((req, res) => {
    const filePath = resolveFilePath(req.url || "/");
    if (!filePath) {
      res.writeHead(400);
      res.end("Bad request");
      return;
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }

      const ext = path.extname(filePath);
      res.writeHead(200, { "Content-Type": contentTypes[ext] || "text/plain" });
      res.end(data);
    });
  });

const ensureDist = () => {
  if (!fs.existsSync(path.join(DIST_DIR, "index.html"))) {
    console.error("dist/index.html nao encontrado. Rode `npm run build` antes.");
    process.exit(1);
  }
};

const exportPdf = async () => {
  ensureDist();
  const server = createServer();

  await new Promise((resolve) => server.listen(PORT, resolve));
  const url = `http://localhost:${PORT}/`;

  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: "networkidle0" });
  await page.emulateMediaType("screen");
  await page.evaluate(() => {
    document.body.classList.add("pdf-export");
    document.querySelectorAll("img").forEach((img) => {
      img.loading = "eager";
      img.decoding = "sync";
    });
  });
  await page.evaluate(async () => {
    const images = Array.from(document.images);
    await Promise.all(
      images.map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise((resolve) => {
              const done = () => resolve();
              img.addEventListener("load", done, { once: true });
              img.addEventListener("error", done, { once: true });
            })
      )
    );
  });
  await page.pdf({
    path: OUTPUT_PATH,
    width: "1280px",
    height: "720px",
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
    printBackground: true,
    preferCSSPageSize: false,
  });

  await browser.close();
  server.close();

  console.log(`PDF gerado em ${OUTPUT_PATH}`);
};

exportPdf().catch((error) => {
  console.error(error);
  process.exit(1);
});
