import {
  AlertTriangle,
  ArrowRight,
  Clock,
  Loader2,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useHistoricoAtividades } from "@/hooks/use-equipamentos";
import type { HistoricoAtividade } from "@/types/database";

const dataCompleta = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const hora = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

type TipoConfig = {
  label: string;
  variant: "disponivel" | "alocado" | "manutencao" | "ocorrencia" | "secondary";
  icon: React.ElementType;
};

const TIPO_MAP: Record<string, TipoConfig> = {
  alocacao: { label: "Alocação", variant: "alocado", icon: ArrowRight },
  manutencao: { label: "Manutenção", variant: "manutencao", icon: Wrench },
  ocorrencia: { label: "Ocorrência", variant: "ocorrencia", icon: AlertTriangle },
  status_change: { label: "Status", variant: "secondary", icon: ArrowRight },
};

function groupByDay(items: HistoricoAtividade[]) {
  const groups: Record<string, HistoricoAtividade[]> = {};
  for (const item of items) {
    const day = dataCompleta.format(new Date(item.criado_em));
    if (!groups[day]) groups[day] = [];
    groups[day].push(item);
  }
  return groups;
}

function HistoryItem({ item }: { item: HistoricoAtividade }) {
  const config = TIPO_MAP[item.tipo] ?? TIPO_MAP.status_change;
  const Icon = config.icon;
  const detalhes = item.detalhes as Record<string, string | null>;

  return (
    <div className="flex gap-3 py-2">
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-semibold">
            {item.equipamento_codigo}
          </span>
          <Badge variant={config.variant} className="text-[10px]">
            {config.label}
          </Badge>
          <span className="text-xs text-muted-foreground">
            <Clock className="mr-0.5 inline h-3 w-3" />
            {hora.format(new Date(item.criado_em))}
          </span>
        </div>

        <p className="mt-0.5 text-sm text-muted-foreground">
          {item.status_anterior && item.status_novo && (
            <span>
              {item.status_anterior} → {item.status_novo}
            </span>
          )}
          {detalhes?.motivo && (
            <span className="ml-2 text-status-ocorrencia">
              · {detalhes.motivo}
            </span>
          )}
          {detalhes?.manutencao_responsavel && (
            <span> · Resp: {detalhes.manutencao_responsavel}</span>
          )}
          {detalhes?.manutencao_detalhamento && (
            <span> · {detalhes.manutencao_detalhamento}</span>
          )}
        </p>

        {item.usuario_email && (
          <p className="text-xs text-muted-foreground/60">
            por {item.usuario_email}
          </p>
        )}
      </div>
    </div>
  );
}

export function ActivityHistory() {
  const { data: historico, isLoading } = useHistoricoAtividades();

  const grouped = historico ? groupByDay(historico) : {};
  const days = Object.keys(grouped);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de atividades</CardTitle>
        <CardDescription>
          Registro de mudanças de status e ocorrências, agrupado por dia.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando
            histórico...
          </div>
        )}

        {days.length === 0 && !isLoading && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhuma atividade registrada ainda.
          </p>
        )}

        {days.map((day) => (
          <div key={day} className="mb-4 last:mb-0">
            <div className="sticky top-0 z-10 mb-1 flex items-center gap-2 bg-card py-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {day}
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="divide-y">
              {grouped[day].map((item) => (
                <HistoryItem key={item.id} item={item} />
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
