import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Loader2, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string } => {
    const r = s["redirect"];
    return typeof r === "string" && r.startsWith("/") && !r.startsWith("//") ? { redirect: r } : {};
  },
  head: () => ({
    meta: [
      { title: "Sign in — Printex" },
      { name: "description", content: "Sign in or create your Printex shop owner account." },
      { property: "og:title", content: "Sign in — Printex" },
      { property: "og:description", content: "Shop owners sign in to manage print orders." },
    ],
  }),
  component: AuthPage,
});

const creds = z.object({ email: z.string().trim().email("Enter a valid email"), password: z.string().min(6, "At least 6 characters") });

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ kind: "err" | "ok"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const dest = redirect ?? "/dashboard";

  useEffect(() => {
    const go = () => navigate({ to: dest, replace: true });
    const token = typeof window !== "undefined" ? localStorage.getItem("printex_token") : null;
    if (token) {
      fetch("/api/auth.php?action=me", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((d) => {
          if (d?.user) go();
        })
        .catch(() => {});
    }
    supabase.auth.getUser().then(({ data }) => data.user && go());
    const { data } = supabase.auth.onAuthStateChange((e, s) => { if (e === "SIGNED_IN" && s) go(); });
    return () => data.subscription.unsubscribe();
  }, [dest, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = creds.safeParse({ email, password });
    if (!r.success) return setMsg({ kind: "err", text: r.error.issues[0]?.message ?? "Invalid" });
    setBusy(true); setMsg(null);

    const go = () => navigate({ to: dest, replace: true });

    // 1. Try Hostinger Auth API first
    try {
      const res = await fetch(`/api/auth.php?action=${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: r.data.email, password: r.data.password }),
      });
      const data = await res.json();
      if (res.ok && data?.token) {
        localStorage.setItem("printex_token", data.token);
        localStorage.setItem("printex_user", JSON.stringify(data.user));
        setBusy(false);
        go();
        return;
      }
      if (!res.ok && data?.error && !data.error.includes("Database configuration missing")) {
        setMsg({ kind: "err", text: data.error });
        setBusy(false);
        return;
      }
    } catch {
      // Hostinger API offline or unreachable, fall back to Supabase
    }

    // 2. Fall back to Supabase
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ ...r.data, options: { emailRedirectTo: window.location.origin + "/auth" } });
      if (error) setMsg({ kind: "err", text: error.message });
      else if (!data.session) setMsg({ kind: "ok", text: "Check your email to confirm your account, then sign in." });
    } else {
      const { error } = await supabase.auth.signInWithPassword(r.data);
      if (error) setMsg({ kind: "err", text: error.message });
    }
    setBusy(false);
  };

  const google = async () => {
    setMsg(null);
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (res.error) setMsg({ kind: "err", text: "Google sign-in failed. Please try again." });
  };

  return (
    <div className="min-h-screen bg-secondary">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo />
          <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back</Link>
        </div>
      </header>
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 className="text-3xl font-bold text-navy">{mode === "signin" ? "Shop owner sign in" : "Create your account"}</h1>
        <p className="mt-2 text-muted-foreground">Customers don't need an account — only shop owners.</p>
        <div className="card mt-8 space-y-4 p-6">
          <button onClick={google} className="btn btn-outline w-full py-3">Continue with Google</button>
          <div className="text-center text-xs text-muted-foreground">or use email</div>
          <form onSubmit={submit} noValidate className="space-y-4">
            <input className="field" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="field" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            {msg && <p className={`rounded-lg p-3 text-sm ${msg.kind === "err" ? "bg-destructive-soft text-destructive" : "bg-success-soft text-success"}`}>{msg.text}</p>}
            <button disabled={busy} className="btn btn-teal w-full py-3">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
          <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMsg(null); }} className="w-full text-sm font-semibold text-teal">
            {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
          </button>
        </div>
      </main>
    </div>
  );
}
