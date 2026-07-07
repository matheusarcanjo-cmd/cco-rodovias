import * as React from "react";
import { toast } from "sonner";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRegistrarOcorrencia } from "@/hooks/use-equipamentos";
import type { MotivoOcorrencia } from "@/types/database";

const MOTIVOS: MotivoOcorrencia[] = [
  "Chuva",
  "Pare/siga",
  "Neblina",
  "Equipamento",
  "Veículo",
  "Colaborador",
  "Outros",
];

const MOTIVOS_COM_DETALHE: MotivoOcorrencia[] = [
  "Equipamento",
  "Veículo",
  "Colaborador",
  "Outros",
];

interface OcorrenciaModalProps {
  equipamentoId: string;
  codigoEquip: string;
}

export function OcorrenciaModal({
  equipamentoId,
  codigoEquip,
}: OcorrenciaModalProps) {
  const [open, setOpen] = React.useState(false);
  const [motivo, setMotivo] = React.useState<string>("");
  const [detalhamento, setDetalhamento] = React.useState("");
  const registrar = useRegistrarOcorrencia();

  const exigeDetalhe = MOTIVOS_COM_DETALHE.includes(motivo as MotivoOcorrencia);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!motivo) {
      toast.error("Selecione o motivo da ocorrência.");
      return;
    }
    if (exigeDetalhe && !detalhamento.trim()) {
      toast.error("Informe o detalhamento da ocorrência.");
      return;
    }

    const motivoFinal = exigeDetalhe && detalhamento.trim()
      ? `${motivo}: ${detalhamento.trim()}`
      : motivo;

    registrar.mutate(
      { equipamentoId, motivo: motivoFinal },
      {
        onSuccess: () => {
          toast.success(
            `Ocorrência registrada para ${codigoEquip}. A alocação segue ativa.`
          );
          setMotivo("");
          setDetalhamento("");
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
          variant="outline"
          className="shrink-0 border-status-ocorrencia/40 text-status-ocorrencia hover:bg-status-ocorrencia/10"
        >
          <AlertTriangle />
          Registrar ocorrência
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar ocorrência · {codigoEquip}</DialogTitle>
          <DialogDescription>
            Pause ou sinalize um impedimento na operação sem encerrar a
            alocação. Selecione o motivo abaixo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 pt-2">
          <div className="grid gap-2">
            <Label htmlFor="motivo-ocorrencia">Motivo da ocorrência</Label>
            <Select
              value={motivo}
              onValueChange={(v) => {
                setMotivo(v);
                if (!MOTIVOS_COM_DETALHE.includes(v as MotivoOcorrencia)) {
                  setDetalhamento("");
                }
              }}
            >
              <SelectTrigger id="motivo-ocorrencia">
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent>
                {MOTIVOS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {exigeDetalhe && (
            <div className="grid gap-2">
              <Label htmlFor="oc-detalhamento">Detalhamento</Label>
              <textarea
                id="oc-detalhamento"
                rows={3}
                placeholder={
                  motivo === "Equipamento"
                    ? "Descreva o problema com o equipamento..."
                    : motivo === "Veículo"
                      ? "Descreva o problema com o veículo..."
                      : motivo === "Colaborador"
                        ? "Descreva a situação do colaborador..."
                        : "Descreva o motivo da ocorrência..."
                }
                value={detalhamento}
                onChange={(e) => setDetalhamento(e.target.value)}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={registrar.isPending}
              className="bg-status-ocorrencia text-primary-foreground hover:bg-status-ocorrencia/90"
            >
              {registrar.isPending && <Loader2 className="animate-spin" />}
              Confirmar ocorrência
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
