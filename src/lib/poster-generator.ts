import { jsPDF } from "jspdf";
import type { Shop } from "./shop-store";
import posterTemplateCleanUrl from "@/assets/poster-template-clean.png";
import posterTemplateRawUrl from "@/assets/poster-template.png";

export interface GeneratePosterOptions {
  shop: Shop;
  qrCanvas: HTMLCanvasElement;
}

/**
 * Format phone number into clean standard Indian mobile display (+91 XXXXX XXXXX)
 */
export function formatPosterPhone(rawPhone?: string): string {
  if (!rawPhone) return "";
  const cleaned = rawPhone.trim();
  const digits = cleaned.replace(/[^\d]/g, "");

  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  if (cleaned.startsWith("+")) {
    return cleaned;
  }
  return cleaned;
}

/**
 * Format address into two balanced lines for the poster card
 */
export function formatPosterAddress(address?: string, state?: string): { line1: string; line2: string } {
  if (!address || !address.trim()) {
    return {
      line1: "Counter Print Station",
      line2: state ? `${state}` : "",
    };
  }

  const cleanAddr = address.trim();
  const cleanState = (state || "").trim();

  // If address contains commas, split into line1 and line2
  if (cleanAddr.includes(",")) {
    const parts = cleanAddr.split(",").map((p) => p.trim()).filter(Boolean);
    const p0 = parts[0] ?? cleanAddr;
    const p1 = parts[1] ?? "";

    if (parts.length === 1) {
      return { line1: p0, line2: cleanState };
    }
    if (parts.length === 2) {
      const line2 = cleanState && !p1.toLowerCase().includes(cleanState.toLowerCase())
        ? `${p1}, ${cleanState}`
        : p1;
      return { line1: p0, line2: line2 || cleanState };
    }
    // More than 2 parts: take first 1-2 parts as line 1 and rest as line 2
    const mid = Math.ceil(parts.length / 2);
    const line1 = parts.slice(0, mid).join(", ");
    let line2 = parts.slice(mid).join(", ");
    if (cleanState && !line2.toLowerCase().includes(cleanState.toLowerCase())) {
      line2 = `${line2}, ${cleanState}`;
    }
    return { line1, line2 };
  }

  // If no comma, check length
  if (cleanAddr.length > 28) {
    const words = cleanAddr.split(" ");
    const mid = Math.ceil(words.length / 2);
    const line1 = words.slice(0, mid).join(" ");
    let line2 = words.slice(mid).join(" ");
    if (cleanState && !line2.toLowerCase().includes(cleanState.toLowerCase())) {
      line2 = `${line2}, ${cleanState}`;
    }
    return { line1, line2 };
  }

  return {
    line1: cleanAddr,
    line2: cleanState,
  };
}

/**
 * Loads an image from a URL into an HTMLImageElement
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Only set crossOrigin for cross-origin URLs to prevent browser CORS errors on same-origin/relative assets
    if (src.startsWith("http://") || src.startsWith("https://")) {
      try {
        if (typeof window !== "undefined" && new URL(src).origin !== window.location.origin) {
          img.crossOrigin = "anonymous";
        }
      } catch {}
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load poster template from ${src}`));
    img.src = src;
  });
}

/**
 * Loads the poster template from bundled assets or URL fallbacks
 */
async function loadTemplateImage(): Promise<{ img: HTMLImageElement; isClean: boolean }> {
  const candidates: Array<{ src: string; isClean: boolean }> = [
    { src: posterTemplateCleanUrl, isClean: true },
    { src: "/poster-template-clean.png", isClean: true },
    { src: "./poster-template-clean.png", isClean: true },
    { src: posterTemplateRawUrl, isClean: false },
    { src: "/poster-template.png", isClean: false },
    { src: "./poster-template.png", isClean: false },
  ];

  for (const candidate of candidates) {
    if (!candidate.src) continue;
    try {
      const img = await loadImage(candidate.src);
      return { img, isClean: candidate.isClean };
    } catch {
      // Try next candidate
    }
  }

  throw new Error("Failed to load poster template image from all sources");
}

/**
 * Generates and downloads a print-ready A4 PDF poster for the shop
 */
