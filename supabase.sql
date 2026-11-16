-- Rode uma vez no Supabase: SQL Editor > New query > Run.
-- Tabela de pedidos do site. Com RLS ligado e nenhuma política criada,
-- ninguém de fora lê ou altera: só o servidor do site, com a chave secreta (sb_secret_...).

create table if not exists public.pedidos (
  id text primary key,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz,
  nome text,
  whatsapp text,
  recebimento text,
  endereco text,
  itens jsonb not null,
  total numeric(10,2) not null,
  status text not null default 'aguardando_pagamento',
  pagamento_id text,
  forma_pagamento text,
  valor_pago numeric(10,2)
);

alter table public.pedidos enable row level security;
revoke all on public.pedidos from anon, authenticated;
grant select, insert, update on public.pedidos to service_role;
