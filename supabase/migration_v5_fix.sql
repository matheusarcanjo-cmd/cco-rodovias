-- ============================================================
-- CCO RODOVIAS — Fix v5
-- Corrige RPCs para gravar manutenção APENAS na tabela equipamentos.
-- Remove campos desnecessários da tabela alocacoes.
-- Execute no SQL Editor do Supabase.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Remover colunas de manutenção da tabela alocacoes
--    (agora vivem na tabela equipamentos)
-- ------------------------------------------------------------
ALTER TABLE public.alocacoes
  DROP COLUMN IF EXISTS manutencao_inicio,
  DROP COLUMN IF EXISTS manutencao_responsavel,
  DROP COLUMN IF EXISTS manutencao_prazo,
  DROP COLUMN IF EXISTS manutencao_detalhamento;

-- ------------------------------------------------------------
-- 2. Remover colunas do formulário de alocação que não são mais usadas
-- ------------------------------------------------------------
ALTER TABLE public.alocacoes
  DROP COLUMN IF EXISTS equipe,
  DROP COLUMN IF EXISTS responsavel,
  DROP COLUMN IF EXISTS rodovia,
  DROP COLUMN IF EXISTS km_inicial,
  DROP COLUMN IF EXISTS km_final;

-- ------------------------------------------------------------
-- 3. RPC corrigida: iniciar manutenção (só grava em equipamentos)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.iniciar_manutencao(
  p_equipamento_id uuid,
  p_responsavel text,
  p_prazo date DEFAULT NULL,
  p_detalhamento text DEFAULT NULL
)
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

  IF v_equip.status NOT IN ('Disponível', 'Alocado') THEN
    RAISE EXCEPTION 'Manutenção só pode ser iniciada em equipamento Disponível ou Alocado (status atual: %).', v_equip.status;
  END IF;

  UPDATE public.equipamentos
     SET status = 'Alocado (manutenção)',
         manutencao_inicio = now(),
         manutencao_responsavel = p_responsavel,
         manutencao_prazo = p_prazo,
         manutencao_detalhamento = p_detalhamento
   WHERE id = p_equipamento_id
   RETURNING * INTO v_equip;

  RETURN v_equip;
END;
$$;

-- ------------------------------------------------------------
-- 4. RPC corrigida: concluir manutenção (só grava em equipamentos)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.concluir_manutencao(p_equipamento_id uuid)
RETURNS public.equipamentos
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_equip public.equipamentos;
  v_tem_alocacao boolean;
BEGIN
  SELECT * INTO v_equip
  FROM public.equipamentos
  WHERE id = p_equipamento_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Equipamento não encontrado.';
  END IF;

  IF v_equip.status <> 'Alocado (manutenção)' THEN
    RAISE EXCEPTION 'Equipamento não está em manutenção (status atual: %).', v_equip.status;
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.alocacoes
    WHERE equipamento_id = p_equipamento_id AND encerrada_em IS NULL
  ) INTO v_tem_alocacao;

  UPDATE public.equipamentos
     SET status = CASE WHEN v_tem_alocacao THEN 'Alocado' ELSE 'Disponível' END,
         manutencao_inicio = NULL,
         manutencao_responsavel = NULL,
         manutencao_prazo = NULL,
         manutencao_detalhamento = NULL
   WHERE id = p_equipamento_id
   RETURNING * INTO v_equip;

  RETURN v_equip;
END;
$$;
