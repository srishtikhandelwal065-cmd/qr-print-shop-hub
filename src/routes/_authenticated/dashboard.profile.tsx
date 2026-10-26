import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, IndianRupee, QrCode } from "lucide-react";
import { useShop } from "@/lib/use-shop";
import { useQueryClient } from "@tanstack/react-query";
import { STATES, updateShop, type Shop } from "@/lib/shop-store";

export const Route = createFileRoute("/_authenticated/dashboard/profile")({ component: Profile });

function Profile() {
  const [shop] = useShop();
  const [form, setForm] = useState<Shop>(shop);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => setForm({ ...shop, doubleDiscount: 0 }), [shop]);

  const set = (k: keyof Shop, v: string | number | boolean) => setForm((f) => ({ ...f, [k]: v }));
  const qc = useQueryClient();

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("saving");
    try {
      await updateShop({ ...form, doubleDiscount: 0 });
      await qc.invalidateQueries({ queryKey: ["my-shop"] });
      setState("saved");
      setTimeout(() => setState("idle"), 2500);
    } catch {
      setState("error");
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-navy">Shop Profile & Printing Rates</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Configure your shop details, UPI ID for customer QR payments, and print/binding charges.
        </p>
      </div>

      <form onSubmit={save} className="card space-y-5 sm:space-y-6 p-4 sm:p-6">
        {/* Shop Info Section */}
        <div>
          <h2 className="text-sm font-bold text-navy uppercase tracking-wider mb-4 border-b pb-2">
            Basic Information
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <L label="Shop Name">
              <input className="field" value={form.name} onChange={(e) => set("name", e.target.value)} />
            </L>
            <L label="Owner Name">
              <input className="field" value={form.owner} onChange={(e) => set("owner", e.target.value)} />
            </L>
            <L label="WhatsApp Mobile Number">
              <input
                className="field"
                placeholder="10-digit number"
                value={form.whatsapp}
                onChange={(e) => set("whatsapp", e.target.value.replace(/\D/g, "").slice(0, 10))}
              />
            </L>
            <L label="State">
              <select className="field" value={form.state} onChange={(e) => set("state", e.target.value)}>
                {STATES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </L>
          </div>
          <div className="mt-4">
            <L label="Shop Address (Appears on Customer Upload page)">
              <textarea
                className="field min-h-20"
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
              />
            </L>
          </div>
        </div>

        {/* UPI Payments Section */}
        <div>
          <h2 className="text-sm font-bold text-navy uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-1.5">
            <QrCode className="h-4 w-4 text-teal" /> UPI Direct Payment Setup
          </h2>
          <L label="Your UPI ID (VPA)">
            <input
              className="field"
              placeholder="e.g. 9876543210@paytm or yourshop@okaxis"
              value={form.upiId || ""}
              onChange={(e) => set("upiId", e.target.value.trim())}
            />
          </L>
          <p className="mt-1 text-xs text-muted-foreground">
            When set, customers will see a dynamic UPI QR code with their exact order amount after uploading files.
          </p>
        </div>

        {/* Print Rates Section */}
        <div>
          <h2 className="text-sm font-bold text-navy uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-1.5">
            <IndianRupee className="h-4 w-4 text-teal" /> Print Rates (Per Page)
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <L label="Black & White (₹/page)">
              <input
                type="number"
                min={0}
                step={0.5}
                className="field"
                value={form.priceBw}
                onChange={(e) => set("priceBw", Number(e.target.value))}
              />
            </L>
            <L label="Colour (₹/page)">
              <input
                type="number"
                min={0}
                step={0.5}
                className="field"
                value={form.priceColor}
                onChange={(e) => set("priceColor", Number(e.target.value))}
              />
            </L>
          </div>
        </div>

        {/* Binding & Finishing Rates */}
        <div>
          <h2 className="text-sm font-bold text-navy uppercase tracking-wider mb-4 border-b pb-2">
            Binding & Finishing Charges
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <L label="Spiral Binding (₹)">
              <input
                type="number"
                min={0}
                step={1}
                className="field"
                value={form.priceSpiral ?? 30}
                onChange={(e) => set("priceSpiral", Number(e.target.value))}
              />
            </L>
            <L label="Corner Staple (₹)">
              <input
                type="number"
                min={0}
                step={1}
                className="field"
                value={form.priceStaple ?? 5}
                onChange={(e) => set("priceStaple", Number(e.target.value))}
              />
            </L>
            <L label="Lamination (₹/page)">
              <input
                type="number"
                min={0}
                step={1}
                className="field"
                value={form.priceLamination ?? 20}
                onChange={(e) => set("priceLamination", Number(e.target.value))}
              />
            </L>
          </div>
        </div>

        {state === "error" && (
          <p className="rounded-xl bg-destructive-soft p-3 text-xs font-semibold text-destructive">
            Couldn't update shop rates. Please verify your Supabase database connection and try again.
          </p>
        )}

        <button disabled={state === "saving"} className="btn btn-teal w-full sm:w-auto py-3 px-6 text-sm font-bold min-h-[44px]">
          {state === "saving" && <Loader2 className="h-4 w-4 animate-spin" />}
          {state === "saved" ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-white" /> Saved Changes!
            </>
          ) : (
            "Save Profile & Rates"
          )}
        </button>
      </form>
    </div>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-foreground">{label}</span>
      {children}
    </label>
  );
}
