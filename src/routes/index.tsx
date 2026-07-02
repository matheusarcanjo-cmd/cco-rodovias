import { createFileRoute } from "@tanstack/react-router";
import { CircleCheck, TrafficCone, Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AllocationForm } from "@/components/allocation-form";
import { ActiveAllocations } from "@/components/active-allocations";
import { EquipmentTable } from "@/components/equipment-table";
import { useEquipamentos } from "@/hooks/use-equipamentos";

export const Route = createFileRoute("/")({
  component: DashboardPage,
});

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  tone: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4 sm:p-6">
        <div className={`rounded-md p-2 ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-display text-2xl font-bold leading-none">
            {value}
          </p>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            {label}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardPage() {
  const { data: equipamentos } = useEquipamentos();

  const disponiveis =
    equipamentos?.filter((e) => e.status === "Disponível").length ?? "—";
  const alocados =
    equipamentos?.filter((e) => e.status === "Alocado").length ?? "—";
  const manutencao =
    equipamentos?.filter((e) => e.status === "Alocado (manutenção)").length ??
    "—";

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Painel operacional</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Alocação de equipamentos e acompanhamento das equipes de campo.
        </p>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard
          label="Disponíveis"
          value={disponiveis}
          icon={CircleCheck}
          tone="bg-status-disponivel/15 text-status-disponivel"
        />
        <StatCard
          label="Alocados em campo"
          value={alocados}
          icon={TrafficCone}
          tone="bg-status-alocado/15 text-status-alocado"
        />
        <StatCard
          label="Em manutenção (em serviço)"
          value={manutencao}
          icon={Wrench}
          tone="bg-status-manutencao/15 text-status-manutencao"
        />
      </div>

      {/* Formulário + alocações ativas: 1 coluna no mobile, 2 no desktop */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AllocationForm />
        <ActiveAllocations />
      </div>

      <EquipmentTable />
    </div>
  );
}
