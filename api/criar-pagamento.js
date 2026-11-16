/* Cria o pagamento no Mercado Pago (Checkout Pro: Pix, cartão e boleto).
   Roda no servidor da Vercel. A chave secreta fica na variável de ambiente
   MP_ACCESS_TOKEN e nunca aparece no site. */

const { LOJA, PRODUTOS } = require("../loja.js");
// Peças de conjuntos são vendidas como itens próprios; o conjunto em si não vai para a sacola.
const ITENS = PRODUTOS.flatMap((p) => (p.pecas ? p.pecas : [p]));

module.exports = async function (req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ erro: "Use POST." });
  }
  if (!process.env.MP_ACCESS_TOKEN) {
    return res.status(503).json({ erro: "Pagamento online ainda não configurado." });
  }

  // Só aceita pedidos vindos do próprio site.
  const origem = req.headers.origin;
  if (origem && origem.replace(/^https?:\/\//, "") !== req.headers.host) {
    return res.status(403).json({ erro: "Origem não permitida." });
  }

  let corpo;
  try {
    corpo = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  } catch (e) {
    return res.status(400).json({ erro: "Pedido inválido." });
  }
  const itens = Array.isArray(corpo.itens) ? corpo.itens.slice(0, 30) : [];
  const cliente = corpo.cliente || {};

  // O preço vem SEMPRE do catálogo do servidor, nunca do navegador do cliente.
  const linhas = [];
  for (const it of itens) {
    const p = ITENS.find((x) => x.id === it.id);
    const qtd = Math.floor(Number(it.qtd));
    if (!p || !(qtd >= 1 && qtd <= 20) || !p.tamanhos.includes(String(it.tam))) {
      return res.status(400).json({ erro: "Algum item da sacola não está mais disponível. Atualize a página." });
    }
    linhas.push({
      id: p.id,
      title: (p.nome + " – " + p.desc + (it.tam !== "Único" ? " – tam. " + it.tam : "")).slice(0, 250),
      quantity: qtd,
      unit_price: Number(p.preco.toFixed(2)),
      currency_id: "BRL"
    });
  }
  if (!linhas.length) return res.status(400).json({ erro: "A sacola está vazia." });

  const base = process.env.SITE_URL || "https://" + req.headers.host;
  const pedido = "ID" + Date.now().toString(36).toUpperCase();

  const preferencia = {
    items: linhas,
    payer: { name: String(cliente.nome || "").slice(0, 80) },
    external_reference: pedido,
    statement_descriptor: "LOJAS IDEAL",
    back_urls: {
      success: base + "/obrigado.html",
      pending: base + "/obrigado.html",
      failure: base + "/obrigado.html"
    },
    auto_return: "approved",
    notification_url: base + "/api/aviso-pagamento",
    metadata: {
      whatsapp: String(cliente.whatsapp || "").slice(0, 20),
      recebimento: String(corpo.recebimento || "retirada"),
      endereco: String(corpo.endereco || "").slice(0, 200)
    }
  };

  try {
    const r = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + process.env.MP_ACCESS_TOKEN,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(preferencia)
    });
    const dados = await r.json();
    if (!r.ok || !dados.init_point) {
      console.error("Mercado Pago recusou:", r.status, JSON.stringify(dados));
      return res.status(502).json({ erro: "O Mercado Pago não respondeu. Tente de novo ou feche pelo WhatsApp." });
    }
    // Registra o pedido no Supabase (se estiver configurado). O site funciona sem ele.
    await salvarPedido({
      id: pedido,
      nome: preferencia.payer.name,
      whatsapp: preferencia.metadata.whatsapp,
      recebimento: preferencia.metadata.recebimento,
      endereco: preferencia.metadata.endereco,
      itens: linhas,
      total: Number(linhas.reduce((s, l) => s + l.unit_price * l.quantity, 0).toFixed(2)),
      status: "aguardando_pagamento"
    });
    return res.status(200).json({ url: dados.init_point, pedido: pedido, loja: LOJA.nome });
  } catch (e) {
    console.error(e);
    return res.status(502).json({ erro: "Não foi possível abrir o pagamento agora." });
  }
};

async function salvarPedido(linha) {
  const url = process.env.SUPABASE_URL, chave = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) return;
  try {
    await fetch(url + "/rest/v1/pedidos", {
      method: "POST",
      headers: cabecalhos(chave),
      body: JSON.stringify(linha)
    });
  } catch (e) {
    console.error("Supabase:", e);
  }
}

// Chave nova do Supabase (sb_secret_...) vai só no cabeçalho apikey; a antiga (eyJ...) também pede Authorization.
function cabecalhos(chave) {
  const h = { apikey: chave, "Content-Type": "application/json", Prefer: "return=minimal" };
  if (chave.indexOf("eyJ") === 0) h.Authorization = "Bearer " + chave;
  return h;
}
