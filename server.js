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

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  let pathname = parsedUrl.pathname;

  // CORS Headers para requisições de API
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // ==========================================
  // API: Status da Configuração do Gateway
  // ==========================================
  if (pathname === "/api/gateway-status" && req.method === "GET") {
    const token = process.env.MP_ACCESS_TOKEN || 
                  process.env.MERCADO_PAGO_TOKEN || 
                  process.env.MERCADOPAGO_ACCESS_TOKEN || 
                  process.env.ACCESS_TOKEN;
    res.writeHead(200, { "Content-Type": "application/json; charset=UTF-8" });
    res.end(JSON.stringify({ 
      active: Boolean(token && token.trim().length > 10),
      gateway: "Mercado Pago"
    }));
    return;
  }

  // ==========================================
  // API: Criar Preferência de Pagamento (Mercado Pago)
  // ==========================================
  if (pathname === "/api/create-preference" && req.method === "POST") {
    const token = process.env.MP_ACCESS_TOKEN || 
                  process.env.MERCADO_PAGO_TOKEN || 
                  process.env.MERCADOPAGO_ACCESS_TOKEN || 
                  process.env.ACCESS_TOKEN;

    if (!token || token.trim().length < 10) {
      res.writeHead(400, { "Content-Type": "application/json; charset=UTF-8" });
      res.end(JSON.stringify({ 
        success: false, 
        error: "Token do Mercado Pago não configurado nas variáveis de ambiente do Railway (MP_ACCESS_TOKEN)." 
      }));
      return;
    }

    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", async () => {
      try {
        const order = JSON.parse(body || "{}");
        const host = req.headers.host || "jelbrigadeiros.com.br";
        const protocol = req.headers["x-forwarded-proto"] || "https";

        const mpPayload = {
          items: [
            {
              id: order.id || "JEL-" + Date.now(),
              title: `Encomenda J&L Brigadeiros #${order.id || ""}`,
              description: `Pedido de doces artesanais #${order.id || ""}`,
              quantity: 1,
              currency_id: "BRL",
              unit_price: parseFloat(Number(order.total || 0).toFixed(2))
            }
          ],
          payer: {
            name: order.customerName || "Cliente",
            phone: {
              number: (order.customerPhone || "").replace(/\D/g, "")
            }
          },
          external_reference: order.id,
          back_urls: {
            success: `${protocol}://${host}/?payment_status=success&orderId=${order.id}`,
            failure: `${protocol}://${host}/?payment_status=failure&orderId=${order.id}`,
            pending: `${protocol}://${host}/?payment_status=pending&orderId=${order.id}`
          },
          auto_return: "approved",
          statement_descriptor: "JL BRIGADEIROS"
        };

        const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token.trim()}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(mpPayload)
        });

        const mpData = await mpRes.json();

        if (!mpRes.ok) {
          console.error("Erro Mercado Pago API:", mpData);
          res.writeHead(mpRes.status || 400, { "Content-Type": "application/json; charset=UTF-8" });
          res.end(JSON.stringify({ success: false, error: mpData.message || "Erro ao gerar cobrança no Mercado Pago" }));
          return;
        }

        res.writeHead(200, { "Content-Type": "application/json; charset=UTF-8" });
        res.end(JSON.stringify({
          success: true,
          id: mpData.id,
          init_point: mpData.init_point,
          sandbox_init_point: mpData.sandbox_init_point
        }));
      } catch (err) {
        console.error("Erro interno ao processar preferência:", err);
        res.writeHead(500, { "Content-Type": "application/json; charset=UTF-8" });
        res.end(JSON.stringify({ success: false, error: "Erro interno no servidor: " + err.message }));
      }
    });
    return;
  }

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
