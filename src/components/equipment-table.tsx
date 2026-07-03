import * as React from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, MapPin, Trash2 } from "lucide-react";
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
  useConcluirManutencao,
  useEquipamentos,
  useRemoverEquipamento,
} from "@/hooks/use-equipamentos";
import { useRole } from "@/hooks/use-role";
import { ManutencaoModal } from "@/components/manutencao-modal";
import { AddEquipmentModal } from "@/components/add-equipment-modal";
import { EditEquipmentModal } from "@/components/edit-equipment-modal";
import { EquipmentDetailModal } from "@/components/equipment-detail-modal";
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

function StatusBadge({ status }: { status: EquipamentoStatus }) {
  return (
    <Badge variant={STATUS_VARIANT[status]}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {status}
    </Badge>
  );
}

function LocationTag({ localizacao }: { localizacao: string | null }) {
  if (!localizacao) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <MapPin className="h-3 w-3" />
      {localizacao}
    </span>
  );
}

function MaintenanceAction({ equipamento }: { equipamento: Equipamento }) {
  const concluir = useConcluirManutencao();

  // Ocorrência: sem ação de manutenção
  if (equipamento.status === "Alocado (Ocorrência)") return null;

  // Em manutenção: botão de concluir
  if (equipamento.status === "Manutenção") {
    return (
      <Button
        size="sm"
        variant="secondary"
        onClick={(e) => {
          e.stopPropagation();
          concluir.mutate(equipamento.id, {
            onSuccess: (eq) =>
              toast.success(
                `${eq.codigo} voltou para ${eq.status === "Alocado" ? "operação" : "disponível"}.`
              ),
            onError: (err) => toast.error(err.message),
          });
        }}
        disabled={concluir.isPending}
        className="whitespace-nowrap"
      >
        {concluir.isPending ? (
          <Loader2 className="animate-spin" />
        ) : (
          <CheckCircle2 />
        )}
        Concluir manutenção
      </Button>
    );
  }

  // Disponível OU Alocado: pode sinalizar manutenção
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <ManutencaoModal
        equipamentoId={equipamento.id}
        codigoEquip={equipamento.codigo}
      />
    </div>
  );
}

function RemoveButton({ equipamento }: { equipamento: Equipamento }) {
  const remover = useRemoverEquipamento();
  const [confirming, setConfirming] = React.useState(false);

  if (equipamento.status !== "Disponível") return null;

  if (confirming) {
    return (
      <div
        className="flex items-center gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          size="sm"
          variant="destructive"
          disabled={remover.isPending}
          onClick={() =>
            remover.mutate(equipamento.id, {
              onSuccess: () =>
                toast.success(`${equipamento.codigo} removido da frota.`),
              onError: (err) => toast.error(err.message),
            })
          }
        >
          {remover.isPending ? <Loader2 className="animate-spin" /> : "Confirmar"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setConfirming(false)}
        >
          Não
        </Button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      className="text-destructive hover:text-destructive"
      onClick={(e) => {
        e.stopPropagation();
        setConfirming(true);
      }}
    >
      <Trash2 />
    </Button>
  );
}

export function EquipmentTable() {
  const { data: equipamentos, isLoading, isError } = useEquipamentos();
  const { canAct, isAdmin } = useRole();

  const [selectedEquip, setSelectedEquip] = React.useState<Equipamento | null>(
    null
  );
  const [detailOpen, setDetailOpen] = React.useState(false);

  function handleClickEquip(eq: Equipamento) {
    setSelectedEquip(eq);
    setDetailOpen(true);
  }

  return (
    <>
      <EquipmentDetailModal
        equipamento={selectedEquip}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Equipamentos</CardTitle>
              <CardDescription>
                Clique em um equipamento para ver detalhes.
                {canAct &&
                  " Qualquer equipamento pode ser sinalizado em manutenção."}
              </CardDescription>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-2">
                <AddEquipmentModal />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando
              equipamentos...
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
              <li
                key={eq.id}
                className="cursor-pointer rounded-lg border p-4 transition-colors hover:bg-accent/50 active:bg-accent"
                onClick={() => handleClickEquip(eq)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-semibold">
                      {eq.codigo}
                    </p>
                    <p className="text-sm text-muted-foreground">{eq.tipo}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={eq.status} />
                    <LocationTag localizacao={eq.localizacao} />
                  </div>
                </div>
                {canAct && (
                  <div className="mt-3 flex items-center gap-2">
                    <MaintenanceAction equipamento={eq} />
                    {isAdmin && <EditEquipmentModal equipamento={eq} />}
                    {isAdmin && <RemoveButton equipamento={eq} />}
                  </div>
                )}
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
                  <th className="py-3 pr-4 font-medium">Localização</th>
                  {canAct && (
                    <th className="py-3 text-right font-medium">Ações</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {equipamentos?.map((eq) => (
                  <tr
                    key={eq.id}
                    className="cursor-pointer border-b transition-colors last:border-0 hover:bg-accent/50"
                    onClick={() => handleClickEquip(eq)}
                  >
                    <td className="py-3 pr-4 font-mono font-semibold">
                      {eq.codigo}
                    </td>
                    <td className="py-3 pr-4">{eq.tipo}</td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={eq.status} />
                    </td>
                    <td className="py-3 pr-4">
                      <LocationTag localizacao={eq.localizacao} />
                    </td>
                    {canAct && (
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <MaintenanceAction equipamento={eq} />
                          {isAdmin && <EditEquipmentModal equipamento={eq} />}
                          {isAdmin && <RemoveButton equipamento={eq} />}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {equipamentos?.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum equipamento cadastrado.
              {isAdmin && " Use o botão acima para adicionar."}
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
