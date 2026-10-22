import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { UploadCloud, FileText, X, Loader2, CheckCircle2, MessageCircle, MapPin, Minus, Plus, Printer, AlertCircle } from "lucide-react";
import { calcPrice, countPdfPages, getShop, submitUpload, type PrintColor, type PrintSides, type Shop } from "@/lib/shop-store";

export const Route = createFileRoute("/s/$shopId")({
  head: () => ({
    meta: [
      { title: "Upload Files to Print — Printex" },
      { name: "description", content: "Send your files to this print shop. Choose colour and sides, see the price, no login needed." },
      { property: "og:title", content: "Upload Files to Print" },
      { property: "og:description", content: "Send your files straight to the print shop — no login needed." },
    ],
  }),
  component: CustomerUpload,
});

interface Item { id: string; file: File; pages: number | null; color: PrintColor; sides: PrintSides; copies: number }
const MAX_MB = 25;
const ACCEPT = ".pdf,.jpg,.jpeg,.png,.doc,.docx";
const nameSchema = z.string().trim().min(2, "Enter your name so the shop can call you").max(40);

function CustomerUpload() {
  const { shopId } = Route.useParams();
  const [shop, setShop] = useState<Shop | null | undefined>(undefined);
  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [orderIds, setOrderIds] = useState<string[]>([]);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => { const t = setTimeout(() => setShop(getShop(shopId) ?? null), 350); return () => clearTimeout(t); }, [shopId]);

  const addFiles = async (list: FileList | null) => {
    if (!list) return;
    setErr("");
    const valid = Array.from(list).filter((f) => {
      if (f.size > MAX_MB * 1024 * 1024) { setErr(`${f.name} is larger than ${MAX_MB} MB`); return false; }
      return true;
    });
    const fresh: Item[] = valid.map((file) => ({ id: crypto.randomUUID(), file, pages: null, color: "bw", sides: "single", copies: 1 }));
    setItems((s) => [...s, ...fresh]);
    for (const it of fresh) {
      const pages = it.file.type === "application/pdf" || it.file.name.toLowerCase().endsWith(".pdf") ? await countPdfPages(it.file) : 1;
      setItems((s) => s.map((x) => (x.id === it.id ? { ...x, pages } : x)));
    }
  };
  const patch = (id: string, p: Partial<Item>) => setItems((s) => s.map((x) => (x.id === id ? { ...x, ...p } : x)));

  if (shop === undefined) return <Center><Loader2 className="h-6 w-6 animate-spin text-teal" /></Center>;
  if (shop === null) return (
    <Center>
      <AlertCircle className="h-10 w-10 text-destructive" />
      <h1 className="mt-3 text-xl font-bold">Shop not found</h1>
      <p className="mt-1 text-sm text-muted-foreground">This QR link may be wrong or expired. Ask the shop for their latest QR code.</p>
    </Center>
  );

  const total = items.reduce((s, it) => s + (it.pages ? calcPrice(shop, it.pages, it.color, it.sides, it.copies) : 0), 0);
  const counting = items.some((i) => i.pages === null);

  const send = async () => {
    const n = nameSchema.safeParse(name);
    if (!n.success) return setErr(n.error.issues[0].message);
    if (!items.length) return setErr("Please add at least one file");
    setErr(""); setStatus("sending");
    try {
      const created = await submitUpload(shop.id, n.data, items.map((it) => ({
        fileName: it.file.name, pages: it.pages ?? 1, copies: it.copies, color: it.color, sides: it.sides,
        amount: calcPrice(shop, it.pages ?? 1, it.color, it.sides, it.copies),
      })));
      setOrderIds(created.map((c) => c.id)); setStatus("sent");
    } catch { setStatus("error"); }
  };

  const wa = `https://wa.me/91${shop.whatsapp}?text=${encodeURIComponent(`Hi ${shop.name}, I want to print some files.`)}`;

  if (status === "sent") return (
    <Center>
      <span className="grid h-16 w-16 place-items-center rounded-full bg-success-soft"><CheckCircle2 className="h-8 w-8 text-success" /></span>
      <h1 className="mt-4 text-2xl font-bold">Files sent!</h1>
      <p className="mt-2 text-sm text-muted-foreground">{shop.name} has received your {orderIds.length} file{orderIds.length > 1 ? "s" : ""}. Show this at the counter.</p>
      <div className="card mt-5 w-full p-4 text-left">
        <p className="text-xs text-muted-foreground">Order ID</p>
        <p className="font-display text-lg font-bold">{orderIds.join(", ")}</p>
        <p className="mt-2 text-xs text-muted-foreground">Estimated total</p>
        <p className="font-display text-lg font-bold text-teal">₹{total.toFixed(2)}</p>
      </div>
      <button onClick={() => { setItems([]); setStatus("idle"); }} className="btn btn-outline mt-5 w-full">Send more files</button>
    </Center>
  );

  return (
    <div className="min-h-screen bg-secondary pb-36">
      <header className="bg-primary px-5 pb-8 pt-6 text-primary-foreground">
        <div className="mx-auto max-w-md">
          <p className="flex items-center gap-1.5 text-xs opacity-75"><Printer className="h-3.5 w-3.5" /> Upload to print at</p>
          <h1 className="mt-1 text-2xl font-bold">{shop.name}</h1>
          <p className="mt-1 flex items-start gap-1 text-xs opacity-75"><MapPin className="mt-0.5 h-3 w-3 shrink-0" /> {shop.address}</p>
          <div className="mt-4 flex gap-2 text-xs">
            <span className="rounded-full bg-primary-foreground/15 px-3 py-1">B/W ₹{shop.priceBw}/page</span>
            <span className="rounded-full bg-primary-foreground/15 px-3 py-1">Colour ₹{shop.priceColor}/page</span>
          </div>
        </div>
      </header>

      <main className="mx-auto -mt-4 max-w-md space-y-4 px-4">
        <div className="card p-4">
          <label className="mb-1.5 block text-sm font-semibold">Your name</label>
          <input className="field" placeholder="So the shop knows whose file it is" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
        </div>

        <button onClick={() => input.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
          className="card flex w-full flex-col items-center border-2 border-dashed border-teal/40 bg-teal-soft p-8 text-center">
          <UploadCloud className="h-10 w-10 text-teal" />
          <p className="mt-3 font-semibold">Tap to choose files</p>
          <p className="text-xs text-muted-foreground">PDF, JPG, PNG, DOC · up to {MAX_MB} MB each</p>
        </button>
        <input ref={input} type="file" multiple accept={ACCEPT} hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />

        {err && <p className="flex items-center gap-2 rounded-lg bg-destructive-soft p-3 text-sm text-destructive"><AlertCircle className="h-4 w-4" /> {err}</p>}
        {status === "error" && <p className="rounded-lg bg-destructive-soft p-3 text-sm text-destructive">Upload failed. Check your internet and try again.</p>}

        {items.map((it) => (
          <div key={it.id} className="card fade-up p-4">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-info-soft text-info"><FileText className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{it.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(it.file.size / 1024 / 1024).toFixed(2)} MB · {it.pages === null ? <span className="inline-flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> counting pages</span> : `${it.pages} page${it.pages > 1 ? "s" : ""}`}
                </p>
              </div>
              <button onClick={() => setItems((s) => s.filter((x) => x.id !== it.id))} aria-label="Remove" className="text-muted-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Seg value={it.color} onChange={(v) => patch(it.id, { color: v })} opts={[["bw", "Black & White"], ["color", "Colour"]]} />
              <Seg value={it.sides} onChange={(v) => patch(it.id, { sides: v })} opts={[["single", "Single-sided"], ["double", "Double-sided"]]} />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Copies</span>
                <button className="rounded-md border p-1" onClick={() => patch(it.id, { copies: Math.max(1, it.copies - 1) })}><Minus className="h-3.5 w-3.5" /></button>
                <span className="w-5 text-center font-semibold">{it.copies}</span>
                <button className="rounded-md border p-1" onClick={() => patch(it.id, { copies: Math.min(50, it.copies + 1) })}><Plus className="h-3.5 w-3.5" /></button>
              </div>
              <span className="font-semibold">₹{it.pages ? calcPrice(shop, it.pages, it.color, it.sides, it.copies).toFixed(2) : "—"}</span>
            </div>
          </div>
        ))}

        <a href={wa} target="_blank" rel="noreferrer" className="card flex items-center gap-3 p-4">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-success-soft text-success"><MessageCircle className="h-5 w-5" /></span>
          <span className="flex-1"><span className="block text-sm font-semibold">Prefer WhatsApp?</span><span className="text-xs text-muted-foreground">Send files directly to the shop's WhatsApp</span></span>
        </a>
        <p className="text-center text-xs text-muted-foreground">No account needed · Powered by <Link to="/" className="font-semibold">Printex</Link></p>
      </main>

      <div className="fixed inset-x-0 bottom-0 border-t bg-background p-4">
        <div className="mx-auto flex max-w-md items-center gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Estimated price</p>
            <p className="font-display text-xl font-bold">₹{total.toFixed(2)}</p>
          </div>
          <button onClick={send} disabled={status === "sending" || counting || !items.length} className="btn btn-teal flex-1 py-3">
            {status === "sending" ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : `Send ${items.length || ""} File${items.length === 1 ? "" : "s"}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function Seg<T extends string>({ value, onChange, opts }: { value: T; onChange: (v: T) => void; opts: [T, string][] }) {
  return (
    <div className="flex rounded-lg bg-secondary p-1">
      {opts.map(([v, l]) => (
        <button key={v} onClick={() => onChange(v)} className={`flex-1 rounded-md px-1 py-1.5 text-[11px] font-semibold transition ${value === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>{l}</button>
      ))}
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen flex-col items-center justify-center bg-secondary px-6 text-center"><div className="flex w-full max-w-sm flex-col items-center">{children}</div></div>;
}
