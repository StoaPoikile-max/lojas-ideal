/* Proteções usadas pelas funções do servidor. O "_" no nome impede a Vercel
   de publicar este arquivo como endereço público. */

const crypto = require("crypto");

/* Limite de chamadas por IP. A memória vale por instância do servidor, então é
   uma barreira contra rajadas (robôs, cliques em série), não uma garantia total:
   para ataques grandes, use também o Firewall da Vercel. */
const baldes = new Map();
function limitar(req, nome, maximo, janelaMs) {
  const ip = String(req.headers["x-real-ip"] || String(req.headers["x-forwarded-for"] || "").split(",")[0] || "?").trim().slice(0, 64);
  const agora = Date.now(), chave = nome + "|" + ip;
  if (baldes.size > 5000) {
    for (const [k, v] of baldes) if (v.fim <= agora) baldes.delete(k);
    if (baldes.size > 5000) baldes.clear();
  }
  let b = baldes.get(chave);
  if (!b || b.fim <= agora) { b = { n: 0, fim: agora + janelaMs }; baldes.set(chave, b); }
  b.n += 1;
  return b.n <= maximo;
}

/* Só aceita chamadas feitas pela própria página do site (bloqueia outro site
   tentando usar o navegador do cliente para chamar a função). */
function mesmaOrigem(req) {
  const host = String(req.headers.host || "");
  const origem = req.headers.origin;
  if (origem) return String(origem).replace(/^https?:\/\//, "") === host;
  const sitio = req.headers["sec-fetch-site"];
  return !sitio || sitio === "same-origin" || sitio === "none";
}

/* Confere a assinatura que o Mercado Pago manda em cada aviso (HMAC-SHA256).
   Modelo oficial: "id:<data.id>;request-id:<x-request-id>;ts:<ts>;" */
function assinaturaMercadoPago(req, segredo, dataId) {
  const partes = {};
  for (const pedaco of String(req.headers["x-signature"] || "").split(",")) {
    const i = pedaco.indexOf("=");
    if (i > 0) partes[pedaco.slice(0, i).trim()] = pedaco.slice(i + 1).trim();
  }
  const ts = partes.ts, v1 = partes.v1;
  if (!ts || !/^[0-9a-f]{64}$/i.test(v1 || "")) return false;
  const reqId = String(req.headers["x-request-id"] || "");
  let manifesto = "";
  if (dataId) manifesto += "id:" + String(dataId).toLowerCase() + ";";
  if (reqId) manifesto += "request-id:" + reqId + ";";
  manifesto += "ts:" + ts + ";";
  const certo = crypto.createHmac("sha256", segredo).update(manifesto).digest();
  const veio = Buffer.from(v1, "hex");
  return veio.length === certo.length && crypto.timingSafeEqual(veio, certo);
}

/* Número de pedido impossível de adivinhar. */
function novoPedido() {
  const letras = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let s = "";
  for (const b of crypto.randomBytes(10)) s += letras[b % letras.length];
  return "ID" + s;
}

function semCache(res) {
  res.setHeader("Cache-Control", "no-store");
}

module.exports = { limitar, mesmaOrigem, assinaturaMercadoPago, novoPedido, semCache };
