-- ============================================================
-- CCO RODOVIAS — Migration v5
-- Manutenção independente de alocação (Disponível → Manutenção).
-- Campos de manutenção movidos para a tabela equipamentos.
-- Execute no SQL Editor do Supabase.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Campos de manutenção na tabela EQUIPAMENTOS
--    (para funcionar mesmo sem alocação ativa)
-- ------------------------------------------------------------
ALTER TABLE public.equipamentos
  ADD COLUMN IF NOT EXISTS manutencao_inicio       timestamptz,
  ADD COLUMN IF NOT EXISTS manutencao_responsavel  text,
  ADD COLUMN IF NOT EXISTS manutencao_prazo        date,
  ADD COLUMN IF NOT EXISTS manutencao_detalhamento text;

-- Adicionar status "Em manutenção" ao enum (para equipamentos disponíveis)
-- Usamos "Alocado (manutenção)" para alocados e agora permitimos o mesmo
-- valor para disponíveis — a lógica muda na RPC.

-- ------------------------------------------------------------
-- 2. RPC atualizada: iniciar manutenção de qualquer status
--    Aceita Disponível E Alocado
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

  -- Agora aceita tanto Disponível quanto Alocado
  IF v_equip.status NOT IN ('Disponível', 'Alocado') THEN
    RAISE EXCEPTION 'Manutenção só pode ser iniciada em equipamento Disponível ou Alocado (status atual: %).', v_equip.status;
  END IF;

  -- Atualiza status e salva detalhes no EQUIPAMENTO
  UPDATE public.equipamentos
     SET status = 'Alocado (manutenção)',
         manutencao_inicio = now(),
         manutencao_responsavel = p_responsavel,
         manutencao_prazo = p_prazo,
         manutencao_detalhamento = p_detalhamento
   WHERE id = p_equipamento_id
   RETURNING * INTO v_equip;

  -- Se tinha alocação ativa, também marca lá (retrocompatibilidade)
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
-- 3. RPC atualizada: concluir manutenção
--    Volta para o status anterior (Disponível se não tinha alocação)
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

  -- Verifica se tinha alocação ativa para decidir o status de volta
  SELECT EXISTS(
    SELECT 1 FROM public.alocacoes
    WHERE equipamento_id = p_equipamento_id AND encerrada_em IS NULL
  ) INTO v_tem_alocacao;

  -- Volta para o status correto
  UPDATE public.equipamentos
     SET status = CASE WHEN v_tem_alocacao THEN 'Alocado' ELSE 'Disponível' END,
         manutencao_inicio = NULL,
         manutencao_responsavel = NULL,
         manutencao_prazo = NULL,
         manutencao_detalhamento = NULL
   WHERE id = p_equipamento_id
   RETURNING * INTO v_equip;

  -- Limpa dados de manutenção na alocação (se existir)
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
-- 4. Política de UPDATE para equipamentos (necessária para edição admin)
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'equipamentos' AND policyname = 'equipamentos: atualizacao autenticada'
  ) THEN
    CREATE POLICY "equipamentos: atualizacao autenticada"
      ON public.equipamentos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;
