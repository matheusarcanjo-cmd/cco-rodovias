import * as React from "react";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
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
import { useAdicionarEquipamento } from "@/hooks/use-equipamentos";

export function AddEquipmentModal() {
  const [open, setOpen] = React.useState(false);
  const [codigo, setCodigo] = React.useState("");
  const [tipo, setTipo] = React.useState("");
  const [observacoes, setObservacoes] = React.useState("");
  const adicionar = useAdicionarEquipamento();

  function limpar() {
    setCodigo("");
    setTipo("");
    setObservacoes("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!codigo.trim() || !tipo.trim()) {
      toast.error("Informe o código e o tipo do equipamento.");
      return;
    }
    adicionar.mutate(
      {
        codigo: codigo.trim(),
        tipo: tipo.trim(),
        observacoes: observacoes.trim() || null,
      },
      {
        onSuccess: (eq) => {
          toast.success(`Equipamento ${eq.codigo} cadastrado.`);
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
        <Button size="sm" variant="outline">
          <Plus />
          Adicionar equipamento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo equipamento</DialogTitle>
          <DialogDescription>
            Cadastre um novo equipamento na frota do CCO. Ele entrará com status
            "Disponível".
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 pt-2">
          <div className="grid gap-2">
            <Label htmlFor="eq-codigo">Código</Label>
            <Input
              id="eq-codigo"
              placeholder="Ex.: GPS-003"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="eq-tipo">Tipo</Label>
            <Input
              id="eq-tipo"
              placeholder="Ex.: GPS Geodésico RTK"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="eq-obs">Observações</Label>
            <Input
              id="eq-obs"
              placeholder="Informações adicionais (opcional)"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
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
            <Button type="submit" disabled={adicionar.isPending}>
              {adicionar.isPending && <Loader2 className="animate-spin" />}
              Cadastrar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
