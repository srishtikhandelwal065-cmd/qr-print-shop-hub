import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Loader2, ArrowLeft, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string; mode?: "signin" | "signup" } => {
    const r = s["redirect"];
    const m = s["mode"];
    const validMode = m === "signup" || m === "signin" ? m : undefined;
    const redirect = typeof r === "string" && r.startsWith("/") && !r.startsWith("//") ? r : undefined;
    return { redirect, mode: validMode };
  },
  head: () => ({
    meta: [
      { title: "Sign In / Register — Printex" },
      { name: "description", content: "Sign in or create your Printex shop owner account." },
      { property: "og:title", content: "Sign In / Register — Printex" },
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
  const { redirect, mode: initialMode } = Route.useSearch();
  const navigate = useNavigate();
  const dest = redirect ?? "/dashboard";

  // Default to signup if came from Get Started / register
  const [mode, setMode] = useState<"signin" | "signup">(
    initialMode || (redirect?.includes("register") ? "signup" : "signin")
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ kind: "err" | "ok"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);



  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = creds.safeParse({ email, password });
    if (!r.success) {
      return setMsg({ kind: "err", text: r.error.issues[0]?.message ?? "Invalid credentials" });
    }

    setBusy(true);
    setMsg(null);
    const go = () => navigate({ to: dest, replace: true });

    // 1. Authenticate via Hostinger PHP/SQLite backend
    try {
      const res = await fetch(`/api/auth.php?action=${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: r.data.email,
          password: r.data.password,
          display_name: name.trim() || undefined,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.token) {
        localStorage.setItem("printex_token", data.token);
        if (data.user) {
          localStorage.setItem("printex_user", JSON.stringify(data.user));
        }
        setMsg({ kind: "ok", text: mode === "signup" ? "Account created! Opening shop setup…" : "Signed in successfully!" });
        setBusy(false);
        setTimeout(go, 300);
        return;
      }

      if (data?.error) {
        setMsg({ kind: "err", text: data.error });
        setBusy(false);
        return;
      }
    } catch (err) {
      console.warn("Hostinger auth check failed, checking Supabase fallback...", err);
    }

    // 2. Supabase fallback
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        ...r.data,
        options: { emailRedirectTo: window.location.origin + "/auth" },
      });
      if (error) {
        setMsg({ kind: "err", text: error.message });
      } else if (!data.session) {
        setMsg({ kind: "ok", text: "Confirmation link sent to your email. Please check your inbox to sign in." });
      } else {
        go();
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword(r.data);
      if (error) {
        setMsg({ kind: "err", text: error.message });
      } else {
        go();
      }
    }
    setBusy(false);
  };

  return (
    <div className="min-h-screen bg-secondary">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo />
          <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-12">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-teal/10 px-3 py-1 text-xs font-bold text-teal">
            <ShieldCheck className="h-3.5 w-3.5" /> For Print Shop Owners Only
          </span>
          <h1 className="mt-3 text-3xl font-extrabold text-navy">
            {mode === "signin" ? "Shop Owner Sign In" : "Create Your Shop Account"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Sign in to view your live orders and counter standee."
              : "Get your counter QR code and dashboard in under 2 minutes."}
          </p>
        </div>

        <div className="card mt-6 space-y-4 p-6 md:p-8">
          <form onSubmit={submit} noValidate className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="mb-1 block text-xs font-bold text-navy uppercase tracking-wider">
                  Owner / Shop Name
                </label>
                <input
                  className="field"
                  type="text"
                  placeholder="e.g. Rakesh Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-bold text-navy uppercase tracking-wider">
                Email Address
              </label>
              <input
                className="field"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-navy uppercase tracking-wider">
                Password
              </label>
              <input
                className="field"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                {msg.kind === "ok" && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />}
                <span>{msg.text}</span>
              </div>
            )}

            <button disabled={busy} type="submit" className="btn btn-teal w-full py-3 font-bold text-sm shadow-sm">
              {busy ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {mode === "signin" ? "Signing In…" : "Creating Account…"}
                </span>
              ) : mode === "signin" ? (
                "Sign In to Dashboard"
              ) : (
                "Create Account & Get Started"
              )}
            </button>
          </form>

          <div className="border-t pt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setMsg(null);
              }}
              className="text-sm font-semibold text-teal hover:underline"
            >
              {mode === "signin"
                ? "Don't have a shop account? Create one here →"
                : "Already registered? Sign in to your shop →"}
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Customers uploading documents do not need an account.
        </p>
      </main>
    </div>
  );
}
