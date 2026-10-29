// Data layer backed by Supabase for Auth & Database, and Hostinger for Large File Storage.
import { supabase } from "@/integrations/supabase/client";
import { createUploadOrders } from "@/lib/upload.functions";

export type PrintColor = "bw" | "color";
export type PrintSides = "single" | "double";
export type PaperSize = "A4" | "A3" | "Legal";
export type BindingOption = "none" | "staple" | "spiral" | "lamination";
export type OrderStatus = "pending" | "printing" | "ready" | "collected";

export interface Shop {
  id: string;
  email?: string;
  name: string;
  owner: string;
  whatsapp: string;
  upiId?: string;
  address: string;
  state: string;
  referral?: string | undefined;
  priceBw: number;
  priceColor: number;
  doubleDiscount: number; // fraction off per page when double-sided
  priceSpiral: number; // e.g. ₹30
  priceStaple: number; // e.g. ₹5
  priceLamination: number; // e.g. ₹20
  acceptUploads: boolean;
  showWhatsapp: boolean;
  createdAt: string;
}

export interface Order {
  id: string;
  tokenNo: string;
  shopId: string;
  customer: string;
  customerPhone?: string;
  fileName: string;
  storagePath: string;
  pages: number;
  copies: number;
  color: PrintColor;
  sides: PrintSides;
  paperSize?: PaperSize;
  binding?: BindingOption;
  pageRange?: string;
  amount: number;
  paymentStatus?: "pending" | "upi_paid" | "cash_at_counter";
  status: OrderStatus;
  createdAt: string;
}

export interface UploadItem {
  file: File;
  pages: number;
  copies: number;
  color: PrintColor;
  sides: PrintSides;
  paperSize?: PaperSize;
  binding?: BindingOption;
  pageRange?: string;
}

export interface CreatedOrderResult {
  id: string;
  tokenNo: string;
  amount: number;
}

// Sample shop used for previews and testing.
export const DEMO_SHOP: Shop = {
  id: "sharma-xerox-pune",
  name: "Sharma Xerox & Printing Hub",
  owner: "Rakesh Sharma",
  email: "sharma.xerox@gmail.com",
  whatsapp: "9876543210",
  upiId: "sharma.xerox@upi",
  address: "Shop 12, FC Road, Shivajinagar, Pune",
  state: "Maharashtra",
  priceBw: 2,
  priceColor: 10,
  doubleDiscount: 0.25,
  priceSpiral: 30,
  priceStaple: 5,
  priceLamination: 20,
  acceptUploads: true,
  showWhatsapp: true,
  createdAt: new Date().toISOString(),
};

/**
 * Computes exact price for print job taking into account:
 * - Base price (B/W vs Color)
 * - Duplex discount (for double-sided)
 * - Paper size multiplier (A3 is 2x)
 * - Copies
 * - Finishing & Binding (Staple, Spiral binding, Lamination)
 */
export function calcPrice(
  shop: Pick<Shop, "priceBw" | "priceColor" | "doubleDiscount" | "priceSpiral" | "priceStaple" | "priceLamination">,
  pages: number,
  color: PrintColor,
  sides: PrintSides,
  copies = 1,
  binding: BindingOption = "none",
  paperSize: PaperSize = "A4"
): number {
  const per = color === "bw" ? (shop.priceBw || 2) : (shop.priceColor || 10);
  const factor = sides === "double" ? 1 - (shop.doubleDiscount || 0.25) : 1;
  const paperMultiplier = paperSize === "A3" ? 2 : paperSize === "Legal" ? 1.25 : 1;
  const printTotal = Math.round(pages * per * factor * paperMultiplier * copies * 100) / 100;

  let bindingTotal = 0;
  if (binding === "staple") bindingTotal = (shop.priceStaple ?? 5) * copies;
  else if (binding === "spiral") bindingTotal = (shop.priceSpiral ?? 30) * copies;
  else if (binding === "lamination") bindingTotal = (shop.priceLamination ?? 20) * pages * copies;

  return Math.round((printTotal + bindingTotal) * 100) / 100;
}

/**
 * Calculates page count from a user-specified range like "1-5, 8, 11-14"
 */
