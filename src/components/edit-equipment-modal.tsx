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
import { useEditarEquipamento } from "@/hooks/use-equipamentos";
import type { Equipamento } from "@/types/database";

interface EditEquipmentModalProps {
  equipamento: Equipamento;
}

export function EditEquipmentModal({ equipamento }: EditEquipmentModalProps) {
  const [open, setOpen] = React.useState(false);
  const [codigo, setCodigo] = React.useState(equipamento.codigo);
  const [tipo, setTipo] = React.useState(equipamento.tipo);
  const [observacoes, setObservacoes] = React.useState(equipamento.observacoes ?? "");
  const editar = useEditarEquipamento();

  React.useEffect(() => {
    if (open) {
      setCodigo(equipamento.codigo);
      setTipo(equipamento.tipo);
      setObservacoes(equipamento.observacoes ?? "");
    }
  }, [open, equipamento]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!codigo.trim() || !tipo.trim()) {
      toast.error("Código e tipo são obrigatórios.");
      return;
    }
    editar.mutate(
      {
        id: equipamento.id,
        codigo: codigo.trim(),
        tipo: tipo.trim(),
        observacoes: observacoes.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success(`Equipamento ${codigo.trim()} atualizado.`);
          setOpen(false);
        },
        onError: (err) => toast.error(err.message),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => e.stopPropagation()}
        >
          <Pencil />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Editar equipamento</DialogTitle>
          <DialogDescription>
            Altere as informações do equipamento {equipamento.codigo}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 pt-2">
          <div className="grid gap-2">
            <Label htmlFor="edit-codigo">Código</Label>
            <Input
              id="edit-codigo"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-tipo">Tipo</Label>
            <Input
              id="edit-tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-obs">Observações</Label>
            <Input
              id="edit-obs"
              placeholder="Informações adicionais (opcional)"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
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
