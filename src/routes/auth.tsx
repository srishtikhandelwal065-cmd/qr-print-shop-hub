import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Loader2, ArrowLeft, CheckCircle2, ShieldCheck, Store, LogIn, AlertCircle } from "lucide-react";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { getMyShop, DEMO_SHOP } from "@/lib/shop-store";
import { useQueryClient } from "@tanstack/react-query";
import { myShopKey } from "@/lib/use-shop";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string; mode?: "signin" | "signup"; email?: string } => {
    const r = s["redirect"];
    const m = s["mode"];
    const e = s["email"];
    const validMode = m === "signup" || m === "signin" ? m : undefined;
    const redirect = typeof r === "string" && r.startsWith("/") && !r.startsWith("//") ? r : undefined;
    const email = typeof e === "string" ? e : undefined;
    return { redirect, mode: validMode, email };
  },
  head: () => ({
    meta: [
      { title: "Sign In — Printex" },
      { name: "description", content: "Sign in to your Printex shop owner account." },
      { property: "og:title", content: "Sign In — Printex" },
      { property: "og:description", content: "Shop owners sign in to manage print orders." },
    ],
  }),
  component: AuthPage,
});

const creds = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

function AuthPage() {
  const { redirect, mode, email: searchEmail } = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();
  const qc = useQueryClient();
  const dest = redirect ?? "/dashboard";

  const [email, setEmail] = useState(searchEmail || "");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ kind: "err" | "ok"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // If redirected with mode=signup, redirect to /register
  useEffect(() => {
    if (mode === "signup") {
      navigate({ to: "/register", replace: true });
    }
  }, [mode, navigate]);

  // Smart Redirection: If already logged in, redirect straight to dashboard
  useEffect(() => {
    let active = true;
    const checkAuth = async () => {
      try {
        const { data: s } = await supabase.auth.getSession();
        if (s?.session?.user) {
          const shop = await getMyShop();
          if (active && shop?.id && shop.id !== "printex-test-hub") {
            navigate({ to: dest, replace: true });
          }
        }
      } catch {}
    };
    checkAuth();
    return () => {
      active = false;
    };
  }, [dest, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = creds.safeParse({ email, password });
    if (!r.success) {
      return setMsg({ kind: "err", text: r.error.issues[0]?.message ?? "Invalid credentials" });
    }

    setBusy(true);
    setMsg(null);

    try {
      // 0. Test / Demo account credentials for instant verification
      if (
        (r.data.email === "demo@printex.in" || r.data.email === "test@printex.in") &&
        (r.data.password === "Password123!" || r.data.password === "Printex2026!")
      ) {
        const localUser = {
          id: "demo-owner-id",
          email: r.data.email,
          displayName: "Rakesh Sharma",
        };
        localStorage.setItem("printex_user", JSON.stringify(localUser));
        localStorage.setItem("printex_token", `token-demo-${Date.now()}`);
        localStorage.setItem("printex_shop_cache", JSON.stringify(DEMO_SHOP));
        qc.setQueryData(myShopKey, DEMO_SHOP);
        await router.invalidate();
        navigate({ to: dest, replace: true });
        return;
      }

      // 1. Authenticate with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: r.data.email,
        password: r.data.password,
      });

      if (error) {
        const lower = error.message.toLowerCase();
        if (lower.includes("invalid login credentials") || lower.includes("invalid_credentials")) {
          setMsg({ kind: "err", text: "Incorrect email or password. Please verify your credentials." });
        } else if (lower.includes("email not confirmed")) {
          setMsg({ kind: "err", text: "Email not confirmed. Please check your inbox or sign up again." });
        } else {
          setMsg({ kind: "err", text: error.message });
        }
        return;
      }

      if (!data.session?.user) {
        setMsg({ kind: "err", text: "Unable to establish session. Please try again." });
        return;
      }

      // 2. Set verified session tokens in localStorage
      const user = data.session.user;
      const localUser = {
        id: user.id,
        email: user.email || r.data.email,
        displayName: user.user_metadata?.display_name || user.email?.split("@")[0] || "Shop Owner",
      };
      localStorage.setItem("printex_user", JSON.stringify(localUser));
      localStorage.setItem("printex_token", data.session.access_token);

      // 3. Load shop for this authenticated owner
      const shop = await getMyShop();
      if (shop) {
        localStorage.setItem("printex_shop_cache", JSON.stringify(shop));
        qc.setQueryData(myShopKey, shop);
        await qc.invalidateQueries({ queryKey: myShopKey });
      }

      await router.invalidate();

      // If user registered but has no shop, direct them to complete registration
      if (!shop) {
        navigate({ to: "/register", replace: true });
      } else {
        navigate({ to: dest, replace: true });
      }
    } catch (err: unknown) {
      const e = err as Error;
      setMsg({ kind: "err", text: e?.message || "Sign in failed. Please try again." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary">
      <header className="border-b bg-background sticky top-0 z-10">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo />
          <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-md px-3.5 sm:px-4 py-8 sm:py-12">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-teal/10 px-3 py-1 text-xs font-bold text-teal">
            <ShieldCheck className="h-3.5 w-3.5" /> For Print Shop Owners
          </span>
          <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold text-navy">
            Shop Owner Sign In
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
            Sign in to access your live counter orders and poster standee.
          </p>
        </div>

        <div className="card mt-5 sm:mt-6 space-y-4 p-5 sm:p-8 shadow-sm">
          <form onSubmit={submit} noValidate autoComplete="off" className="space-y-4">
            <div>
              <label htmlFor="owner-email" className="mb-1 block text-xs font-bold text-navy uppercase tracking-wider">
                Email Address
              </label>
              <input
                id="owner-email"
                name="printex_owner_email"
                className="field"
                type="email"
                inputMode="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                style={{ color: "#0f172a", backgroundColor: "#ffffff", caretColor: "#0f172a" }}
                required
              />
            </div>

            <div>
              <label htmlFor="owner-password" className="mb-1 block text-xs font-bold text-navy uppercase tracking-wider">
                Password
              </label>
              <input
                id="owner-password"
                name="printex_owner_password"
                className="field"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                style={{ color: "#0f172a", backgroundColor: "#ffffff", caretColor: "#0f172a" }}
                required
              />
            </div>

            {msg && (
              <div
                className={`flex items-start gap-2 rounded-xl p-3 text-sm font-medium ${
                  msg.kind === "err"
                    ? "bg-destructive/10 text-destructive border border-destructive/20"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                {msg.kind === "err" ? (
                  <AlertCircle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
                )}
                <span>{msg.text}</span>
              </div>
            )}

            <button disabled={busy} type="submit" className="btn btn-teal w-full py-3 font-bold text-sm shadow-sm">
              {busy ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing In…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <LogIn className="h-4 w-4" /> Sign In to Dashboard
                </span>
              )}
            </button>
          </form>

          <div className="border-t pt-4 text-center">
            <Link
              to="/register"
              className="text-sm font-semibold text-teal hover:underline flex items-center justify-center gap-1.5"
            >
              <Store className="h-4 w-4" /> Don't have a shop account? Register here →
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Customers uploading documents do not need an account.
        </p>
      </main>
    </div>
  );
}
