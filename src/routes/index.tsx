import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  QrCode, Upload, Search, Bell, FileText, IndianRupee, Clock, CheckCircle2, Smartphone,
  LayoutDashboard, MessageCircle, Calculator, Shield, Star, Menu, X, Mail, Phone, MapPin,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { StatusBadge } from "@/components/StatusBadge";
import { DEMO_SHOP, searchShops, getMyShop } from "@/lib/shop-store";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Printex — Manage Your Print Shop in One Screen" },
      { name: "description", content: "Printex gives every Indian photocopy shop its own QR code. Customers upload files, you print from one dashboard." },
      { property: "og:title", content: "Printex — Manage Your Print Shop in One Screen" },
      { property: "og:description", content: "Your own shop QR code, instant file uploads, and a single dashboard for every print order." },
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
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-16 text-center md:pt-24">
          <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-semibold text-accent-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-teal" /> Built for Indian xerox & print shops
          </span>
          <h1 className="fade-up mx-auto mt-6 max-w-3xl text-3xl sm:text-4xl md:text-6xl font-bold leading-tight text-navy">
            Manage Your Print Shop in <span className="text-teal">One Screen.</span>
          </h1>
          <p className="mx-auto mt-4 sm:mt-5 max-w-xl text-sm sm:text-base text-muted-foreground md:text-lg">
            No more WhatsApp chaos or pen-drive viruses. Customers scan your shop QR, upload files, choose print options — you see every order with the price calculated.
          </p>
          <div className="mt-7 sm:mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/register" className="btn btn-teal px-6 py-3 min-h-[46px]"><QrCode className="h-4 w-4" /> Get My Shop QR Code</Link>
            <button onClick={() => setFindOpen(true)} className="btn btn-outline px-6 py-3 min-h-[46px]"><Upload className="h-4 w-4" /> Find Your Shop to Upload Files</button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Free to start · Setup in 2 minutes · No app download for customers</p>
          <DashboardPreview />
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
  const rows = [
    ["Resume_Final_v3.pdf", 2, "Colour · Single", "pending", 20],
    ["DBMS_Notes_Unit4.pdf", 38, "B/W · Double", "printing", 57],
    ["Rent_Agreement.pdf", 6, "B/W · Double", "ready", 9],
    ["Aadhaar_Card_Front.pdf", 1, "B/W · Single", "collected", 2],
  ] as const;
  return (
    <div className="relative mx-auto mt-16 max-w-5xl text-left">
      <div className="card overflow-hidden shadow-[var(--shadow-float)]">
        <div className="flex items-center gap-2 border-b bg-secondary px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" /><span className="h-2.5 w-2.5 rounded-full bg-warning/60" /><span className="h-2.5 w-2.5 rounded-full bg-success/60" />
          <span className="ml-3 rounded-md bg-card px-3 py-0.5 text-xs text-muted-foreground">printex.in/dashboard</span>
        </div>
        <div className="grid md:grid-cols-[180px_1fr]">
          <aside className="hidden border-r p-4 md:block">
            <p className="text-sm font-semibold">{DEMO_SHOP.name}</p>
            {["Overview", "Print Orders", "My Shop QR", "Shop Profile", "Settings"].map((l, i) => (
              <p key={l} className={`mt-2 rounded-lg px-2 py-1.5 text-xs ${i === 1 ? "bg-teal-soft font-semibold text-accent-foreground" : "text-muted-foreground"}`}>{l}</p>
            ))}
          </aside>
          <div className="p-4 md:p-6">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[[FileText, "Today's orders", "24"], [Clock, "Pending", "6"], [CheckCircle2, "Ready", "9"], [IndianRupee, "Revenue", "₹1,840"]].map(([I, l, v]) => {
                const Ic = I as typeof FileText;
                return (
                  <div key={l as string} className="rounded-xl border p-3">
                    <Ic className="h-4 w-4 text-teal" />
                    <p className="mt-2 text-xs text-muted-foreground">{l as string}</p>
                    <p className="font-display text-lg font-bold">{v as string}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 overflow-x-auto rounded-xl border">
              <table className="w-full text-xs">
                <thead className="bg-secondary text-muted-foreground"><tr>{["File", "Pages", "Type", "Status", "Amount"].map((h) => <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>)}</tr></thead>
                <tbody>
                  {rows.map(([f, p, t, s, a]) => (
                    <tr key={f} className="border-t">
                      <td className="px-3 py-2.5 font-medium">{f}</td><td className="px-3">{p}</td><td className="px-3 text-muted-foreground">{t}</td>
                      <td className="px-3"><StatusBadge status={s} /></td><td className="px-3 font-semibold">₹{a}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
