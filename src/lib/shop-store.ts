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
  const { data: s } = await supabase.auth.getSession();
  const userId = s?.session?.user?.id;
  if (userId) {
    const shop = await fetchShopForOwner(userId);
    if (shop) return shop;
  }
  const { data: u } = await supabase.auth.getUser();
  if (!u?.user) return null;
  return fetchShopForOwner(u.user.id);
}

async function fetchShopForOwner(ownerId: string): Promise<Shop | null> {
  const { data, error } = await supabase
    .from("shops")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: true })
    .limit(10);
  if (error) throw error;
  if (!data || data.length === 0) return null;
  const preferred = data.find((r: Record<string, unknown>) => r.id === "printex-test-hub") || data[0];
  const shop = toShop(preferred as ShopRow);
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
  try {
    const { data, error } = await supabase.rpc("find_print_shops", { search_text: "", shop_slug: id });
    if (!error && data?.[0]) return toShop(data[0] as ShopRow);
  } catch {
    // fallback
  }
  const { data, error } = await supabase.from("shops").select("*").eq("id", id).maybeSingle();
  if (error) return null;
  return data ? toShop(data as ShopRow) : null;
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
  const { error } = await supabase.from("shops").update({
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
  }).eq("id", shop.id);
  if (error) throw error;
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

export async function downloadOrderFile(o: Order) {
  // 1. If stored on Hostinger disk (relative path e.g. "shop-id/filename.pdf")
  if (o.storagePath && !o.storagePath.startsWith("http") && o.storagePath.includes("/")) {
    window.open(`/api/upload.php?action=download&path=${encodeURIComponent(o.storagePath)}&name=${encodeURIComponent(o.fileName)}`, "_blank");
    return;
  }

  // 2. Supabase storage fallback
  const { data, error } = await supabase.storage.from("print-documents").createSignedUrl(o.storagePath, 3600, { download: o.fileName });
  if (!error && data?.signedUrl) {
    window.open(data.signedUrl, "_blank");
    return;
  }
  const { data: pub } = supabase.storage.from("print-documents").getPublicUrl(o.storagePath);
  if (pub?.publicUrl) {
    window.open(pub.publicUrl, "_blank");
  } else {
    throw new Error("Could not download file");
  }
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
  const tokenNo = Math.floor(1000 + Math.random() * 9000).toString();
  const results: CreatedOrderResult[] = [];

  for (const it of items) {
    const amount = calcPrice(shop, it.pages, it.color, it.sides, it.copies, it.binding, it.paperSize);
    let storagePath = "";

    // 1. Save physical file to Hostinger Disk Storage
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
    } catch (err) {
      console.warn("Hostinger upload failed, attempting Supabase storage fallback...", err);
    }

    // 2. Fallback to Supabase Storage if Hostinger is unreachable
    if (!storagePath) {
      const safe = it.file.name.replace(/[^\w.\-]+/g, "_").slice(-100);
      const fileId = crypto.randomUUID();
      storagePath = `${shop.id}/${fileId}-${safe}`;

      const { error: uploadErr } = await supabase.storage.from("print-documents").upload(storagePath, it.file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (uploadErr) {
        console.error("Storage upload error:", uploadErr);
        throw new Error("Could not upload file to storage: " + uploadErr.message);
      }
    }

    // 3. Insert order record into Supabase Database
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

    results.push({
      id: orderId,
      tokenNo,
      amount,
    });
  }

  return results;
}

export function shopUploadUrl(id: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://printex.app";
  return `${origin}/s/${id}`;
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

// Client-side PDF page counter
export async function countPdfPages(file: File): Promise<number> {
  try {
    const text = await file.text();
    const m = text.match(/\/Type\s*\/Page[^s]/g);
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
