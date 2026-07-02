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
  const [equipe, setEquipe] = React.useState("");
  const [responsavel, setResponsavel] = React.useState("");
  const [operador, setOperador] = React.useState("");
  const [crs, setCrs] = React.useState("");
  const [espacamento, setEspacamento] = React.useState("");
  const [rodovia, setRodovia] = React.useState("");
  const [kmInicial, setKmInicial] = React.useState("");
  const [kmFinal, setKmFinal] = React.useState("");
  const [prazoPrevisto, setPrazoPrevisto] = React.useState("");
  const [descricao, setDescricao] = React.useState("");

  function limpar() {
    setEquipamentoId("");
    setEquipe("");
    setResponsavel("");
    setOperador("");
    setCrs("");
    setEspacamento("");
    setRodovia("");
    setKmInicial("");
    setKmFinal("");
    setPrazoPrevisto("");
    setDescricao("");
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!equipamentoId) {
      toast.error("Selecione um equipamento.");
      return;
    }
    if (!equipe.trim() || !responsavel.trim()) {
      toast.error("Informe a equipe e o responsável.");
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
        equipe: equipe.trim(),
        responsavel: responsavel.trim(),
        operador: operador.trim(),
        crs: crs.trim() || undefined,
        espacamento: espacamento.trim() || undefined,
        rodovia: rodovia.trim() || undefined,
        km_inicial: kmInicial ? Number(kmInicial) : null,
        km_final: kmFinal ? Number(kmFinal) : null,
        prazo_previsto: prazoPrevisto || null,
        percentual: 0,
        descricao: descricao.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Equipamento alocado à equipe.");
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
          Vincule um equipamento disponível a uma equipe de campo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          {/* Dropdown de equipamentos lendo do banco */}
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="equipe">Equipe</Label>
              <Input
                id="equipe"
                placeholder="Ex.: Equipe Norte 02"
                value={equipe}
                onChange={(e) => setEquipe(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="responsavel">Responsável</Label>
              <Input
                id="responsavel"
                placeholder="Líder de campo"
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                required
              />
            </div>
          </div>

          {/* v2: Operador + Prazo previsto */}
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

          {/* v3: CRS + Espaçamento */}
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

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="rodovia">Rodovia</Label>
              <Input
                id="rodovia"
                placeholder="Ex.: BR-381"
                value={rodovia}
                onChange={(e) => setRodovia(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="km-inicial">km inicial</Label>
              <Input
                id="km-inicial"
                type="number"
                inputMode="decimal"
                step="0.001"
                min="0"
                placeholder="0,000"
                value={kmInicial}
                onChange={(e) => setKmInicial(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="km-final">km final</Label>
              <Input
                id="km-final"
                type="number"
                inputMode="decimal"
                step="0.001"
                min="0"
                placeholder="0,000"
                value={kmFinal}
                onChange={(e) => setKmFinal(e.target.value)}
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
