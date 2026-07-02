import * as React from "react";
import { toast } from "sonner";
import { Loader2, Wrench } from "lucide-react";
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
import { useIniciarManutencao } from "@/hooks/use-equipamentos";

interface ManutencaoModalProps {
  equipamentoId: string;
  codigoEquip: string;
}

export function ManutencaoModal({
  equipamentoId,
  codigoEquip,
}: ManutencaoModalProps) {
  const [open, setOpen] = React.useState(false);
  const [responsavel, setResponsavel] = React.useState("");
  const [prazo, setPrazo] = React.useState("");
  const [detalhamento, setDetalhamento] = React.useState("");
  const iniciar = useIniciarManutencao();

  function limpar() {
    setResponsavel("");
    setPrazo("");
    setDetalhamento("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!responsavel.trim()) {
      toast.error("Informe o responsável pela manutenção.");
      return;
    }
    iniciar.mutate(
      {
        equipamentoId,
        responsavel: responsavel.trim(),
        prazo: prazo || null,
        detalhamento: detalhamento.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success(
            `${codigoEquip} sinalizado em manutenção. A alocação segue ativa.`
          );
          limpar();
          setOpen(false);
        },
        onError: (err) => toast.error(err.message),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="whitespace-nowrap">
          <Wrench />
          Sinalizar manutenção
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Iniciar manutenção · {codigoEquip}</DialogTitle>
          <DialogDescription>
            Informe os detalhes da manutenção. A alocação continua ativa.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 pt-2">
          <div className="grid gap-2">
            <Label htmlFor="man-responsavel">Responsável</Label>
            <Input
              id="man-responsavel"
              placeholder="Nome do técnico responsável"
              value={responsavel}
              onChange={(e) => setResponsavel(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="man-prazo">Data de término previsto</Label>
            <Input
              id="man-prazo"
              type="date"
              value={prazo}
              onChange={(e) => setPrazo(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="man-detalhe">Detalhamento</Label>
            <textarea
              id="man-detalhe"
              rows={3}
              placeholder="Descreva o problema e o serviço necessário..."
              value={detalhamento}
              onChange={(e) => setDetalhamento(e.target.value)}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={iniciar.isPending}>
              {iniciar.isPending && <Loader2 className="animate-spin" />}
              Confirmar manutenção
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
