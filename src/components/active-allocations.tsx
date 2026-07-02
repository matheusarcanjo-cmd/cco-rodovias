import { toast } from "sonner";
import { Loader2, MapPin, SquareCheckBig, Users } from "lucide-react";
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
} from "@/hooks/use-equipamentos";

const dataCurta = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export function ActiveAllocations() {
  const { data: alocacoes, isLoading } = useAlocacoesAtivas();
  const encerrar = useEncerrarAlocacao();

  function handleEncerrar(id: string, codigo?: string) {
    encerrar.mutate(id, {
      onSuccess: () =>
        toast.success(
          `Alocação encerrada. ${codigo ?? "Equipamento"} voltou a ficar disponível.`
        ),
      onError: (err) => toast.error(err.message),
    });
  }

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
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando alocações...
          </div>
        )}

        {alocacoes?.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhuma alocação ativa. Use o formulário para enviar um equipamento
            a campo.
          </p>
        )}

        {alocacoes?.map((a) => {
          const emManutencao =
            a.equipamentos?.status === "Alocado (manutenção)";
          return (
            <div
              key={a.id}
              className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-semibold">
                    {a.equipamentos?.codigo}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {a.equipamentos?.tipo}
                  </span>
                  {emManutencao && (
                    <Badge variant="manutencao">Em manutenção</Badge>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {a.equipe} · {a.responsavel}
                  </span>
                  {a.rodovia && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {a.rodovia}
                      {a.km_inicial != null && ` km ${a.km_inicial}`}
                      {a.km_final != null && ` a ${a.km_final}`}
                    </span>
                  )}
                  <span>desde {dataCurta.format(new Date(a.alocada_em))}</span>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0"
                disabled={encerrar.isPending}
                onClick={() => handleEncerrar(a.id, a.equipamentos?.codigo)}
              >
                <SquareCheckBig />
                Encerrar alocação
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
