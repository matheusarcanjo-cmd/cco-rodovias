-- ============================================================
-- CCO RODOVIAS — Migration v6
-- Renomeia "Alocado (manutenção)" → "Manutenção"
-- Execute no SQL Editor do Supabase.
-- ============================================================

-- 1. Adicionar novo valor ao enum
ALTER TYPE public.equipamento_status ADD VALUE IF NOT EXISTS 'Manutenção';

-- 2. Converter registros existentes com o status antigo
UPDATE public.equipamentos SET status = 'Manutenção' WHERE status = 'Alocado (manutenção)';

-- 3. RPC iniciar_manutencao — agora usa 'Manutenção'
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
     SET status = 'Manutenção',
         manutencao_inicio = now(),
         manutencao_responsavel = p_responsavel,
         manutencao_prazo = p_prazo,
         manutencao_detalhamento = p_detalhamento
   WHERE id = p_equipamento_id
   RETURNING * INTO v_equip;

  RETURN v_equip;
END;
$$;

-- 4. RPC concluir_manutencao — verifica 'Manutenção'
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

  IF v_equip.status <> 'Manutenção' THEN
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
