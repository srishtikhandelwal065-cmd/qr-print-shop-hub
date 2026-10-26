import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("printex_token");
      if (token) return; // Authenticated with Hostinger token!
    }

    try {
      const { data } = await supabase.auth.getUser();
      if (data?.user) return;
    } catch {
      // Supabase unavailable
    }

    throw redirect({ to: "/auth", search: { redirect: location.pathname } });
  },
  component: () => <Outlet />,
});
