-- ============================================================
-- CCO RODOVIAS — Migration v3
-- Novos campos: CRS, espaçamento, detalhes de manutenção.
-- CRUD de equipamentos para admin.
-- Execute no SQL Editor do Supabase APÓS migration_v2.sql.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Novos campos na tabela alocacoes
-- ------------------------------------------------------------
ALTER TABLE public.alocacoes
  ADD COLUMN IF NOT EXISTS crs             text,
  ADD COLUMN IF NOT EXISTS espacamento     text;

-- ------------------------------------------------------------
-- 2. Campos de manutenção na tabela alocacoes
--    (manutenção acontece dentro de uma alocação ativa)
-- ------------------------------------------------------------
ALTER TABLE public.alocacoes
  ADD COLUMN IF NOT EXISTS manutencao_inicio       timestamptz,
  ADD COLUMN IF NOT EXISTS manutencao_responsavel  text,
  ADD COLUMN IF NOT EXISTS manutencao_prazo        date,
  ADD COLUMN IF NOT EXISTS manutencao_detalhamento text;

-- ------------------------------------------------------------
-- 3. RPC atualizada: sinalizar manutenção COM detalhes
--    Substitui a versão anterior que só alternava o status.
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

  IF v_equip.status <> 'Alocado' THEN
    RAISE EXCEPTION 'Manutenção só pode ser iniciada em equipamento Alocado (status atual: %).', v_equip.status;
  END IF;

  -- Atualiza status do equipamento
  UPDATE public.equipamentos
     SET status = 'Alocado (manutenção)'
   WHERE id = p_equipamento_id
   RETURNING * INTO v_equip;

  -- Salva detalhes de manutenção na alocação ativa
  UPDATE public.alocacoes
     SET manutencao_inicio = now(),
         manutencao_responsavel = p_responsavel,
         manutencao_prazo = p_prazo,
         manutencao_detalhamento = p_detalhamento
   WHERE equipamento_id = p_equipamento_id
     AND encerrada_em IS NULL;

  RETURN v_equip;
END;
$$;

-- ------------------------------------------------------------
-- 4. RPC: concluir manutenção (limpa dados e volta para Alocado)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.concluir_manutencao(p_equipamento_id uuid)
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

  IF v_equip.status <> 'Alocado (manutenção)' THEN
    RAISE EXCEPTION 'Equipamento não está em manutenção (status atual: %).', v_equip.status;
  END IF;

  UPDATE public.equipamentos
     SET status = 'Alocado'
   WHERE id = p_equipamento_id
   RETURNING * INTO v_equip;

  -- Limpa campos de manutenção
  UPDATE public.alocacoes
     SET manutencao_inicio = NULL,
         manutencao_responsavel = NULL,
         manutencao_prazo = NULL,
         manutencao_detalhamento = NULL
   WHERE equipamento_id = p_equipamento_id
     AND encerrada_em IS NULL;

  RETURN v_equip;
END;
$$;

-- ------------------------------------------------------------
-- 5. Política de DELETE para equipamentos (admin via app)
-- ------------------------------------------------------------
CREATE POLICY "equipamentos: exclusao autenticada"
  ON public.equipamentos FOR DELETE TO authenticated USING (true);
