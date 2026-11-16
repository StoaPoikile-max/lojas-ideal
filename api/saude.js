/* Conferência rápida da configuração, sem revelar nenhum valor:
   diz só se o pagamento está ligado e se o banco de dados responde à chave do servidor. */

const { limitar, semCache } = require("./_seguranca.js");

module.exports = async function (req, res) {
  semCache(res);
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ erro: "Use GET." });
  }
  if (!limitar(req, "saude", 10, 60000)) return res.status(429).json({ erro: "Espere um minuto." });

  const url = process.env.SUPABASE_URL, chave = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  let banco = "desligado";
  if (url && chave) {
    try {
      const h = { apikey: chave };
      if (chave.indexOf("eyJ") === 0) h.Authorization = "Bearer " + chave;
      const r = await fetch(url.replace(/\/+$/, "") + "/rest/v1/pedidos?select=id&limit=1", { headers: h });
      banco = r.ok ? "ok" : "erro";
    } catch (e) {
      banco = "erro";
    }
  }
  return res.status(200).json({ pagamento: process.env.MP_ACCESS_TOKEN ? "ligado" : "desligado", banco: banco });
};
