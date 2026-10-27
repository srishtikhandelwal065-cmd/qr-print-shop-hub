import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user) return;
      const { data } = await supabase.auth.getUser();
      if (data?.user) return;
    } catch {
      // Supabase network failure
    }

    if (typeof window !== "undefined") {
      const localUser = localStorage.getItem("printex_user");
      const localToken = localStorage.getItem("printex_token");
      if (localUser && localToken) return;
    }

    if (location.pathname === "/auth") return;
    throw redirect({ to: "/auth", search: { redirect: location.pathname } });
  },
  component: () => <Outlet />,
});
