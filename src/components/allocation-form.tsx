import * as React from "react";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCriarAlocacao,
  useEquipamentosDisponiveis,
} from "@/hooks/use-equipamentos";

export function AllocationForm() {
  const { data: disponiveis, isLoading, isError } = useEquipamentosDisponiveis();
  const criarAlocacao = useCriarAlocacao();

  const [equipamentoId, setEquipamentoId] = React.useState<string>("");
  const [operador, setOperador] = React.useState("");
  const [crs, setCrs] = React.useState("");
  const [espacamento, setEspacamento] = React.useState("");
  const [prazoPrevisto, setPrazoPrevisto] = React.useState("");
  const [descricao, setDescricao] = React.useState("");

  function limpar() {
    setEquipamentoId("");
    setOperador("");
    setCrs("");
    setEspacamento("");
    setPrazoPrevisto("");
    setDescricao("");
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!equipamentoId) {
      toast.error("Selecione um equipamento.");
      return;
    }
    if (!operador.trim()) {
      toast.error("Informe o operador responsável.");
      return;
    }
    if (!prazoPrevisto) {
      toast.error("Informe o prazo previsto de término.");
      return;
    }

    criarAlocacao.mutate(
      {
        equipamento_id: equipamentoId,
        operador: operador.trim(),
        crs: crs.trim() || undefined,
        espacamento: espacamento.trim() || undefined,
        prazo_previsto: prazoPrevisto || null,
        percentual: 0,
        descricao: descricao.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Equipamento alocado.");
          limpar();
        },
        onError: (err) => toast.error(err.message),
      }
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alocar equipamento</CardTitle>
        <CardDescription>
          Vincule um equipamento disponível a uma operação de campo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          {/* Dropdown de equipamentos */}
          <div className="grid gap-2">
            <Label htmlFor="equipamento">Equipamento</Label>
            <Select value={equipamentoId} onValueChange={setEquipamentoId}>
              <SelectTrigger id="equipamento" disabled={isLoading}>
                <SelectValue
                  placeholder={
                    isLoading
                      ? "Carregando equipamentos..."
                      : "Selecione um equipamento disponível"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {disponiveis?.map((eq) => (
                  <SelectItem key={eq.id} value={eq.id}>
                    {`Código: ${eq.codigo} - Tipo: ${eq.tipo}`}
                  </SelectItem>
                ))}
                {disponiveis?.length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    Nenhum equipamento disponível no momento.
                  </div>
                )}
              </SelectContent>
            </Select>
            {isError && (
              <p className="text-sm text-destructive">
                Não foi possível carregar os equipamentos. Recarregue a página.
              </p>
            )}
          </div>

          {/* Operador + Prazo previsto */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="operador">Operador responsável</Label>
              <Input
                id="operador"
                placeholder="Nome do operador"
                value={operador}
                onChange={(e) => setOperador(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="prazo-previsto">Prazo previsto de término</Label>
              <Input
                id="prazo-previsto"
                type="date"
                value={prazoPrevisto}
                onChange={(e) => setPrazoPrevisto(e.target.value)}
                required
              />
            </div>
          </div>

          {/* CRS + Espaçamento */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="crs">CRS</Label>
              <Input
                id="crs"
                placeholder="Ex.: SIRGAS 2000 / UTM 23S"
                value={crs}
                onChange={(e) => setCrs(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="espacamento">Espaçamento</Label>
              <Input
                id="espacamento"
                placeholder="Ex.: 20m"
                value={espacamento}
                onChange={(e) => setEspacamento(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="descricao">Descrição do serviço</Label>
            <Input
              id="descricao"
              placeholder="Ex.: Levantamento topográfico do trecho duplicado"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            disabled={criarAlocacao.isPending}
            className="w-full sm:w-auto sm:justify-self-end"
          >
            {criarAlocacao.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Send />
            )}
            Alocar equipamento
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
