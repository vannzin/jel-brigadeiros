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
                  process.env.ACCESS_TOKEN ||
                  process.env.MP_TOKEN;

    if (!token || token.trim().length < 10) {
      console.warn("⚠️ Token do Mercado Pago não encontrado nas variáveis do ambiente!");
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
        const isHttps = (req.headers["x-forwarded-proto"] === "https") || host.includes("railway.app") || host.includes("jelbrigadeiros.com.br");
        const protocol = isHttps ? "https" : "http";

        const totalAmount = Number(parseFloat(order.total || 0).toFixed(2));

        const mpPayload = {
          items: [
            {
              id: String(order.id || "JEL-1"),
              title: `Encomenda J&L Brigadeiros #${order.id || ""}`,
              description: `Doces artesanais J&L Brigadeiros`,
              quantity: 1,
              currency_id: "BRL",
              unit_price: totalAmount > 0 ? totalAmount : 1.00
            }
          ],
          payer: {
            name: (order.customerName || "Cliente J&L").slice(0, 30)
          },
          external_reference: String(order.id || "")
        };

        // Adicionar back_urls e auto_return apenas se for HTTPS em produção
        if (isHttps) {
          mpPayload.back_urls = {
            success: `https://${host}/?payment_status=success&orderId=${order.id}`,
            failure: `https://${host}/?payment_status=failure&orderId=${order.id}`,
            pending: `https://${host}/?payment_status=pending&orderId=${order.id}`
          };
          mpPayload.auto_return = "approved";
        }

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
          console.error("❌ Erro Mercado Pago API:", mpData);
          res.writeHead(mpRes.status || 400, { "Content-Type": "application/json; charset=UTF-8" });
          res.end(JSON.stringify({ 
            success: false, 
            error: mpData.message || (mpData.cause && mpData.cause[0] ? mpData.cause[0].description : "Erro ao gerar cobrança no Mercado Pago") 
          }));
          return;
        }

        console.log(`✅ Preferência Mercado Pago criada com sucesso para pedido ${order.id}:`, mpData.id);

        res.writeHead(200, { "Content-Type": "application/json; charset=UTF-8" });
        res.end(JSON.stringify({
          success: true,
          id: mpData.id,
          init_point: mpData.init_point,
          sandbox_init_point: mpData.sandbox_init_point
        }));
      } catch (err) {
        console.error("❌ Erro interno ao processar preferência:", err);
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
    const isDynamic = [".html", ".js", ".css", ".json"].includes(ext);

    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": isDynamic 
        ? "no-cache, no-store, must-revalidate, max-age=0" 
        : "public, max-age=3600, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0"
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
