/* Recebe o aviso do Mercado Pago quando um pagamento muda de situação.
   Segurança em duas camadas:
   1) se MP_WEBHOOK_SECRET estiver configurada, o aviso só é aceito com a
      assinatura do Mercado Pago (quem não é o Mercado Pago recebe 401);
   2) o conteúdo do aviso NUNCA é usado como verdade: com o número do pagamento,
      o servidor pergunta direto ao Mercado Pago qual é a situação real. */

const { limitar, assinaturaMercadoPago, semCache } = require("./_seguranca.js");

module.exports = async function (req, res) {
  semCache(res);
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false });
  }
  if (!limitar(req, "aviso", 120, 60000)) return res.status(429).json({ ok: false });
  try {
    let corpo = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    if (!corpo || typeof corpo !== "object") corpo = {};
    const q = req.query || {};
    const tipo = corpo.type || q.type || q.topic;
    const id = String((corpo.data && corpo.data.id) || q["data.id"] || q.id || "");
    if (tipo !== "payment" || !/^\d{5,20}$/.test(id) || !process.env.MP_ACCESS_TOKEN) {
      return res.status(200).json({ ok: true });
    }
    const segredo = process.env.MP_WEBHOOK_SECRET;
    if (segredo && (String(q["data.id"] || "") !== id || !assinaturaMercadoPago(req, segredo, id))) {
      return res.status(401).json({ ok: false });
    }

    const r = await fetch("https://api.mercadopago.com/v1/payments/" + id, {
      headers: { Authorization: "Bearer " + process.env.MP_ACCESS_TOKEN }
    });
    if (!r.ok) return res.status(200).json({ ok: true });
    const pg = await r.json();
    const ref = String(pg.external_reference || "");
    if (!/^ID[0-9A-Z]{6,14}$/.test(ref)) return res.status(200).json({ ok: true });

    const url = process.env.SUPABASE_URL, chave = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && chave) {
      const situacao = { approved: "pago", pending: "aguardando_pagamento", in_process: "em_analise", rejected: "recusado", cancelled: "cancelado", refunded: "devolvido", charged_back: "contestado" }[pg.status] || "outro";
      await fetch(url.replace(/\/+$/, "") + "/rest/v1/pedidos?id=eq." + encodeURIComponent(ref), {
        method: "PATCH",
        headers: cabecalhos(chave),
        body: JSON.stringify({
          status: situacao,
          pagamento_id: id,
          forma_pagamento: String(pg.payment_type_id || "").slice(0, 40),
          valor_pago: Number(pg.transaction_amount) || 0,
          atualizado_em: new Date().toISOString()
        })
      });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("aviso-pagamento:", e && e.message);
    return res.status(200).json({ ok: true });
  }
};

// Chave nova do Supabase (sb_secret_...) vai só no cabeçalho apikey; a antiga (eyJ...) também pede Authorization.
function cabecalhos(chave) {
  const h = { apikey: chave, "Content-Type": "application/json", Prefer: "return=minimal" };
  if (chave.indexOf("eyJ") === 0) h.Authorization = "Bearer " + chave;
  return h;
}
