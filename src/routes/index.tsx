import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import {
  QrCode, Upload, Search, Bell, FileText, IndianRupee, Clock, CheckCircle2, Smartphone,
  LayoutDashboard, MessageCircle, Calculator, Shield, Star, Menu, X, Mail, Phone, MapPin,
  Sparkles, ShieldCheck, Zap, Printer, Check, ShieldAlert, ArrowRight, RefreshCw, AlertTriangle,
  TrendingUp, MousePointer2, PieChart, Layers, ChevronDown, ChevronRight
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { StatusBadge } from "@/components/StatusBadge";
import { DEMO_SHOP, searchShops, getMyShop } from "@/lib/shop-store";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import howItWorksVideo from "@/assets/how-it-works-animation.mp4";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Printex — Manage Every Print Order in One Place" },
      { name: "description", content: "The Smarter Way to Run Your Print Shop. Customers scan your counter QR code, upload files, and you manage every order with instant pricing from one screen." },
      { property: "og:title", content: "Printex — Manage Every Print Order in One Place" },
      { property: "og:description", content: "The Smarter Way to Run Your Print Shop. Your own shop QR code, instant file uploads, and a single dashboard for every print order." },
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

      {/* Hero Section - 2-Column Dribbble Inspired Layout */}
      <section className="relative overflow-hidden pt-8 pb-14 md:pt-14 md:pb-20">
        <div className="bg-grid absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)] pointer-events-none" />
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-[420px] w-[900px] rounded-full bg-gradient-to-r from-teal/15 via-indigo-500/10 to-amber-500/10 blur-3xl opacity-75" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            {/* Left Column: Heading, Subheading & CTAs */}
            <div className="lg:col-span-6 text-left">
              <InteractiveHeroBadge />

              <h1 className="fade-up mt-5 text-3xl sm:text-5xl lg:text-5xl xl:text-6xl font-extrabold leading-[1.12] tracking-tight text-navy">
                Manage Every Print Order in <span className="text-teal">One Place.</span>
              </h1>

              <p className="mt-4 text-xl sm:text-2xl font-bold text-navy/90 tracking-tight leading-snug">
                The Smarter Way to Run Your Print Shop.
              </p>

              <p className="mt-3 max-w-lg text-sm sm:text-base text-muted-foreground leading-relaxed">
                Streamline your counter end-to-end. Customers scan your shop QR, choose print options, and you see every order with auto-counted pages and exact price calculated.
              </p>

              <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Link
                  to="/register"
                  className="btn btn-primary px-7 py-3.5 min-h-[48px] text-sm font-bold shadow-lg shadow-navy/20 rounded-xl justify-center"
                >
                  Get Started
                </Link>
                <button
                  onClick={() => setFindOpen(true)}
                  className="btn btn-outline px-6 py-3.5 min-h-[48px] text-sm font-semibold rounded-xl justify-center"
                >
                  <Upload className="h-4 w-4" /> Test Customer Upload
                </button>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground border-t border-border/60 pt-4">
                <span className="inline-flex items-center gap-1.5 font-medium"><ShieldCheck className="h-3.5 w-3.5 text-teal" /> 100% Virus-Free (No USBs)</span>
                <span className="inline-flex items-center gap-1.5 font-medium"><Zap className="h-3.5 w-3.5 text-amber-500" /> 10-Second Turnaround</span>
                <span className="inline-flex items-center gap-1.5 font-medium"><IndianRupee className="h-3.5 w-3.5 text-emerald-600" /> Auto Page & UPI Calculations</span>
              </div>
            </div>

            {/* Right Column: Dribbble-Style Hero Visual Composition (NO HUMAN PHOTOS) */}
            <div className="lg:col-span-6 relative">
              <HeroVisualComposition />
            </div>
          </div>
        </div>
      </section>

      {/* Why Shop Owners Switch Section */}
      <section id="why-switch" className="scroll-mt-20 border-t bg-gradient-to-b from-white via-slate-50/70 to-white py-16 sm:py-20">
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
            {/* Card 1 */}
            <div className="group rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs hover:border-blue-500/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between">
              <div>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600 font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                  <MessageCircle className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-bold text-navy text-base">Zero WhatsApp Clutter</h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
                  No personal phone numbers handed out or 50 student PDFs cluttering your phone memory and chat list.
                </p>
              </div>
              <div className="mt-5 rounded-xl bg-slate-50 border border-slate-100 p-2.5 text-[11px] text-slate-600 font-medium">
                <span className="text-slate-700 font-bold">✕ Old way:</span> Searching buried WhatsApp chats
              </div>
            </div>

            {/* Card 2 */}
            <div className="group rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs hover:border-blue-500/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between">
              <div>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600 font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-bold text-navy text-base">100% Virus-Free Counter</h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Never insert a stranger's infected USB pen-drive into your shop's billing computer again. Files land securely online.
                </p>
              </div>
              <div className="mt-5 rounded-xl bg-slate-50 border border-slate-100 p-2.5 text-[11px] text-slate-600 font-medium">
                <span className="text-blue-600 font-bold">✓ Printex:</span> Touchless QR cloud transfer
              </div>
            </div>

            {/* Card 3 */}
            <div className="group rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs hover:border-blue-500/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between">
              <div>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600 font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                  <Calculator className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-bold text-navy text-base">Automatic Page & Price</h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
                  PDF pages are counted automatically with B/W and colour pricing pre-calculated. Zero rate disputes with customers.
                </p>
              </div>
              <div className="mt-5 rounded-xl bg-slate-50 border border-slate-100 p-2.5 text-[11px] text-slate-600 font-medium">
                <span className="text-blue-600 font-bold">✓ Printex:</span> Exact upfront amount ready
              </div>
            </div>

            {/* Card 4 */}
            <div className="group rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs hover:border-blue-500/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between">
              <div>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600 font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                  <Zap className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-bold text-navy text-base">10-Second Turnaround</h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Customers get a Token Number. Click [Print], hand over pages, hit [Done], and seamlessly take the next order.
                </p>
              </div>
              <div className="mt-5 rounded-xl bg-slate-50 border border-slate-100 p-2.5 text-[11px] text-slate-600 font-medium">
                <span className="text-blue-600 font-bold">⚡ Rush Hour:</span> 3x faster counter throughput
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works: Video Animation on Left + 3 Points in Short on Right */}
      <section id="how-it-works" className="scroll-mt-20 border-y border-slate-200/80 bg-slate-50/70 py-20 lg:py-24 overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-600 shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" /> How It Works
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-extrabold text-navy tracking-tight">
              From customer phone to your printer in 3 steps
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-500 max-w-xl mx-auto leading-relaxed">
              No WhatsApp chaos, no virus-prone pen-drives. An effortless touchless counter workflow.
            </p>
          </div>

          {/* 2-Column Showcase: Left Video Animation + Right Points in Short */}
          <div className="mt-12 sm:mt-16 grid gap-8 lg:gap-12 lg:grid-cols-12 items-center">
            
            {/* Left: Video Showcase (Depicting the steps in animation) */}
            <div className="lg:col-span-7">
              <div className="relative group">
                {/* Ambient Blue Back-Glow */}
                <div className="pointer-events-none absolute -inset-2 rounded-[32px] bg-gradient-to-tr from-blue-600/20 via-blue-500/10 to-transparent blur-2xl -z-10" />

                {/* Video Showcase Card */}
                <div className="relative rounded-[26px] sm:rounded-[32px] border border-slate-200/90 bg-white p-3 sm:p-4 shadow-xl hover:shadow-2xl transition-all duration-300">
                  {/* Top Bar with Status Badge */}
                  <div className="flex items-center justify-between px-2 pb-3 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                      <span className="ml-2 text-[11px] font-mono text-slate-400 hidden sm:inline">printex-counter-flow.mp4</span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-600 border border-blue-200/60">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                      Touchless Animation
                    </span>
                  </div>

                  {/* Video Player Container */}
                  <div className="relative overflow-hidden rounded-2xl bg-slate-950 aspect-video shadow-inner">
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="auto"
                      className="w-full h-full object-cover"
                    >
                      <source src={howItWorksVideo} type="video/mp4" />
                      <source src="/how-it-works-animation.mp4" type="video/mp4" />
                      Your browser does not support HTML5 video.
                    </video>
                  </div>

                  {/* Bottom Milestone Bar */}
                  <div className="mt-3.5 grid grid-cols-3 gap-2 px-1 text-center">
                    <div className="rounded-xl bg-slate-50 border border-slate-100 py-2 px-2">
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Step 1</p>
                      <p className="text-xs font-semibold text-slate-700 truncate mt-0.5">Scan Desk QR</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-100 py-2 px-2">
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Step 2</p>
                      <p className="text-xs font-semibold text-slate-700 truncate mt-0.5">Upload & Choose</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-100 py-2 px-2">
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Step 3</p>
                      <p className="text-xs font-semibold text-slate-700 truncate mt-0.5">1-Click Print</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Points in Short */}
            <div className="lg:col-span-5 flex flex-col gap-4 sm:gap-5">
              {[
                {
                  step: "01",
                  icon: QrCode,
                  title: "Display your QR",
                  desc: "Stick your shop's unique QR poster at the billing desk. Customers scan directly with their phone camera—no app download needed.",
                  tag: "Zero app download",
                },
                {
                  step: "02",
                  icon: Smartphone,
                  title: "Customer uploads",
                  desc: "Customers pick PDFs/images, choose B/W or Colour, sides & copies. Exact transparent pricing is calculated upfront.",
                  tag: "Auto page calculation",
                },
                {
                  step: "03",
                  icon: Printer,
                  title: "You print & collect",
                  desc: "Orders land on your shop screen instantly. Hit Print, collect payment via your normal QR or cash, and hand over the printout.",
                  tag: "3x faster counter",
                },
              ].map(({ step, icon: Icon, title, desc, tag }) => (
                <div
                  key={step}
                  className="group relative rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-5 shadow-xs hover:border-blue-400 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start gap-4">
                    {/* Step Icon & Number Badge */}
                    <div className="shrink-0">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200 shadow-xs">
                        <Icon className="h-6 w-6" />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-base sm:text-lg font-bold text-navy group-hover:text-blue-600 transition-colors duration-150">
                          {title}
                        </h3>
                        <span className="text-xs font-mono font-extrabold text-blue-600/70">
                          {step}
                        </span>
                      </div>
                      <p className="mt-1 text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {desc}
                      </p>
                      <div className="mt-2.5">
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors duration-150">
                          <Check className="h-3 w-3 text-blue-600" />
                          {tag}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* Features - Premium Bento Grid Architecture */}
      <section id="features" className="scroll-mt-16 py-20 bg-gradient-to-b from-white via-slate-50/60 to-white border-t">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/30 bg-teal-soft px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-teal shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-teal" /> Features
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-extrabold text-navy tracking-tight">
              Everything a Busy Print Counter Needs.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Eliminate daily counter friction, speed up rush hour by 3x, and give customers a seamless modern experience.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-12">
            
            {/* Bento 1: Large Featured Card (lg:col-span-7) - Unique Counter QR & Stand */}
            <div className="lg:col-span-7 rounded-3xl border border-slate-900 bg-slate-950 text-white p-6 sm:p-8 flex flex-col justify-between shadow-xl relative overflow-hidden group">
              {/* Decorative radial glow */}
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-teal/20 blur-3xl group-hover:bg-teal/30 transition-all duration-500" />

              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-teal/15 border border-teal/30 px-3 py-1 text-[11px] font-bold text-teal uppercase tracking-wider">
                    <QrCode className="h-3.5 w-3.5" /> 1-Click Setup
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Instant A4 / Acrylic Print</span>
                </div>

                <h3 className="mt-4 text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Unique Counter QR Code & Ready-to-Print Poster
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md">
                  Every shop gets its permanent branded QR code. Download the pre-formatted A4 poster, stick it on your counter desk, and customers upload directly from their phones.
                </p>
              </div>

              {/* Visual Micro Preview of the Counter Poster */}
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="rounded-xl bg-white p-3 shadow-lg shrink-0 text-center">
                    <QrCode className="h-14 w-14 text-navy mx-auto" />
                    <p className="text-[9px] font-bold text-navy mt-1 uppercase tracking-wider">Scan to Print</p>
                  </div>
                  <div className="space-y-1.5 text-center sm:text-left min-w-0 flex-1">
                    <div className="inline-block rounded-md bg-teal/20 px-2 py-0.5 text-[10px] font-bold text-teal">
                      No App Download Required
                    </div>
                    <p className="text-xs font-semibold text-white">Works with iPhone, Android & WhatsApp</p>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Students scan the QR code right at your front glass or counter desk — no phone numbers saved, zero waiting in line.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bento 2: Auto Page & Pricing Engine (lg:col-span-5) */}
            <div className="lg:col-span-5 rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 flex flex-col justify-between shadow-card hover:shadow-xl transition-all duration-300 group">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200/60 px-3 py-1 text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                  <Calculator className="h-3.5 w-3.5" /> Instant Pricing
                </span>
                <h3 className="mt-4 text-xl font-bold text-navy">
                  Auto Page Count & Price Engine
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  PDF pages are counted automatically. Set your B/W, colour, and double-sided rates once — customers see upfront estimates with zero price disputes.
                </p>
              </div>

              {/* Visual Micro Calculator Card */}
              <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-navy flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-teal" /> College_Notes.pdf
                  </span>
                  <span className="rounded-md bg-blue-100/80 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                    24 pages detected
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200/60 pt-2 text-xs">
                  <span className="text-muted-foreground">B/W · Double-Sided (₹1.5/pg)</span>
                  <span className="font-extrabold text-navy text-sm">Total: ₹36.00</span>
                </div>
              </div>
            </div>

            {/* Bento 3: 100% Virus-Free Shield (lg:col-span-4) */}
            <div className="lg:col-span-4 rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 flex flex-col justify-between shadow-card hover:shadow-xl transition-all duration-300">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200/60 px-3 py-1 text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                  <ShieldCheck className="h-3.5 w-3.5" /> Zero Hardware Risk
                </span>
                <h3 className="mt-4 text-lg font-bold text-navy">
                  100% Virus-Free (No USBs)
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Protect your counter billing PC from malware, shortcut worms, and Trojan viruses found on customer pen-drives.
                </p>
              </div>

              <div className="mt-5 space-y-2">
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-100/80 p-2 text-[11px]">
                  <span className="font-bold text-slate-700">✕ USB Pen Drive</span>
                  <span className="text-slate-500 font-medium">Infected files & slow</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-blue-200/80 bg-blue-50 p-2 text-[11px]">
                  <span className="font-bold text-blue-700">✓ Direct QR Cloud</span>
                  <span className="text-blue-700 font-medium">100% Sandboxed & Safe</span>
                </div>
              </div>
            </div>

            {/* Bento 4: Live Order Queue with Done Tracking (lg:col-span-4) */}
            <div className="lg:col-span-4 rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 flex flex-col justify-between shadow-card hover:shadow-xl transition-all duration-300">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200/60 px-3 py-1 text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                  <Zap className="h-3.5 w-3.5" /> Counter Speed
                </span>
                <h3 className="mt-4 text-lg font-bold text-navy">
                  10-Second Queue & "Done" Tracking
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Every order lands in your live queue. Click [Print], hand over pages, and hit [Done] to subtract from pending counts automatically.
                </p>
              </div>

              {/* Micro Status Queue Simulation */}
              <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-navy">Token #18</span>
                  <span className="rounded-md bg-teal px-2 py-0.5 text-[10px] font-bold text-white">Printing</span>
                </div>
                <div className="flex items-center justify-between text-xs border-t border-slate-200/60 pt-1.5">
                  <span className="font-medium text-slate-400 line-through">Token #17</span>
                  <span className="rounded-md bg-slate-100 text-slate-600 px-2 py-0.5 text-[10px] font-bold">Done ✓</span>
                </div>
              </div>
            </div>

            {/* Bento 5: WhatsApp Direct Fallback (lg:col-span-4) */}
            <div className="lg:col-span-4 rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 flex flex-col justify-between shadow-card hover:shadow-xl transition-all duration-300">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200/60 px-3 py-1 text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                  <MessageCircle className="h-3.5 w-3.5" /> Always Connected
                </span>
                <h3 className="mt-4 text-lg font-bold text-navy">
                  WhatsApp Fallback Built-In
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  For customers who still prefer WhatsApp, your shop profile generates a direct 1-click WhatsApp chat link with pre-filled details.
                </p>
              </div>

              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center justify-between text-xs">
                <span className="font-bold text-navy flex items-center gap-1.5">
                  <MessageCircle className="h-4 w-4 text-blue-600" /> WhatsApp Chat
                </span>
                <span className="text-[11px] text-blue-600 font-semibold">1-Tap Send ↗</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Dual Moving Testimonials Marquee Section */}
      <DualMovingTestimonialsSection />


      {/* Redesigned Modern Footer */}
      <footer id="contact" className="scroll-mt-16 border-t border-slate-800 bg-slate-950 text-slate-300">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-16 pb-12">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12">
            
            {/* Col 1: Brand & Operational Status (lg:col-span-4) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="inline-block rounded-xl bg-white p-2.5 shadow-sm">
                <Logo className="h-6" />
              </div>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
                The smart operating system for Indian photocopy, xerox, and digital printing businesses. Replace WhatsApp chaos with a touchless counter queue.
              </p>
              
              {/* Live Status Pill */}
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>All Systems Operational</span>
              </div>
            </div>

            {/* Col 2: Product & Platform (lg:col-span-2) */}
            <div className="lg:col-span-2 space-y-3 text-xs sm:text-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-white">Platform</p>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#features" className="hover:text-teal transition-colors">Bento Features</a></li>
                <li><a href="#reviews" className="hover:text-teal transition-colors">Shop Reviews</a></li>
                <li><Link to="/register" className="hover:text-teal transition-colors">Register Shop (Free)</Link></li>
                <li><Link to="/auth" className="hover:text-teal transition-colors">Owner Sign In</Link></li>
                <li><button onClick={() => setFindOpen(true)} className="hover:text-teal transition-colors text-left">Find Shop</button></li>
              </ul>
            </div>

            {/* Col 3: Counter Solutions (lg:col-span-3) */}
            <div className="lg:col-span-3 space-y-3 text-xs sm:text-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-white">Counter Tools</p>
              <ul className="space-y-2 text-slate-400">
                <li><span className="text-slate-300 font-medium">Printable Counter QR Stand</span></li>
                <li><span className="text-slate-300 font-medium">Auto PDF Page Detection</span></li>
                <li><span className="text-slate-300 font-medium">Instant B/W & Colour Pricing</span></li>
                <li><span className="text-slate-300 font-medium">100% Virus-Free Isolation</span></li>
                <li><span className="text-slate-300 font-medium">1-Click Done Queue Ledger</span></li>
              </ul>
            </div>

            {/* Col 4: Contact & Support (lg:col-span-3) */}
            <div className="lg:col-span-3 space-y-3 text-xs sm:text-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-white">Support & Contact</p>
              <div className="space-y-2 text-slate-400">
                <a href="mailto:contact.printex@gmail.com" className="flex items-center gap-2 hover:text-teal transition-colors">
                  <Mail className="h-4 w-4 text-teal" /> contact.printex@gmail.com
                </a>
                <a href="tel:+918957759289" className="flex items-center gap-2 hover:text-teal transition-colors">
                  <Phone className="h-4 w-4 text-teal" /> +91 89577 59289
                </a>
                <p className="flex items-center gap-2 text-slate-400">
                  <MapPin className="h-4 w-4 text-teal" /> Delhi, India
                </p>
                <p className="text-[11px] text-slate-500 pt-1">
                  Support: Mon - Sat, 9:00 AM - 9:00 PM IST
                </p>
              </div>
            </div>

          </div>

          {/* Bottom Copyright & Guarantee Sub-bar */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800/80 pt-6 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} Printex. Built for Indian xerox & print counters.</p>
            <div className="flex flex-wrap items-center gap-4 text-slate-400">
              <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-teal" /> 100% Privacy Protected</span>
              <span className="inline-flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-amber-400" /> Fast & Virus-Free</span>
              <span>🇮🇳 Made in India</span>
            </div>
          </div>
        </div>
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

