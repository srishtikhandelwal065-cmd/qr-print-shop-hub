import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download, Printer, Copy, Check, ExternalLink, Sparkles, Smartphone, FileUp, CheckCircle2 } from "lucide-react";
import { useShop } from "@/lib/use-shop";
import { shopUploadUrl } from "@/lib/shop-store";

export const Route = createFileRoute("/_authenticated/dashboard/qr")({ component: QrPage });

function QrPage() {
  const [shop] = useShop();
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUrl(shopUploadUrl(shop.id));
  }, [shop.id]);

  const download = () => {
    const c = wrap.current?.querySelector("canvas");
    if (!c) return;
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png");
    a.download = `${shop.id}-counter-qr.png`;
    a.click();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="no-print">
        <h1 className="text-2xl font-bold text-navy">Counter QR Code & Standee</h1>
        <p className="text-sm text-muted-foreground">
          Print this tent card and place it on your Xerox counter. Customers scan this QR to upload their files directly.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        {/* Printable Standee Card */}
        <div
          ref={wrap}
          className="card overflow-hidden border-2 border-navy/20 bg-card p-8 text-center shadow-md print:border-0 print:shadow-none print:p-0 print:m-0"
        >
          {/* Standee Header */}
          <div className="rounded-xl bg-navy p-4 text-white print:bg-navy print:text-white">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-navy">
              <Sparkles className="h-3 w-3" /> Quick Print Counter
            </span>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight">{shop.name}</h2>
            <p className="text-xs text-white/80 mt-0.5">{shop.address}</p>
          </div>

          {/* QR Code Centerpiece */}
          <div className="my-6 flex flex-col items-center">
            <div className="rounded-3xl border-4 border-teal bg-white p-4 shadow-inner">
              {url && <QRCodeCanvas value={url} size={220} level="H" marginSize={2} />}
            </div>
            <p className="mt-3 text-xs font-bold uppercase tracking-wider text-teal">
              Scan with Phone Camera or Google Lens
            </p>
          </div>

          {/* 3 Step Instructions */}
          <div className="grid grid-cols-3 gap-2 border-y py-4 text-left">
            <div className="flex flex-col items-center text-center">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-soft text-teal font-bold text-xs">
                1
              </span>
              <p className="mt-1.5 text-xs font-bold text-navy">Scan QR</p>
              <p className="text-[10px] text-muted-foreground">No app download needed</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-soft text-teal font-bold text-xs">
                2
              </span>
              <p className="mt-1.5 text-xs font-bold text-navy">Upload Files</p>
              <p className="text-[10px] text-muted-foreground">Choose B/W, Colour, Sides</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-soft text-teal font-bold text-xs">
                3
              </span>
              <p className="mt-1.5 text-xs font-bold text-navy">Show Token</p>
              <p className="text-[10px] text-muted-foreground">Collect prints at counter</p>
            </div>
          </div>

          {/* Quick Rates Pill */}
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs">
            <span className="rounded-lg bg-secondary px-3 py-1 font-bold text-foreground">
              B/W: ₹{shop.priceBw}/pg
            </span>
            <span className="rounded-lg bg-secondary px-3 py-1 font-bold text-foreground">
              Colour: ₹{shop.priceColor}/pg
            </span>
            {shop.priceSpiral && (
              <span className="rounded-lg bg-secondary px-3 py-1 font-bold text-foreground">
                Spiral: ₹{shop.priceSpiral}
              </span>
            )}
          </div>

          <p className="mt-6 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Fast Digital Printing Powered by Printex
          </p>
        </div>

        {/* Action Controls Column */}
        <div className="no-print space-y-4">
          <div className="card p-4 space-y-2.5">
            <button onClick={() => window.print()} className="btn btn-teal w-full py-2.5 text-xs font-bold">
              <Printer className="h-4 w-4" /> Print Standee (A4)
            </button>
            <button onClick={download} className="btn btn-outline w-full py-2.5 text-xs font-bold">
              <Download className="h-4 w-4" /> Download QR Image
            </button>
            <button onClick={copy} className="btn btn-outline w-full py-2.5 text-xs font-bold">
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              {copied ? "Link Copied!" : "Copy Customer Link"}
            </button>
          </div>

          <div className="card p-4 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Your Shop URL</p>
            <p className="break-all font-mono text-xs font-medium bg-secondary p-2 rounded-lg">{url}</p>
            <Link
              to="/s/$shopId"
              params={{ shopId: shop.id }}
              target="_blank"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-teal hover:underline pt-1"
            >
              Test Customer Upload Page <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
