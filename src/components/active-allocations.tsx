import { toast } from "sonner";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Loader2,
  SquareCheckBig,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useAlocacoesAtivas,
  useEncerrarAlocacao,
  useResolverOcorrencia,
} from "@/hooks/use-equipamentos";
import { useRole } from "@/hooks/use-role";
import { ProgressModal } from "@/components/progress-modal";
import { OcorrenciaModal } from "@/components/ocorrencia-modal";
import type { AlocacaoComEquipamento, EquipamentoStatus } from "@/types/database";

const dataCurta = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const dataSimples = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function StatusIndicator({ status }: { status: EquipamentoStatus }) {
  if (status === "Manutenção") {
    return <Badge variant="manutencao">Em manutenção</Badge>;
  }
  if (status === "Alocado (Ocorrência)") {
    return <Badge variant="ocorrencia">Ocorrência</Badge>;
  }
  return null;
}

function ProgressBar({ percentual }: { percentual: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-status-alocado transition-all duration-300"
          style={{ width: `${percentual}%` }}
        />
      </div>
      <span className="font-mono text-xs font-semibold tabular-nums text-muted-foreground">
        {percentual}%
      </span>
    </div>
  );
}

function AllocationCard({
  a,
  canAct,
}: {
  a: AlocacaoComEquipamento;
  canAct: boolean;
}) {
  const encerrar = useEncerrarAlocacao();
  const resolverOcorrencia = useResolverOcorrencia();
  const status = a.equipamentos?.status ?? "Alocado";
  const emOcorrencia = status === "Alocado (Ocorrência)";

  function handleEncerrar() {
    encerrar.mutate(a.id, {
      onSuccess: () =>
        toast.success(
          `Alocação encerrada. ${a.equipamentos?.codigo ?? "Equipamento"} voltou a ficar disponível.`
        ),
      onError: (err) => toast.error(err.message),
    });
  }

  function handleResolverOcorrencia() {
    if (!a.equipamentos) return;
    resolverOcorrencia.mutate(a.equipamentos.id, {
      onSuccess: () =>
        toast.success(
          `Ocorrência resolvida. ${a.equipamentos!.codigo} voltou à operação.`
        ),
      onError: (err) => toast.error(err.message),
    });
  }

  return (
    <div
      className={`flex flex-col gap-3 rounded-lg border p-4 ${
        emOcorrencia ? "border-status-ocorrencia/40 bg-status-ocorrencia/5" : ""
      }`}
    >
      {/* Header */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-semibold">
            {a.equipamentos?.codigo}
          </span>
          <span className="text-sm text-muted-foreground">
            {a.equipamentos?.tipo}
          </span>
          <StatusIndicator status={status} />
        </div>

        {/* Meta info */}
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {a.operador && (
            <span className="inline-flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {a.operador}
            </span>
          )}
          <span>desde {dataCurta.format(new Date(a.alocada_em))}</span>
          {a.prazo_previsto && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Prazo: {dataSimples.format(new Date(a.prazo_previsto + "T12:00:00"))}
            </span>
          )}
        </div>

        {/* Motivo de ocorrência */}
        {emOcorrencia && a.motivo_ocorrencia && (
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-status-ocorrencia/10 px-2 py-1 text-xs font-medium text-status-ocorrencia">
            <AlertTriangle className="h-3.5 w-3.5" />
            Motivo: {a.motivo_ocorrencia}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <ProgressBar percentual={a.percentual} />

      {/* Actions */}
      {canAct && (
        <div className="flex flex-wrap gap-2">
          <ProgressModal
            alocacaoId={a.id}
            codigoEquip={a.equipamentos?.codigo ?? "—"}
            currentPrazo={a.prazo_previsto}
            currentPercentual={a.percentual}
          />

          {emOcorrencia ? (
            <Button
              size="sm"
              variant="outline"
              className="shrink-0"
              disabled={resolverOcorrencia.isPending}
              onClick={handleResolverOcorrencia}
            >
              {resolverOcorrencia.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <CheckCircle2 />
              )}
              Resolver ocorrência
            </Button>
          ) : (
            a.equipamentos && (
              <OcorrenciaModal
                equipamentoId={a.equipamentos.id}
                codigoEquip={a.equipamentos.codigo}
              />
            )
          )}

          <Button
            size="sm"
            variant="outline"
            className="shrink-0"
            disabled={encerrar.isPending}
            onClick={handleEncerrar}
          >
            {encerrar.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <SquareCheckBig />
            )}
            Encerrar alocação
          </Button>
        </div>
      )}
    </div>
  );
}

export function ActiveAllocations() {
  const { data: alocacoes, isLoading } = useAlocacoesAtivas();
  const { canAct } = useRole();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alocações ativas</CardTitle>
        <CardDescription>
          Equipamentos operando em campo neste momento.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {isLoading && (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando
            alocações...
          </div>
        )}

        {alocacoes?.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhuma alocação ativa. Use o formulário para enviar um equipamento
            a campo.
          </p>
        )}

        {alocacoes?.map((a) => (
          <AllocationCard key={a.id} a={a} canAct={canAct} />
        ))}
      </CardContent>
    </Card>
  );
}