function InteractiveHeroBadge() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative inline-block text-left z-30">
      {/* Interactive Main Pill Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group relative inline-flex items-center gap-2 rounded-full border border-teal/40 bg-gradient-to-r from-teal-soft/95 via-white to-teal-soft/95 p-1 pr-3 text-xs font-semibold text-navy shadow-xs hover:border-teal hover:shadow-md transition-all duration-200 active:scale-95 cursor-pointer"
        aria-expanded={isOpen}
      >
        {/* Animated pulsating radar dot */}
        <span className="relative flex h-2 w-2 ml-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-teal" />
        </span>

        {/* Indian Flag & Text */}
        <span className="flex items-center gap-1.5 font-extrabold text-navy text-[11px] sm:text-xs tracking-tight">
          <span className="text-sm leading-none">🇮🇳</span>
          <span>Built for Indian Xerox & Print Counters</span>
        </span>

        {/* Interactive Action Indicator Chip */}
        <span className="inline-flex items-center gap-1 rounded-full bg-teal/10 px-2 py-0.5 text-[10px] font-bold text-teal group-hover:bg-teal group-hover:text-white transition-colors">
          <span className="hidden sm:inline">{isOpen ? "Close" : "See Why"}</span>
          <ChevronDown
            className={`h-3 w-3 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </span>
      </button>

      {/* Expandable Glassmorphic Insight Popover */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 z-40 w-80 sm:w-96 rounded-2xl border border-teal/30 bg-white/98 p-4 text-navy shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🇮🇳</span>
              <span className="text-xs font-bold text-navy">Why Indian Counters Need Printex</span>
            </div>
            <span className="rounded-full bg-teal-soft px-2 py-0.5 text-[10px] font-bold text-teal">
              1,200+ Shops Live
            </span>
          </div>

          <div className="mt-3 space-y-2.5 text-xs">
            <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-2.5 border border-slate-100">
              <span className="text-base select-none">🛡️</span>
              <div>
                <p className="font-bold text-navy">Zero Pen-Drive Shortcut Viruses</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                  Customer USB sticks frequently carry shortcut malware that corrupts billing PCs. Printex keeps files 100% cloud-isolated.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-2.5 border border-slate-100">
              <span className="text-base select-none">💬</span>
              <div>
                <p className="font-bold text-navy">No Buried WhatsApp Chats</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                  Stop sharing personal numbers or digging through 50 unread student PDFs during rush hour.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-2.5 border border-slate-100">
              <span className="text-base select-none">₹</span>
              <div>
                <p className="font-bold text-navy">Automatic Page & UPI Calculations</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                  Instant PDF page detection eliminates manual math arguments with customers over B/W vs colour rates.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px]">
            <span className="text-[10px] text-muted-foreground font-mono">Pune · Delhi · Chennai · Lucknow</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="font-bold text-teal hover:underline text-xs"
            >
              Close ✓
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function HeroVisualComposition() {
  return (
    <div className="relative mx-auto max-w-lg lg:max-w-none pt-4 pb-8 sm:py-6">
      {/* Diffused ambient backglow */}
      <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-gradient-to-tr from-teal/20 via-sky-400/10 to-amber-300/10 blur-2xl" />

      {/* Floating 4-point decorative star */}
      <span className="absolute -top-3 left-6 text-teal text-xl select-none font-bold animate-pulse">✦</span>
      <span className="absolute bottom-1 right-8 text-navy/40 text-lg select-none font-bold">✦</span>

      {/* Main Central Card */}
      <div className="relative rounded-2xl border border-slate-200/90 bg-white shadow-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_25px_50px_-12px_rgba(13,148,136,0.22)]">
        <div className="grid grid-cols-[44px_1fr] sm:grid-cols-[48px_1fr]">
          {/* Left Vertical Dark Tool Palette (Zenbase screenshot style) */}
          <div className="bg-slate-950 flex flex-col items-center py-4 gap-3 text-slate-400 border-r border-slate-800">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-teal text-white shadow-xs" title="Live Counter Queue">
              <LayoutDashboard className="h-3.5 w-3.5" />
            </span>
            <span className="grid h-7 w-7 place-items-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition" title="Print Orders">
              <FileText className="h-3.5 w-3.5" />
            </span>
            <span className="grid h-7 w-7 place-items-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition" title="Instant Pricing">
              <Calculator className="h-3.5 w-3.5" />
            </span>
            <span className="grid h-7 w-7 place-items-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition" title="Shop QR Code">
              <QrCode className="h-3.5 w-3.5" />
            </span>
            <span className="grid h-7 w-7 place-items-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition mt-auto" title="Layers">
              <Layers className="h-3.5 w-3.5" />
            </span>
          </div>

          {/* Right Main Widget Canvas */}
          <div className="p-3.5 sm:p-5 bg-gradient-to-b from-slate-50/50 to-white">
            {/* Top 4 Stat Blocks (Exact Zenbase 4-metric grid) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Orders</p>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-base sm:text-lg font-extrabold text-navy font-display">28</span>
                  <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded">
                    ↑ 14%
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Pending</p>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-base sm:text-lg font-extrabold text-navy font-display">3</span>
                  <span className="inline-flex items-center text-[10px] font-bold text-amber-600 bg-amber-50 px-1 py-0.2 rounded">
                    ⚡ Live
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Revenue</p>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-base sm:text-lg font-extrabold text-navy font-display">₹1,840</span>
                  <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded">
                    ↑ 22%
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Turnaround</p>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-base sm:text-lg font-extrabold text-navy font-display">10s</span>
                  <span className="inline-flex items-center text-[10px] font-bold text-teal bg-teal-soft px-1 py-0.2 rounded">
                    Fast
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Visual: Counter Rush Hour Volume Bar Chart */}
            <div className="mt-3.5 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-navy flex items-center gap-1.5">
                    <TrendingUp className="h-3 w-3 text-teal" /> Counter Rush Hours
                  </p>
                  <p className="text-[10px] text-muted-foreground">Live volume across college & office hours</p>
                </div>
                <span className="rounded-full bg-teal-soft px-2 py-0.5 text-[10px] font-bold text-teal">
                  98% On-Time
                </span>
              </div>

              {/* Bar Chart Visual with peak highlight and cursor pointer */}
              <div className="relative mt-3 pt-4 pb-1">
                <div className="flex items-end justify-between gap-2 h-20 px-2 border-b border-slate-100">
                  {[
                    { time: "9 AM", height: "36%", isPeak: false },
                    { time: "11 AM", height: "65%", isPeak: false },
                    { time: "1 PM", height: "96%", isPeak: true },
                    { time: "3 PM", height: "52%", isPeak: false },
                    { time: "5 PM", height: "82%", isPeak: false },
                    { time: "7 PM", height: "40%", isPeak: false },
                  ].map((bar) => (
                    <div key={bar.time} className="flex-1 flex flex-col items-center gap-1 group">
                      <div className="w-full max-w-[28px] h-full flex items-end justify-center">
                        <div
                          style={{ height: bar.height }}
                          className={`w-full rounded-t-md transition-all duration-300 ${
                            bar.isPeak
                              ? "bg-gradient-to-t from-teal to-blue-400 shadow-md shadow-teal/30 ring-2 ring-teal/30"
                              : "bg-slate-200 hover:bg-slate-300"
                          }`}
                        />
                      </div>
                      <span className={`text-[9px] font-mono ${bar.isPeak ? "font-bold text-teal" : "text-slate-400"}`}>
                        {bar.time}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Simulated Cursor Pointer on 1 PM Peak */}
                <div className="absolute top-1 left-[40%] flex items-center gap-1 -translate-x-1/2 pointer-events-none">
                  <div className="rounded-md bg-navy px-1.5 py-0.5 text-[9px] font-bold text-white shadow-md">
                    Rush Peak: 42/hr
                  </div>
                  <MousePointer2 className="h-3.5 w-3.5 text-navy fill-navy -rotate-45" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Satellite Card 1 (Top-Right, Replacing Human Photo with Live Counter Scan!) */}
      <div className="absolute -top-3 sm:-top-5 -right-2 sm:-right-4 z-20 w-48 sm:w-56 rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-md p-3 shadow-xl transition hover:-translate-y-1">
        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Customer Scan
          </span>
          <span className="text-[9px] font-mono text-muted-foreground">2s ago</span>
        </div>
        <div className="mt-2 flex items-start gap-2">
          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-teal-soft text-teal">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-navy" title="Resume_Final_2026.pdf">
              Resume_Final_2026.pdf
            </p>
            <p className="text-[10px] text-muted-foreground">2 pgs · Colour Single</p>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-1.5 text-xs">
          <span className="font-extrabold text-navy">₹20.00</span>
          <span className="rounded-full bg-teal-soft px-2 py-0.5 text-[10px] font-bold text-teal">
            Ready to Print
          </span>
        </div>
      </div>

      {/* Floating Satellite Card 2 (Bottom-Left, Replacing Human Photo with Auto-Priced Order!) */}
      <div className="absolute -bottom-6 -left-2 sm:-left-4 z-20 w-52 sm:w-60 rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-md p-3 shadow-xl transition hover:-translate-y-1">
        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
          <span className="flex items-center gap-1 text-[10px] font-bold text-teal">
            <Zap className="h-3 w-3 text-amber-500" />
            Auto-Calculated Order
          </span>
          <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[9px] font-mono text-slate-600 font-bold">
            Token #102
          </span>
        </div>
        <div className="mt-2 flex items-start gap-2">
          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-600">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-navy" title="DBMS_Unit4_Notes.pdf">
              DBMS_Unit4_Notes.pdf
            </p>
            <p className="text-[10px] text-muted-foreground">38 pages · B/W Double</p>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-1.5">
          <div>
            <span className="text-[9px] text-muted-foreground">Pre-calculated</span>
            <p className="text-xs font-extrabold text-navy">₹57.00</p>
          </div>
          <span className="rounded-lg bg-teal px-2.5 py-1 text-[10px] font-bold text-white shadow-2xs">
            Print Ready ↗
          </span>
        </div>
      </div>

      {/* Floating Tool Pill (Bottom-Right, similar to black circular tool badge in Dribbble) */}
      <div className="hidden sm:flex absolute bottom-8 -right-3 z-20 items-center gap-1.5 rounded-full border border-slate-900 bg-slate-950 px-2.5 py-1 text-[10px] font-bold text-white shadow-lg">
        <ShieldCheck className="h-3 w-3 text-teal" />
        <span>100% Virus-Free</span>
      </div>
    </div>
  );
}

interface TestimonialItem {
  quote: string;
  name: string;
  shop: string;
  initials: string;
  gradient: string;
  badge: string;
}

const testimonialsRow1: TestimonialItem[] = [
  {
    quote: "Earlier students sent 50 files on WhatsApp and I lost track of payments. Now everything is queued with exact page counts, color breakdown, and instant UPI bills.",
    name: "Rajesh Sharma",
    shop: "Sai Xerox & Cyber Cafe · Pune",
    initials: "SX",
    gradient: "from-blue-600 to-indigo-600",
    badge: "No WhatsApp Chaos",
  },
  {
    quote: "Zero pen-drive shortcut viruses since we put the Printex standee on our counter. Customers scan with their own phones, and our billing PC stays completely safe.",
    name: "Amit Verma",
    shop: "Verma Print Graphics · Delhi (DU North)",
    initials: "VG",
    gradient: "from-slate-700 to-navy",
    badge: "Virus-Free Counter",
  },
  {
    quote: "Automatic page counting alone saves us 40 minutes every single day. No more arguments with customers over colour vs B/W rates; they see the transparent price upfront.",
    name: "Priya Sundaram",
    shop: "Campus Prints & Stationery · Chennai",
    initials: "CP",
    gradient: "from-sky-600 to-blue-700",
    badge: "Auto Page Calc",
  },
  {
    quote: "During semester project rush, 20 students upload at once. They select double-side or color right on their phone screen. We just hit Print and hand over the file.",
    name: "Vikram Patel",
    shop: "Balaji Photostat & Digital Press · Ahmedabad",
    initials: "BP",
    gradient: "from-blue-700 to-indigo-800",
    badge: "Peak Rush Ready",
  },
];

const testimonialsRow2: TestimonialItem[] = [
  {
    quote: "Customers get a WhatsApp status ping the moment their job is printed. Counter crowding dropped by 70% because students don't need to hover around asking 'Bhaiya hua kya?'",
    name: "Imran Qureshi",
    shop: "City Copy Centre · Lucknow (Hazratganj)",
    initials: "CC",
    gradient: "from-indigo-600 to-blue-800",
    badge: "1-Tap WhatsApp",
  },
  {
    quote: "The printable counter QR stand took 2 minutes to generate. Our walk-in customers scan, upload 100-page project reports in seconds, and pay via UPI effortlessly.",
    name: "K. Venkatesh",
    shop: "Sri Ganesh Digital Xerox · Bengaluru",
    initials: "SG",
    gradient: "from-blue-500 to-blue-700",
    badge: "2-Min QR Setup",
  },
  {
    quote: "As a female counter manager, I hated sharing my personal phone number with hundreds of walk-in strangers every day. Printex completely protected my privacy.",
    name: "Deepa Nair",
    shop: "Nair Documentation & Print Hub · Kochi",
    initials: "ND",
    gradient: "from-navy to-slate-800",
    badge: "100% Privacy",
  },
  {
    quote: "For quick Aadhaar and resume prints, customers scan from outside the counter while waiting. By the time they step up, their printout is already sitting in the collection tray.",
    name: "Manoj Chawla",
    shop: "Chawla Offset & Quick Xerox · Jaipur",
    initials: "CQ",
    gradient: "from-slate-800 to-slate-950",
    badge: "500+ Prints/Day",
  },
];

function DribbbleQuoteIcon({ className = "h-7 w-7 text-[#2563eb]" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
    </svg>
  );
}

function TestimonialCard({ item }: { item: TestimonialItem }) {
  return (
    <div className="w-[320px] sm:w-[380px] shrink-0 rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between select-none">
      <div>
        {/* Solid Blue Quote Icon */}
        <DribbbleQuoteIcon className="h-7 w-7 text-blue-600" />

        {/* Testimonial Quote */}
        <p className="mt-3.5 text-xs sm:text-[13.5px] leading-relaxed text-slate-600 font-normal min-h-[60px]">
          {item.quote}
        </p>
      </div>

      {/* Card Footer: Shop Monogram Circle, Owner Name & Shop Location */}
      <div className="mt-5 flex items-center gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${item.gradient} text-xs font-bold text-white shadow-xs`}
        >
          {item.initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-bold text-navy truncate">{item.name}</p>
          <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">{item.shop}</p>
        </div>
      </div>
    </div>
  );
}

