/* Catálogo em CSV para o Gerenciador de Comércio da Meta (Instagram/Facebook)
   e para o Google Merchant Center. Endereço: https://SEU-SITE/api/feed
   Lê os produtos de loja.js, então fica sempre igual ao site. */

const { PRODUTOS } = require("../loja.js");
const MARCAS = ["Olympikus", "Mizuno", "Under Armour", "Mormaii", "Condor", "Technos", "Bebecê", "Via Marte", "Sua Cia", "Classe", "Rider", "Havaianas", "Ipanema", "Lupo", "HIS", "Carolina Herrera", "La Rive", "Shakira", "Antonio Banderas", "Jacques Bogart", "Linn Young", "iScents"];

module.exports = function (req, res) {
  const base = process.env.SITE_URL || "https://" + req.headers.host;
  const csv = (v) => '"' + String(v).replace(/"/g, '""') + '"';
  const linhas = [["id", "title", "description", "availability", "condition", "price", "link", "image_link", "brand", "product_type"].join(",")];
  const itens = PRODUTOS.flatMap((g) => (g.pecas ? g.pecas.map((x) => Object.assign({}, x, { foto: g.foto, categoria: g.categoria, sub: g.sub })) : [g]));
  for (const p of itens) {
    const texto = p.nome + " " + p.desc;
    const marca = MARCAS.find((m) => texto.toLowerCase().includes(m.toLowerCase())) || "Lojas Ideal";
    linhas.push([
      p.id,
      p.nome,
      p.nome + ". " + p.desc + ". Retire na Lojas Ideal, no centro de Pojuca, ou receba em casa.",
      "in stock",
      "new",
      p.preco.toFixed(2) + " BRL",
      base + "/#p-" + p.id,
      base + "/" + p.foto,
      marca,
      p.categoria + " > " + p.sub
    ].map(csv).join(","));
  }
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.status(200).send(linhas.join("\n"));
};
