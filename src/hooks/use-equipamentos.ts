import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type {
  Alocacao,
  AlocacaoComEquipamento,
  Equipamento,
} from "@/types/database";

// ------------------------------------------------------------------
// QUERIES
// ------------------------------------------------------------------

/** Todos os equipamentos, para o painel geral. */
export function useEquipamentos() {
  return useQuery({
    queryKey: ["equipamentos"],
    queryFn: async (): Promise<Equipamento[]> => {
      const { data, error } = await supabase
        .from("equipamentos")
        .select("*")
        .order("codigo");
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

/** Somente equipamentos disponíveis — alimenta o dropdown do formulário. */
export function useEquipamentosDisponiveis() {
  return useQuery({
    queryKey: ["equipamentos", "disponiveis"],
    queryFn: async (): Promise<Equipamento[]> => {
      const { data, error } = await supabase
        .from("equipamentos")
        .select("*")
        .eq("status", "Disponível")
        .order("codigo");
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

/** Alocações ativas (encerrada_em IS NULL) com dados do equipamento. */
export function useAlocacoesAtivas() {
  return useQuery({
    queryKey: ["alocacoes", "ativas"],
    queryFn: async (): Promise<AlocacaoComEquipamento[]> => {
      const { data, error } = await supabase
        .from("alocacoes")
        .select("*, equipamentos ( id, codigo, tipo, status )")
        .is("encerrada_em", null)
        .order("alocada_em", { ascending: false });
      if (error) throw new Error(error.message);
      return data as unknown as AlocacaoComEquipamento[];
    },
  });
}

// ------------------------------------------------------------------
// MUTATIONS
// ------------------------------------------------------------------

export interface NovaAlocacao {
  equipamento_id: string;
  equipe: string;
  responsavel: string;
  rodovia?: string;
  km_inicial?: number | null;
  km_final?: number | null;
  descricao?: string;
}

/**
 * Cria uma alocação. O trigger `tg_alocar_equipamento` no banco
 * valida a disponibilidade e muda o status para 'Alocado' atomicamente.
 */
export function useCriarAlocacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (nova: NovaAlocacao): Promise<Alocacao> => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("alocacoes")
        .insert({ ...nova, created_by: userData.user?.id ?? null })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipamentos"] });
      queryClient.invalidateQueries({ queryKey: ["alocacoes"] });
    },
  });
}

/**
 * MANUTENÇÃO EM SERVIÇO:
 * Alterna 'Alocado' <-> 'Alocado (manutenção)' via RPC `alternar_manutencao`,
 * SEM encerrar a alocação ativa e sem criar uma nova.
 */
export function useAlternarManutencao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (equipamentoId: string): Promise<Equipamento> => {
      const { data, error } = await supabase.rpc("alternar_manutencao", {
        p_equipamento_id: equipamentoId,
      });
      if (error) throw new Error(error.message);
      return data as Equipamento;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipamentos"] });
      queryClient.invalidateQueries({ queryKey: ["alocacoes"] });
    },
  });
}

/** Encerra uma alocação: trigger devolve o equipamento para 'Disponível'. */
export function useEncerrarAlocacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (alocacaoId: string) => {
      const { error } = await supabase
        .from("alocacoes")
        .update({ encerrada_em: new Date().toISOString() })
        .eq("id", alocacaoId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipamentos"] });
      queryClient.invalidateQueries({ queryKey: ["alocacoes"] });
    },
  });
}
