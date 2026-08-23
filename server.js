const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0";
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  ".html": "text/html; charset=UTF-8",
  ".css": "text/css; charset=UTF-8",
  ".js": "application/javascript; charset=UTF-8",
  ".json": "application/json; charset=UTF-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".txt": "text/plain; charset=UTF-8"
};

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  let pathname = parsedUrl.pathname;

  // Rotas amigáveis
  if (pathname === "/" || pathname === "") {
    pathname = "/index.html";
  } else if (pathname === "/admin" || pathname === "/admin/") {
    pathname = "/admin.html";
  }

  // Prevenir Directory Traversal
  const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, "");
  let filePath = path.join(PUBLIC_DIR, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Tentar arquivo .html caso omitido
      if (fs.existsSync(filePath + ".html")) {
        filePath = filePath + ".html";
      } else {
        // Retornar 404 amigável ou fallback para index.html
        res.writeHead(404, { "Content-Type": "text/html; charset=UTF-8" });
        res.end("<h1>404 - Página não encontrada</h1><p><a href='/'>Voltar para J&L Brigadeiros</a></p>");
        return;
      }
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=86400"
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
    stream.on("error", () => {
      res.writeHead(500);
      res.end("Erro interno do servidor");
    });
  });
});

server.listen(PORT, HOST, () => {
  console.log(`🍰 J&L Brigadeiros rodando com sucesso na porta ${PORT} (${HOST})`);
  console.log(`🌐 Loja do Cliente: http://localhost:${PORT}`);
  console.log(`🔐 Painel Admin:   http://localhost:${PORT}/admin`);
});
