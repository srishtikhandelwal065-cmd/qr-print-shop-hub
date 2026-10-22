import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Loader2, LocateFixed, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { registerShop, STATES } from "@/lib/shop-store";

export const Route = createFileRoute("/register")({
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
  address: z.string().trim().min(8, "Enter the full shop address").max(200),
  state: z.string().min(1, "Select your state"),
  referral: z.string().trim().max(20).regex(/^[A-Za-z0-9]*$/, "Letters and numbers only").optional(),
});
type Form = z.infer<typeof schema>;

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState<Form>({ name: "", owner: "", whatsapp: "", address: "", state: "", referral: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");

  const set = (k: keyof Form, v: string) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };

  const detect = () => {
    setLocError("");
    if (!navigator.geolocation) return setLocError("Location not supported on this device");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocating(false);
        set("address", `${form.address ? form.address + ", " : ""}Near ${p.coords.latitude.toFixed(4)}, ${p.coords.longitude.toFixed(4)}`);
      },
      () => { setLocating(false); setLocError("Couldn't get location. Please type the address."); },
      { timeout: 8000 },
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse(form);
    if (!r.success) {
      const errs: typeof errors = {};
      r.error.issues.forEach((i) => { errs[i.path[0] as keyof Form] = i.message; });
      return setErrors(errs);
    }
    setStatus("saving");
    try {
      await registerShop({ ...r.data, referral: r.data.referral || undefined });
      setStatus("done");
      setTimeout(() => navigate({ to: "/dashboard" }), 900);
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-secondary">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo />
          <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back</Link>
        </div>
      </header>
      <main className="mx-auto max-w-xl px-4 py-12">
        <h1 className="text-3xl font-bold text-navy">Register your shop</h1>
        <p className="mt-2 text-muted-foreground">Get your unique QR code and dashboard in under 2 minutes.</p>

        <form onSubmit={submit} noValidate className="card mt-8 space-y-5 p-6 md:p-8">
          <Field label="Shop Name" error={errors.name}>
            <input className="field" placeholder="e.g. Sharma Xerox & Printing" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="Owner Name" error={errors.owner}>
            <input className="field" placeholder="Full name" value={form.owner} onChange={(e) => set("owner", e.target.value)} />
          </Field>
          <Field label="WhatsApp Number" error={errors.whatsapp}>
            <div className="flex">
              <span className="grid place-items-center rounded-l-[var(--radius)] border border-r-0 bg-secondary px-3 text-sm text-muted-foreground">+91</span>
              <input className="field rounded-l-none" inputMode="numeric" maxLength={10} placeholder="9876543210" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value.replace(/\D/g, ""))} />
            </div>
          </Field>
          <Field label="Shop Address" error={errors.address || locError}>
            <textarea className="field min-h-20" placeholder="Shop no., street, area, city" value={form.address} onChange={(e) => set("address", e.target.value)} />
            <button type="button" onClick={detect} disabled={locating} className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-teal">
              {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />} {locating ? "Detecting…" : "Detect Location"}
            </button>
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="State" error={errors.state}>
              <select className="field" value={form.state} onChange={(e) => set("state", e.target.value)}>
                <option value="">Select state</option>
                {STATES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Referral Code (optional)" error={errors.referral}>
              <input className="field uppercase" placeholder="PRX2026" value={form.referral} onChange={(e) => set("referral", e.target.value)} />
            </Field>
          </div>

          {status === "error" && <p className="rounded-lg bg-destructive-soft p-3 text-sm text-destructive">Something went wrong. Please try again.</p>}
          {status === "done" && <p className="flex items-center gap-2 rounded-lg bg-success-soft p-3 text-sm text-success"><CheckCircle2 className="h-4 w-4" /> Shop created! Opening your dashboard…</p>}

          <button type="submit" disabled={status === "saving" || status === "done"} className="btn btn-teal w-full py-3">
            {status === "saving" && <Loader2 className="h-4 w-4 animate-spin" />}
            {status === "saving" ? "Creating your shop…" : "Create Shop & Open Dashboard"}
          </button>
        </form>
      </main>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}
