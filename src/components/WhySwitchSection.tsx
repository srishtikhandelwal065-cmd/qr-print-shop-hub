import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Zap, ShieldAlert, ShieldCheck, Clock, Smartphone,
  CheckCircle2, XCircle, ChevronDown, ChevronUp, Sparkles,
  QrCode, Copy, Check, ArrowRight, IndianRupee, Layers
} from "lucide-react";
import { shopUploadUrl, type Shop } from "@/lib/shop-store";

export function WhySwitchSection({ shop }: { shop: Shop }) {
  const [activeTab, setActiveTab] = useState<"comparison" | "superpowers" | "impact">("comparison");
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("printex_why_switch_collapsed") === "true";
      } catch {}
    }
    return false;
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("printex_why_switch_collapsed", String(isCollapsed));
      } catch {}
    }
  }, [isCollapsed]);

  const uploadLink = shopUploadUrl(shop.id);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(uploadLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <section className="relative overflow-hidden rounded-2xl border border-teal/30 bg-gradient-to-br from-slate-950 via-[#0e172a] to-slate-950 p-4 sm:p-6 text-white shadow-xl transition-all">
      {/* Decorative ambient glowing backdrops */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-teal/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

      {/* Top Banner Header */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-teal/40 bg-teal/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-teal">
            <Sparkles className="h-3 w-3" /> The Counter Transformation
          </div>
          <h2 className="mt-2 text-lg sm:text-xl md:text-2xl font-extrabold tracking-tight text-white">
            Say Goodbye to WhatsApp Chaos. <span className="text-teal">Run Your Counter on Auto-Pilot.</span>
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-2xl">
            Why leading xerox & photocopy owners replace scattered chats, infected pen-drives, and manual page counting with this professional 10-second queue.
          </p>
        </div>

        {/* Action controls: Collapse toggle */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition active:scale-95"
            title={isCollapsed ? "Expand section" : "Minimize section"}
          >
            <span>{isCollapsed ? "Expand Guide" : "Minimize"}</span>
            {isCollapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      {!isCollapsed && (
        <div className="relative mt-5 space-y-5">
          {/* Dynamic Interactive Tab Navigation */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "comparison", label: "⚡ The Rush Hour Difference", sub: "Old vs Printex" },
              { id: "superpowers", label: "🚀 3 Counter Superpowers", sub: "Speed & Safety" },
              { id: "impact", label: "📊 Your Daily Impact", sub: "ROI Metrics" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition active:scale-95 border ${
                  activeTab === tab.id
                    ? "bg-teal text-white border-teal shadow-md shadow-teal/20"
                    : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* TAB 1: SIDE-BY-SIDE HEAD-TO-HEAD COMPARISON */}
          {activeTab === "comparison" && (
            <div className="grid gap-4 md:grid-cols-2">
              {/* The Old WhatsApp / Pen-Drive Chaos */}
              <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-4 sm:p-5 backdrop-blur-sm space-y-3">
                <div className="flex items-center justify-between border-b border-rose-500/20 pb-2.5">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-rose-400 uppercase tracking-wider">
                    <XCircle className="h-4 w-4" /> The Old Chaotic Counter
                  </span>
                  <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                    High Stress · Slow
                  </span>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-rose-500/20 text-rose-400 font-bold text-[10px]">✕</span>
                    <div>
                      <strong className="text-white">Buried in Personal Chats:</strong> "Bhaiya doc bhej diya" — scrolling through 40 unread WhatsApp chats to locate one student's thesis.
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-rose-500/20 text-rose-400 font-bold text-[10px]">✕</span>
                    <div>
                      <strong className="text-white">Infected Pen-Drives:</strong> Customers plugging virus-ridden USB sticks straight into your shop billing PC.
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-rose-500/20 text-rose-400 font-bold text-[10px]">✕</span>
                    <div>
                      <strong className="text-white">Manual Page Counting:</strong> Opening PDF properties, counting 50+ pages by hand, and haggling over duplex discounts.
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-rose-500/20 text-rose-400 font-bold text-[10px]">✕</span>
                    <div>
                      <strong className="text-white">Payment Arguments:</strong> Customers rushing off without paying because price was calculated verbally after printing.
                    </div>
                  </li>
                </ul>
              </div>

              {/* The New Printex Pro Counter */}
              <div className="rounded-2xl border border-teal/40 bg-teal-950/25 p-4 sm:p-5 backdrop-blur-sm space-y-3">
                <div className="flex items-center justify-between border-b border-teal/30 pb-2.5">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-teal uppercase tracking-wider">
                    <CheckCircle2 className="h-4 w-4" /> Your Printex Pro Workflow
                  </span>
                  <span className="rounded-full bg-teal/20 px-2.5 py-0.5 text-[10px] font-bold text-teal">
                    10-Sec Speed · Zero Errors
                  </span>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-200">
                  <li className="flex items-start gap-2.5">
                    <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-teal/20 text-teal font-bold text-[10px]">✓</span>
                    <div>
                      <strong className="text-white">Single Live Queue:</strong> Orders land with Customer Name, Token #, and Total Amount pre-calculated upfront.
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-teal/20 text-teal font-bold text-[10px]">✓</span>
                    <div>
                      <strong className="text-white">100% Virus-Free:</strong> Files arrive via secure mobile browser upload. No pen-drives or personal number sharing.
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-teal/20 text-teal font-bold text-[10px]">✓</span>
                    <div>
                      <strong className="text-white">Instant Page & Price Detection:</strong> Dual B/W & Colour page counting with automatic duplex discounts applied.
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-teal/20 text-teal font-bold text-[10px]">✓</span>
                    <div>
                      <strong className="text-white">Instant UPI Token Collection:</strong> Dynamic UPI QR generated for the exact amount. Customer pays before collecting.
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: THREE COUNTER SUPERPOWERS */}
          {activeTab === "superpowers" && (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-teal/40 transition">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-soft text-teal">
                  <Clock className="h-5 w-5" />
                </span>
                <p className="mt-3 text-xs font-bold uppercase tracking-wider text-teal">Speed Advantage</p>
                <h3 className="text-sm font-bold text-white mt-1">45+ Minutes Saved Every Rush Hour</h3>
                <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                  During college rush hours, customers self-upload and select exact B/W, Color, copies, and binding while waiting in queue.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-teal/40 transition">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/20 text-emerald-400">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <p className="mt-3 text-xs font-bold uppercase tracking-wider text-emerald-400">Security Advantage</p>
                <h3 className="text-sm font-bold text-white mt-1">100% PC Protection & Privacy</h3>
                <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                  Protect your printer and billing computers from pen-drive trojans, shortcuts, and corrupted system drivers permanently.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-teal/40 transition">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500/20 text-indigo-400">
                  <IndianRupee className="h-5 w-5" />
                </span>
                <p className="mt-3 text-xs font-bold uppercase tracking-wider text-indigo-400">Revenue Advantage</p>
                <h3 className="text-sm font-bold text-white mt-1">Zero Page Count Leakage</h3>
                <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                  Never lose money on miscounted pages or students claiming they printed less. Everything is transparent and logged.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: DAILY IMPACT & QUICK PRO TIPS */}
          {activeTab === "impact" && (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-teal/30 bg-teal/10 p-4 text-center">
                <span className="font-mono text-3xl font-extrabold text-teal">~45m</span>
                <p className="mt-1 text-xs font-bold text-white uppercase tracking-wider">Time Saved Daily</p>
                <p className="mt-1 text-[11px] text-slate-300">Eliminates downloading from WhatsApp, Bluetooth pairing, and manual counting.</p>
              </div>

              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
                <span className="font-mono text-3xl font-extrabold text-emerald-400">0</span>
                <p className="mt-1 text-xs font-bold text-white uppercase tracking-wider">USB Drives Needed</p>
                <p className="mt-1 text-[11px] text-slate-300">Clean, contactless browser upload direct to your counter screen.</p>
              </div>

              <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4 text-center">
                <span className="font-mono text-3xl font-extrabold text-indigo-400">100%</span>
                <p className="mt-1 text-xs font-bold text-white uppercase tracking-wider">Rate Accuracy</p>
                <p className="mt-1 text-[11px] text-slate-300">Customers see exact B/W, Color, and duplex pricing before tapping send.</p>
              </div>
            </div>
          )}

          {/* Quick Action Footer Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-teal text-white font-bold">
                <QrCode className="h-4 w-4" />
              </span>
              <span className="text-slate-300">
                Your Live Counter URL: <span className="font-mono font-bold text-teal">{uploadLink}</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copyLink}
                className="inline-flex items-center gap-1.5 rounded-lg border border-teal/40 bg-teal/15 px-3 py-1.5 font-bold text-teal hover:bg-teal hover:text-white transition active:scale-95"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? "Link Copied!" : "Copy Customer Link"}</span>
              </button>

              <Link
                to="/dashboard/qr"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 font-bold text-white hover:bg-white/20 transition active:scale-95"
              >
                <span>Print QR Poster</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
