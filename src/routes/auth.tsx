import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import {
  Loader2, ArrowLeft, CheckCircle2, ShieldCheck, Store, LogIn,
  AlertCircle, KeyRound, Mail, X, Send
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { PasswordInput } from "@/components/PasswordInput";
import { supabase } from "@/integrations/supabase/client";
import { getMyShop, DEMO_SHOP } from "@/lib/shop-store";
import { useQueryClient } from "@tanstack/react-query";
import { myShopKey } from "@/lib/use-shop";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string; mode?: "signin" | "signup" | "reset"; email?: string } => {
    const r = s["redirect"];
    const m = s["mode"];
    const e = s["email"];
    const validMode = m === "signup" || m === "signin" || m === "reset" ? m : undefined;
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

  // Login form state
  const [email, setEmail] = useState(searchEmail || "");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ kind: "err" | "ok"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // Forgot password modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetBusy, setResetBusy] = useState(false);
  const [resetMsg, setResetMsg] = useState<{ kind: "err" | "ok"; text: string } | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  // New password setting state (when user opens recovery link from email)
  const [isRecoverySession, setIsRecoverySession] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPasswordBusy, setNewPasswordBusy] = useState(false);
  const [newPasswordMsg, setNewPasswordMsg] = useState<{ kind: "err" | "ok"; text: string } | null>(null);

  // If redirected with mode=signup, redirect to /register
  useEffect(() => {
    if (mode === "signup") {
      navigate({ to: "/register", replace: true });
    }
  }, [mode, navigate]);

  // Detect recovery session from URL hash or Supabase event
  useEffect(() => {
    const hash = window.location.hash || "";
    if (hash.includes("type=recovery") || mode === "reset") {
      setIsRecoverySession(true);
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecoverySession(true);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [mode]);

  // Smart Redirection: If already logged in, redirect straight to dashboard (except in recovery mode)
  useEffect(() => {
    let active = true;
    const checkAuth = async () => {
      if (isRecoverySession || window.location.hash.includes("type=recovery") || mode === "reset") {
        return;
      }
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
  }, [dest, navigate, isRecoverySession, mode]);

  // Handle standard login
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
          setMsg({ kind: "err", text: "Incorrect email or password. Please verify your credentials or click 'Forgot password?'." });
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
      if (!shop || !shop.id || shop.id === "printex-test-hub") {
        navigate({ to: "/register", replace: true });
      } else {
        navigate({ to: dest, replace: true });
      }
    } catch (err: unknown) {
      const e = err as Error;
      setMsg({ kind: "err", text: e?.message || "Sign in failed. Please check network connection." });
    } finally {
      setBusy(false);
    }
  };

  // Handle sending recovery email
  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = resetEmail.trim();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setResetMsg({ kind: "err", text: "Please enter a valid email address." });
      return;
    }

    setResetBusy(true);
    setResetMsg(null);

    try {
      const redirectUrl = `${window.location.origin}/auth?mode=reset`;
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirectUrl,
      });

      if (error) {
        const lower = error.message.toLowerCase();
        if (error.status === 429 || lower.includes("rate limit")) {
          setResetMsg({
            kind: "err",
            text: "Email rate limit exceeded. Please wait a few minutes before requesting another reset email.",
          });
        } else {
          setResetMsg({ kind: "err", text: error.message });
        }
      } else {
        setResetSuccess(true);
        setResetMsg({
          kind: "ok",
          text: `Password recovery link sent to ${cleanEmail}! Please check your inbox (and spam folder) and click the link to reset your password.`,
        });
      }
    } catch (err: unknown) {
      setResetMsg({ kind: "err", text: (err as Error)?.message || "Failed to send reset link." });
    } finally {
      setResetBusy(false);
    }
  };

  // Handle setting new password after clicking email recovery link
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setNewPasswordMsg({ kind: "err", text: "Password must be at least 6 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setNewPasswordMsg({ kind: "err", text: "Passwords do not match. Please re-enter." });
      return;
    }

    setNewPasswordBusy(true);
    setNewPasswordMsg(null);

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setNewPasswordMsg({ kind: "err", text: error.message });
        return;
      }

      setNewPasswordMsg({
        kind: "ok",
        text: "Password updated successfully! Signing you in…",
      });

      if (data?.user) {
        const localUser = {
          id: data.user.id,
          email: data.user.email,
          displayName: data.user.user_metadata?.display_name || "Shop Owner",
        };
        localStorage.setItem("printex_user", JSON.stringify(localUser));
      }

      // Clear recovery hash from URL
      if (window.history.replaceState) {
        window.history.replaceState(null, "", window.location.pathname);
      }

      await qc.invalidateQueries({ queryKey: myShopKey });
      await router.invalidate();
      setTimeout(() => navigate({ to: "/dashboard", replace: true }), 1200);
    } catch (err: unknown) {
      setNewPasswordMsg({
        kind: "err",
        text: (err as Error)?.message || "Failed to update password. Please request a new reset link.",
      });
    } finally {
      setNewPasswordBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary">
      <header className="border-b bg-background sticky top-0 z-20">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Logo />
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-8 sm:py-14">
        {/* VIEW 1: Set New Password Mode (When user arrives from recovery email) */}
        {isRecoverySession ? (
          <div>
            <div className="text-center">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-soft text-teal shadow-xs">
                <KeyRound className="h-6 w-6" />
              </span>
              <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold text-navy">
                Set New Password
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                Enter your new password below to regain access to your shop.
              </p>
            </div>

            <div className="card mt-5 sm:mt-6 space-y-4 p-5 sm:p-8 shadow-sm">
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label htmlFor="new-password" className="mb-1 block text-xs font-bold text-navy uppercase tracking-wider">
                    New Password *
                  </label>
                  <PasswordInput
                    id="new-password"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="confirm-password" className="mb-1 block text-xs font-bold text-navy uppercase tracking-wider">
                    Confirm New Password *
                  </label>
                  <PasswordInput
                    id="confirm-password"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>

                {newPasswordMsg && (
                  <div
                    className={`flex items-start gap-2 rounded-xl p-3 text-sm font-medium ${
                      newPasswordMsg.kind === "err"
                        ? "bg-destructive/10 text-destructive border border-destructive/20"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    {newPasswordMsg.kind === "err" ? (
                      <AlertCircle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
                    )}
                    <span>{newPasswordMsg.text}</span>
                  </div>
                )}

                <button
                  disabled={newPasswordBusy}
                  type="submit"
                  className="btn btn-teal w-full py-3 font-bold text-sm shadow-sm"
                >
                  {newPasswordBusy ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Updating Password…
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <KeyRound className="h-4 w-4" /> Save New Password & Sign In
                    </span>
                  )}
                </button>
              </form>

              <div className="border-t pt-4 text-center">
                <button
                  type="button"
                  onClick={() => setIsRecoverySession(false)}
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  ← Back to standard Sign In
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* VIEW 2: Standard Sign In */
          <div>
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-soft px-3 py-1 text-xs font-bold text-teal">
                <ShieldCheck className="h-3.5 w-3.5" /> Printex Shopkeeper Portal
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
                  <div className="mb-1 flex items-center justify-between">
                    <label htmlFor="owner-password" className="block text-xs font-bold text-navy uppercase tracking-wider">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowResetModal(true);
                        setResetEmail(email);
                        setResetMsg(null);
                        setResetSuccess(false);
                      }}
                      className="text-xs font-semibold text-teal hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <PasswordInput
                    id="owner-password"
                    name="printex_owner_password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
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
          </div>
        )}

        {/* FORGOT PASSWORD MODAL */}
        {showResetModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 p-4 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setShowResetModal(false)}
          >
            <div
              className="card w-full max-w-md p-5 sm:p-7 shadow-2xl bg-card border"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-teal-soft text-teal">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="font-bold text-navy text-base">Reset Password</h2>
                    <p className="text-[11px] text-muted-foreground">Get a secure recovery link via email</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {resetSuccess ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
                    <div className="text-xs leading-relaxed">
                      <p className="font-bold text-emerald-900 mb-1">Recovery Link Sent!</p>
                      <p>
                        We have sent a password reset link to <strong className="underline">{resetEmail}</strong>.
                      </p>
                      <p className="mt-2 text-emerald-700">
                        Please check your inbox (and spam folder) and click the link to choose your new password.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="btn btn-teal w-full py-2.5 font-bold text-xs"
                  >
                    Done / Back to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSendResetEmail} className="space-y-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Enter the email address registered with your print shop account. We'll send you a password recovery link.
                  </p>

                  <div>
                    <label htmlFor="reset-email-input" className="mb-1 block text-xs font-bold text-navy uppercase tracking-wider">
                      Account Email Address
                    </label>
                    <input
                      id="reset-email-input"
                      type="email"
                      inputMode="email"
                      className="field"
                      placeholder="e.g. yourshop@gmail.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>

                  {resetMsg && (
                    <div
                      className={`flex items-start gap-2 rounded-xl p-3 text-xs font-medium ${
                        resetMsg.kind === "err"
                          ? "bg-destructive/10 text-destructive border border-destructive/20"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {resetMsg.kind === "err" ? (
                        <AlertCircle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                      )}
                      <span>{resetMsg.text}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowResetModal(false)}
                      className="btn btn-secondary px-4 py-2.5 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={resetBusy}
                      className="btn btn-teal px-5 py-2.5 text-xs font-bold shadow-xs inline-flex items-center gap-1.5"
                    >
                      {resetBusy ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending…
                        </>
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5" /> Send Reset Link
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
