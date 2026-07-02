import * as React from "react";
import { Loader2, TrafficCone } from "lucide-react";
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
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/use-auth";

export function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await signIn(email, password);
    if (error) setError("E-mail ou senha inválidos. Verifique e tente novamente.");
    setSubmitting(false);
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="hazard-stripe" aria-hidden />
      <div className="flex justify-end p-4">
        <ThemeToggle />
      </div>
      <div className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="items-center text-center">
            <TrafficCone className="h-8 w-8 text-primary" />
            <CardTitle className="text-xl">CCO Rodovias</CardTitle>
            <CardDescription>
              Acesse com sua conta operacional para entrar no painel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="voce@empresa.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting && <Loader2 className="animate-spin" />}
                Entrar
              </Button>
            </form>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Usuários são cadastrados pelo administrador no painel do Supabase
              (Authentication &gt; Users).
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
