import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  QrCode, Upload, Search, Bell, FileText, IndianRupee, Clock, CheckCircle2, Smartphone,
  LayoutDashboard, MessageCircle, Calculator, Shield, Star, Menu, X, Mail, Phone, MapPin,
  Sparkles, ShieldCheck, Zap, Printer, Check, ShieldAlert, ArrowRight, RefreshCw, AlertTriangle
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { StatusBadge } from "@/components/StatusBadge";
import { DEMO_SHOP, searchShops, getMyShop } from "@/lib/shop-store";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Printex — Replace Chaotic Chats with a Professional Counter Workflow" },
      { name: "description", content: "Why Indian photocopy and xerox shops switch to Printex: Zero WhatsApp chaos, virus-free counter QR uploads, automatic page counts, and instant UPI pricing." },
      { property: "og:title", content: "Printex — Replace Chaotic Chats with a Professional Counter Workflow" },
      { property: "og:description", content: "Stop WhatsApp chaos and infected pen drives. Customers scan your counter QR, choose print options, and you print from one screen." },
    ],
  }),
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [findOpen, setFindOpen] = useState(false);

  // Smart Redirection: If registered shop owner is already logged in, redirect to dashboard
  useEffect(() => {
    let active = true;
    const checkAuth = async () => {
      try {
        const { data: s } = await supabase.auth.getSession();
        if (s?.session?.user) {
          const shop = await getMyShop();
          if (active && shop?.id && shop.id !== "printex-test-hub") {
            navigate({ to: "/dashboard", replace: true });
          }
        }
      } catch {}
    };
    checkAuth();
    return () => {
      active = false;
    };
  }, [navigate]);

  const nav = [["Features", "#features"], ["Reviews", "#reviews"], ["Contact", "#contact"]];
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            {nav.map(([l, h]) => <a key={h} href={h} className="hover:text-foreground">{l}</a>)}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <Link to="/auth" className="btn btn-outline">Sign In</Link>
            <Link to="/register" className="btn btn-primary">Get Started</Link>
          </div>
          <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X /> : <Menu />}</button>
        </div>
        {open && (
          <div className="border-t px-4 py-4 md:hidden">
            {nav.map(([l, h]) => <a key={h} href={h} onClick={() => setOpen(false)} className="block py-2 font-medium">{l}</a>)}
            <Link to="/auth" onClick={() => setOpen(false)} className="btn btn-outline mt-2 w-full">Sign In</Link>
            <Link to="/register" onClick={() => setOpen(false)} className="btn btn-primary mt-2 w-full">Get Started</Link>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="bg-grid absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-12 text-center md:pt-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal/30 bg-teal-soft px-3.5 py-1 text-xs font-bold text-teal shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-teal" /> WHY SHOP OWNERS SWITCH
          </div>
          <h1 className="fade-up mx-auto mt-5 max-w-4xl text-3xl sm:text-5xl md:text-6xl font-extrabold leading-[1.14] tracking-tight text-navy">
            Replace Chaotic Chats with a{" "}
            <span className="text-teal underline decoration-teal/30 decoration-wavy">
              Professional Workflow.
            </span>
          </h1>
          <p className="mx-auto mt-4 sm:mt-5 max-w-2xl text-sm sm:text-base text-muted-foreground md:text-lg leading-relaxed">
            Say goodbye to buried WhatsApp documents, virus-infected pen drives, and manual page calculation. Customers scan your counter QR code — you see every print order with auto-counted pages and exact pricing ready to print.
          </p>
          <div className="mt-7 sm:mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/register" className="btn btn-teal px-7 py-3.5 min-h-[48px] text-sm font-bold shadow-lg shadow-teal/20">
              <QrCode className="h-4 w-4" /> Get Free Shop QR Code
            </Link>
            <button onClick={() => setFindOpen(true)} className="btn btn-outline px-6 py-3.5 min-h-[48px] text-sm font-semibold">
              <Upload className="h-4 w-4" /> Test Customer Upload Flow
            </button>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 font-medium"><ShieldCheck className="h-3.5 w-3.5 text-teal" /> 100% Virus-Free (No USBs)</span>
            <span className="inline-flex items-center gap-1.5 font-medium"><Zap className="h-3.5 w-3.5 text-amber-500" /> 10-Second Counter Turnaround</span>
            <span className="inline-flex items-center gap-1.5 font-medium"><IndianRupee className="h-3.5 w-3.5 text-emerald-600" /> Auto Page & UPI Calculations</span>
          </div>

          <DashboardPreview />
        </div>
      </section>

      {/* Why Shop Owners Switch Section */}
      <section className="border-t bg-gradient-to-b from-white via-slate-50/70 to-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/40 bg-teal-soft px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-teal">
              <Sparkles className="h-3.5 w-3.5" /> Direct Side-by-Side Upgrade
            </span>
            <h2 className="mx-auto mt-3 max-w-2xl text-2xl sm:text-3xl md:text-4xl font-extrabold text-navy">
              Why 1,200+ Xerox & Print Shops Left WhatsApp
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm sm:text-base text-muted-foreground">
              See the exact operational transformation that saves print counters 2+ hours every single day.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="card p-5 border-t-4 border-t-rose-500 hover:shadow-lg transition">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-rose-600 font-bold">
                <MessageCircle className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-bold text-navy text-base">Zero WhatsApp Clutter</h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                No personal phone numbers handed out or 50 student PDFs cluttering your phone memory and chat list.
              </p>
              <div className="mt-4 rounded-lg bg-rose-50/80 p-2.5 text-[11px] text-rose-700 font-medium">
                ❌ Before: "Bhaiya doc bhej diya search karo"
              </div>
            </div>

            <div className="card p-5 border-t-4 border-t-teal hover:shadow-lg transition">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-soft text-teal font-bold">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-bold text-navy text-base">100% Virus-Free Counter</h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Never insert a stranger's infected USB pen-drive into your shop's billing computer again. Files land securely online.
              </p>
              <div className="mt-4 rounded-lg bg-teal-soft p-2.5 text-[11px] text-teal font-medium">
                ✅ With Printex: Touchless QR cloud transfer
              </div>
            </div>

            <div className="card p-5 border-t-4 border-t-amber-500 hover:shadow-lg transition">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600 font-bold">
                <Calculator className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-bold text-navy text-base">Automatic Page & Price</h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                PDF pages are counted automatically with B/W and colour pricing pre-calculated. Zero rate disputes with customers.
              </p>
              <div className="mt-4 rounded-lg bg-amber-50/80 p-2.5 text-[11px] text-amber-700 font-medium">
                ✅ Upfront estimate: Exact amount ready
              </div>
            </div>

            <div className="card p-5 border-t-4 border-t-indigo-500 hover:shadow-lg transition">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600 font-bold">
                <Zap className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-bold text-navy text-base">10-Second Turnaround</h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Customers get a Token Number. Click [Print], hand over pages, hit [Done], and seamlessly take the next order.
              </p>
              <div className="mt-4 rounded-lg bg-indigo-50/80 p-2.5 text-[11px] text-indigo-700 font-medium">
                ⚡ 3x faster counter throughput in rush hour
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y bg-secondary py-20">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHead eyebrow="How it works" title="From customer phone to your printer in 3 steps" />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              [QrCode, "Display your QR", "Register your shop and print your unique QR code. Stick it on the counter."],
              [Smartphone, "Customer uploads", "Customers scan, pick files, choose B/W or colour and sides. No login needed."],
              [LayoutDashboard, "You print & collect", "Orders appear instantly with page counts and price. Print, mark ready, done."],
            ].map(([Icon, t, d], i) => {
              const I = Icon as typeof QrCode;
              return (
                <div key={i} className="card p-6">
                  <div className="flex items-center justify-between">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-soft text-teal"><I className="h-5 w-5" /></span>
                    <span className="font-display text-3xl font-bold text-border">0{i + 1}</span>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{t as string}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{d as string}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-16 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHead eyebrow="Features" title="Everything a busy print counter needs" />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              [QrCode, "Unique shop QR", "Every shop gets its own QR and upload link — share on WhatsApp or print it."],
              [FileText, "Auto page count", "PDF pages are counted automatically so pricing is never a guess."],
              [Calculator, "Instant pricing", "Set B/W, colour and double-sided rates. Customers see the estimate upfront."],
              [Bell, "Live order queue", "New uploads land in one queue with status: pending, printing, ready."],
              [MessageCircle, "WhatsApp fallback", "Customers can still send files on WhatsApp straight to your number."],
              [Shield, "No pen drives", "Files come straight to you — no viruses, no stranger's phone logins."],
            ].map(([Icon, t, d], i) => {
              const I = Icon as typeof QrCode;
              return (
                <div key={i} className="card p-6 transition hover:-translate-y-0.5">
                  <I className="h-5 w-5 text-teal" />
                  <h3 className="mt-4 font-semibold">{t as string}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{d as string}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section id="reviews" className="scroll-mt-16 border-t bg-secondary py-20">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHead eyebrow="Reviews" title="Loved by shop owners across India" />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              ["Earlier students sent 50 files on WhatsApp and I lost track. Now everything is in one list with the price.", "Rakesh Sharma", "Sharma Xerox, Pune"],
              ["The QR on my counter does the work. Rush hour near college is so much smoother.", "Lakshmi Iyer", "Sri Sai Prints, Chennai"],
              ["Page counting alone saves me 30 minutes a day. Customers trust the price they see.", "Imran Qureshi", "City Copy Centre, Lucknow"],
            ].map(([q, n, s]) => (
              <figure key={n} className="card p-6">
                <div className="flex gap-0.5 text-warning">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}</div>
                <blockquote className="mt-4 text-sm leading-relaxed">“{q}”</blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{n?.[0]}</span>
                  <span><span className="block text-sm font-semibold">{n}</span><span className="text-xs text-muted-foreground">{s}</span></span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4">
          <div className="rounded-3xl bg-primary p-10 text-center text-primary-foreground shadow-[var(--shadow-float)]">
            <h2 className="text-3xl font-bold">Get your shop QR code today</h2>
            <p className="mx-auto mt-3 max-w-md opacity-80">Join print shops saving hours every week. Free to start.</p>
            <Link to="/register" className="btn btn-teal mt-7 px-6 py-3">Create my shop</Link>
          </div>
        </div>
      </section>

      <footer id="contact" className="scroll-mt-16 border-t">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">Smart order management for photocopy and printing businesses across India.</p>
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-semibold">Product</p>
            <a href="#features" className="block text-muted-foreground hover:text-foreground">Features</a>
            <Link to="/register" className="block text-muted-foreground hover:text-foreground">Register shop</Link>
            <Link to="/dashboard" className="block text-muted-foreground hover:text-foreground">Dashboard</Link>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Contact</p>
            <a href="mailto:contact.printex@gmail.com" className="flex items-center gap-2 hover:text-foreground transition-colors">
              <Mail className="h-4 w-4" /> contact.printex@gmail.com
            </a>
            <a href="tel:+918957759289" className="flex items-center gap-2 hover:text-foreground transition-colors">
              <Phone className="h-4 w-4" /> +91 89577 59289
            </a>
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Delhi, India
            </p>
          </div>
        </div>
        <p className="border-t py-5 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} Printex. All rights reserved.</p>
      </footer>

      {findOpen && <FindShop onClose={() => setFindOpen(false)} />}
    </div>
  );
}

function SectionHead({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-teal">{eyebrow}</p>
      <h2 className="mx-auto mt-2 max-w-xl text-3xl font-bold text-navy md:text-4xl">{title}</h2>
    </div>
  );
}

function FindShop({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState("");
  const { data: shops = [] } = useQuery({ queryKey: ["find-shops", q], queryFn: () => searchShops(q) });
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-navy/40 p-4" onClick={onClose}>
      <div className="card fade-up w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Find your print shop</h3>
          <button onClick={onClose} aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <input autoFocus className="field pl-9" placeholder="Shop name or area" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="mt-4 max-h-72 space-y-2 overflow-auto">
          {shops.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No shops found. Ask the shop for its QR code.</p>}
          {shops.map((s) => (
            <Link key={s.id} to="/s/$shopId" params={{ shopId: s.id }} className="block rounded-xl border p-3 hover:border-teal hover:bg-teal-soft">
              <p className="font-semibold">{s.name}</p>
              <p className="text-xs text-muted-foreground">{s.address}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function DashboardPreview() {
  const initialOrders = [
    { id: 101, file: "Resume_Final_2026.pdf", pages: 2, type: "Colour · Single", status: "pending", amount: 20, isDone: false },
    { id: 102, file: "DBMS_Unit4_Handwritten_Notes.pdf", pages: 38, type: "B/W · Double", status: "printing", amount: 57, isDone: false },
    { id: 103, file: "Rent_Agreement_Draft.pdf", pages: 6, type: "B/W · Double", status: "ready", amount: 9, isDone: false },
    { id: 104, file: "Aadhaar_PAN_Card_Front_Back.pdf", pages: 1, type: "B/W · Single", status: "collected", amount: 5, isDone: true },
  ];

  const [activeTab, setActiveTab] = useState<"printex" | "whatsapp">("printex");
  const [orders, setOrders] = useState(initialOrders);
  const [printingId, setPrintingId] = useState<number | null>(null);
  const [simulatedCounter, setSimulatedCounter] = useState(105);

  const pendingCount = orders.filter((o) => !o.isDone).length;
  const totalRev = orders.reduce((sum, o) => sum + o.amount, 0);

  const handleSimulateOrder = () => {
    const samples = [
      { file: "College_ID_Card_Urgent.pdf", pages: 1, type: "Colour · Single", amount: 10 },
      { file: "Chemistry_Lab_Manual_Full.pdf", pages: 44, type: "B/W · Double", amount: 66 },
      { file: "Passport_Application_Form.pdf", pages: 4, type: "B/W · Single", amount: 12 },
      { file: "Gate_2026_Admit_Card.pdf", pages: 2, type: "Colour · Single", amount: 20 },
    ];
    const picked = samples[(simulatedCounter - 105) % samples.length];
    const newOrder = {
      id: simulatedCounter,
      file: picked.file,
      pages: picked.pages,
      type: picked.type,
      status: "pending",
      amount: picked.amount,
      isDone: false,
    };
    setOrders((prev) => [newOrder, ...prev]);
    setSimulatedCounter((c) => c + 1);
  };

  const handlePrint = (id: number) => {
    setPrintingId(id);
    setTimeout(() => {
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: "ready" } : o))
      );
      setPrintingId(null);
    }, 900);
  };

  const handleDone = (id: number) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, isDone: true, status: "collected" } : o))
    );
  };

  const handleReset = () => {
    setOrders(initialOrders);
  };

  return (
    <div className="relative mx-auto mt-10 sm:mt-14 max-w-5xl text-left">
      {/* Dynamic Mode Switcher Bar */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-1.5 rounded-xl border border-border/80 bg-card p-1 shadow-xs">
          <button
            onClick={() => setActiveTab("printex")}
            className={`inline-flex items-center gap-2 rounded-lg px-3 sm:px-4 py-1.5 text-xs font-bold transition ${
              activeTab === "printex"
                ? "bg-teal text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            <span>⚡ Printex Counter Queue</span>
            <span className="hidden sm:inline-block rounded-md bg-white/20 px-1.5 py-0.2 text-[10px]">Live Demo</span>
          </button>
          <button
            onClick={() => setActiveTab("whatsapp")}
            className={`inline-flex items-center gap-2 rounded-lg px-3 sm:px-4 py-1.5 text-xs font-bold transition ${
              activeTab === "whatsapp"
                ? "bg-rose-600 text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>❌ The WhatsApp Chaos</span>
            <span className="hidden sm:inline-block rounded-md bg-white/20 px-1.5 py-0.2 text-[10px]">Before</span>
          </button>
        </div>

        {activeTab === "printex" && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSimulateOrder}
              className="inline-flex items-center gap-1.5 rounded-lg border border-teal/40 bg-teal-soft px-3 py-1.5 text-xs font-bold text-teal hover:bg-teal hover:text-white transition shadow-xs active:scale-95"
            >
              <span>+ Simulate Customer Scan</span>
            </button>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary transition active:scale-95"
              title="Reset sample orders"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      <div className="card overflow-hidden shadow-[var(--shadow-float)] border">
        {/* Browser Mockup Top Bar */}
        <div className="flex items-center justify-between border-b bg-secondary px-3.5 sm:px-4 py-2 sm:py-2.5">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
            <span className="ml-2 sm:ml-3 rounded-md bg-card px-2.5 sm:px-3 py-0.5 text-[11px] sm:text-xs font-mono text-muted-foreground truncate max-w-[200px] sm:max-w-none">
              printex.in/dashboard
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Counter Active
            </span>
          </div>
        </div>

        {activeTab === "printex" ? (
          <div className="grid md:grid-cols-[180px_1fr]">
            {/* Desktop Sidebar */}
            <aside className="hidden border-r p-4 md:block bg-card/50">
              <p className="text-sm font-semibold truncate text-navy">{DEMO_SHOP.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">Pune, Maharashtra</p>
              {["Overview", "Print Orders", "My Shop QR", "Shop Profile", "Settings"].map((l, i) => (
                <p
                  key={l}
                  className={`mt-2 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                    i === 1 ? "bg-teal-soft font-semibold text-teal" : "text-muted-foreground"
                  }`}
                >
                  {l}
                </p>
              ))}
              <div className="mt-8 rounded-xl border border-teal/20 bg-teal-soft/60 p-3 text-center">
                <QrCode className="mx-auto h-8 w-8 text-teal" />
                <p className="mt-1 text-[11px] font-bold text-navy">Counter QR Active</p>
                <p className="text-[10px] text-muted-foreground">Scan & print instantly</p>
              </div>
            </aside>

            {/* Main Content Area */}
            <div className="p-3.5 sm:p-5 md:p-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
                {[
                  [FileText, "Total Orders", orders.length],
                  [Clock, "Pending to Print", pendingCount],
                  [CheckCircle2, "Virus Risk", "0% (Cloud)"],
                  [IndianRupee, "Total Value", `₹${totalRev}`],
                ].map(([I, l, v]) => {
                  const Ic = I as typeof FileText;
                  return (
                    <div key={l as string} className="rounded-xl border bg-card p-2.5 sm:p-3 shadow-xs">
                      <Ic className="h-4 w-4 text-teal" />
                      <p className="mt-1.5 text-[10px] sm:text-xs text-muted-foreground truncate">{l as string}</p>
                      <p className="font-display text-base sm:text-lg font-bold text-navy truncate">{v as string}</p>
                    </div>
                  );
                })}
              </div>

              {/* Interactive Orders List (Mobile) */}
              <div className="mt-4 space-y-2.5 sm:hidden">
                <div className="flex items-center justify-between px-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  <span>Interactive Queue</span>
                  <span className="text-teal text-[10px]">Try clicking Print or Done!</span>
                </div>
                {orders.map((o) => (
                  <div
                    key={o.id}
                    className={`rounded-xl border p-3 shadow-xs transition-all ${
                      o.isDone
                        ? "border-red-300 bg-red-50/60 opacity-80"
                        : "border-border bg-card"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className={`truncate font-bold text-xs ${o.isDone ? "text-red-900 line-through" : "text-navy"}`}>
                          {o.file}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {o.pages} pages · {o.type}
                        </p>
                      </div>
                      <span className={`shrink-0 font-bold text-xs ${o.isDone ? "text-red-700" : "text-navy"}`}>
                        ₹{o.amount}
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between border-t border-border/60 pt-2">
                      <div className="flex items-center gap-1.5">
                        {o.isDone ? (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                            Completed
                          </span>
                        ) : (
                          <StatusBadge status={o.status as any} />
                        )}
                        <span className="text-[10px] text-muted-foreground font-mono">#{o.id}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {o.isDone ? (
                          <span className="rounded-md border border-red-200 bg-red-100/80 px-2 py-1 text-[11px] font-semibold text-red-700 cursor-not-allowed">
                            Printed
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => handlePrint(o.id)}
                              disabled={printingId === o.id}
                              className="rounded-md bg-teal px-2.5 py-1 text-[11px] font-bold text-white hover:bg-teal/90 transition active:scale-95 disabled:opacity-50"
                            >
                              {printingId === o.id ? "Printing..." : "Print"}
                            </button>
                            <button
                              onClick={() => handleDone(o.id)}
                              className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-bold text-navy hover:bg-slate-100 transition active:scale-95"
                            >
                              Done
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Interactive Orders Table (Desktop) */}
              <div className="mt-4 hidden overflow-x-auto rounded-xl border sm:block">
                <table className="w-full text-xs">
                  <thead className="bg-secondary text-muted-foreground">
                    <tr>
                      <th className="px-3.5 py-2.5 text-left font-medium">Token & File</th>
                      <th className="px-3 py-2.5 text-left font-medium">Pages</th>
                      <th className="px-3 py-2.5 text-left font-medium">Type</th>
                      <th className="px-3 py-2.5 text-left font-medium">Status</th>
                      <th className="px-3 py-2.5 text-left font-medium">Amount</th>
                      <th className="px-3.5 py-2.5 text-right font-medium">Interactive Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {orders.map((o) => (
                      <tr
                        key={o.id}
                        className={`transition-colors ${
                          o.isDone
                            ? "bg-red-50/70 border-l-4 border-l-red-500"
                            : "hover:bg-muted/30"
                        }`}
                      >
                        <td className="px-3.5 py-2.5">
                          <span className="font-mono text-[11px] text-muted-foreground mr-1.5">#{o.id}</span>
                          <span className={`font-semibold ${o.isDone ? "text-red-900 line-through" : "text-navy"}`}>
                            {o.file}
                          </span>
                        </td>
                        <td className="px-3 text-muted-foreground">{o.pages}</td>
                        <td className="px-3 text-muted-foreground">{o.type}</td>
                        <td className="px-3">
                          {o.isDone ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                              Completed
                            </span>
                          ) : (
                            <StatusBadge status={o.status as any} />
                          )}
                        </td>
                        <td className={`px-3 font-bold ${o.isDone ? "text-red-700" : "text-navy"}`}>₹{o.amount}</td>
                        <td className="px-3.5 py-2 text-right">
                          {o.isDone ? (
                            <span className="inline-block rounded-md border border-red-200 bg-red-100/70 px-2.5 py-1 text-[11px] font-semibold text-red-700 cursor-not-allowed">
                              Printed
                            </span>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              <button
                                onClick={() => handlePrint(o.id)}
                                disabled={printingId === o.id}
                                className="inline-flex items-center gap-1 rounded-md bg-teal px-2.5 py-1 text-[11px] font-bold text-white hover:bg-teal/90 transition active:scale-95 disabled:opacity-50"
                              >
                                {printingId === o.id ? (
                                  <>
                                    <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                                    <span>Printing...</span>
                                  </>
                                ) : (
                                  <>
                                    <Printer className="h-3 w-3" />
                                    <span>Print</span>
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleDone(o.id)}
                                className="rounded-md border border-border bg-card px-2.5 py-1 text-[11px] font-bold text-navy hover:bg-secondary transition active:scale-95"
                              >
                                Done
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-right text-[11px] text-muted-foreground italic">
                💡 Tip: Click <strong>Print</strong> or <strong>Done</strong> above to test the real shopkeeper counter workflow!
              </p>
            </div>
          </div>
        ) : (
          /* The WhatsApp Chaos View */
          <div className="p-4 sm:p-8 bg-slate-900 text-white">
            <div className="mx-auto max-w-2xl rounded-2xl border border-rose-500/30 bg-rose-950/20 p-5 backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-rose-500/20 text-rose-400 font-bold text-xs">
                    47
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-white">WhatsApp Xerox Counter Inbox</h4>
                    <p className="text-[11px] text-rose-300">47 unread messages · Cluttered personal chats</p>
                  </div>
                </div>
                <span className="rounded-full bg-rose-500/20 px-2.5 py-0.5 text-[10px] font-bold text-rose-300 uppercase">
                  Before Printex
                </span>
              </div>

              <div className="mt-4 space-y-2.5 text-xs">
                <div className="rounded-xl bg-slate-800/80 p-3 border border-white/5">
                  <p className="font-semibold text-rose-400">Student 1 (10:14 AM):</p>
                  <p className="text-slate-300">"Bhaiya 15 minute pehle PDF bheja tha, print nikaal diya kya? Main jaldi mein hoon!"</p>
                </div>
                <div className="rounded-xl bg-slate-800/80 p-3 border border-white/5">
                  <p className="font-semibold text-rose-400">Customer 2 (10:16 AM):</p>
                  <p className="text-slate-300">"Bhaiya black & white bola tha, aapne colour nikaal ke ₹40 maang rahe ho! Main itna nahi dunga."</p>
                </div>
                <div className="rounded-xl bg-slate-800/80 p-3 border border-white/5">
                  <p className="font-semibold text-rose-400">College Student (10:18 AM):</p>
                  <p className="text-slate-300">"Bhaiya pen drive mein 4 folders hain. Final wala project folder print kar do, antivirus off karke lagana!"</p>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-center">
                <p className="text-xs font-bold text-rose-300">
                  ⚠️ 5 to 7 minutes wasted per customer · Risk of PC malware · Manual page count arguments
                </p>
                <button
                  onClick={() => setActiveTab("printex")}
                  className="btn btn-teal mt-3 text-xs py-2 px-4 shadow-sm"
                >
                  ⚡ Switch to Printex Clean Queue
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
