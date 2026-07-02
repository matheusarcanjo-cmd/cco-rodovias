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

/**
 * Formulário de Alocação de Equipamentos.
 *
 * Requisito do dropdown:
 *  - Cada opção exibe exatamente:  "Código: [código] - Tipo: [tipo]"
 *  - O value enviado no submit é o ID (uuid) do equipamento.
 */
export function AllocationForm() {
  const { data: disponiveis, isLoading, isError } = useEquipamentosDisponiveis();
  const criarAlocacao = useCriarAlocacao();

  const [equipamentoId, setEquipamentoId] = React.useState<string>("");
  const [equipe, setEquipe] = React.useState("");
  const [responsavel, setResponsavel] = React.useState("");
  const [rodovia, setRodovia] = React.useState("");
  const [kmInicial, setKmInicial] = React.useState("");
  const [kmFinal, setKmFinal] = React.useState("");
  const [descricao, setDescricao] = React.useState("");

  function limpar() {
    setEquipamentoId("");
    setEquipe("");
    setResponsavel("");
    setRodovia("");
    setKmInicial("");
    setKmFinal("");
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

    criarAlocacao.mutate(
      {
        equipamento_id: equipamentoId, // <- value do select é o ID
        equipe: equipe.trim(),
        responsavel: responsavel.trim(),
        rodovia: rodovia.trim() || undefined,
        km_inicial: kmInicial ? Number(kmInicial) : null,
        km_final: kmFinal ? Number(kmFinal) : null,
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
                  // value = ID do equipamento; texto no formato exigido
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
                placeholder="Nome do líder de campo"
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                required
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