export function countPagesInRange(range: string, maxPages: number): number {
  if (!range || range.trim().toLowerCase() === "all") return maxPages;
  const parts = range.split(",");
  const pages = new Set<number>();
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.includes("-")) {
      const [startStr, endStr] = trimmed.split("-");
      const start = parseInt(startStr || "0", 10);
      const end = parseInt(endStr || "0", 10);
      if (!isNaN(start) && !isNaN(end) && start > 0 && end >= start) {
        for (let i = start; i <= Math.min(end, maxPages); i++) {
          pages.add(i);
        }
      }
    } else {
      const p = parseInt(trimmed, 10);
      if (!isNaN(p) && p > 0 && p <= maxPages) {
        pages.add(p);
      }
    }
  }
  return pages.size > 0 ? pages.size : maxPages;
}

export function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40);
}

type ShopRow = {
  id: string;
  name: string;
  owner?: string;
  email?: string | null;
  whatsapp: string;
  upi_id?: string | null;
  address: string;
  state: string;
  referral?: string | null;
  price_bw: number;
  price_color: number;
  double_discount: number;
  price_spiral?: number | null;
  price_staple?: number | null;
  price_lamination?: number | null;
  accept_uploads: boolean;
  show_whatsapp: boolean;
  created_at: string;
};

const toShop = (r: ShopRow): Shop => ({
  id: r.id,
  email: r.email ?? undefined,
  name: r.name,
  owner: r.owner ?? "",
  whatsapp: r.whatsapp,
  upiId: r.upi_id ?? undefined,
  address: r.address,
  state: r.state,
  referral: r.referral ?? undefined,
  priceBw: Number(r.price_bw ?? 2),
  priceColor: Number(r.price_color ?? 10),
  doubleDiscount: Number(r.double_discount ?? 0.25),
  priceSpiral: Number(r.price_spiral ?? 30),
  priceStaple: Number(r.price_staple ?? 5),
  priceLamination: Number(r.price_lamination ?? 20),
  acceptUploads: r.accept_uploads,
  showWhatsapp: r.show_whatsapp,
  createdAt: r.created_at,
});

export async function getMyShop(): Promise<Shop | null> {
  // 1. Identify currently authenticated user (Supabase session or verified local auth)
  let userId: string | null = null;
  let userEmail: string | null = null;
  let userDisplayName: string | null = null;

  try {
    const { data: s } = await supabase.auth.getSession();
    if (s?.session?.user) {
      userId = s.session.user.id;
      userEmail = s.session.user.email || null;
      userDisplayName = s.session.user.user_metadata?.display_name || null;
    } else {
      const { data: u } = await supabase.auth.getUser();
      if (u?.user) {
        userId = u.user.id;
        userEmail = u.user.email || null;
        userDisplayName = u.user.user_metadata?.display_name || null;
      }
    }
  } catch {}

  // Local storage check for authenticated session
  if (!userId && typeof window !== "undefined") {
    try {
      const localUserStr = localStorage.getItem("printex_user");
      const localToken = localStorage.getItem("printex_token");
      if (localUserStr && localToken) {
        const localUser = JSON.parse(localUserStr);
        if (localUser?.id) userId = localUser.id;
        if (localUser?.email) userEmail = localUser.email;
        if (localUser?.displayName) userDisplayName = localUser.displayName;
      }
    } catch {}
  }

  // If no user is authenticated, user has no shop
  if (!userId && !userEmail) {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("printex_shop_cache");
      } catch {}
    }
    return null;
  }

  // 2. Check cached shop if already loaded
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem("printex_shop_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.id && parsed.id !== "printex-test-hub") return parsed;
      }
    } catch {}
  }

  // 3. Query Supabase for shop owned by this authenticated user
  if (userId) {
    try {
      const shop = await fetchShopForOwner(userId);
      if (shop) {
        if (!shop.email && userEmail) shop.email = userEmail;
        return shop;
      }
    } catch {}
  }

  // 4. Fallback match by owner display name/email if owner_id was unpopulated
  if (userDisplayName || userEmail) {
    try {
      const query = (userDisplayName || userEmail?.split("@")[0] || "").trim();
      if (query.length >= 2) {
        const { data: matched } = await supabase
          .from("shops")
          .select("*")
          .ilike("owner", `%${query}%`)
          .order("created_at", { ascending: false })
          .limit(1);
        if (matched && matched.length > 0) {
          const shop = toShop(matched[0] as ShopRow);
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem("printex_shop_cache", JSON.stringify(shop));
            } catch {}
          }
          return shop;
        }
      }
    } catch {}
  }

  return null;
}

