// Tipos do banco. Para gerar automaticamente a partir do seu projeto:
// npx supabase gen types typescript --project-id SEU_PROJECT_ID > src/types/database.ts
//
// IMPORTANTE: use `type` (não `interface`) — o supabase-js exige que as linhas
// satisfaçam Record<string, unknown>, o que interfaces não fazem implicitamente.

export type EquipamentoStatus =
  | "Disponível"
  | "Alocado"
  | "Alocado (manutenção)";

export type Equipamento = {
  id: string;
  codigo: string;
  tipo: string;
  status: EquipamentoStatus;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};

export type Alocacao = {
  id: string;
  equipamento_id: string;
  equipe: string;
  responsavel: string;
  rodovia: string | null;
  km_inicial: number | null;
  km_final: number | null;
  descricao: string | null;
  alocada_em: string;
  encerrada_em: string | null;
  created_by: string | null;
  created_at: string;
};

export type AlocacaoComEquipamento = Alocacao & {
  equipamentos: Pick<Equipamento, "id" | "codigo" | "tipo" | "status"> | null;
};

export type Database = {
  public: {
    Tables: {
      equipamentos: {
        Row: Equipamento;
        Insert: {
          id?: string;
          codigo: string;
          tipo: string;
          status?: EquipamentoStatus;
          observacoes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          codigo?: string;
          tipo?: string;
          status?: EquipamentoStatus;
          observacoes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      alocacoes: {
        Row: Alocacao;
        Insert: {
          id?: string;
          equipamento_id: string;
          equipe: string;
          responsavel: string;
          rodovia?: string | null;
          km_inicial?: number | null;
          km_final?: number | null;
          descricao?: string | null;
          alocada_em?: string;
          encerrada_em?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          equipamento_id?: string;
          equipe?: string;
          responsavel?: string;
          rodovia?: string | null;
          km_inicial?: number | null;
          km_final?: number | null;
          descricao?: string | null;
          alocada_em?: string;
          encerrada_em?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "alocacoes_equipamento_id_fkey";
            columns: ["equipamento_id"];
            isOneToOne: false;
            referencedRelation: "equipamentos";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      alternar_manutencao: {
        Args: { p_equipamento_id: string };
        Returns: Equipamento;
      };
    };
    Enums: {
      equipamento_status: EquipamentoStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
