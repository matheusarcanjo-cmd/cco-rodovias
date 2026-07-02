export type EquipamentoStatus =
  | "Disponível"
  | "Alocado"
  | "Alocado (manutenção)"
  | "Alocado (Ocorrência)";

export type UserRole = "admin" | "operador" | "viewer";

export type MotivoOcorrencia =
  | "Chuva"
  | "Manutenção no trecho"
  | "Obra"
  | "Outros";

export type Equipamento = {
  id: string;
  codigo: string;
  tipo: string;
  status: EquipamentoStatus;
  observacoes: string | null;
  localizacao: string | null;
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
  operador: string | null;
  crs: string | null;
  espacamento: string | null;
  prazo_previsto: string | null;
  percentual: number;
  motivo_ocorrencia: MotivoOcorrencia | null;
  manutencao_inicio: string | null;
  manutencao_responsavel: string | null;
  manutencao_prazo: string | null;
  manutencao_detalhamento: string | null;
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
          localizacao?: string | null;
        };
        Update: {
          id?: string;
          codigo?: string;
          tipo?: string;
          status?: EquipamentoStatus;
          observacoes?: string | null;
          localizacao?: string | null;
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
          operador?: string | null;
          crs?: string | null;
          espacamento?: string | null;
          prazo_previsto?: string | null;
          percentual?: number;
          motivo_ocorrencia?: MotivoOcorrencia | null;
          alocada_em?: string;
          encerrada_em?: string | null;
          created_by?: string | null;
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
          operador?: string | null;
          crs?: string | null;
          espacamento?: string | null;
          prazo_previsto?: string | null;
          percentual?: number;
          motivo_ocorrencia?: MotivoOcorrencia | null;
          manutencao_inicio?: string | null;
          manutencao_responsavel?: string | null;
          manutencao_prazo?: string | null;
          manutencao_detalhamento?: string | null;
          alocada_em?: string;
          encerrada_em?: string | null;
          created_by?: string | null;
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
      user_roles: {
        Row: { id: string; email: string; role: UserRole; created_at: string };
        Insert: { id?: string; email: string; role?: UserRole };
        Update: { id?: string; email?: string; role?: UserRole };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      alternar_manutencao: {
        Args: { p_equipamento_id: string };
        Returns: Equipamento;
      };
      iniciar_manutencao: {
        Args: {
          p_equipamento_id: string;
          p_responsavel: string;
          p_prazo?: string | null;
          p_detalhamento?: string | null;
        };
        Returns: Equipamento;
      };
      concluir_manutencao: {
        Args: { p_equipamento_id: string };
        Returns: Equipamento;
      };
      registrar_ocorrencia: {
        Args: { p_equipamento_id: string; p_motivo: string };
        Returns: Equipamento;
      };
      resolver_ocorrencia: {
        Args: { p_equipamento_id: string };
        Returns: Equipamento;
      };
      get_user_role: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: { equipamento_status: EquipamentoStatus };
    CompositeTypes: { [_ in never]: never };
  };
};
