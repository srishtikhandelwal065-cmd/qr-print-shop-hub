import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Loader2, LocateFixed, ArrowLeft, CheckCircle2, Sparkles, LayoutDashboard, AlertCircle } from "lucide-react";
import { Logo } from "@/components/Logo";
import { registerShop, STATES } from "@/lib/shop-store";
import { useQueryClient } from "@tanstack/react-query";
import { useMyShop, myShopKey } from "@/lib/use-shop";

export const Route = createFileRoute("/_authenticated/register")({
  head: () => ({
    meta: [
      { title: "Register Your Print Shop — Printex" },
      { name: "description", content: "Create your Printex shop in 2 minutes and get your own QR code for customer uploads." },
      { property: "og:title", content: "Register Your Print Shop — Printex" },
      { property: "og:description", content: "Create your shop and get a unique QR code for customer file uploads." },
    ],
  }),
  component: Register,
});

const schema = z.object({
  name: z.string().trim().min(3, "Shop name must be at least 3 characters").max(80),
  owner: z.string().trim().min(2, "Enter the owner's name").max(60),
  whatsapp: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  address: z.string().trim().min(5, "Enter the shop address").max(200),
  state: z.string().min(1, "Select your state"),
  referral: z.string().trim().max(20).regex(/^[A-Za-z0-9]*$/, "Letters and numbers only").optional(),
});
type Form = z.infer<typeof schema>;

const SAMPLE_SHOP: Form = {
  name: "Sharma Xerox & Printing Hub",
  owner: "Rakesh Sharma",
  whatsapp: "9876543210",
  address: "Shop 12, FC Road, Shivajinagar",
  state: "Maharashtra",
  referral: "",
};

function Register() {
  const navigate = useNavigate();
  const router = useRouter();
  const qc = useQueryClient();
  const { data: existing, isLoading: loadingExisting } = useMyShop();
  const [form, setForm] = useState<Form>({ name: "", owner: "", whatsapp: "", address: "", state: "", referral: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");

  if (existing) {
    return (
      <div className="min-h-screen bg-secondary">
        <header className="border-b bg-background sticky top-0 z-10">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
            <Logo />
            <Link to="/dashboard" className="btn btn-teal text-xs font-bold py-2">
              <LayoutDashboard className="h-4 w-4" /> Open Shop Dashboard
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-md px-4 py-16 text-center">
          <div className="card p-8 space-y-4 shadow-sm">
            <CheckCircle2 className="mx-auto h-12 w-12 text-teal" />
            <h1 className="text-2xl font-bold text-navy">Shop Already Created!</h1>
            <p className="text-sm text-muted-foreground">
              Your shop <strong>{existing.name}</strong> is active and ready to accept customer print jobs.
            </p>
            <Link to="/dashboard" className="btn btn-teal w-full py-3 font-bold text-sm shadow-sm">
              Go to Shop Dashboard →
            </Link>
          </div>
        </main>
      </div>
    );
  }

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
      const shop = await registerShop({ ...r.data, referral: r.data.referral || undefined });
      qc.setQueryData(myShopKey, shop);
      await qc.invalidateQueries({ queryKey: myShopKey });
      setStatus("done");
      await router.invalidate();
      setTimeout(() => navigate({ to: "/dashboard", replace: true }), 600);
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
            <Link to="/dashboard" className="text-xs font-semibold text-muted-foreground hover:text-foreground hidden sm:inline-flex items-center gap-1">
              <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
            </Link>
            <Link to="/" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        {/* Title & Quick Fill Option */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-navy">Register your shop</h1>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Set up your shop details to get your counter standee QR code.
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
            <span>Shop registered successfully! Redirecting to dashboard…</span>
          </div>
        )}

        {/* Registration Form Card */}
        <form onSubmit={submit} noValidate className="card mt-6 p-5 sm:p-7 space-y-4 shadow-sm">
          {/* Row 1: Shop Name & Owner Name */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Shop Name *" error={errors.name}>
              <input
                className="field"
                placeholder="e.g. Sharma Xerox & Printing"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
              />
            </Field>

            <Field label="Owner Name *" error={errors.owner}>
              <input
                className="field"
                placeholder="e.g. Rakesh Sharma"
                value={form.owner}
                onChange={(e) => set("owner", e.target.value)}
                required
              />
            </Field>
          </div>

          {/* Row 2: WhatsApp Number & State */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="WhatsApp Number *" error={errors.whatsapp}>
              <div className="flex">
                <span className="grid place-items-center rounded-l-[var(--radius)] border border-r-0 bg-secondary px-3 text-sm text-muted-foreground font-medium">
                  +91
                </span>
                <input
                  className="field rounded-l-none"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="9876543210"
                  value={form.whatsapp}
                  onChange={(e) => set("whatsapp", e.target.value.replace(/\D/g, ""))}
                  required
                />
              </div>
            </Field>

            <Field label="State *" error={errors.state}>
              <select
                className="field"
                value={form.state}
                onChange={(e) => set("state", e.target.value)}
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

          {/* Row 3: Shop Address */}
          <Field label="Shop Address *" error={errors.address || locError}>
            <textarea
              className="field min-h-16 resize-y"
              rows={2}
              placeholder="Shop number, building, market, street, city"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
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

          {/* Row 4: Referral Code */}
          <div>
            <Field label="Referral Code (Optional)" error={errors.referral}>
              <input
                className="field uppercase"
                placeholder="e.g. PRX2026"
                value={form.referral}
                onChange={(e) => set("referral", e.target.value)}
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
                  <Loader2 className="h-4 w-4 animate-spin" /> Creating your shop…
                </span>
              ) : (
                "Create Shop & Open Dashboard →"
              )}
            </button>
          </div>
        </form>
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
