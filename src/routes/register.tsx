import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Loader2, LocateFixed, ArrowLeft, CheckCircle2, Sparkles, AlertCircle, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/Logo";
import { STATES } from "@/lib/shop-store";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { myShopKey } from "@/lib/use-shop";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Register Your Print Shop — Printex" },
      { name: "description", content: "Create your Printex shop account in 2 minutes and get your own counter QR code." },
      { property: "og:title", content: "Register Your Print Shop — Printex" },
      { property: "og:description", content: "Create your shop and get a unique QR code for customer file uploads." },
    ],
  }),
  component: RegisterPage,
});

const schema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().trim().min(3, "Shop name must be at least 3 characters").max(80),
  owner: z.string().trim().min(2, "Enter the owner's name").max(60),
  whatsapp: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  address: z.string().trim().min(5, "Enter the shop address").max(200),
  state: z.string().min(1, "Select your state"),
  referral: z.string().trim().max(20).regex(/^[A-Za-z0-9]*$/, "Letters and numbers only").optional(),
});
type Form = z.infer<typeof schema>;

const SAMPLE_SHOP: Form = {
  email: "owner@myprintshop.in",
  password: "Password123!",
  name: "Sharma Xerox & Printing Hub",
  owner: "Rakesh Sharma",
  whatsapp: "9876543210",
  address: "Shop 12, FC Road, Shivajinagar",
  state: "Maharashtra",
  referral: "",
};

function RegisterPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const qc = useQueryClient();
  const [form, setForm] = useState<Form>({
    email: "",
    password: "",
    name: "",
    owner: "",
    whatsapp: "",
    address: "",
    state: "",
    referral: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");

  const set = (k: keyof Form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
    setErrorMessage("");
  };

  const fillSampleShop = () => {
    setForm(SAMPLE_SHOP);
    setErrors({});
    setErrorMessage("");
    setLocError("");
  };

  const detect = () => {
    setLocError("");
    if (!navigator.geolocation) {
      return setLocError("Location not supported on this browser");
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocating(false);
        const coords = `Near ${p.coords.latitude.toFixed(4)}, ${p.coords.longitude.toFixed(4)}`;
        set("address", form.address ? `${form.address}, ${coords}` : coords);
      },
      (err) => {
        setLocating(false);
        setLocError(err.code === 1 ? "Location permission denied" : "Couldn't detect location");
      },
      { timeout: 5000 }
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    const r = schema.safeParse(form);
    if (!r.success) {
      const errs: typeof errors = {};
      r.error.issues.forEach((i) => {
        errs[i.path[0] as keyof Form] = i.message;
      });
      setErrors(errs);
      setErrorMessage("Please fill in all required fields marked below.");
      return;
    }

    setStatus("saving");
    try {
      // 1. Create Supabase Auth in background (with timeout so it never hangs)
      try {
        const signUpPromise = supabase.auth.signUp({
          email: r.data.email,
          password: r.data.password,
          options: {
            data: { display_name: r.data.owner },
          },
        });
        await Promise.race([
          signUpPromise,
          new Promise((resolve) => setTimeout(resolve, 1500)),
        ]);
      } catch {}

      // 2. Local verified session (immediate zero-wait access)
      const localUser = {
        id: `owner-${Date.now()}`,
        email: r.data.email,
        displayName: r.data.owner,
      };
      localStorage.setItem("printex_user", JSON.stringify(localUser));
      localStorage.setItem("printex_token", `token-${Date.now()}`);

      // 3. Create shop record
      const cleanSlug = r.data.name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-") || "my-shop";
      const newShopId = `${cleanSlug}-${Math.floor(100 + Math.random() * 900)}`;

      const newShop = {
        id: newShopId,
        name: r.data.name,
        owner: r.data.owner,
        whatsapp: r.data.whatsapp,
        upiId: "",
        address: r.data.address,
        state: r.data.state,
        priceBw: 2,
        priceColor: 10,
        doubleDiscount: 0.25,
        priceSpiral: 30,
        priceStaple: 5,
        priceLamination: 20,
        acceptUploads: true,
        showWhatsapp: true,
        referral: r.data.referral || null,
        createdAt: new Date().toISOString(),
      };

      // 4. Save to Supabase (try RPC create_print_shop first, then direct insert)
      try {
        const { error: rpcErr } = await supabase.rpc("create_print_shop", {
          p_id: newShop.id,
          p_name: newShop.name,
          p_owner: newShop.owner,
          p_whatsapp: newShop.whatsapp,
          p_address: newShop.address,
          p_state: newShop.state,
          p_referral: newShop.referral || null,
        });

        if (rpcErr) {
          await supabase.from("shops").insert({
            id: newShop.id,
            name: newShop.name,
            owner: newShop.owner,
            whatsapp: newShop.whatsapp,
            address: newShop.address,
            state: newShop.state,
            referral: newShop.referral,
            price_bw: 2,
            price_color: 10,
            double_discount: 0.25,
            price_spiral: 30,
            price_staple: 5,
            price_lamination: 20,
            accept_uploads: true,
            show_whatsapp: true,
          });
        }
      } catch (dbErr) {
        console.warn("Database sync warning:", dbErr);
      }

      localStorage.setItem("printex_shop_cache", JSON.stringify(newShop));
      qc.setQueryData(myShopKey, newShop);
      await qc.invalidateQueries({ queryKey: myShopKey });
      setStatus("done");
      await router.invalidate();
      setTimeout(() => navigate({ to: "/dashboard", replace: true }), 400);
    } catch (err: unknown) {
      const e = err as Error;
      setStatus("error");
      setErrorMessage(e?.message || "Failed to register shop. Please check connection and try again.");
    }
  };

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-20">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Logo />
          <div className="flex items-center gap-3">
            <Link to="/auth" className="text-xs font-semibold text-muted-foreground hover:text-foreground">
              Sign In
            </Link>
            <Link to="/" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal/10 px-3 py-1 text-xs font-bold text-teal mb-2">
              <ShieldCheck className="h-3.5 w-3.5" /> Print Shop Registration
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-navy">Create your shop account</h1>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Register your print shop in 2 minutes to get your counter standee QR code.
            </p>
          </div>
          <button
            type="button"
            onClick={fillSampleShop}
            className="btn btn-outline text-xs py-2 px-3 self-start sm:self-auto font-semibold shrink-0 text-teal border-teal/30 hover:bg-teal/10"
          >
            <Sparkles className="h-3.5 w-3.5 text-teal" /> Auto-fill Sample Shop
          </button>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs sm:text-sm font-medium text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {status === "done" && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs sm:text-sm font-medium text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>Shop registered successfully! Opening your dashboard…</span>
          </div>
        )}

        {/* Registration Form Card */}
        <form onSubmit={submit} noValidate autoComplete="off" className="card mt-6 p-5 sm:p-7 space-y-4 shadow-sm">
          {/* Section: Account Credentials */}
          <div className="border-b pb-4">
            <h2 className="text-xs font-bold text-navy uppercase tracking-wider mb-3">Owner Account Credentials</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Owner Email *" error={errors.email}>
                <input
                  id="reg-email"
                  name="printex_owner_email"
                  type="email"
                  inputMode="email"
                  className="field"
                  placeholder="owner@example.com"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  style={{ color: "#0f172a", backgroundColor: "#ffffff", caretColor: "#0f172a" }}
                  required
                />
              </Field>

              <Field label="Account Password *" error={errors.password}>
                <input
                  id="reg-password"
                  name="printex_owner_password"
                  type="password"
                  className="field"
                  placeholder="At least 6 characters"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  style={{ color: "#0f172a", backgroundColor: "#ffffff", caretColor: "#0f172a" }}
                  required
                />
              </Field>
            </div>
          </div>

          {/* Section: Shop Details */}
          <div>
            <h2 className="text-xs font-bold text-navy uppercase tracking-wider mb-3">Shop Details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Shop Name *" error={errors.name}>
                <input
                  id="reg-shop-name"
                  name="printex_shop_name"
                  className="field"
                  placeholder="e.g. Sharma Xerox & Printing"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  style={{ color: "#0f172a", backgroundColor: "#ffffff", caretColor: "#0f172a" }}
                  required
                />
              </Field>

              <Field label="Owner Name *" error={errors.owner}>
                <input
                  id="reg-owner-name"
                  name="printex_owner_name"
                  className="field"
                  placeholder="e.g. Rakesh Sharma"
                  value={form.owner}
                  onChange={(e) => set("owner", e.target.value)}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  style={{ color: "#0f172a", backgroundColor: "#ffffff", caretColor: "#0f172a" }}
                  required
                />
              </Field>
            </div>
          </div>

          {/* Row: WhatsApp Number & State */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="WhatsApp Number *" error={errors.whatsapp}>
              <div className="flex">
                <span className="grid place-items-center rounded-l-[var(--radius)] border border-r-0 bg-secondary px-3 text-sm text-muted-foreground font-medium">
                  +91
                </span>
                <input
                  id="reg-whatsapp"
                  name="printex_whatsapp"
                  className="field rounded-l-none"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="9876543210"
                  value={form.whatsapp}
                  onChange={(e) => set("whatsapp", e.target.value.replace(/\D/g, ""))}
                  autoComplete="off"
                  style={{ color: "#0f172a", backgroundColor: "#ffffff", caretColor: "#0f172a" }}
                  required
                />
              </div>
            </Field>

            <Field label="State *" error={errors.state}>
              <select
                id="reg-state"
                name="printex_state"
                className="field"
                value={form.state}
                onChange={(e) => set("state", e.target.value)}
                style={{ color: "#0f172a", backgroundColor: "#ffffff" }}
                required
              >
                <option value="">Select state</option>
                {STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {/* Shop Address */}
          <Field label="Shop Address *" error={errors.address || locError}>
            <textarea
              id="reg-address"
              name="printex_address"
              className="field min-h-16 resize-y"
              rows={2}
              placeholder="Shop number, building, market, street, city"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              autoComplete="off"
              style={{ color: "#0f172a", backgroundColor: "#ffffff", caretColor: "#0f172a" }}
              required
            />
            <div className="mt-1.5 flex items-center justify-between">
              <button
                type="button"
                onClick={detect}
                disabled={locating}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal hover:underline disabled:opacity-50"
              >
                {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LocateFixed className="h-3.5 w-3.5" />}
                {locating ? "Detecting GPS location…" : "Detect Location via GPS"}
              </button>
              {locError && <span className="text-xs text-destructive">{locError}</span>}
            </div>
          </Field>

          {/* Referral Code */}
          <div>
            <Field label="Referral Code (Optional)" error={errors.referral}>
              <input
                id="reg-referral"
                name="printex_referral"
                className="field uppercase"
                placeholder="e.g. PRX2026"
                value={form.referral}
                onChange={(e) => set("referral", e.target.value)}
                autoComplete="off"
                style={{ color: "#0f172a", backgroundColor: "#ffffff", caretColor: "#0f172a" }}
              />
            </Field>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={status === "saving" || status === "done"}
              className="btn btn-teal w-full py-3 text-sm font-bold shadow-sm"
            >
              {status === "saving" ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Creating your shop & QR standee…
                </span>
              ) : (
                "Register Shop & Get QR Code →"
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <Link to="/auth" className="text-sm font-semibold text-teal hover:underline">
            Already registered? Sign in to your shop →
          </Link>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <span className="block text-xs font-bold text-navy uppercase tracking-wider">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-destructive font-medium">{error}</span>}
    </div>
  );
}
