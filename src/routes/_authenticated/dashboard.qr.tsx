import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download, Printer, Copy, Check, ExternalLink } from "lucide-react";
import { useShop } from "@/lib/use-shop";
import { shopUploadUrl } from "@/lib/shop-store";

export const Route = createFileRoute("/_authenticated/dashboard/qr")({ component: QrPage });

function QrPage() {
  const [shop] = useShop();
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => setUrl(shopUploadUrl(shop.id)), [shop.id]);

  const download = () => {
    const c = wrap.current?.querySelector("canvas");
    if (!c) return;
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png");
    a.download = `${shop.id}-printex-qr.png`;
    a.click();
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* ignore */ }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="no-print">
        <h1 className="text-2xl font-bold text-navy">My Shop QR Code</h1>
        <p className="text-sm text-muted-foreground">Print this and place it on your counter. Customers scan to upload files directly to {shop.name}.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-[1fr_280px]">
        <div className="card flex flex-col items-center p-8 text-center print:border-0 print:shadow-none">
          <p className="text-xs font-semibold uppercase tracking-widest text-teal">Scan to upload files</p>
          <h2 className="mt-1 text-2xl font-bold">{shop.name}</h2>
          <div ref={wrap} className="mt-6 rounded-2xl border-4 border-teal p-4">
            {url && <QRCodeCanvas value={url} size={220} level="M" marginSize={1} />}
          </div>
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">Open your camera, scan the code, and send your PDFs or photos for printing.</p>
          <p className="mt-3 text-xs font-semibold text-muted-foreground">Powered by Printex</p>
        </div>
        <div className="no-print space-y-3">
          <button onClick={download} className="btn btn-teal w-full"><Download className="h-4 w-4" /> Download QR</button>
          <button onClick={() => window.print()} className="btn btn-outline w-full"><Printer className="h-4 w-4" /> Print QR</button>
          <button onClick={copy} className="btn btn-outline w-full">{copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />} {copied ? "Link copied!" : "Copy Link"}</button>
          <div className="card p-4">
            <p className="text-xs font-semibold text-muted-foreground">Your upload link</p>
            <p className="mt-1 break-all text-sm font-medium">{url}</p>
            <Link to="/s/$shopId" params={{ shopId: shop.id }} target="_blank" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-teal">Open customer page <ExternalLink className="h-3.5 w-3.5" /></Link>
          </div>
        </div>
      </div>
    </div>
  );
}