async function fetchShopForOwner(ownerId: string): Promise<Shop | null> {
  const { data, error } = await supabase
    .from("shops")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) throw error;
  if (!data || data.length === 0) return null;
  const shop = toShop(data[0] as ShopRow);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("printex_shop_cache", JSON.stringify(shop));
    } catch {}
  }
  return shop;
}

export async function searchShops(q: string): Promise<Shop[]> {
  try {
    const { data, error } = await supabase.rpc("find_print_shops", { search_text: q });
    if (!error && data) return data.map((r: unknown) => toShop(r as ShopRow));
  } catch {
    // fallback if RPC not installed yet
  }
  const { data, error } = await supabase.from("shops").select("*").ilike("name", `%${q}%`).limit(20);
  if (error) return [];
  return (data ?? []).map((r: unknown) => toShop(r as ShopRow));
}

export async function getPublicShop(id: string): Promise<Shop | null> {
  const cleanId = (id || "").replace(/\/+$/, "").trim();
  const cacheKey = `printex_public_shop_${cleanId}`;

  // 1. Exact match directly from Supabase (fast: ~100ms)
  try {
    const { data, error } = await supabase.from("shops").select("*").eq("id", cleanId).maybeSingle();
    if (!error && data) {
      const shop = toShop(data as ShopRow);
      if (typeof window !== "undefined") {
        try { localStorage.setItem(cacheKey, JSON.stringify(shop)); } catch {}
      }
      return shop;
    }
  } catch {}

  // 2. Prefix match in Supabase (in case link has slug variation or trailing char)
  try {
    const { data: prefixMatches } = await supabase
      .from("shops")
      .select("*")
      .ilike("id", `${cleanId}%`)
      .limit(1);
    if (prefixMatches && prefixMatches.length > 0) {
      const shop = toShop(prefixMatches[0] as ShopRow);
      if (typeof window !== "undefined") {
        try { localStorage.setItem(cacheKey, JSON.stringify(shop)); } catch {}
      }
      return shop;
    }
  } catch {}

  // 3. Fallback to cached version (if offline or mobile network glitch)
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch {}
  }

  // 4. Fallback to owner local shop cache (if testing on shopkeeper's phone)
  if (typeof window !== "undefined") {
    try {
      const activeCache = localStorage.getItem("printex_shop_cache");
      if (activeCache) {
        const parsed = JSON.parse(activeCache);
        if (parsed?.id && (parsed.id === id || parsed.id.startsWith(id) || id.startsWith(parsed.id))) {
          return parsed;
        }
      }
    } catch {}
  }

  return null;
}

export async function registerShop(input: Pick<Shop, "name" | "owner" | "whatsapp" | "address" | "state" | "referral">) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Please sign in first");
  const base = slugify(input.name) || "shop";
  for (let i = 0; i < 4; i++) {
    const id = i === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
    const { data, error } = await supabase.from("shops").insert({
      id,
      owner_id: u.user.id,
      name: input.name,
      owner: input.owner,
      whatsapp: input.whatsapp,
      address: input.address,
      state: input.state,
      referral: input.referral ?? null,
    }).select("*").single();
    if (!error) return toShop(data as ShopRow);
    if (error.code !== "23505") throw error;
  }
  throw new Error("Could not create a unique shop link");
}

export async function updateShop(shop: Shop) {
  const payload: Record<string, unknown> = {
    name: shop.name,
    owner: shop.owner,
    whatsapp: shop.whatsapp,
    upi_id: shop.upiId ?? null,
    address: shop.address,
    state: shop.state,
    price_bw: shop.priceBw,
    price_color: shop.priceColor,
    double_discount: shop.doubleDiscount,
    price_spiral: shop.priceSpiral,
    price_staple: shop.priceStaple,
    price_lamination: shop.priceLamination,
    accept_uploads: shop.acceptUploads,
    show_whatsapp: shop.showWhatsapp,
  };
  if (shop.email !== undefined) {
    payload.email = shop.email;
  }
  const { error } = await supabase.from("shops").update(payload).eq("id", shop.id);
  if (error) {
    // If the column email has not been added to supabase yet, gracefully retry without it
    if (error.message?.includes("email") || (error as { code?: string }).code === "PGRST204") {
      delete payload.email;
      const { error: retryErr } = await supabase.from("shops").update(payload).eq("id", shop.id);
      if (retryErr) throw retryErr;
    } else {
      throw error;
    }
  }

  // Also update public.profiles if user is logged in
  try {
    const { data: u } = await supabase.auth.getUser();
    if (u?.user) {
      await supabase.from("profiles").upsert({
        id: u.user.id,
        email: shop.email || u.user.email,
        display_name: shop.owner || u.user.user_metadata?.display_name || "",
      });
    }
  } catch {}
}

