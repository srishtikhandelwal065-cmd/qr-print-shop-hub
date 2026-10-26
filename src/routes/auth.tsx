import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Loader2, ArrowLeft, CheckCircle2, ShieldCheck, Sparkles, KeyRound } from "lucide-react";
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

const TEST_EMAIL = "printextest99@maxxspace.com";
const TEST_PASSWORD = "PrintexPassword123!";

function AuthPage() {
  const { redirect, mode: initialMode } = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();
  const dest = redirect ?? "/dashboard";

  const [mode, setMode] = useState<"signin" | "signup">(
    initialMode || (redirect?.includes("register") ? "signup" : "signin")
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ kind: "err" | "ok"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // If already logged in, redirect directly to destination
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data?.session?.user) {
        navigate({ to: dest, replace: true });
      }
    });
    return () => {
      active = false;
    };
  }, [dest, navigate]);

  const go = async () => {
    await router.invalidate();
    navigate({ to: dest, replace: true });
  };

  const loginWithTestCredentials = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      if (error) {
        setMsg({ kind: "err", text: error.message });
      } else {
        await router.invalidate();
        navigate({ to: "/dashboard", replace: true });
      }
    } catch (err: unknown) {
      const e = err as Error;
      setMsg({ kind: "err", text: e?.message || "Failed to sign in with test credentials." });
    } finally {
      setBusy(false);
    }
  };

  const fillTestCredentials = () => {
    setMode("signin");
    setEmail(TEST_EMAIL);
    setPassword(TEST_PASSWORD);
    setMsg({
      kind: "ok",
      text: "Test credentials filled! Click 'Sign In to Dashboard' below or press enter.",
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = creds.safeParse({ email, password });
    if (!r.success) {
      return setMsg({ kind: "err", text: r.error.issues[0]?.message ?? "Invalid credentials" });
    }

    setBusy(true);
    setMsg(null);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: r.data.email,
          password: r.data.password,
          options: {
            data: { display_name: name.trim() || undefined },
            emailRedirectTo: window.location.origin + "/auth",
          },
        });

        if (error) {
          if (error.message?.toLowerCase().includes("rate limit") || (error as { status?: number }).status === 429) {
            setMsg({
              kind: "err",
              text: "Supabase email rate limit exceeded for new signups. Use the '⚡ 1-Click Instant Login' button above to sign in immediately!",
            });
          } else {
            setMsg({ kind: "err", text: error.message });
          }
        } else if (!data.session) {
          setMsg({
            kind: "ok",
            text: "Account registered! If email confirmation is required, please check your inbox, or use the Test Login button above to access the dashboard directly.",
          });
        } else {
          await go();
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: r.data.email,
          password: r.data.password,
        });

        if (error) {
          setMsg({ kind: "err", text: error.message });
        } else {
          await router.invalidate();
          const target = dest === "/register" ? "/dashboard" : dest;
          navigate({ to: target, replace: true });
        }
      }
    } catch (err: unknown) {
      const e = err as Error;
      setMsg({ kind: "err", text: e?.message || "Authentication failed. Please check your network connection." });
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + "/auth" },
      });
      if (error) setMsg({ kind: "err", text: error.message });
    } catch {
      setMsg({ kind: "err", text: "Google sign-in could not be opened." });
    }
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
          {/* ⚡ Instant Test Login Box */}
          <div className="rounded-2xl border-2 border-teal/30 bg-teal/5 p-4 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-teal" />
                <span className="text-xs font-bold uppercase tracking-wider text-teal">Ready Test Account</span>
              </div>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">Active & Verified</span>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Skip signup hassles & rate limits — log straight into the working shop:
            </p>
            <div className="mt-2.5 space-y-1 font-mono text-xs bg-card rounded-lg p-2.5 border">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-sans">Email:</span>
                <span className="font-semibold text-foreground select-all">{TEST_EMAIL}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-sans">Password:</span>
                <span className="font-semibold text-foreground select-all">{TEST_PASSWORD}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-dashed">
                <span className="text-muted-foreground font-sans">Shop:</span>
                <span className="font-sans font-medium text-teal">Printex Test Hub</span>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={loginWithTestCredentials}
                disabled={busy}
                className="btn btn-teal text-xs py-2 w-full font-bold shadow-sm"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto" /> : "⚡ 1-Click Instant Login"}
              </button>
              <button
                type="button"
                onClick={fillTestCredentials}
                className="btn btn-outline text-xs py-2 px-3 font-semibold shrink-0"
              >
                Fill Form
              </button>
            </div>
          </div>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs text-muted-foreground"><span className="bg-card px-2">or sign in manually</span></div>
          </div>

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
