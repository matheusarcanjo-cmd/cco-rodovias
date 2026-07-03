import * as React from "react";
import { toast } from "sonner";
import { Loader2, Pencil } from "lucide-react";
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
import { useEditarAlocacao } from "@/hooks/use-equipamentos";
import type { AlocacaoComEquipamento } from "@/types/database";

interface EditAllocationModalProps {
  alocacao: AlocacaoComEquipamento;
}

export function EditAllocationModal({ alocacao }: EditAllocationModalProps) {
  const [open, setOpen] = React.useState(false);
  const [operador, setOperador] = React.useState(alocacao.operador ?? "");
  const [crs, setCrs] = React.useState(alocacao.crs ?? "");
  const [espacamento, setEspacamento] = React.useState(alocacao.espacamento ?? "");
  const [prazoPrevisto, setPrazoPrevisto] = React.useState(alocacao.prazo_previsto ?? "");
  const [descricao, setDescricao] = React.useState(alocacao.descricao ?? "");
  const editar = useEditarAlocacao();

  React.useEffect(() => {
    if (open) {
      setOperador(alocacao.operador ?? "");
      setCrs(alocacao.crs ?? "");
      setEspacamento(alocacao.espacamento ?? "");
      setPrazoPrevisto(alocacao.prazo_previsto ?? "");
      setDescricao(alocacao.descricao ?? "");
    }
  }, [open, alocacao]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    editar.mutate(
      {
        alocacaoId: alocacao.id,
        operador: operador.trim() || null,
        crs: crs.trim() || null,
        espacamento: espacamento.trim() || null,
        prazo_previsto: prazoPrevisto || null,
        descricao: descricao.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success(
            `Alocação do ${alocacao.equipamentos?.codigo ?? "equipamento"} atualizada.`
          );
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
          <Pencil />
          Editar alocação
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Editar alocação · {alocacao.equipamentos?.codigo}
          </DialogTitle>
          <DialogDescription>
            Altere as informações da alocação. O status do equipamento não será
            afetado.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 pt-2">
          <div className="grid gap-2">
            <Label htmlFor="edit-al-operador">Operador responsável</Label>
            <Input
              id="edit-al-operador"
              value={operador}
              onChange={(e) => setOperador(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="edit-al-crs">CRS</Label>
              <Input
                id="edit-al-crs"
                value={crs}
                onChange={(e) => setCrs(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-al-esp">Espaçamento</Label>
              <Input
                id="edit-al-esp"
                value={espacamento}
                onChange={(e) => setEspacamento(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-al-prazo">Prazo previsto de término</Label>
            <Input
              id="edit-al-prazo"
              type="date"
              value={prazoPrevisto}
              onChange={(e) => setPrazoPrevisto(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-al-desc">Descrição do serviço</Label>
            <Input
              id="edit-al-desc"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={editar.isPending}>
              {editar.isPending && <Loader2 className="animate-spin" />}
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
