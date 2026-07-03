-- ============================================================
-- CCO RODOVIAS — Migration v7
-- Fix colunas crs/espacamento, histórico de atividades.
-- Execute no SQL Editor do Supabase.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Garantir que crs e espacamento existam na tabela alocacoes
-- ------------------------------------------------------------
ALTER TABLE public.alocacoes
  ADD COLUMN IF NOT EXISTS crs         text,
  ADD COLUMN IF NOT EXISTS espacamento text;

-- ------------------------------------------------------------
-- 2. Tabela de histórico de atividades
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.historico_atividades (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo        text NOT NULL,  -- 'status_change', 'ocorrencia', 'alocacao', 'manutencao'
  equipamento_id uuid REFERENCES public.equipamentos(id) ON DELETE CASCADE,
  equipamento_codigo text,
  status_anterior text,
  status_novo     text,
  detalhes    jsonb DEFAULT '{}',
  usuario_email text,
  criado_em   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_historico_criado ON public.historico_atividades (criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_historico_equip  ON public.historico_atividades (equipamento_id);

ALTER TABLE public.historico_atividades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "historico: leitura autenticada"
  ON public.historico_atividades FOR SELECT TO authenticated USING (true);

CREATE POLICY "historico: insercao autenticada"
  ON public.historico_atividades FOR INSERT TO authenticated WITH CHECK (true);

-- ------------------------------------------------------------
-- 3. Trigger automático para logar mudanças de status
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_log_status_change()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_email text;
BEGIN
  -- Tenta pegar o email do usuário logado
  BEGIN
    SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  EXCEPTION WHEN OTHERS THEN
    v_email := 'sistema';
  END;

  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.historico_atividades
      (tipo, equipamento_id, equipamento_codigo, status_anterior, status_novo, usuario_email, detalhes)
    VALUES (
      CASE
        WHEN NEW.status = 'Manutenção' THEN 'manutencao'
        WHEN NEW.status = 'Alocado (Ocorrência)' THEN 'ocorrencia'
        WHEN NEW.status = 'Alocado' AND OLD.status = 'Disponível' THEN 'alocacao'
        ELSE 'status_change'
      END,
      NEW.id,
      NEW.codigo,
      OLD.status::text,
      NEW.status::text,
      v_email,
      jsonb_build_object(
        'manutencao_responsavel', NEW.manutencao_responsavel,
        'manutencao_detalhamento', NEW.manutencao_detalhamento
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_status_change ON public.equipamentos;
CREATE TRIGGER trg_log_status_change
  AFTER UPDATE ON public.equipamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_log_status_change();

-- ------------------------------------------------------------
-- 4. Função para logar ocorrências com motivo
--    (chamada pela RPC registrar_ocorrencia, não por trigger)
-- ------------------------------------------------------------
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
  IF p_motivo NOT IN ('Chuva', 'Manutenção no trecho', 'Obra', 'Outros') THEN
    RAISE EXCEPTION 'Motivo de ocorrência inválido: %', p_motivo;
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

  -- Logar ocorrência com motivo nos detalhes
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
