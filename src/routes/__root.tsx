import { Link, Outlet, createRootRoute } from "@tanstack/react-router";
import { Loader2, LogOut, TrafficCone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { LoginScreen } from "@/components/login-screen";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const { session, loading, signOut, user } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Guarda de autenticação: sem sessão, exibe a tela de login.
  if (!session) {
    return <LoginScreen />;
  }

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Assinatura visual: faixa de sinalização */}
      <div className="hazard-stripe" aria-hidden />

      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2">
            <TrafficCone className="h-5 w-5 text-primary" />
            <span className="font-display text-base font-bold sm:text-lg">
              CCO Rodovias
            </span>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3">
            <span className="hidden max-w-48 truncate text-sm text-muted-foreground md:inline">
              {user?.email}
            </span>
            {/* Toggle de tema claro/escuro */}
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Sair"
              onClick={() => signOut()}
            >
              <LogOut />
            </Button>
          </nav>
        </div>
      </header>

      <main className="container flex-1 py-6">
        <Outlet />
      </main>

      <footer className="border-t py-4">
        <p className="container text-xs text-muted-foreground">
          Centro de Controle Operacional · Levantamentos de infraestrutura
          rodoviária
        </p>
      </footer>
    </div>
  );
}
