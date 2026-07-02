-- ============================================================
-- CCO RODOVIAS — Migration v2
-- Novos campos de progresso, status "Alocado (Ocorrência)"
-- e sistema de roles baseado em email.
-- Execute no SQL Editor do Supabase APÓS o schema.sql inicial.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Novo valor no ENUM de status
-- ------------------------------------------------------------
ALTER TYPE public.equipamento_status ADD VALUE IF NOT EXISTS 'Alocado (Ocorrência)';

-- ------------------------------------------------------------
-- 2. Novos campos na tabela alocacoes
-- ------------------------------------------------------------
ALTER TABLE public.alocacoes
  ADD COLUMN IF NOT EXISTS operador         text,
  ADD COLUMN IF NOT EXISTS prazo_previsto   date,
  ADD COLUMN IF NOT EXISTS percentual       integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS motivo_ocorrencia text;

-- Constraint: percentual entre 0 e 100
ALTER TABLE public.alocacoes
  DROP CONSTRAINT IF EXISTS alocacoes_percentual_check;
ALTER TABLE public.alocacoes
  ADD CONSTRAINT alocacoes_percentual_check CHECK (percentual >= 0 AND percentual <= 100);

-- Constraint: motivo_ocorrencia aceita apenas valores válidos
ALTER TABLE public.alocacoes
  DROP CONSTRAINT IF EXISTS alocacoes_motivo_check;
ALTER TABLE public.alocacoes
  ADD CONSTRAINT alocacoes_motivo_check
    CHECK (motivo_ocorrencia IS NULL OR motivo_ocorrencia IN ('Chuva', 'Manutenção no trecho', 'Obra', 'Outros'));

-- ------------------------------------------------------------
-- 3. Tabela de roles (RBAC simples por email)
--    admin / operador = ações completas
--    viewer = somente leitura (diretoria)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_roles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text NOT NULL UNIQUE,
  role       text NOT NULL DEFAULT 'viewer',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_roles_role_check CHECK (role IN ('admin', 'operador', 'viewer'))
);

COMMENT ON TABLE public.user_roles IS
  'Papéis de usuário para controle de acesso. Emails não listados são tratados como viewer.';

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_roles: leitura autenticada"
  ON public.user_roles FOR SELECT TO authenticated USING (true);

-- Seed: cadastre seus emails reais aqui
INSERT INTO public.user_roles (email, role) VALUES
  ('matheuspa619@gmail.com', 'admin')
ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role;

-- ------------------------------------------------------------
-- 4. RPC — Registrar / Limpar ocorrência (sem encerrar alocação)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.registrar_ocorrencia(
  p_equipamento_id uuid,
  p_motivo text
)
RETURNS public.equipamentos
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_equip public.equipamentos;
BEGIN
  -- Valida motivo
  IF p_motivo NOT IN ('Chuva', 'Manutenção no trecho', 'Obra', 'Outros') THEN
    RAISE EXCEPTION 'Motivo de ocorrência inválido: %', p_motivo;
  END IF;

  -- Busca o equipamento
  SELECT * INTO v_equip
  FROM public.equipamentos
  WHERE id = p_equipamento_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Equipamento não encontrado.';
  END IF;

  -- Só equipamentos alocados podem receber ocorrência
  IF v_equip.status NOT IN ('Alocado', 'Alocado (manutenção)') THEN
    RAISE EXCEPTION 'Ocorrência só se aplica a equipamentos em campo (status atual: %).', v_equip.status;
  END IF;

  -- Atualiza status do equipamento
  UPDATE public.equipamentos
     SET status = 'Alocado (Ocorrência)'
   WHERE id = p_equipamento_id
   RETURNING * INTO v_equip;

  -- Salva o motivo na alocação ativa
  UPDATE public.alocacoes
     SET motivo_ocorrencia = p_motivo
   WHERE equipamento_id = p_equipamento_id
     AND encerrada_em IS NULL;

  RETURN v_equip;
END;
$$;

-- ------------------------------------------------------------
-- 5. RPC — Resolver ocorrência (volta para Alocado)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.resolver_ocorrencia(p_equipamento_id uuid)
RETURNS public.equipamentos
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_equip public.equipamentos;
BEGIN
  SELECT * INTO v_equip
  FROM public.equipamentos
  WHERE id = p_equipamento_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Equipamento não encontrado.';
  END IF;

  IF v_equip.status <> 'Alocado (Ocorrência)' THEN
    RAISE EXCEPTION 'Equipamento não está com ocorrência (status atual: %).', v_equip.status;
  END IF;

  UPDATE public.equipamentos
     SET status = 'Alocado'
   WHERE id = p_equipamento_id
   RETURNING * INTO v_equip;

  UPDATE public.alocacoes
     SET motivo_ocorrencia = NULL
   WHERE equipamento_id = p_equipamento_id
     AND encerrada_em IS NULL;

  RETURN v_equip;
END;
$$;

-- ------------------------------------------------------------
-- 6. RPC — Buscar role do usuário logado
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_email text;
  v_role  text;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  IF v_email IS NULL THEN RETURN 'viewer'; END IF;

  SELECT role INTO v_role FROM public.user_roles WHERE email = v_email;
  RETURN COALESCE(v_role, 'viewer');
END;
$$;
