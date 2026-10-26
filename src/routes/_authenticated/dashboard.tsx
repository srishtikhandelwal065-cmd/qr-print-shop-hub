import { createFileRoute, Link, Navigate, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyShop } from "@/lib/use-shop";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, FileText, QrCode, Store, Settings, Menu, X, ExternalLink,
  LogOut, Loader2, Volume2, VolumeX, BellRing
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { playNewOrderChime } from "@/lib/shop-store";

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
  { to: "/dashboard/profile", label: "Shop Profile & Rates", icon: Store },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
] as const;

function DashboardLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { data: shop, isLoading, error } = useMyShop();
  const qc = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => setOpen(false), [path]);

  const shopId = shop?.id;

  // Realtime Supabase Channel for instantaneous incoming orders & sound chime
  useEffect(() => {
    if (!shopId) return;
    const channel = supabase
      .channel(`orders-${shopId}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `shop_id=eq.${shopId}` },
        (payload) => {
          if (payload.eventType === "INSERT" && soundEnabled) {
            playNewOrderChime();
          }
          qc.invalidateQueries({ queryKey: ["orders", shopId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shopId, qc, soundEnabled]);

  const signOut = async () => {
    localStorage.removeItem("printex_token");
    localStorage.removeItem("printex_user");
    await qc.cancelQueries();
    qc.clear();
    try {
      await supabase.auth.signOut();
    } catch {}
    navigate({ to: "/auth", replace: true });
  };

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-secondary">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-teal" />
          <p className="text-xs text-muted-foreground font-medium">Loading your shop counter…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-destructive font-medium">
        Couldn't load your shop details. Please refresh the page.
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="grid min-h-screen place-items-center bg-secondary p-4">
        <div className="card max-w-md p-8 text-center space-y-4 shadow-md">
          <Store className="mx-auto h-12 w-12 text-teal" />
          <h2 className="text-2xl font-bold text-navy">Welcome to Printex!</h2>
          <p className="text-sm text-muted-foreground">
            You don't have a print shop registered yet. It takes less than 2 minutes to create your shop and get your counter QR code.
          </p>
          <Link to="/register" className="btn btn-teal w-full py-3 font-bold text-sm">
            Create Your Shop Now →
          </Link>
        </div>
      </div>
    );
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between border-b px-5">
        <Logo to="/dashboard" />
      </div>

      {/* Shop Info Badge */}
      <div className="m-3 rounded-2xl bg-secondary p-3 border">
        <div className="flex items-center justify-between">
          <p className="truncate text-sm font-bold text-navy">{shop.name}</p>
          <span className="h-2 w-2 rounded-full bg-emerald-500" title="Online" />
        </div>
        <p className="truncate text-xs text-muted-foreground">{shop.owner}</p>
        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Status:</span>
          <span className={`font-semibold ${shop.acceptUploads ? "text-emerald-600" : "text-amber-600"}`}>
            {shop.acceptUploads ? "Accepting Orders" : "Shop Paused"}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3">
        {items.map(({ to, label, icon: Icon }) => {
          const active = to === "/dashboard" ? path === "/dashboard" || path === "/dashboard/" : path.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                active
                  ? "bg-teal text-white shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" /> {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Controls */}
      <div className="border-t p-3 space-y-1">
        {/* Sound Chime Toggle */}
        <button
          onClick={() => {
            const next = !soundEnabled;
            setSoundEnabled(next);
            if (next) playNewOrderChime();
          }}
          className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs text-muted-foreground hover:bg-secondary transition"
        >
          <span className="flex items-center gap-2">
            {soundEnabled ? <Volume2 className="h-4 w-4 text-teal" /> : <VolumeX className="h-4 w-4" />}
            Order Chime
          </span>
          <span className="text-[10px] font-bold uppercase">{soundEnabled ? "On" : "Mute"}</span>
        </button>

        <Link
          to="/s/$shopId"
          params={{ shopId: shop.id }}
          target="_blank"
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-teal hover:bg-teal-soft/60 transition"
        >
          <ExternalLink className="h-4 w-4" /> Customer Upload Link
        </Link>

        <button
          onClick={signOut}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-muted-foreground hover:bg-destructive-soft hover:text-destructive transition"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-secondary">
      <aside className="no-print sticky top-0 hidden h-screen w-64 shrink-0 border-r bg-background lg:block">
        {sidebar}
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 bg-navy/40 lg:hidden" onClick={() => setOpen(false)}>
          <aside className="h-full w-72 bg-background" onClick={(e) => e.stopPropagation()}>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print flex h-16 items-center justify-between border-b bg-background px-4 lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Open menu" className="p-1">
            <Menu className="h-6 w-6" />
          </button>
          <Logo to="/dashboard" />
          <span className="w-6">{open && <X />}</span>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
