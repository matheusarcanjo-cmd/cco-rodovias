-- ============================================================
-- CCO RODOVIAS — Migration v8
-- Novos motivos de ocorrência + detalhamento livre.
-- Execute no SQL Editor do Supabase.
-- ============================================================

-- 1. Remover constraint antiga de motivo (permitir texto livre com detalhamento)
ALTER TABLE public.alocacoes
  DROP CONSTRAINT IF EXISTS alocacoes_motivo_check;

-- 2. RPC atualizada: aceitar qualquer motivo (validação no frontend)
CREATE OR REPLACE FUNCTION public.registrar_ocorrencia(
  p_equipamento_id uuid,
  p_motivo text
)
RETURNS public.equipamentos
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_equip public.equipamentos;
  v_email text;
BEGIN
  IF p_motivo IS NULL OR p_motivo = '' THEN
    RAISE EXCEPTION 'Motivo da ocorrência é obrigatório.';
  END IF;

  SELECT * INTO v_equip
  FROM public.equipamentos
  WHERE id = p_equipamento_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Equipamento não encontrado.';
  END IF;

  IF v_equip.status NOT IN ('Alocado', 'Manutenção') THEN
    RAISE EXCEPTION 'Ocorrência só se aplica a equipamentos em campo (status atual: %).', v_equip.status;
  END IF;

  UPDATE public.equipamentos
     SET status = 'Alocado (Ocorrência)'
   WHERE id = p_equipamento_id
   RETURNING * INTO v_equip;

  UPDATE public.alocacoes
     SET motivo_ocorrencia = p_motivo
   WHERE equipamento_id = p_equipamento_id
     AND encerrada_em IS NULL;

  -- Logar ocorrência
  BEGIN
    SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  EXCEPTION WHEN OTHERS THEN
    v_email := 'sistema';
  END;

  INSERT INTO public.historico_atividades
    (tipo, equipamento_id, equipamento_codigo, status_anterior, status_novo, usuario_email, detalhes)
  VALUES (
    'ocorrencia',
    p_equipamento_id,
    v_equip.codigo,
    'Alocado',
    'Alocado (Ocorrência)',
    v_email,
    jsonb_build_object('motivo', p_motivo)
  );

  RETURN v_equip;
END;
$$;
