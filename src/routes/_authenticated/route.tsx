import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("printex_token");
      if (token) {
        try {
          const res = await fetch(`/api/auth.php?action=me&token=${encodeURIComponent(token)}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const d = await res.json();
            if (d?.user) return; // Authenticated with Hostinger!
          }
        } catch {
          // If offline or check fails, fall through to Supabase check
        }
      }
    }

    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth", search: { redirect: location.pathname } });
  },
  component: () => <Outlet />,
});
