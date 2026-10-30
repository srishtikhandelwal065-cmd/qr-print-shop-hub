import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  Download, Printer, Copy, Check, ExternalLink, Sparkles,
  FileDown, RefreshCw, Layout, Smartphone
} from "lucide-react";
import { useShop } from "@/lib/use-shop";
import { shopUploadUrl } from "@/lib/shop-store";
import {
  downloadShopPosterPdf,
  renderShopPosterCanvas
} from "@/lib/poster-generator";

export const Route = createFileRoute("/_authenticated/dashboard/qr")({ component: QrPage });

function QrPage() {
  const [shop] = useShop();
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"poster" | "standee">("poster");
  const [posterPreviewUrl, setPosterPreviewUrl] = useState<string>("");
  const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);
  const [isRenderingPreview, setIsRenderingPreview] = useState(true);
  const [previewError, setPreviewError] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const posterQrRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setUrl(shopUploadUrl(shop.id));
  }, [shop.id]);

  const generatePreview = async () => {
    try {
      setIsRenderingPreview(true);
      setPreviewError(false);
      // Wait briefly for QR code canvas to mount
      await new Promise((r) => setTimeout(r, 100));
      const qrCanvas = posterQrRef.current || wrap.current?.querySelector("canvas");
      if (!qrCanvas) {
        setIsRenderingPreview(false);
        return;
      }
      const canvas = await renderShopPosterCanvas({ shop, qrCanvas });
      setPosterPreviewUrl(canvas.toDataURL("image/png"));
    } catch (err) {
      console.error("Failed to render poster preview:", err);
      setPreviewError(true);
    } finally {
      setIsRenderingPreview(false);
    }
  };

  useEffect(() => {
    if (url) {
      generatePreview();
    }
  }, [url, shop.name, shop.address, shop.state, shop.whatsapp]);

  const downloadQrOnly = () => {
    const c = posterQrRef.current || wrap.current?.querySelector("canvas");
    if (!c) return;
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png");
    a.download = `${shop.id}-counter-qr.png`;
    a.click();
  };

  const downloadPoster = async () => {
    try {
      setIsGeneratingPoster(true);
      const qrCanvas = posterQrRef.current || wrap.current?.querySelector("canvas");
      if (!qrCanvas) {
        throw new Error("QR Code is not ready yet");
      }
      await downloadShopPosterPdf({ shop, qrCanvas });
    } catch (err) {
      console.error("Failed to generate shop poster:", err);
      alert("Could not generate poster. Please try again.");
    } finally {
      setIsGeneratingPoster(false);
    }
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
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Page Title & View Switcher */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
            Counter QR Code & Poster
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-soft px-2.5 py-0.5 text-xs font-bold text-teal border border-teal/20">
              <Sparkles className="h-3 w-3" /> Official Printex Blue
            </span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Place this QR poster at your shop counter. Customers scan with their phone camera to upload print orders directly.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="inline-flex rounded-xl bg-secondary p-1 border border-border shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("poster")}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeTab === "poster"
                ? "bg-white text-navy shadow-xs"
                : "text-muted-foreground hover:text-navy"
            }`}
          >
            <Layout className="h-3.5 w-3.5 text-teal" /> A4 Counter Poster
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("standee")}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeTab === "standee"
                ? "bg-white text-navy shadow-xs"
                : "text-muted-foreground hover:text-navy"
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" /> Tent Standee Card
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        {/* Main Display Column */}
        <div className="min-w-0">
          {activeTab === "poster" ? (
            /* ==================================================== */
            /* A4 Branded Blue Poster (Personalized Live Preview)   */
            /* ==================================================== */
            <div className="card overflow-hidden border border-slate-200/90 bg-white p-4 sm:p-6 shadow-md">
              <div className="no-print flex items-center justify-between pb-4 border-b mb-4">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-teal text-white shadow-xs">
                    <Sparkles className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-navy">Personalized A4 Print Poster</h3>
                    <p className="text-[11px] text-muted-foreground">
                      Auto-populated with <strong className="text-navy">{shop.name}</strong>, dynamic QR & contact
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={generatePreview}
                  disabled={isRenderingPreview}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-teal hover:underline disabled:opacity-50"
                  title="Refresh poster preview"
                >
                  <RefreshCw className={`h-3 w-3 ${isRenderingPreview ? "animate-spin" : ""}`} /> Refresh
                </button>
              </div>

              {/* Poster Canvas / Image Container */}
              <div className="relative mx-auto max-w-[420px] rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-50 shadow-lg">
                {isRenderingPreview && !posterPreviewUrl ? (
                  <div className="aspect-[682/1024] flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <span className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-teal border-t-transparent" />
                    <p className="text-xs font-bold text-navy">Generating your blue shop poster…</p>
                    <p className="text-[11px] text-muted-foreground">Fitting shop name & sharp QR code</p>
                  </div>
                ) : previewError ? (
                  <div className="aspect-[682/1024] flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <p className="text-xs font-bold text-destructive">Could not generate poster preview</p>
                    <button onClick={generatePreview} className="btn btn-outline text-xs py-1.5 px-3">
                      Try Again
                    </button>
                  </div>
                ) : (
                  <div className="relative group">
                    <img
                      src={posterPreviewUrl}
                      alt={`${shop.name} Counter Poster`}
                      className="w-full h-auto object-contain block transition-transform duration-300 group-hover:scale-[1.01]"
                    />
                    <div className="no-print absolute top-3 right-3 rounded-full bg-navy/80 backdrop-blur-xs text-white px-3 py-1 text-[10px] font-bold shadow-md">
                      A4 Ready (300 DPI)
                    </div>
                  </div>
                )}
              </div>

              {/* Quick note under poster */}
              <div className="no-print mt-4 text-center">
                <p className="text-xs text-muted-foreground">
                  💡 <strong>Tip:</strong> Print this full-color A4 poster and laminate it or put it in an acrylic stand on your counter.
                </p>
              </div>
            </div>
          ) : (
            /* ==================================================== */
            /* Printable Tent Standee Card                          */
            /* ==================================================== */
            <div
              ref={wrap}
              className="card overflow-hidden border-2 border-navy/20 bg-card p-4 sm:p-8 text-center shadow-md print:border-0 print:shadow-none print:p-0 print:m-0"
            >
              {/* Standee Header */}
              <div className="rounded-xl bg-navy p-3.5 sm:p-4 text-white print:bg-navy print:text-white">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-teal px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-navy">
                  <Sparkles className="h-3 w-3" /> Quick Print Counter
                </span>
                <h2 className="mt-2 text-xl sm:text-2xl font-extrabold tracking-tight">{shop.name}</h2>
                <p className="text-xs text-white/80 mt-0.5">{shop.address}</p>
              </div>

              {/* QR Code Centerpiece */}
              <div className="my-5 sm:my-6 flex flex-col items-center">
                <div className="rounded-3xl border-4 border-teal bg-white p-3 sm:p-4 shadow-inner max-w-full flex justify-center">
                  {url && <QRCodeCanvas value={url} size={190} level="H" marginSize={2} className="max-w-full h-auto" />}
                </div>
                <p className="mt-3 text-xs font-bold uppercase tracking-wider text-teal">
                  Scan with Phone Camera or Google Lens
                </p>
              </div>

              {/* 3 Step Instructions */}
              <div className="grid grid-cols-3 gap-1 sm:gap-2 border-y py-3 sm:py-4 text-left">
                <div className="flex flex-col items-center text-center">
                  <span className="grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-lg bg-teal-soft text-teal font-bold text-xs">
                    1
                  </span>
                  <p className="mt-1 text-[11px] sm:text-xs font-bold text-navy">Scan QR</p>
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground">No app needed</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <span className="grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-lg bg-teal-soft text-teal font-bold text-xs">
                    2
                  </span>
                  <p className="mt-1 text-[11px] sm:text-xs font-bold text-navy">Upload Files</p>
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground">B/W, Colour, Sides</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <span className="grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-lg bg-teal-soft text-teal font-bold text-xs">
                    3
                  </span>
                  <p className="mt-1 text-[11px] sm:text-xs font-bold text-navy">Show Token</p>
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground">Collect at counter</p>
                </div>
              </div>

              {/* Quick Rates Pill */}
              <div className="mt-4 flex flex-wrap justify-center gap-1.5 sm:gap-2 text-xs">
                <span className="rounded-lg bg-secondary px-2.5 py-1 font-bold text-foreground text-xs">
                  B/W: ₹{shop.priceBw}/pg
                </span>
                <span className="rounded-lg bg-secondary px-2.5 py-1 font-bold text-foreground text-xs">
                  Colour: ₹{shop.priceColor}/pg
                </span>
                {shop.priceSpiral && (
                  <span className="rounded-lg bg-secondary px-2.5 py-1 font-bold text-foreground text-xs">
                    Spiral: ₹{shop.priceSpiral}
                  </span>
                )}
              </div>

              <p className="mt-5 sm:mt-6 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Fast Digital Printing Powered by Printex
              </p>
            </div>
          )}
        </div>

        {/* Action Controls Column */}
        <div className="no-print space-y-4">
          <div className="card p-4 space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Download & Print Actions
            </h3>

            {/* Primary Action: Download Poster PDF */}
            <button
              onClick={downloadPoster}
              disabled={isGeneratingPoster}
              className="btn btn-teal w-full py-3 text-xs font-bold min-h-[46px] flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
            >
              {isGeneratingPoster ? (
                <>
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Generating Print-Ready PDF...
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4" /> Download Poster (A4 PDF)
                </>
              )}
            </button>

            {/* Print Standee / Poster */}
            <button
              onClick={() => window.print()}
              className="btn btn-outline w-full py-2.5 text-xs font-bold min-h-[42px] flex items-center justify-center gap-2 hover:bg-secondary transition-all"
            >
              <Printer className="h-4 w-4" /> Print Current View
            </button>

            {/* Download QR Image Only */}
            <button
              onClick={downloadQrOnly}
              className="btn btn-outline w-full py-2.5 text-xs font-bold min-h-[42px] flex items-center justify-center gap-2 hover:bg-secondary transition-all"
            >
              <Download className="h-4 w-4" /> Download QR Code Only
            </button>

            {/* Copy Customer Link */}
            <button
              onClick={copy}
              className="btn btn-outline w-full py-2.5 text-xs font-bold min-h-[42px] flex items-center justify-center gap-2 hover:bg-secondary transition-all"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              {copied ? "Link Copied!" : "Copy Customer Link"}
            </button>
          </div>

          {/* Shop Upload URL Box */}
          <div className="card p-4 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Your Shop URL</p>
            <p className="break-all font-mono text-xs font-medium bg-secondary p-2.5 rounded-lg border border-border">
              {url}
            </p>
            <Link
              to="/s/$shopId"
              params={{ shopId: shop.id }}
              target="_blank"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-teal hover:underline pt-1 min-h-[36px]"
            >
              Test Customer Upload Page <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Hidden high-resolution QR canvas for generating crisp print-ready A4 poster */}
      <div style={{ position: "fixed", left: -9999, top: -9999, pointerEvents: "none", opacity: 0 }} aria-hidden="true">
        {url && <QRCodeCanvas ref={posterQrRef} value={url} size={600} level="H" marginSize={2} />}
      </div>
    </div>
  );
}
