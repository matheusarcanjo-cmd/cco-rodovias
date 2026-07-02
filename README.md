# CCO Rodovias — Centro de Controle Operacional

Aplicação web para gestão de equipes de campo e levantamentos de infraestrutura em rodovias: alocação de equipamentos, acompanhamento em tempo real e sinalização de manutenção em serviço.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + Vite 6 |
| Roteamento | TanStack Router (file-based, plugin Vite) |
| Dados/cache | TanStack Query |
| Estilo | Tailwind CSS + componentes estilo shadcn/ui (Radix) |
| Backend | Supabase (Auth + PostgreSQL + RLS + RPC) |
| Deploy | Vercel (SPA com rewrite em `vercel.json`) |

## Estrutura de pastas

```
cco-rodovias/
├── vercel.json                  # Rewrite SPA (previne 404 na Vercel)
├── vite.config.ts               # Vite + plugin do TanStack Router
├── tailwind.config.js
├── supabase/
│   └── schema.sql               # Tabelas, enum, triggers, RPC, RLS e seed
└── src/
    ├── main.tsx                 # Providers (Theme, Auth, Query, Router)
    ├── index.css                # Tokens de tema claro/escuro (CSS vars)
    ├── routeTree.gen.ts         # GERADO automaticamente pelo router-plugin
    ├── routes/
    │   ├── __root.tsx           # Layout: header, toggle de tema, guard de auth
    │   └── index.tsx            # Dashboard (indicadores + formulário + tabelas)
    ├── components/
    │   ├── allocation-form.tsx  # Formulário de alocação + dropdown de equipamentos
    │   ├── equipment-table.tsx  # Frota + botão de manutenção em serviço
    │   ├── active-allocations.tsx
    │   ├── login-screen.tsx
    │   ├── theme-provider.tsx / theme-toggle.tsx
    │   └── ui/                  # button, card, input, label, select, badge
    ├── hooks/
    │   ├── use-auth.tsx         # Sessão Supabase
    │   └── use-equipamentos.ts  # Queries e mutations (TanStack Query)
    ├── lib/
    │   ├── supabase.ts          # Cliente Supabase tipado
    │   └── utils.ts             # cn()
    └── types/
        └── database.ts          # Tipos do banco
```

## 1. Configurar o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Abra **SQL Editor** e execute o conteúdo de `supabase/schema.sql` (cria tabelas, enum de status, triggers, a função RPC `alternar_manutencao`, políticas RLS e dados de exemplo).
3. Em **Authentication > Users**, crie os usuários da equipe (e-mail + senha). Para simplificar, desative "Confirm email" em Authentication > Providers > Email durante o desenvolvimento.
4. Copie a **Project URL** e a **anon key** em Project Settings > API.

## 2. Rodar localmente

```bash
npm install
cp .env.example .env   # preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm run dev
```

> O arquivo `src/routeTree.gen.ts` é gerado automaticamente pelo `@tanstack/router-plugin` na primeira execução de `npm run dev` ou `npm run build`. Não edite nem versione esse arquivo.

## 3. Deploy na Vercel

1. Suba o repositório para o GitHub e importe na Vercel (framework: **Vite**).
2. Em **Settings > Environment Variables**, cadastre `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
3. O `vercel.json` na raiz já contém o rewrite que redireciona qualquer rota para `index.html`, evitando o erro 404 ao recarregar rotas internas do SPA:

```json
{ "rewrites": [ { "source": "/((?!_next|api|assets).*).*", "destination": "/index.html" } ] }
```

## Regras de negócio implementadas

**Status possíveis** (enum `equipamento_status` no PostgreSQL): `Disponível`, `Alocado`, `Alocado (manutenção)`.

**Alocação** — o formulário lista apenas equipamentos com status `Disponível`. O dropdown exibe cada opção como `Código: [código] - Tipo: [tipo]` e envia o **ID** do equipamento como value. Ao inserir a alocação, um trigger no banco valida a disponibilidade (com lock de linha) e muda o status para `Alocado` de forma atômica. Um índice único parcial impede duas alocações ativas para o mesmo equipamento.

**Manutenção em serviço** — se um equipamento `Alocado` apresenta problema em campo, o operador clica em "Sinalizar manutenção" e a RPC `alternar_manutencao` muda o status para `Alocado (manutenção)` **sem encerrar a alocação atual nem criar uma nova**. Resolvido o problema, "Concluir manutenção" devolve o status para `Alocado`.

**Encerramento** — ao encerrar uma alocação (`encerrada_em` preenchido), um trigger devolve o equipamento para `Disponível`.

## Tema claro/escuro

O toggle no cabeçalho alterna a classe `dark` no `<html>`, com persistência em `localStorage` e respeito à preferência do sistema no primeiro acesso. Um script inline no `index.html` aplica o tema antes do React montar, evitando flash de tema incorreto.
