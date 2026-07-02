import { toast } from "sonner";
import { CheckCircle2, Loader2, Wrench } from "lucide-react";
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
  useAlternarManutencao,
  useEquipamentos,
} from "@/hooks/use-equipamentos";
import type { Equipamento, EquipamentoStatus } from "@/types/database";

const STATUS_VARIANT: Record<
  EquipamentoStatus,
  "disponivel" | "alocado" | "manutencao"
> = {
  Disponível: "disponivel",
  Alocado: "alocado",
  "Alocado (manutenção)": "manutencao",
};

function StatusBadge({ status }: { status: EquipamentoStatus }) {
  return (
    <Badge variant={STATUS_VARIANT[status]}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {status}
    </Badge>
  );
}

/**
 * Botão "Manutenção em serviço":
 * - Se status = 'Alocado'              -> muda para 'Alocado (manutenção)'
 * - Se status = 'Alocado (manutenção)' -> volta para 'Alocado'
 * A alocação ativa NÃO é encerrada nem substituída — apenas o status
 * do equipamento muda, refletindo um problema (ou reparo) durante o serviço.
 */
function MaintenanceAction({ equipamento }: { equipamento: Equipamento }) {
  const alternar = useAlternarManutencao();

  if (equipamento.status === "Disponível") return null;

  const emManutencao = equipamento.status === "Alocado (manutenção)";

  function handleClick() {
    alternar.mutate(equipamento.id, {
      onSuccess: (eq) =>
        toast.success(
          eq.status === "Alocado (manutenção)"
            ? `${eq.codigo} sinalizado em manutenção. A alocação segue ativa.`
            : `${eq.codigo} voltou à operação normal.`
        ),
      onError: (err) => toast.error(err.message),
    });
  }

  return (
    <Button
      size="sm"
      variant={emManutencao ? "secondary" : "outline"}
      onClick={handleClick}
      disabled={alternar.isPending}
      className="whitespace-nowrap"
    >
      {alternar.isPending ? (
        <Loader2 className="animate-spin" />
      ) : emManutencao ? (
        <CheckCircle2 />
      ) : (
        <Wrench />
      )}
      {emManutencao ? "Concluir manutenção" : "Sinalizar manutenção"}
    </Button>
  );
}

export function EquipmentTable() {
  const { data: equipamentos, isLoading, isError } = useEquipamentos();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Equipamentos</CardTitle>
        <CardDescription>
          Situação da frota de equipamentos em tempo real. Equipamentos em
          campo podem ser sinalizados em manutenção sem encerrar a alocação.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando equipamentos...
          </div>
        )}

        {isError && (
          <p className="py-8 text-sm text-destructive">
            Não foi possível carregar os equipamentos. Verifique a conexão e
            recarregue a página.
          </p>
        )}

        {/* Mobile: cards empilhados */}
        <ul className="grid gap-3 md:hidden">
          {equipamentos?.map((eq) => (
            <li key={eq.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-sm font-semibold">{eq.codigo}</p>
                  <p className="text-sm text-muted-foreground">{eq.tipo}</p>
                </div>
                <StatusBadge status={eq.status} />
              </div>
              <div className="mt-3">
                <MaintenanceAction equipamento={eq} />
              </div>
            </li>
          ))}
        </ul>

        {/* Desktop: tabela */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-3 pr-4 font-medium">Código</th>
                <th className="py-3 pr-4 font-medium">Tipo</th>
                <th className="py-3 pr-4 font-medium">Status</th>
                <th className="py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {equipamentos?.map((eq) => (
                <tr key={eq.id} className="border-b last:border-0">
                  <td className="py-3 pr-4 font-mono font-semibold">
                    {eq.codigo}
                  </td>
                  <td className="py-3 pr-4">{eq.tipo}</td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={eq.status} />
                  </td>
                  <td className="py-3 text-right">
                    <MaintenanceAction equipamento={eq} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {equipamentos?.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhum equipamento cadastrado. Execute o seed do banco em
            supabase/schema.sql para começar.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
