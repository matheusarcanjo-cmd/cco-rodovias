-- ============================================================
-- CCO RODOVIAS — Migration v4 (localização simplificada)
-- Substitui cidade + uf por uma coluna única "localizacao"
-- que recebe o valor concatenado direto da planilha (ex: "Belo Horizonte/MG").
-- Execute no SQL Editor do Supabase.
-- ============================================================

-- Remove as colunas separadas (se existirem)
ALTER TABLE public.equipamentos DROP COLUMN IF EXISTS cidade;
ALTER TABLE public.equipamentos DROP COLUMN IF EXISTS uf;

-- Adiciona coluna única
ALTER TABLE public.equipamentos
  ADD COLUMN IF NOT EXISTS localizacao text;

COMMENT ON COLUMN public.equipamentos.localizacao IS
  'Localização do equipamento no formato Cidade/UF, importada da planilha externa.';
