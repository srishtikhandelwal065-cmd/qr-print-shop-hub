import { createFileRoute, Link, Navigate, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyShop } from "@/lib/use-shop";
import { useEffect, useState } from "react";
import { LayoutDashboard, FileText, QrCode, Store, Settings, Menu, X, ExternalLink, LogOut, Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Shop Dashboard — Printex" },
      { name: "description", content: "Manage print orders, your shop QR code and profile." },
      { property: "og:title", content: "Shop Dashboard — Printex" },
      { property: "og:description", content: "Manage print orders, your shop QR code and profile." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardLayout,
});

const items = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/dashboard/orders", label: "Print Orders", icon: FileText },
  { to: "/dashboard/qr", label: "My Shop QR Code", icon: QrCode },
  { to: "/dashboard/profile", label: "Shop Profile", icon: Store },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
] as const;

function DashboardLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const { data: shop, isLoading, error } = useMyShop();
  const qc = useQueryClient();
  const navigate = useNavigate();
  useEffect(() => setOpen(false), [path]);
  const signOut = async () => {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
  if (isLoading) return <div className="grid min-h-screen place-items-center"><Loader2 className="h-6 w-6 animate-spin text-teal" /></div>;
  if (error) return <div className="grid min-h-screen place-items-center text-sm text-destructive">Couldn't load your shop. Please refresh.</div>;
  if (!shop) return <Navigate to="/register" replace />;

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b px-5"><Logo to="/dashboard" /></div>
      <div className="m-3 rounded-xl bg-secondary p-3">
        <p className="truncate text-sm font-semibold">{shop.name}</p>
        <p className="truncate text-xs text-muted-foreground">{shop.owner}</p>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {items.map(({ to, label, icon: Icon }) => {
          const active = to === "/dashboard" ? path === "/dashboard" || path === "/dashboard/" : path.startsWith(to);
          return (
            <Link key={to} to={to} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${active ? "bg-teal-soft text-accent-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
              <Icon className="h-4 w-4" /> {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-3">
        <Link to="/s/$shopId" params={{ shopId: shop.id }} target="_blank" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary">
          <ExternalLink className="h-4 w-4" /> Customer upload page
        </Link>
        <button onClick={signOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-secondary">
      <aside className="no-print sticky top-0 hidden h-screen w-64 shrink-0 border-r bg-background lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 bg-navy/40 lg:hidden" onClick={() => setOpen(false)}>
          <aside className="h-full w-72 bg-background" onClick={(e) => e.stopPropagation()}>{sidebar}</aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print flex h-16 items-center justify-between border-b bg-background px-4 lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Open menu"><Menu /></button>
          <Logo to="/dashboard" />
          <span className="w-6">{open && <X />}</span>
        </header>
        <main className="flex-1 p-4 md:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
