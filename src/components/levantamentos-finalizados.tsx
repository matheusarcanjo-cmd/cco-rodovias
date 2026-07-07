import * as React from "react";
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Ruler,
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
import { useLevantamentosFinalizados } from "@/hooks/use-equipamentos";
import type { AlocacaoComEquipamento } from "@/types/database";

const dataSimples = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function FinalizadoCard({ a }: { a: AlocacaoComEquipamento }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-semibold">
            {a.equipamentos?.codigo}
          </span>
          <span className="text-sm text-muted-foreground">
            {a.equipamentos?.tipo}
          </span>
        </div>
        <Badge variant="disponivel">
          <CheckCircle2 className="h-3 w-3" />
          Concluído
        </Badge>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        {a.operador && (
          <span className="inline-flex items-center gap-1">
            <User className="h-3.5 w-3.5" />
            {a.operador}
          </span>
        )}
        {a.crs && (
          <span className="inline-flex items-center gap-1">
            <Ruler className="h-3.5 w-3.5" />
            {a.crs}
          </span>
        )}
        {a.espacamento && (
          <span className="text-xs">Espaçamento: {a.espacamento}</span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          Início: {dataSimples.format(new Date(a.alocada_em))}
        </span>
        {a.encerrada_em && (
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            Finalizado: {dataSimples.format(new Date(a.encerrada_em))}
          </span>
        )}
      </div>

      {a.descricao && (
        <p className="text-sm text-muted-foreground">{a.descricao}</p>
      )}
    </div>
  );
}

export function LevantamentosFinalizados() {
  const { data: finalizados, isLoading } = useLevantamentosFinalizados();
  const [expanded, setExpanded] = React.useState(false);

  const total = finalizados?.length ?? 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-status-disponivel" />
              Levantamentos finalizados
            </CardTitle>
            <CardDescription>
              {total > 0
                ? `${total} levantamento${total !== 1 ? "s" : ""} concluído${total !== 1 ? "s" : ""} com 100%.`
                : "Serviços encerrados com 100% de conclusão."}
            </CardDescription>
          </div>
          {total > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <>
                  <ChevronUp />
                  Recolher
                </>
              ) : (
                <>
                  <ChevronDown />
                  Ver todos ({total})
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="grid gap-3">
          {isLoading && (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
            </div>
          )}

          {finalizados?.map((a) => (
            <FinalizadoCard key={a.id} a={a} />
          ))}

          {total === 0 && !isLoading && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhum levantamento finalizado ainda.
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
}
