import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import type { UserRole } from "@/types/database";

/**
 * RBAC simples: busca o papel do usuário logado via RPC `get_user_role`.
 * Emails sem registro na tabela `user_roles` são tratados como "viewer".
 *
 * canAct = true  → admin | operador (ações completas)
 * canAct = false → viewer (somente leitura, diretoria)
 */
export function useRole() {
  const { user } = useAuth();

  const { data: role, isLoading } = useQuery({
    queryKey: ["user-role", user?.id],
    queryFn: async (): Promise<UserRole> => {
      const { data, error } = await supabase.rpc("get_user_role");
      if (error) {
        console.warn("Falha ao buscar role, usando viewer:", error.message);
        return "viewer";
      }
      return (data as UserRole) ?? "viewer";
    },
    enabled: !!user,
    staleTime: 5 * 60_000, // cache 5 min
  });

  const resolvedRole: UserRole = role ?? "viewer";

  return {
    role: resolvedRole,
    isLoading,
    canAct: resolvedRole === "admin" || resolvedRole === "operador",
    isAdmin: resolvedRole === "admin",
  };
}