function DualMovingTestimonialsSection() {
  return (
    <section id="reviews" className="scroll-mt-20 py-16 sm:py-24 bg-slate-50/60 border-t border-slate-200/80 overflow-hidden">
      {/* Centered Heading */}
      <div className="text-center mb-10 sm:mb-14 px-4 max-w-3xl mx-auto">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-navy">
          about our presence.
        </h2>
        <p className="mt-2.5 text-sm sm:text-base text-slate-500 font-medium">
          Loved by 1,200+ print & xerox counters across India
        </p>
      </div>

      {/* Dual Moving Marquee Container with Left & Right Fade Masks */}
      <div className="relative w-full overflow-hidden space-y-4 sm:space-y-6 pause-on-hover">
        {/* Left & Right Smooth Fade Masks */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 sm:w-36 bg-gradient-to-r from-slate-50/90 via-slate-50/60 to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-36 bg-gradient-to-l from-slate-50/90 via-slate-50/60 to-transparent z-10" />

        {/* Row 1: Moves Left (scrolling right-to-left) */}
        <div className="flex w-max gap-4 sm:gap-6 animate-marquee-left">
          {[...testimonialsRow1, ...testimonialsRow1].map((item, idx) => (
            <TestimonialCard key={`row1-${idx}`} item={item} />
          ))}
        </div>

        {/* Row 2: Moves Right (scrolling left-to-right, vice versa!) */}
        <div className="flex w-max gap-4 sm:gap-6 animate-marquee-right">
          {[...testimonialsRow2, ...testimonialsRow2].map((item, idx) => (
            <TestimonialCard key={`row2-${idx}`} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}