export async function listOrders(shopId: string): Promise<Order[]> {
  const { data, error } = await supabase.from("orders").select("*").eq("shop_id", shopId).order("created_at", { ascending: false });
  if (error) throw error;
  const list = (data ?? []).map((r: Record<string, unknown>) => ({
    id: String(r.id),
    tokenNo: String(r.token_no || String(r.id).slice(-4).toUpperCase()),
    shopId: String(r.shop_id),
    customer: String(r.customer),
    customerPhone: r.customer_phone ? String(r.customer_phone) : undefined,
    fileName: String(r.file_name),
    storagePath: String(r.storage_path),
    pages: Number(r.pages || 1),
    copies: Number(r.copies || 1),
    color: (r.color as PrintColor) || "bw",
    sides: (r.sides as PrintSides) || "single",
    paperSize: (r.paper_size as PaperSize) || "A4",
    binding: (r.binding as BindingOption) || "none",
    pageRange: r.page_range ? String(r.page_range) : "all",
    amount: Number(r.amount || 0),
    paymentStatus: (r.payment_status as "pending" | "upi_paid" | "cash_at_counter") || "pending",
    status: (r.status as OrderStatus) || "pending",
    createdAt: String(r.created_at),
  }));

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(`printex_orders_cache_${shopId}`, JSON.stringify(list));
    } catch {}
  }

  return list;
}

export async function setOrderStatus(id: string, status: OrderStatus) {
  const { error } = await supabase.from("orders").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function deleteOrder(o: Order) {
  // Delete physical file from Hostinger storage disk if stored there
  if (o.storagePath && !o.storagePath.startsWith("http")) {
    try {
      await fetch("/api/upload.php?action=delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: o.storagePath }),
      });
    } catch {
      // ignore
    }
  }

  // Delete from Supabase storage if stored there
  try {
    await supabase.storage.from("print-documents").remove([o.storagePath]);
  } catch {
    // ignore
  }

  // Delete from Supabase database
  const { error } = await supabase.from("orders").delete().eq("id", o.id);
  if (error) throw error;
}

export async function getOrderFileUrl(o: Order): Promise<string> {
  // 0. Base64 data URL
  if (o.storagePath && (o.storagePath.startsWith("data:") || o.storagePath.startsWith("blob:"))) {
    return o.storagePath;
  }

  // 1. If stored on Hostinger disk (relative path e.g. "shop-id/filename.pdf")
  if (o.storagePath && !o.storagePath.startsWith("http") && o.storagePath.includes("/")) {
    return `/api/upload.php?action=download&path=${encodeURIComponent(o.storagePath)}&name=${encodeURIComponent(o.fileName)}`;
  }

  // 2. Supabase storage fallback
  try {
    const { data: pub } = supabase.storage.from("print-documents").getPublicUrl(o.storagePath);
    if (pub?.publicUrl) return pub.publicUrl;
  } catch {}

  try {
    const { data } = await supabase.storage.from("print-documents").createSignedUrl(o.storagePath, 3600);
    if (data?.signedUrl) return data.signedUrl;
  } catch {}

  return o.storagePath;
}

