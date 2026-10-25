import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { QRCodeCanvas } from "qrcode.react";
import {
  UploadCloud, FileText, X, Loader2, CheckCircle2, MessageCircle, MapPin,
  Minus, Plus, Printer, AlertCircle, IndianRupee, ShieldCheck, QrCode, ChevronDown, ChevronUp
} from "lucide-react";
import {
  calcPrice, countPdfPages, countPagesInRange, getPublicShop, submitUpload, getUpiPaymentUrl,
  type PrintColor, type PrintSides, type PaperSize, type BindingOption, type Shop, type CreatedOrderResult
} from "@/lib/shop-store";

export const Route = createFileRoute("/s/$shopId")({
  head: () => ({
    meta: [
      { title: "Upload Files to Print — Printex" },
      { name: "description", content: "Instant zero-friction document printing. Upload files, customize print options, and collect at counter." },
      { property: "og:title", content: "Upload Files to Print — Printex" },
      { property: "og:description", content: "Send your files straight to the print shop — no login needed." },
    ],
  }),
  component: CustomerUpload,
});

interface Item {
  id: string;
  file: File;
  totalPages: number | null;
  activePages: number | null;
  pageRange: string;
  isCustomRange: boolean;
  color: PrintColor;
  sides: PrintSides;
  paperSize: PaperSize;
  binding: BindingOption;
  copies: number;
  showAdvanced: boolean;
}

const MAX_MB = 35;
const ACCEPT = ".pdf,.jpg,.jpeg,.png,.doc,.docx";
const nameSchema = z.string().trim().min(2, "Enter your name so the shopkeeper can call you").max(40);
const phoneSchema = z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian phone number").optional().or(z.literal(""));

