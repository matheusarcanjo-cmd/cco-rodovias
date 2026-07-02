import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type {
  Alocacao,
  AlocacaoComEquipamento,
  Equipamento,
  MotivoOcorrencia,
} from "@/types/database";

// ------------------------------------------------------------------
// QUERIES
// ------------------------------------------------------------------

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

/** Busca a alocação ativa de um equipamento específico (para o modal de detalhes). */
export function useAlocacaoDoEquipamento(equipamentoId: string | null) {
  return useQuery({
    queryKey: ["alocacoes", "equipamento", equipamentoId],
    queryFn: async (): Promise<Alocacao | null> => {
      if (!equipamentoId) return null;
      const { data, error } = await supabase
        .from("alocacoes")
        .select("*")
        .eq("equipamento_id", equipamentoId)
        .is("encerrada_em", null)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!equipamentoId,
  });
}

// ------------------------------------------------------------------
// MUTATIONS
// ------------------------------------------------------------------

function useInvalidateAll() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["equipamentos"] });
    qc.invalidateQueries({ queryKey: ["alocacoes"] });
  };
}

export interface NovaAlocacao {
  equipamento_id: string;
  equipe: string;
  responsavel: string;
  rodovia?: string;
  km_inicial?: number | null;
  km_final?: number | null;
  descricao?: string;
  operador?: string;
  crs?: string;
  espacamento?: string;
  prazo_previsto?: string | null;
  percentual?: number;
}

export function useCriarAlocacao() {
  const invalidate = useInvalidateAll();
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
    onSuccess: invalidate,
  });
}

export function useEncerrarAlocacao() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: async (alocacaoId: string) => {
      const { error } = await supabase
        .from("alocacoes")
        .update({ encerrada_em: new Date().toISOString() })
        .eq("id", alocacaoId);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });
}

// --- Progresso ---
export interface AtualizacaoProgresso {
  alocacaoId: string;
  prazo_previsto: string | null;
  percentual: number;
}

export function useAtualizarProgresso() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: async (payload: AtualizacaoProgresso) => {
      const { error } = await supabase
        .from("alocacoes")
        .update({
          prazo_previsto: payload.prazo_previsto,
          percentual: payload.percentual,
        })
        .eq("id", payload.alocacaoId);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });
}

// --- Manutenção v3: com detalhes ---
export interface IniciarManutencaoArgs {
  equipamentoId: string;
  responsavel: string;
  prazo?: string | null;
  detalhamento?: string | null;
}

export function useIniciarManutencao() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: async (args: IniciarManutencaoArgs): Promise<Equipamento> => {
      const { data, error } = await supabase.rpc("iniciar_manutencao", {
        p_equipamento_id: args.equipamentoId,
        p_responsavel: args.responsavel,
        p_prazo: args.prazo ?? null,
        p_detalhamento: args.detalhamento ?? null,
      });
      if (error) throw new Error(error.message);
      return data as Equipamento;
    },
    onSuccess: invalidate,
  });
}

export function useConcluirManutencao() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: async (equipamentoId: string): Promise<Equipamento> => {
      const { data, error } = await supabase.rpc("concluir_manutencao", {
        p_equipamento_id: equipamentoId,
      });
      if (error) throw new Error(error.message);
      return data as Equipamento;
    },
    onSuccess: invalidate,
  });
}

// --- Ocorrência ---
export function useRegistrarOcorrencia() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: async (args: {
      equipamentoId: string;
      motivo: MotivoOcorrencia;
    }): Promise<Equipamento> => {
      const { data, error } = await supabase.rpc("registrar_ocorrencia", {
        p_equipamento_id: args.equipamentoId,
        p_motivo: args.motivo,
      });
      if (error) throw new Error(error.message);
      return data as Equipamento;
    },
    onSuccess: invalidate,
  });
}

export function useResolverOcorrencia() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: async (equipamentoId: string): Promise<Equipamento> => {
      const { data, error } = await supabase.rpc("resolver_ocorrencia", {
        p_equipamento_id: equipamentoId,
      });
      if (error) throw new Error(error.message);
      return data as Equipamento;
    },
    onSuccess: invalidate,
  });
}

// --- CRUD Equipamentos (admin) ---
export interface NovoEquipamento {
  codigo: string;
  tipo: string;
  observacoes?: string | null;
}

export function useAdicionarEquipamento() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: async (novo: NovoEquipamento): Promise<Equipamento> => {
      const { data, error } = await supabase
        .from("equipamentos")
        .insert({ codigo: novo.codigo, tipo: novo.tipo, observacoes: novo.observacoes ?? null })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: invalidate,
  });
}

export function useRemoverEquipamento() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("equipamentos")
        .delete()
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });
}