export async function downloadOrderFile(o: Order) {
  const fileUrl = await getOrderFileUrl(o);
  const a = document.createElement("a");
  a.href = fileUrl;
  a.download = o.fileName;
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export async function printOrderFile(o: Order) {
  const fileUrl = await getOrderFileUrl(o);
  const isImage = /\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(o.fileName) || fileUrl.startsWith("data:image/");
  const title = `Print Order #${o.tokenNo} - ${o.fileName}`;
  const specDetails = `${o.pages} Page${o.pages > 1 ? "s" : ""} · ${o.color.toUpperCase()} · ${o.sides === "double" ? "Duplex" : "Single-sided"} · ${o.copies} Cop${o.copies > 1 ? "ies" : "y"} · Paper: ${o.paperSize || "A4"}`;

  // Open the real print window
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    window.open(fileUrl, "_blank");
    return;
  }

  if (isImage) {
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @page {
              size: ${o.paperSize || "A4"};
              margin: 8mm;
            }
            * { box-sizing: border-box; }
            body {
              margin: 0;
              padding: 0;
              background: #0f172a;
              color: white;
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              flex-direction: column;
              min-height: 100vh;
            }
            .header-bar {
              position: sticky;
              top: 0;
              z-index: 50;
              background: #0f172a;
              border-bottom: 1px solid rgba(255,255,255,0.1);
              padding: 12px 20px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            }
            .token-pill {
              background: #1668fe;
              color: white;
              font-weight: 800;
              font-size: 15px;
              padding: 3px 10px;
              border-radius: 6px;
              letter-spacing: 0.5px;
            }
            .doc-info {
              margin-left: 12px;
              font-size: 13px;
              color: #cbd5e1;
            }
            .doc-info strong {
              color: white;
              font-size: 14px;
            }
            .btn-print {
              background: #1668fe;
              color: white;
              border: none;
              padding: 9px 20px;
              border-radius: 6px;
              font-weight: 800;
              font-size: 14px;
              cursor: pointer;
              display: inline-flex;
              align-items: center;
              gap: 8px;
              box-shadow: 0 2px 8px rgba(22,104,254,0.4);
              transition: background 0.15s ease;
            }
            .btn-print:hover { background: #1356d2; }
            .preview-container {
              flex: 1;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 24px;
              background: #1e293b;
            }
            img {
              max-width: 100%;
              max-height: 85vh;
              object-fit: contain;
              background: white;
              border-radius: 6px;
              box-shadow: 0 8px 30px rgba(0,0,0,0.4);
            }
            @media print {
              body, .preview-container { background: white !important; padding: 0 !important; }
              .header-bar { display: none !important; }
              img {
                max-width: 100% !important;
                max-height: 100% !important;
                border-radius: 0 !important;
                box-shadow: none !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="header-bar">
            <div style="display:flex; align-items:center;">
              <span class="token-pill">TOKEN #${o.tokenNo}</span>
              <div class="doc-info">
                <strong>${o.fileName}</strong> · Customer: ${o.customer}
                <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">${specDetails}</div>
              </div>
            </div>
            <button class="btn-print" onclick="window.print()">
              🖨️ Print #${o.tokenNo}
            </button>
          </div>
          <div class="preview-container">
            <img src="${fileUrl}" alt="${o.fileName}" onload="setTimeout(function(){ window.print(); }, 400);" />
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    return;
  }

  // If PDF or other document
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @page { size: auto; margin: 0; }
          body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; font-family: system-ui, -apple-system, sans-serif; background: #0f172a; }
          .header-bar {
            height: 52px;
            background: #0f172a;
            color: white;
            padding: 0 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid rgba(255,255,255,0.1);
          }
          .token-pill {
            background: #1668fe;
            color: white;
            font-weight: 800;
            font-size: 14px;
            padding: 3px 10px;
            border-radius: 6px;
          }
          .doc-info { margin-left: 12px; font-size: 13px; color: #cbd5e1; }
          .btn-print {
            background: #1668fe;
            color: white;
            border: none;
            padding: 8px 18px;
            border-radius: 6px;
            font-weight: 800;
            font-size: 13px;
            cursor: pointer;
          }
          .btn-print:hover { background: #1356d2; }
          iframe {
            width: 100%;
            height: calc(100% - 52px);
            border: none;
            background: #fff;
          }
          @media print {
            .header-bar { display: none !important; }
            iframe { height: 100% !important; }
          }
        </style>
      </head>
      <body>
        <div class="header-bar">
          <div style="display:flex; align-items:center;">
            <span class="token-pill">TOKEN #${o.tokenNo}</span>
            <div class="doc-info">
              <strong>${o.fileName}</strong> · Customer: ${o.customer}
              <div style="font-size: 11px; color: #94a3b8;">${specDetails}</div>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap: 12px;">
            <button class="btn-print" onclick="try{document.getElementById('pdfFrame').contentWindow.print();}catch(e){window.print();}">
              🖨️ Print #${o.tokenNo}
            </button>
            <a href="${fileUrl}" target="_blank" style="color:#1668fe; font-size:12px; text-decoration:none; font-weight:600;">Open Standalone PDF ↗</a>
          </div>
        </div>
        <iframe id="pdfFrame" src="${fileUrl}" onload="setTimeout(function(){ try { document.getElementById('pdfFrame').contentWindow.print(); } catch(e){} }, 500);"></iframe>
      </body>
    </html>
  `);
  printWindow.document.close();
}

export async function getNextTokenNo(shopId: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("token_no")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false })
      .limit(200);

    if (!error && data && data.length > 0) {
      let maxNum = 0;
      for (const row of data) {
        const val = parseInt(String(row.token_no), 10);
        // Ignore legacy 4-digit random tokens (>= 1000) so we start strictly 1, 2, 3...
        if (!isNaN(val) && val < 1000 && val > maxNum) {
          maxNum = val;
        }
      }
      return String(maxNum + 1);
    }
  } catch {}

  // Fallback to local storage cache if offline
  if (typeof window !== "undefined") {
    try {
      const cached = JSON.parse(localStorage.getItem(`printex_orders_cache_${shopId}`) || "[]");
      let maxNum = 0;
      for (const o of cached) {
        const val = parseInt(String(o.tokenNo), 10);
        if (!isNaN(val) && val < 1000 && val > maxNum) {
          maxNum = val;
        }
      }
      return String(maxNum + 1);
    } catch {}
  }

  return "1";
}

/**
 * Uploads physical files directly to Hostinger disk storage (100GB+ space),
 * and saves order metadata directly to Supabase Database (with Realtime & RLS).
 */
export async function submitUpload(
  shop: Shop,
  customer: string,
  customerPhone: string,
  items: UploadItem[]
): Promise<CreatedOrderResult[]> {
  const tokenNo = await getNextTokenNo(shop.id);
  const results: CreatedOrderResult[] = [];

  for (const it of items) {
    const amount = calcPrice(shop, it.pages, it.color, it.sides, it.copies, it.binding, it.paperSize);
    let storagePath = "";

    // 1. Save physical file to Hostinger Disk Storage (if available)
    try {
      const fd = new FormData();
      fd.append("shop_id", shop.id);
      fd.append("file", it.file);

      const res = await fetch("/api/upload.php", {
        method: "POST",
        body: fd,
      });

      if (res.ok) {
        const json = await res.json();
        if (json?.filePath) {
          storagePath = json.filePath;
        }
      }
    } catch {
      // ignore Hostinger fallback
    }

    // 2. Fallback to Supabase Storage if Hostinger is unreachable
    if (!storagePath) {
      const safe = it.file.name.replace(/[^\w.\-]+/g, "_").slice(-100);
      const fileId = crypto.randomUUID();
      storagePath = `${shop.id}/${fileId}-${safe}`;

      try {
        const { error: uploadErr } = await supabase.storage.from("print-documents").upload(storagePath, it.file, {
          cacheControl: "3600",
          upsert: false,
        });
        if (uploadErr) {
          console.warn("Storage upload error, using resilient data URI fallback:", uploadErr.message);
          storagePath = "";
        }
      } catch (storageEx) {
        console.warn("Storage upload exception, using resilient data URI fallback:", storageEx);
        storagePath = "";
      }
    }

    // 3. Ultra-resilient inline Data URI fallback (ensures upload never fails even if bucket is missing)
    if (!storagePath) {
      try {
        storagePath = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(it.file);
        });
      } catch (readErr) {
        throw new Error("Could not read file for upload: " + (readErr as Error).message);
      }
    }

    // 4. Insert order record into Supabase Database
    const orderId = `ORD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const { error: insertErr } = await supabase.from("orders").insert({
      id: orderId,
      token_no: tokenNo,
      shop_id: shop.id,
      customer,
      customer_phone: customerPhone || null,
      file_name: it.file.name,
      storage_path: storagePath,
      pages: it.pages,
      copies: it.copies,
      color: it.color,
      sides: it.sides,
      paper_size: it.paperSize || "A4",
      binding: it.binding || "none",
      page_range: it.pageRange || "all",
      amount,
      payment_status: "pending",
      status: "pending",
    });

    if (insertErr) {
      console.error("Order insertion error:", insertErr);
      throw new Error("Could not save order: " + insertErr.message);
    }

    // 5. Save into local shop orders cache as backup
    if (typeof window !== "undefined") {
      try {
        const cacheKey = `printex_orders_cache_${shop.id}`;
        const existing = JSON.parse(localStorage.getItem(cacheKey) || "[]");
        const newOrder = {
          id: orderId,
          tokenNo,
          shopId: shop.id,
          customer,
          customerPhone: customerPhone || undefined,
          fileName: it.file.name,
          storagePath,
          pages: it.pages,
          copies: it.copies,
          color: it.color,
          sides: it.sides,
          paperSize: it.paperSize || "A4",
          binding: it.binding || "none",
          pageRange: it.pageRange || "all",
          amount,
          paymentStatus: "pending" as const,
          status: "pending" as const,
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem(cacheKey, JSON.stringify([newOrder, ...existing]));
      } catch {}
    }

    results.push({
      id: orderId,
      tokenNo,
      amount,
    });
  }

  return results;
}

export function shopUploadUrl(id: string) {
  const cleanId = (id || "").replace(/\/+$/, "").trim();
  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    // If running on localhost or 127.0.0.1, phone cameras cannot reach 'localhost:8080'.
    // Use the live deployed URL so scanning from a phone immediately works!
    if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
      return `https://printex.touranzza.com/s/${cleanId}`;
    }
    return `${origin}/s/${cleanId}`;
  }
  return `https://printex.touranzza.com/s/${cleanId}`;
}

/**
 * Generate UPI deep-link URI for instant QR scanning and payment
 */
export function getUpiPaymentUrl(upiId: string, shopName: string, amount: number, tokenNo: string) {
  if (!upiId) return "";
  const cleanUpi = upiId.trim();
  const params = new URLSearchParams({
    pa: cleanUpi,
    pn: shopName,
    am: amount.toFixed(2),
    cu: "INR",
    tn: `Print Order #${tokenNo}`,
  });
  return `upi://pay?${params.toString()}`;
}

/**
 * Synthesizer bell audio chime using Web Audio API.
 * Requires no external audio assets or network downloads.
 */
export function playNewOrderChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Bell chime: Tone 1 (E5 - 659Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Bell chime: Tone 2 (A5 - 880Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, now + 0.12);
    gain2.gain.setValueAtTime(0.25, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);
  } catch {
    // Audio context may be restricted before user gesture
  }
}

// Client-side ultra-fast non-blocking PDF page counter
export async function countPdfPages(file: File): Promise<number> {
  try {
    // Fast path: Check trailer /Pages dictionary in last 256KB or first 256KB
    // This avoids reading tens of megabytes into memory and freezing the mobile UI
    const endSize = Math.min(file.size, 256 * 1024);
    const endChunk = await file.slice(Math.max(0, file.size - endSize)).text();
    const endCount = endChunk.match(/\/Type\s*\/Pages[^>]*\/Count\s+(\d+)/) || endChunk.match(/\/Count\s+(\d+)/);
    if (endCount && endCount[1]) {
      const p = parseInt(endCount[1], 10);
      if (!isNaN(p) && p > 0 && p < 5000) return p;
    }

    const startSize = Math.min(file.size, 256 * 1024);
    const startChunk = await file.slice(0, startSize).text();
    const startCount = startChunk.match(/\/Type\s*\/Pages[^>]*\/Count\s+(\d+)/) || startChunk.match(/\/Count\s+(\d+)/);
    if (startCount && startCount[1]) {
      const p = parseInt(startCount[1], 10);
      if (!isNaN(p) && p > 0 && p < 5000) return p;
    }

    // Fallback: Sample slice (at most 1.5MB) to count /Type /Page without memory freeze
    const sample = await file.slice(0, Math.min(file.size, 1536 * 1024)).text();
    const m = sample.match(/\/Type\s*\/Page[^s]/g);
    return Math.max(1, m?.length ?? 1);
  } catch {
    return 1;
  }
}

export const STATES = [
  "Andhra Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Odisha", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana",
  "Uttar Pradesh", "Uttarakhand", "West Bengal"
];