function CustomerUpload() {
  const { shopId } = Route.useParams();
  const [shop, setShop] = useState<Shop | null | undefined>(undefined);
  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [createdOrders, setCreatedOrders] = useState<CreatedOrderResult[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const [failMsg, setFailMsg] = useState("");

  useEffect(() => {
    getPublicShop(shopId).then(setShop).catch(() => setShop(null));
  }, [shopId]);

  const addFiles = async (list: FileList | null) => {
    if (!list) return;
    setErr("");
    const valid = Array.from(list).filter((f) => {
      if (f.size > MAX_MB * 1024 * 1024) {
        setErr(`${f.name} is larger than ${MAX_MB} MB limit.`);
        return false;
      }
      return true;
    });

    const fresh: Item[] = valid.map((file) => ({
      id: crypto.randomUUID(),
      file,
      totalPages: null,
      activePages: null,
      pageRange: "all",
      isCustomRange: false,
      color: "bw",
      sides: "single",
      paperSize: "A4",
      binding: "none",
      copies: 1,
      showAdvanced: false,
    }));

    setItems((s) => [...s, ...fresh]);

    for (const it of fresh) {
      const isPdf = it.file.type === "application/pdf" || it.file.name.toLowerCase().endsWith(".pdf");
      const totalPages = isPdf ? await countPdfPages(it.file) : 1;
      setItems((s) =>
        s.map((x) =>
          x.id === it.id
            ? { ...x, totalPages, activePages: totalPages }
            : x
        )
      );
    }
  };

  const patch = (id: string, p: Partial<Item>) => {
    setItems((s) =>
      s.map((x) => {
        if (x.id !== id) return x;
        const updated = { ...x, ...p };
        // Recalculate active pages if range changed
        if (p.pageRange !== undefined || p.isCustomRange !== undefined) {
          const max = updated.totalPages ?? 1;
          updated.activePages = updated.isCustomRange ? countPagesInRange(updated.pageRange, max) : max;
        }
        return updated;
      })
    );
  };

  if (shop === undefined) {
    return (
      <Center>
        <Loader2 className="h-8 w-8 animate-spin text-teal" />
        <p className="mt-3 text-sm text-muted-foreground font-medium">Connecting to print shop…</p>
      </Center>
    );
  }

  if (shop === null) {
    return (
      <Center>
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-destructive-soft text-destructive">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-navy">Shop Not Found</h1>
        <p className="mt-2 text-sm text-muted-foreground">This QR code or link may have changed. Please ask the shopkeeper for their latest counter QR code.</p>
        <Link to="/" className="btn btn-outline mt-6">Return to Homepage</Link>
      </Center>
    );
  }

  const total = items.reduce(
    (s, it) =>
      s +
      (it.activePages
        ? calcPrice(shop, it.activePages, it.color, it.sides, it.copies, it.binding, it.paperSize)
        : 0),
    0
  );

  const isCounting = items.some((i) => i.totalPages === null);

  const send = async () => {
    const n = nameSchema.safeParse(name);
    if (!n.success) return setErr(n.error.issues[0]?.message ?? "Please enter your name");
    
    if (phone.trim()) {
      const p = phoneSchema.safeParse(phone.trim());
      if (!p.success) return setErr(p.error.issues[0]?.message ?? "Please enter a valid phone number");
    }

    if (!items.length) return setErr("Please upload at least one document or photo.");
    setErr("");
    setStatus("sending");

    try {
      const created = await submitUpload(
        shop,
        n.data,
        phone.trim(),
        items.map((it) => ({
          file: it.file,
          pages: it.activePages ?? 1,
          copies: it.copies,
          color: it.color,
          sides: it.sides,
          paperSize: it.paperSize,
          binding: it.binding,
          pageRange: it.isCustomRange ? it.pageRange : "all",
        }))
      );
      setCreatedOrders(created);
      setStatus("sent");
    } catch (e) {
      console.error(e);
      setFailMsg(e instanceof Error ? e.message : "Upload encountered an issue. Please try again.");
      setStatus("error");
    }
  };

  const primaryToken = createdOrders[0]?.tokenNo || "4821";
  const upiLink = shop.upiId ? getUpiPaymentUrl(shop.upiId, shop.name, total, primaryToken) : "";
  const waShareMsg = encodeURIComponent(
    `Namaste ${shop.name}! I just submitted a print order.\n\n*Pickup Token: #${primaryToken}*\nCustomer: ${name}\nFiles: ${items.length}\nEstimated Total: ₹${total.toFixed(2)}\n\nPlease let me know when ready!`
  );
  const waUrl = `https://wa.me/91${shop.whatsapp}?text=${waShareMsg}`;

  // ==========================================
  // ORDER SUCCESS CONFIRMATION SCREEN
  // ==========================================
  if (status === "sent") {
    return (
      <div className="min-h-screen bg-secondary pb-16">
        <header className="bg-navy px-4 py-6 text-primary-foreground text-center">
          <div className="mx-auto max-w-md">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/20 px-3 py-1 text-xs font-semibold text-success">
              <CheckCircle2 className="h-4 w-4" /> Order Uploaded Successfully
            </span>
            <h1 className="mt-2 text-2xl font-bold">{shop.name}</h1>
          </div>
        </header>

        <main className="mx-auto -mt-3 max-w-md space-y-4 px-4">
          {/* Token Card */}
          <div className="card text-center p-6 border-2 border-teal/40 bg-card shadow-lg">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Your Counter Pickup Token</p>
            <div className="my-2 inline-block rounded-2xl bg-teal-soft px-6 py-3">
              <p className="font-mono text-4xl font-extrabold tracking-wider text-teal">#{primaryToken}</p>
            </div>
            <p className="text-xs text-muted-foreground">Show or announce this 4-digit token at the Xerox counter.</p>
            
            <div className="mt-4 flex items-center justify-between rounded-xl bg-secondary p-3 text-left">
              <div>
                <p className="text-xs text-muted-foreground">Total Print Amount</p>
                <p className="font-display text-xl font-bold text-navy">₹{total.toFixed(2)}</p>
              </div>
              <span className="rounded-lg bg-warning-soft px-2.5 py-1 text-xs font-semibold text-warning">
                Pay at counter / UPI
              </span>
            </div>
          </div>

          {/* Dynamic UPI QR Code if shopkeeper configured UPI */}
          {shop.upiId && (
            <div className="card p-5 text-center">
              <p className="text-sm font-bold text-navy flex items-center justify-center gap-1.5">
                <QrCode className="h-4 w-4 text-teal" /> Instant UPI Payment
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">Scan with Google Pay, PhonePe, Paytm, or BHIM</p>
              
              <div className="mx-auto my-4 w-fit rounded-2xl border-2 border-teal/30 bg-background p-3 shadow-inner">
                <QRCodeCanvas value={upiLink} size={180} level="M" marginSize={1} />
              </div>

              <div className="flex flex-col gap-2">
                <a href={upiLink} className="btn btn-teal w-full py-2.5 text-xs font-bold">
                  <IndianRupee className="h-3.5 w-3.5" /> Pay ₹{total.toFixed(2)} via UPI App
                </a>
                <p className="text-[11px] text-muted-foreground">UPI ID: <span className="font-mono font-medium">{shop.upiId}</span></p>
              </div>
            </div>
          )}

          {/* Quick WhatsApp Shop Notification */}
          <div className="card p-4">
            <a href={waUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#25D366]/15 text-[#25D366]">
                <MessageCircle className="h-6 w-6" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">Send Token to Shop WhatsApp</p>
                <p className="text-xs text-muted-foreground truncate">Sends order summary directly to {shop.name}</p>
              </div>
            </a>
          </div>

          {/* Action buttons */}
          <button
            onClick={() => {
              setItems([]);
              setStatus("idle");
              setCreatedOrders([]);
            }}
            className="btn btn-outline w-full py-3"
          >
            Send More Documents
          </button>
        </main>
      </div>
    );
  }

  // ==========================================
  // CUSTOMER UPLOAD FORM
  // ==========================================
  return (
    <div className="min-h-screen bg-secondary pb-36">
      {/* Header */}
      <header className="bg-navy px-5 pb-8 pt-6 text-primary-foreground shadow">
        <div className="mx-auto max-w-md">
          <p className="flex items-center gap-1.5 text-xs opacity-75">
            <Printer className="h-3.5 w-3.5 text-teal" /> Upload & Print at
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{shop.name}</h1>
          <p className="mt-1 flex items-start gap-1 text-xs opacity-75">
            <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-teal" /> {shop.address}
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-white/10 px-3 py-1 font-medium">B/W: ₹{shop.priceBw}/pg</span>
            <span className="rounded-full bg-white/10 px-3 py-1 font-medium">Colour: ₹{shop.priceColor}/pg</span>
            {shop.doubleDiscount > 0 && (
              <span className="rounded-full bg-teal/20 text-teal px-3 py-1 font-semibold">
                Duplex: {Math.round(shop.doubleDiscount * 100)}% OFF
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto -mt-4 max-w-md space-y-4 px-4">
        {/* Customer Details Card */}
        <div className="card p-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your Name *</label>
            <input
              className="field"
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mobile Number (Optional)</label>
            <div className="flex">
              <span className="grid place-items-center rounded-l-[var(--radius)] border border-r-0 bg-secondary px-3 text-xs text-muted-foreground font-medium">+91</span>
              <input
                className="field rounded-l-none"
                placeholder="For WhatsApp status updates"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              />
            </div>
          </div>
        </div>

        {/* Upload Dropzone */}
        <button
          onClick={() => input.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            addFiles(e.dataTransfer.files);
          }}
          className="card flex w-full flex-col items-center border-2 border-dashed border-teal/40 bg-teal-soft/50 p-7 text-center transition hover:border-teal hover:bg-teal-soft"
        >
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal text-white shadow">
            <UploadCloud className="h-6 w-6" />
          </div>
          <p className="mt-3 text-base font-bold text-navy">Tap or Drag Files to Upload</p>
          <p className="text-xs text-muted-foreground">PDF, Word (DOC/DOCX), JPG, PNG · Max {MAX_MB} MB each</p>
        </button>
        <input
          ref={input}
          type="file"
          multiple
          accept={ACCEPT}
          hidden
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />

        {/* Error Messages */}
        {err && (
          <p className="flex items-center gap-2 rounded-xl bg-destructive-soft p-3 text-xs font-medium text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" /> {err}
          </p>
        )}
        {status === "error" && (
          <p className="rounded-xl bg-destructive-soft p-3 text-xs font-medium text-destructive">
            {failMsg || "Upload encountered an issue. Please verify your internet and try again."}
          </p>
        )}

        {/* Uploaded File Cards */}
        {items.map((it) => {
          const itemPrice = it.activePages
            ? calcPrice(shop, it.activePages, it.color, it.sides, it.copies, it.binding, it.paperSize)
            : 0;

          return (
            <div key={it.id} className="card fade-up p-4 space-y-3">
              {/* Header row */}
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-info-soft text-info">
                  <FileText className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-navy">{it.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(it.file.size / 1024 / 1024).toFixed(2)} MB ·{" "}
                    {it.totalPages === null ? (
                      <span className="inline-flex items-center gap-1 text-teal font-medium">
                        <Loader2 className="h-3 w-3 animate-spin" /> detecting pages…
                      </span>
                    ) : (
                      <span className="font-medium text-foreground">
                        {it.activePages} of {it.totalPages} page{it.totalPages > 1 ? "s" : ""}
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => setItems((s) => s.filter((x) => x.id !== it.id))}
                  aria-label="Remove"
                  className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Primary Print Controls */}
              <div className="grid grid-cols-2 gap-2">
                <Seg
                  value={it.color}
                  onChange={(v) => patch(it.id, { color: v })}
                  opts={[
                    ["bw", `B/W (₹${shop.priceBw})`],
                    ["color", `Colour (₹${shop.priceColor})`],
                  ]}
                />
                <Seg
                  value={it.sides}
                  onChange={(v) => patch(it.id, { sides: v })}
                  opts={[
                    ["single", "Single-sided"],
                    ["double", "Double-sided"],
                  ]}
                />
              </div>

              {/* Copies & Item Subtotal */}
              <div className="flex items-center justify-between border-t pt-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground font-medium">Copies:</span>
                  <button
                    className="grid h-7 w-7 place-items-center rounded-md border bg-secondary hover:bg-card"
                    onClick={() => patch(it.id, { copies: Math.max(1, it.copies - 1) })}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-5 text-center font-bold">{it.copies}</span>
                  <button
                    className="grid h-7 w-7 place-items-center rounded-md border bg-secondary hover:bg-card"
                    onClick={() => patch(it.id, { copies: Math.min(50, it.copies + 1) })}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => patch(it.id, { showAdvanced: !it.showAdvanced })}
                    className="text-xs font-semibold text-teal flex items-center gap-0.5"
                  >
                    {it.showAdvanced ? "Less options" : "More options"}
                    {it.showAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                  <span className="font-display font-bold text-navy text-sm">₹{itemPrice.toFixed(2)}</span>
                </div>
              </div>

              {/* Advanced Options Drawer (Page Range, Paper Size, Binding) */}
              {it.showAdvanced && (
                <div className="rounded-xl bg-secondary/80 p-3 space-y-3 text-xs border">
                  {/* Page Range Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-muted-foreground">Pages to Print:</span>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => patch(it.id, { isCustomRange: false, pageRange: "all" })}
                          className={`rounded px-2 py-0.5 font-medium ${!it.isCustomRange ? "bg-teal text-white" : "bg-card text-muted-foreground"}`}
                        >
                          All Pages
                        </button>
                        <button
                          type="button"
                          onClick={() => patch(it.id, { isCustomRange: true, pageRange: it.pageRange === "all" ? "1-" + (it.totalPages || 1) : it.pageRange })}
                          className={`rounded px-2 py-0.5 font-medium ${it.isCustomRange ? "bg-teal text-white" : "bg-card text-muted-foreground"}`}
                        >
                          Custom Range
                        </button>
                      </div>
                    </div>
                    {it.isCustomRange && (
                      <input
                        className="field text-xs py-1.5"
                        placeholder="e.g. 1-5, 8, 11-15"
                        value={it.pageRange}
                        onChange={(e) => patch(it.id, { pageRange: e.target.value })}
                      />
                    )}
                  </div>

                  {/* Paper Size */}
                  <div>
                    <span className="font-semibold text-muted-foreground block mb-1.5">Paper Size:</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(["A4", "A3", "Legal"] as const).map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => patch(it.id, { paperSize: sz })}
                          className={`rounded-lg py-1.5 text-center font-medium transition ${it.paperSize === sz ? "bg-teal text-white" : "bg-card text-muted-foreground border"}`}
                        >
                          {sz} {sz === "A3" ? "(2x)" : ""}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Binding & Finishing */}
                  <div>
                    <span className="font-semibold text-muted-foreground block mb-1.5">Finishing & Binding:</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        ["none", "None"],
                        ["staple", `Staple (+₹${shop.priceStaple})`],
                        ["spiral", `Spiral (+₹${shop.priceSpiral})`],
                        ["lamination", `Laminate (+₹${shop.priceLamination}/pg)`],
                      ].map(([val, label]) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => patch(it.id, { binding: val as BindingOption })}
                          className={`rounded-lg py-1.5 px-2 text-left font-medium transition ${it.binding === val ? "bg-teal text-white" : "bg-card text-muted-foreground border"}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {!shop.acceptUploads && (
          <p className="rounded-xl bg-warning-soft p-3 text-xs font-medium text-warning flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            This shop is currently not accepting new uploads.
          </p>
        )}

        {/* WhatsApp direct chat option */}
        {shop.showWhatsapp && (
          <a
            href={`https://wa.me/91${shop.whatsapp}?text=${encodeURIComponent(`Hi ${shop.name}, I want to get some documents printed.`)}`}
            target="_blank"
            rel="noreferrer"
            className="card flex items-center gap-3 p-4 transition hover:shadow-md"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-success-soft text-success">
              <MessageCircle className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <span className="block text-xs font-bold text-foreground">Need help or prefer WhatsApp?</span>
              <span className="text-[11px] text-muted-foreground">Chat directly with {shop.name}</span>
            </div>
          </a>
        )}

        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground pt-2">
          <ShieldCheck className="h-3.5 w-3.5 text-teal" /> Safe & Private · Powered by{" "}
          <Link to="/" className="font-bold text-foreground hover:underline">
            Printex
          </Link>
        </div>
      </main>

      {/* Floating Bottom Action Bar */}
      <div className="fixed inset-x-0 bottom-0 border-t bg-background/95 backdrop-blur-md p-4 shadow-lg z-20">
        <div className="mx-auto flex max-w-md items-center gap-4">
          <div>
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Estimated Total</p>
            <p className="font-display text-2xl font-extrabold text-navy">₹{total.toFixed(2)}</p>
          </div>
          <button
            onClick={send}
            disabled={status === "sending" || isCounting || !items.length || !shop.acceptUploads}
            className="btn btn-teal flex-1 py-3 text-sm font-bold shadow-md disabled:opacity-50"
          >
            {status === "sending" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Uploading to Shop…
              </>
            ) : (
              `Send ${items.length ? `${items.length} File${items.length === 1 ? "" : "s"}` : "Files"}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function Seg<T extends string>({
  value,
  onChange,
  opts,
}: {
  value: T;
  onChange: (v: T) => void;
  opts: [T, string][];
}) {
  return (
    <div className="flex rounded-lg bg-secondary p-1">
      {opts.map(([v, l]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`flex-1 rounded-md px-1 py-1.5 text-[11px] font-semibold transition ${
            value === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary px-6 text-center">
      <div className="flex w-full max-w-sm flex-col items-center">{children}</div>
    </div>
  );
}