export async function downloadShopPosterPdf({ shop, qrCanvas }: GeneratePosterOptions): Promise<void> {
  // Ensure custom and system fonts are ready
  try {
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }
  } catch {
    // Continue if font API unavailable
  }

  // 1. Load the background template (bundled asset or fallback)
  const { img: templateImg, isClean } = await loadTemplateImage();

  // 2. High-resolution canvas (2x of 682x1024 = 1364x2048)
  const canvas = document.createElement("canvas");
  const W = 1364;
  const H = 2048;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not initialize 2D canvas context for poster generation");
  }

  // High quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Draw base template
  ctx.drawImage(templateImg, 0, 0, W, H);

  // If using original template as fallback, clean the placeholder areas manually
  if (!isClean) {
    // Top pill
    ctx.fillStyle = "#ebf9f7";
    ctx.fillRect(190, 280, 980, 210);

    // QR center
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(390, 720, 584, 550);

    // Bottom address
    ctx.fillStyle = "#f8f9fb";
    ctx.fillRect(250, 1770, 460, 140);

    // Bottom phone
    ctx.fillRect(900, 1780, 390, 130);
  }

  // ==========================================
  // 3. Dynamic Shop Name (Top Pill)
  // Center is (682, 380), max text width 880px
  // ==========================================
  const rawShopName = (shop.name || "PRINT & XEROX HUB").trim();
  const shopNameText = rawShopName.toUpperCase();
  const pillCenterX = 682;
  const pillCenterY = 380;
  const maxShopNameWidth = 880;

  let fontSize = 66;
  ctx.fillStyle = "#0e1e38"; // Bold Printex dark navy
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

  let measuredWidth = ctx.measureText(shopNameText).width;
  while (measuredWidth > maxShopNameWidth && fontSize > 36) {
    fontSize -= 2;
    ctx.font = `900 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    measuredWidth = ctx.measureText(shopNameText).width;
  }

  if (measuredWidth > maxShopNameWidth) {
    // Very long name: split into two centered lines
    const words = shopNameText.split(" ");
    const mid = Math.ceil(words.length / 2);
    const line1 = words.slice(0, mid).join(" ");
    const line2 = words.slice(mid).join(" ");
    const lineHeight = fontSize * 1.15;
    ctx.fillText(line1, pillCenterX, pillCenterY - lineHeight / 2);
    ctx.fillText(line2, pillCenterX, pillCenterY + lineHeight / 2);
  } else {
    ctx.fillText(shopNameText, pillCenterX, pillCenterY);
  }

  // ==========================================
  // 4. Dynamic Sharp QR Code
  // Frame center is (682, 990), size is 550x550
  // ==========================================
  const qrSize = 550;
  const qrX = pillCenterX - qrSize / 2; // 407
  const qrY = 990 - qrSize / 2; // 715

  // Ensure solid white background beneath QR code
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 4);

  // Draw the shop's personalized QR code
  ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

  // ==========================================
  // 5. Dynamic Shop Address (Bottom Left)
  // Location icon is around x=156, y=1864
  // Text starts at x=250, divider is at x=728
  // ==========================================
  const { line1: addrLine1, line2: addrLine2 } = formatPosterAddress(shop.address, shop.state);
  const addrStartX = 250;
  const maxAddrWidth = 460;

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  if (addrLine2) {
    // Two lines
    // Line 1: Bold Address Street / Landmark
    ctx.fillStyle = "#0e1e38";
    let l1Size = 26;
    ctx.font = `800 ${l1Size}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    while (ctx.measureText(addrLine1).width > maxAddrWidth && l1Size > 18) {
      l1Size -= 1;
      ctx.font = `800 ${l1Size}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    }
    ctx.fillText(addrLine1, addrStartX, 1846);

    // Line 2: Subtitle City / Area / State
    ctx.fillStyle = "#64748b";
    let l2Size = 22;
    ctx.font = `600 ${l2Size}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    while (ctx.measureText(addrLine2).width > maxAddrWidth && l2Size > 16) {
      l2Size -= 1;
      ctx.font = `600 ${l2Size}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    }
    ctx.fillText(addrLine2, addrStartX, 1880);
  } else {
    // Single line centered vertically
    ctx.fillStyle = "#0e1e38";
    let l1Size = 28;
    ctx.font = `800 ${l1Size}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    while (ctx.measureText(addrLine1).width > maxAddrWidth && l1Size > 18) {
      l1Size -= 1;
      ctx.font = `800 ${l1Size}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    }
    ctx.fillText(addrLine1, addrStartX, 1864);
  }

  // ==========================================
  // 6. Dynamic Shop Phone Number (Bottom Right)
  // Phone icon is around x=840, y=1864
  // Text starts at x=916
  // ==========================================
  const formattedPhone = formatPosterPhone(shop.whatsapp) || "+91 98765 43210";
  const phoneStartX = 916;
  const maxPhoneWidth = 370;

  ctx.fillStyle = "#0e1e38";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  let phoneFontSize = 32;
  ctx.font = `900 ${phoneFontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  while (ctx.measureText(formattedPhone).width > maxPhoneWidth && phoneFontSize > 22) {
    phoneFontSize -= 1;
    ctx.font = `900 ${phoneFontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  }
  ctx.fillText(formattedPhone, phoneStartX, 1864);

  // ==========================================
  // 7. Generate Print-Ready A4 PDF with jsPDF
  // A4 standard format: 210mm x 297mm
  // ==========================================
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const posterJpegData = canvas.toDataURL("image/jpeg", 0.96);
  // Fit to full page A4 (210mm x 297mm)
  pdf.addImage(posterJpegData, "JPEG", 0, 0, 210, 297, undefined, "FAST");

  // Format clean filename based on shop id or shop name
  const safeShopId = (shop.id || shop.name || "printex-shop")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  pdf.save(`${safeShopId}-counter-poster-A4.pdf`);
}
