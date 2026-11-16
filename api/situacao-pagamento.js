/* A página "obrigado" pergunta aqui se o pagamento existe mesmo.
   Sem isto, qualquer pessoa poderia montar um link com "status=approved" e
   mandar para a loja uma mensagem de "pagamento aprovado" sem ter pago.
   Só responde quando o número do pagamento E o número do pedido batem. */

const { limitar, mesmaOrigem, semCache } = require("./_seguranca.js");

module.exports = async function (req, res) {
  semCache(res);
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ erro: "Use GET." });
  }
  if (!mesmaOrigem(req)) return res.status(403).json({ erro: "Origem não permitida." });
  if (!limitar(req, "situacao", 20, 60000)) {
    res.setHeader("Retry-After", "60");
    return res.status(429).json({ erro: "Muitas consultas. Espere um minuto." });
  }
  const q = req.query || {};
  const id = typeof q.id === "string" ? q.id : "", ref = typeof q.pedido === "string" ? q.pedido : "";
  if (!/^\d{5,20}$/.test(id) || !/^ID[0-9A-Z]{6,14}$/.test(ref)) return res.status(400).json({ erro: "Consulta inválida." });
  if (!process.env.MP_ACCESS_TOKEN) return res.status(503).json({ erro: "Pagamento online ainda não configurado." });
  try {
    const r = await fetch("https://api.mercadopago.com/v1/payments/" + id, {
      headers: { Authorization: "Bearer " + process.env.MP_ACCESS_TOKEN }
    });
    if (!r.ok) return res.status(404).json({ erro: "Pagamento não encontrado." });
    const pg = await r.json();
    if (String(pg.external_reference || "") !== ref) return res.status(404).json({ erro: "Pagamento não encontrado." });
    const situacao = { approved: "aprovado", pending: "pendente", in_process: "pendente" }[pg.status] || "nao_concluido";
    return res.status(200).json({ situacao: situacao, forma: String(pg.payment_type_id || "").slice(0, 40) });
  } catch (e) {
    console.error("situacao-pagamento:", e && e.message);
    return res.status(502).json({ erro: "Não foi possível conferir agora." });
  }
};
