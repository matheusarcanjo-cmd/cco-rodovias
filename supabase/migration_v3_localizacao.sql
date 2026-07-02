-- ============================================================
-- CCO RODOVIAS — Migration v3 (localização)
-- Adiciona campos de localização vindos da planilha externa.
-- Execute no SQL Editor do Supabase APÓS as migrations anteriores.
-- ============================================================

ALTER TABLE public.equipamentos
  ADD COLUMN IF NOT EXISTS cidade text,
  ADD COLUMN IF NOT EXISTS uf     text;

COMMENT ON COLUMN public.equipamentos.cidade IS 'Cidade onde o equipamento se encontra (atualizado via planilha externa).';
COMMENT ON COLUMN public.equipamentos.uf     IS 'UF onde o equipamento se encontra (atualizado via planilha externa).';
