-- ============================================================
-- CCO RODOVIAS — Schema do banco de dados (Supabase / PostgreSQL)
-- Execute este script no SQL Editor do painel do Supabase.
-- ============================================================

-- ------------------------------------------------------------
-- 1. TIPO ENUM DE STATUS
--    Garante integridade: só os 3 status permitidos existem.
-- ------------------------------------------------------------
create type public.equipamento_status as enum (
  'Disponível',
  'Alocado',
  'Alocado (manutenção)'
);

-- ------------------------------------------------------------
-- 2. TABELA: equipamentos
-- ------------------------------------------------------------
create table public.equipamentos (
  id          uuid primary key default gen_random_uuid(),
  codigo      text not null unique,
  tipo        text not null,
  status      public.equipamento_status not null default 'Disponível',
  observacoes text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.equipamentos is
  'Equipamentos de campo do CCO (GPS, drones, estações totais, veículos, etc.)';

-- ------------------------------------------------------------
-- 3. TABELA: alocacoes
--    Uma alocação vincula um equipamento a uma equipe de campo.
--    encerrada_em = null  =>  alocação ATIVA.
-- ------------------------------------------------------------
create table public.alocacoes (
  id              uuid primary key default gen_random_uuid(),
  equipamento_id  uuid not null references public.equipamentos (id) on delete restrict,
  equipe          text not null,
  responsavel     text not null,
  rodovia         text,
  km_inicial      numeric(8,3),
  km_final        numeric(8,3),
  descricao       text,
  alocada_em      timestamptz not null default now(),
  encerrada_em    timestamptz,
  created_by      uuid references auth.users (id),
  created_at      timestamptz not null default now()
);

comment on table public.alocacoes is
  'Histórico de alocações de equipamentos às equipes de campo.';

-- Índice parcial: impede DUAS alocações ativas para o mesmo equipamento.
create unique index alocacoes_equipamento_ativa_uidx
  on public.alocacoes (equipamento_id)
  where encerrada_em is null;

create index alocacoes_equipamento_idx on public.alocacoes (equipamento_id);

-- ------------------------------------------------------------
-- 4. TRIGGERS — sincronização automática de status
-- ------------------------------------------------------------

-- 4.1 Atualiza updated_at em equipamentos
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger equipamentos_updated_at
  before update on public.equipamentos
  for each row execute function public.tg_set_updated_at();

-- 4.2 Ao CRIAR uma alocação: valida disponibilidade e marca como 'Alocado'
create or replace function public.tg_alocar_equipamento()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_status public.equipamento_status;
begin
  select status into v_status
  from public.equipamentos
  where id = new.equipamento_id
  for update; -- lock de linha evita corrida entre dois operadores

  if v_status is null then
    raise exception 'Equipamento não encontrado.';
  end if;

  if v_status <> 'Disponível' then
    raise exception 'Equipamento não está disponível (status atual: %).', v_status;
  end if;

  update public.equipamentos
     set status = 'Alocado'
   where id = new.equipamento_id;

  return new;
end;
$$;

create trigger alocacoes_before_insert
  before insert on public.alocacoes
  for each row execute function public.tg_alocar_equipamento();

-- 4.3 Ao ENCERRAR uma alocação (encerrada_em preenchido): volta para 'Disponível'
create or replace function public.tg_encerrar_alocacao()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.encerrada_em is null and new.encerrada_em is not null then
    update public.equipamentos
       set status = 'Disponível'
     where id = new.equipamento_id;
  end if;
  return new;
end;
$$;

create trigger alocacoes_before_update
  before update on public.alocacoes
  for each row execute function public.tg_encerrar_alocacao();

-- ------------------------------------------------------------
-- 5. RPC — Manutenção em serviço (SEM encerrar a alocação)
--    'Alocado' -> 'Alocado (manutenção)' e vice-versa.
--    A alocação ativa permanece intocada.
-- ------------------------------------------------------------
create or replace function public.alternar_manutencao(p_equipamento_id uuid)
returns public.equipamentos
language plpgsql security definer set search_path = public as $$
declare
  v_equip public.equipamentos;
begin
  select * into v_equip
  from public.equipamentos
  where id = p_equipamento_id
  for update;

  if not found then
    raise exception 'Equipamento não encontrado.';
  end if;

  if v_equip.status = 'Alocado' then
    update public.equipamentos
       set status = 'Alocado (manutenção)'
     where id = p_equipamento_id
     returning * into v_equip;

  elsif v_equip.status = 'Alocado (manutenção)' then
    update public.equipamentos
       set status = 'Alocado'
     where id = p_equipamento_id
     returning * into v_equip;

  else
    raise exception
      'Manutenção em serviço só se aplica a equipamentos alocados (status atual: %).',
      v_equip.status;
  end if;

  return v_equip;
end;
$$;

-- ------------------------------------------------------------
-- 6. ROW LEVEL SECURITY
--    Apenas usuários autenticados podem ler/escrever.
-- ------------------------------------------------------------
alter table public.equipamentos enable row level security;
alter table public.alocacoes    enable row level security;

create policy "equipamentos: leitura autenticada"
  on public.equipamentos for select to authenticated using (true);

create policy "equipamentos: insercao autenticada"
  on public.equipamentos for insert to authenticated with check (true);

create policy "equipamentos: atualizacao autenticada"
  on public.equipamentos for update to authenticated using (true);

create policy "alocacoes: leitura autenticada"
  on public.alocacoes for select to authenticated using (true);

create policy "alocacoes: insercao autenticada"
  on public.alocacoes for insert to authenticated with check (true);

create policy "alocacoes: atualizacao autenticada"
  on public.alocacoes for update to authenticated using (true);

-- ------------------------------------------------------------
-- 7. SEED — dados de exemplo para desenvolvimento
-- ------------------------------------------------------------
insert into public.equipamentos (codigo, tipo, status) values
  ('GPS-001',  'GPS Geodésico RTK',      'Disponível'),
  ('GPS-002',  'GPS Geodésico RTK',      'Disponível'),
  ('DRN-001',  'Drone de Mapeamento',    'Disponível'),
  ('EST-001',  'Estação Total',          'Disponível'),
  ('EST-002',  'Estação Total',          'Disponível'),
  ('VTR-010',  'Veículo de Inspeção',    'Disponível'),
  ('NIV-001',  'Nível Digital',          'Disponível'),
  ('LSR-001',  'Scanner Laser 3D',       'Disponível');
