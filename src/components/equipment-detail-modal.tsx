import * as React from "react";
import {
  Calendar,
  Clock,
  Info,
  MapPin,
  Ruler,
  User,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAlocacaoDoEquipamento } from "@/hooks/use-equipamentos";
import type { Equipamento, EquipamentoStatus } from "@/types/database";

const STATUS_VARIANT: Record<
  EquipamentoStatus,
  "disponivel" | "alocado" | "manutencao" | "ocorrencia"
> = {
  Disponível: "disponivel",
  Alocado: "alocado",
  "Manutenção": "manutencao",
  "Alocado (Ocorrência)": "ocorrencia",
};

const dataCompleta = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const dataSimples = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function ProgressBar({ percentual }: { percentual: number }) {
  return (
    <div className="mt-1 flex items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-status-alocado transition-all"
          style={{ width: `${percentual}%` }}
        />
      </div>
      <span className="font-mono text-xs font-semibold tabular-nums">
        {percentual}%
      </span>
    </div>
  );
}

interface EquipmentDetailModalProps {
  equipamento: Equipamento | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EquipmentDetailModal({
  equipamento,
  open,
  onOpenChange,
}: EquipmentDetailModalProps) {
  const temAlocacao =
    equipamento?.status === "Alocado" ||
    equipamento?.status === "Manutenção" ||
    equipamento?.status === "Alocado (Ocorrência)";

  const { data: alocacao, isLoading } = useAlocacaoDoEquipamento(
    temAlocacao ? equipamento?.id ?? null : null
  );

  if (!equipamento) return null;

  const emManutencao = equipamento.status === "Manutenção";
  const isAlocado = equipamento.status === "Alocado" || equipamento.status === "Alocado (Ocorrência)";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle className="font-mono">{equipamento.codigo}</DialogTitle>
            <Badge variant={STATUS_VARIANT[equipamento.status]}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
              {equipamento.status}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted-foreground">{equipamento.tipo}</p>
            {equipamento.localizacao && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {equipamento.localizacao}
              </span>
            )}
          </div>
        </DialogHeader>

        {/* Equipamento disponível */}
        {equipamento.status === "Disponível" && (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <Info className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Equipamento disponível para alocação.
            </p>
            {equipamento.observacoes && (
              <p className="mt-2 text-xs text-muted-foreground">
                {equipamento.observacoes}
              </p>
            )}
          </div>
        )}

        {/* Carregando dados da alocação */}
        {temAlocacao && isLoading && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Carregando informações...
          </p>
        )}

        {/* Info de alocação */}
        {isAlocado && alocacao && !emManutencao && (
          <div className="grid gap-0.5">
            <h3 className="mb-1 text-sm font-semibold text-muted-foreground">
              Informações da alocação
            </h3>
            <div className="rounded-lg border p-4">
              <div className="grid gap-0.5 sm:grid-cols-2">
                <InfoRow
                  icon={Ruler}
                  label="CRS"
                  value={alocacao.crs || "—"}
                />
                <InfoRow
                  icon={User}
                  label="Operador"
                  value={alocacao.operador || "—"}
                />
                <InfoRow
                  icon={Ruler}
                  label="Espaçamento"
                  value={alocacao.espacamento || "—"}
                />
                <InfoRow
                  icon={Calendar}
                  label="Data de início"
                  value={dataCompleta.format(new Date(alocacao.alocada_em))}
                />
                <InfoRow
                  icon={Calendar}
                  label="Previsão de término"
                  value={
                    alocacao.prazo_previsto
                      ? dataSimples.format(
                          new Date(alocacao.prazo_previsto + "T12:00:00")
                        )
                      : "—"
                  }
                />
              </div>

              <div className="mt-2 border-t pt-3">
                <p className="mb-1 text-xs text-muted-foreground">% concluído</p>
                <ProgressBar percentual={alocacao.percentual} />
              </div>

              {alocacao.descricao && (
                <div className="mt-3 border-t pt-3">
                  <p className="text-xs text-muted-foreground">Descrição</p>
                  <p className="mt-0.5 text-sm">{alocacao.descricao}</p>
                </div>
              )}

              {alocacao.motivo_ocorrencia && (
                <div className="mt-3 rounded-md bg-status-ocorrencia/10 p-3">
                  <p className="text-xs font-medium text-status-ocorrencia">
                    Ocorrência: {alocacao.motivo_ocorrencia}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info de manutenção (lê do equipamento, que agora tem os campos) */}
        {emManutencao && (
          <div className="grid gap-0.5">
            <h3 className="mb-1 text-sm font-semibold text-muted-foreground">
              Informações da manutenção
            </h3>
            <div className="rounded-lg border border-status-manutencao/30 bg-status-manutencao/5 p-4">
              <div className="grid gap-0.5 sm:grid-cols-2">
                <InfoRow
                  icon={Clock}
                  label="Data de início da manutenção"
                  value={
                    equipamento.manutencao_inicio
                      ? dataCompleta.format(new Date(equipamento.manutencao_inicio))
                      : "—"
                  }
                />
                <InfoRow
                  icon={User}
                  label="Responsável"
                  value={equipamento.manutencao_responsavel || "—"}
                />
                <InfoRow
                  icon={Calendar}
                  label="Data de término previsto"
                  value={
                    equipamento.manutencao_prazo
                      ? dataSimples.format(
                          new Date(equipamento.manutencao_prazo + "T12:00:00")
                        )
                      : "—"
                  }
                />
                <InfoRow
                  icon={Wrench}
                  label="Detalhamento"
                  value={equipamento.manutencao_detalhamento || "—"}
                />
              </div>
            </div>

            {/* Se tinha alocação ativa, mostra por baixo */}
            {alocacao && (
              <>
                <h3 className="mb-1 mt-4 text-sm font-semibold text-muted-foreground">
                  Alocação ativa (em fundo)
                </h3>
                <div className="rounded-lg border p-4">
                  <div className="grid gap-0.5 sm:grid-cols-2">
                    <InfoRow icon={User} label="Operador" value={alocacao.operador || "—"} />
                    <InfoRow icon={Ruler} label="CRS" value={alocacao.crs || "—"} />
                    <InfoRow
                      icon={Calendar}
                      label="Início da alocação"
                      value={dataCompleta.format(new Date(alocacao.alocada_em))}
                    />
                  </div>
                  <div className="mt-2 border-t pt-3">
                    <p className="mb-1 text-xs text-muted-foreground">% concluído</p>
                    <ProgressBar percentual={alocacao.percentual} />
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
