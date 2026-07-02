import * as React from "react";
import { toast } from "sonner";
import { Loader2, TrendingUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAtualizarProgresso } from "@/hooks/use-equipamentos";

interface ProgressModalProps {
  alocacaoId: string;
  codigoEquip: string;
  currentPrazo: string | null;
  currentPercentual: number;
}

export function ProgressModal({
  alocacaoId,
  codigoEquip,
  currentPrazo,
  currentPercentual,
}: ProgressModalProps) {
  const [open, setOpen] = React.useState(false);
  const [prazo, setPrazo] = React.useState(currentPrazo ?? "");
  const [percentual, setPercentual] = React.useState(currentPercentual);
  const atualizar = useAtualizarProgresso();

  // Sync ao abrir
  React.useEffect(() => {
    if (open) {
      setPrazo(currentPrazo ?? "");
      setPercentual(currentPercentual);
    }
  }, [open, currentPrazo, currentPercentual]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    atualizar.mutate(
      {
        alocacaoId,
        prazo_previsto: prazo || null,
        percentual,
      },
      {
        onSuccess: () => {
          toast.success(`Progresso de ${codigoEquip} atualizado.`);
          setOpen(false);
        },
        onError: (err) => toast.error(err.message),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="shrink-0">
          <TrendingUp />
          Atualizar progresso
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Atualizar progresso · {codigoEquip}</DialogTitle>
          <DialogDescription>
            Registre a evolução diária do levantamento sem encerrar a alocação.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-5 pt-2">
          <div className="grid gap-2">
            <Label htmlFor="modal-prazo">Prazo previsto de término</Label>
            <Input
              id="modal-prazo"
              type="date"
              value={prazo}
              onChange={(e) => setPrazo(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="modal-pct">% concluído</Label>
              <span className="font-mono text-sm font-semibold tabular-nums">
                {percentual}%
              </span>
            </div>
            <input
              id="modal-pct"
              type="range"
              min={0}
              max={100}
              step={1}
              value={percentual}
              onChange={(e) => setPercentual(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={atualizar.isPending}>
              {atualizar.isPending && <Loader2 className="animate-spin" />}
              Salvar progresso
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
