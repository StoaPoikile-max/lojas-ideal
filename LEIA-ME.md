# Site da Lojas Ideal

Site de vendas com pagamento por Pix, cartão e boleto (Mercado Pago), pedido pelo WhatsApp e localização da loja.

## O que tem na pasta

| Arquivo | Para que serve |
|---|---|
| `index.html` | O site: vitrine, sacola, endereço, horários |
| `loja.js` | **Dados da loja e produtos. É o arquivo que você edita.** |
| `obrigado.html` | Tela depois do pagamento; leva o cliente sozinho para o WhatsApp |
| `api/criar-pagamento.js` | Cria a cobrança no Mercado Pago (roda no servidor) |
| `api/aviso-pagamento.js` | Confirma o pagamento com o Mercado Pago e grava no Supabase |
| `api/feed.js` | Catálogo para Instagram e Google |
| `privacidade.html` | Política de privacidade (LGPD) |
| `fotos/` | Coloque aqui as fotos dos produtos e o logo |

## Colocar no ar (uma vez só)

1. **Conta Mercado Pago.** Crie em mercadopago.com.br no CPF ou CNPJ de quem vai receber o dinheiro e complete a verificação de identidade. Em "Seu negócio > Custos", escolha o prazo de recebimento (quanto mais rápido cai o dinheiro, maior a taxa).
2. **Chave de integração.** Em mercadopago.com.br/developers > "Suas integrações" > "Criar aplicação" > produto **Checkout Pro**. Copie o **Access Token de produção**. Essa chave é secreta: não mande por WhatsApp nem cole no site.
3. **Hospedagem.** Crie uma conta gratuita na vercel.com, clique em "Add New > Project" e envie esta pasta (pelo GitHub ou com o comando `npx vercel`).
4. **Ligar o pagamento.** Na Vercel, em "Settings > Environment Variables", crie `MP_ACCESS_TOKEN` com a chave do passo 2 e faça "Redeploy".
5. **Endereço do site.** A Vercel dá um endereço grátis (`algumacoisa.vercel.app`). Um domínio próprio `.com.br` sai por volta de R$ 40 por ano no registro.br e é ligado em "Settings > Domains".
6. **Teste.** Faça uma compra real de valor baixo com Pix e confira se o dinheiro aparece no Mercado Pago e se a tela final abre o WhatsApp.

## Registro de pedidos no Supabase (recomendado)

Sem isso o site já vende. Com isso, cada pedido fica gravado e a situação do pagamento é confirmada direto com o Mercado Pago, sem depender do que o cliente diz.

1. Crie um projeto gratuito em supabase.com.
2. Em "SQL Editor", cole o conteúdo de `supabase.sql` e clique em "Run".
3. Em "Settings > API Keys", copie a **Project URL** e a **Secret key** (começa com `sb_secret_`). Se o projeto ainda não tiver, clique em "Create new API keys". Não use a chave antiga `service_role`: o Supabase vai aposentá-la.
4. Na Vercel, crie as variáveis `SUPABASE_URL` e `SUPABASE_SECRET_KEY` e faça "Redeploy".
5. Os pedidos aparecem em "Table Editor > pedidos", com status `pago`, `aguardando_pagamento`, `recusado` etc.

## O que protege o site

- O site não guarda nem vê dados de cartão: o pagamento acontece na página do Mercado Pago.
- O preço cobrado é calculado no servidor a partir de `loja.js`; mexer no navegador não muda o valor.
- As chaves secretas ficam só nas variáveis da Vercel, nunca nos arquivos do site.
- O aviso de pagamento não é aceito "de boca": o servidor consulta o Mercado Pago antes de marcar um pedido como pago.
- A tabela de pedidos tem RLS ligado e nenhuma política pública: ninguém de fora lê nomes, telefones ou endereços.
- `vercel.json` liga HTTPS obrigatório, bloqueia scripts de terceiros e impede que o site seja aberto dentro de outra página.
- Ative a verificação em duas etapas nas contas do Mercado Pago, Vercel, Supabase e do e-mail usado nelas. É a proteção que mais importa.

## Integrações

Tudo aqui é opcional e pode ser ligado depois, uma de cada vez.

| Integração | Para que serve | Como ligar |
|---|---|---|
| Perfil da Empresa no Google | Loja aparece no Google e no Maps, com avaliações | Crie em business.google.com e coloque o endereço do site no perfil |
| Loja do Instagram | Marcar produtos nos posts e stories | No Gerenciador de Comércio da Meta, crie um catálogo com "feed de dados" > "usar uma URL" e cole `https://SEU-SITE/api/feed`. Exige domínio próprio verificado |
| Google Merchant Center | Produtos na aba Shopping do Google | Use o mesmo endereço `https://SEU-SITE/api/feed` como feed agendado |
| Pixel da Meta | Medir vendas vindas do Instagram e criar anúncios | Coloque o ID em `pixel` no `loja.js` |
| Google Analytics | Ver visitas, produtos mais vistos e vendas | Coloque o ID (G-...) em `ga4` no `loja.js` |
| Busca de CEP (ViaCEP) | Preenche o endereço de entrega | Já está ligada, não precisa de conta |
| Melhor Envio | Calcular frete e gerar etiqueta dos Correios e transportadoras | Hoje o frete é combinado no WhatsApp; use o site do Melhor Envio para cotar. A ligação automática fica para quando houver volume |

Cada produto tem um link próprio (`https://SEU-SITE/#p-id-do-produto`). É esse link que vai para o catálogo do Instagram e que o botão "Enviar para alguém" compartilha.

## Dia a dia: trocar produtos e preços

Abra `loja.js`. Cada produto é uma linha com nome, descrição, categoria, parcelas, valor da parcela, preço total, tamanhos e foto (`fotos/nome-da-foto.jpg`). O carrossel do topo mostra os produtos listados em `destaques`. Salve e envie de novo para a Vercel.

Os tamanhos foram preenchidos com uma grade padrão por tipo de produto. Ajuste para o que existe em estoque.

Para o cliente parcelar sem juros como na etiqueta (ex.: 10x de R$ 44,00), ative o parcelamento sem juros na conta do Mercado Pago; a taxa dessa opção fica por conta da loja.

Fotos: use imagens em pé (proporção 4:5), com até 300 KB cada.

## Como o pedido chega até você

- **Pagou pelo site:** o Mercado Pago avisa por e-mail e no aplicativo. O cliente cai no WhatsApp da loja com a lista de peças, a forma de pagamento e o número do pedido. Confira no app do Mercado Pago se o pagamento está aprovado antes de entregar.
- **Boleto e Pix pendente:** o cliente chega no WhatsApp com "aguardando confirmação". Só entregue depois de aprovado.
- **Entrega:** o site cobra só os produtos. O frete é combinado no WhatsApp e pago pelo cliente à parte.
- **Pedido direto pelo WhatsApp:** o botão verde manda a sacola pronta sem pagar no site; você cobra por Pix ou link.

## Limites desta versão

- Não controla estoque. Se uma peça acabar, tire o tamanho da lista em `loja.js`.
- Não tem painel de pedidos: o histórico fica no Mercado Pago e no WhatsApp.
- Trocas e devoluções são solicitadas pelo WhatsApp da loja (em compras online, o Código de Defesa do Consumidor dá 7 dias para desistência). Nota fiscal é tratada pela loja.
