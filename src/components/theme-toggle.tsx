import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

/**
 * Toggle switch de tema (claro/escuro) exibido no cabeçalho.
 * Acessível: role="switch" + aria-checked + operável por teclado.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
      onClick={toggleTheme}
      className={cn(
        "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border border-border bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
        className
      )}
    >
      <span
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-full bg-card shadow transition-transform duration-200",
          isDark ? "translate-x-7" : "translate-x-1"
        )}
      >
        {isDark ? (
          <Moon className="h-3.5 w-3.5 text-primary" />
        ) : (
          <Sun className="h-3.5 w-3.5 text-status-manutencao" />
        )}
      </span>
    </button>
  );
}
