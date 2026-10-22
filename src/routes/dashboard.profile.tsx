import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useShop } from "./dashboard";
import { STATES, updateShop, type Shop } from "@/lib/shop-store";

export const Route = createFileRoute("/dashboard/profile")({ component: Profile });

function Profile() {
  const [shop] = useShop();
  const [form, setForm] = useState<Shop>(shop);
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  useEffect(() => setForm(shop), [shop]);
  const set = (k: keyof Shop, v: string | number) => setForm((f) => ({ ...f, [k]: v }));
  const save = (e: React.FormEvent) => {
    e.preventDefault(); setState("saving");
    setTimeout(() => { updateShop(form); setState("saved"); setTimeout(() => setState("idle"), 2000); }, 700);
  };
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Shop Profile</h1>
        <p className="text-sm text-muted-foreground">These details appear on your customer upload page.</p>
      </div>
      <form onSubmit={save} className="card space-y-5 p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <L label="Shop name"><input className="field" value={form.name} onChange={(e) => set("name", e.target.value)} /></L>
          <L label="Owner name"><input className="field" value={form.owner} onChange={(e) => set("owner", e.target.value)} /></L>
          <L label="WhatsApp number"><input className="field" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value.replace(/\D/g, "").slice(0, 10))} /></L>
          <L label="State"><select className="field" value={form.state} onChange={(e) => set("state", e.target.value)}>{STATES.map((s) => <option key={s}>{s}</option>)}</select></L>
        </div>
        <L label="Address"><textarea className="field min-h-20" value={form.address} onChange={(e) => set("address", e.target.value)} /></L>
        <h3 className="pt-2 font-semibold">Pricing (per page)</h3>
        <div className="grid gap-5 sm:grid-cols-3">
          <L label="Black & White (₹)"><input type="number" min={0} step={0.5} className="field" value={form.priceBw} onChange={(e) => set("priceBw", Number(e.target.value))} /></L>
          <L label="Colour (₹)"><input type="number" min={0} step={0.5} className="field" value={form.priceColor} onChange={(e) => set("priceColor", Number(e.target.value))} /></L>
          <L label="Double-sided discount (%)"><input type="number" min={0} max={90} className="field" value={Math.round(form.doubleDiscount * 100)} onChange={(e) => set("doubleDiscount", Number(e.target.value) / 100)} /></L>
        </div>
        <button disabled={state === "saving"} className="btn btn-primary">
          {state === "saving" && <Loader2 className="h-4 w-4 animate-spin" />}
          {state === "saved" ? <><CheckCircle2 className="h-4 w-4" /> Saved</> : "Save changes"}
        </button>
      </form>
    </div>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-semibold">{label}</span>{children}</label>;
}
