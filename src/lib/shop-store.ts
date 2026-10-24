// Data layer backed by Lovable Cloud. Owner reads/writes run in the browser with row-level access rules;
// customer uploads go through a server function (see upload.functions.ts).
import { supabase } from "@/integrations/supabase/client";
import { createUploadOrders } from "@/lib/upload.functions";

export type PrintColor = "bw" | "color";
export type PrintSides = "single" | "double";
export type OrderStatus = "pending" | "printing" | "ready" | "collected";

export interface Shop {
  id: string;
  name: string;
  owner: string;
  whatsapp: string;
  address: string;
  state: string;
  referral?: string | undefined;
  priceBw: number;
  priceColor: number;
  doubleDiscount: number; // fraction off per page when double-sided
  acceptUploads: boolean;
  showWhatsapp: boolean;
  createdAt: string;
}

export interface Order {
  id: string;
  shopId: string;
  customer: string;
  fileName: string;
  storagePath: string;
  pages: number;
  copies: number;
  color: PrintColor;
  sides: PrintSides;
  amount: number;
  status: OrderStatus;
  createdAt: string;
}

// Sample shop used only for the homepage illustration.
export const DEMO_SHOP: Shop = {
  id: "sharma-xerox-pune", name: "Sharma Xerox & Printing", owner: "Rakesh Sharma", whatsapp: "9876543210",
  address: "Shop 12, FC Road, Shivajinagar, Pune", state: "Maharashtra", priceBw: 2, priceColor: 10,
  doubleDiscount: 0.25, acceptUploads: true, showWhatsapp: true, createdAt: new Date().toISOString(),
};

export function calcPrice(shop: Pick<Shop, "priceBw" | "priceColor" | "doubleDiscount">, pages: number, color: PrintColor, sides: PrintSides, copies = 1) {
  const per = color === "bw" ? shop.priceBw : shop.priceColor;
  const factor = sides === "double" ? 1 - shop.doubleDiscount : 1;
  return Math.round(pages * per * factor * copies * 100) / 100;
}

export function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40);
}

type ShopRow = { id: string; name: string; owner?: string; whatsapp: string; address: string; state: string; referral?: string | null; price_bw: number; price_color: number; double_discount: number; accept_uploads: boolean; show_whatsapp: boolean; created_at: string };
const toShop = (r: ShopRow): Shop => ({
  id: r.id, name: r.name, owner: r.owner ?? "", whatsapp: r.whatsapp, address: r.address, state: r.state,
  referral: r.referral ?? undefined, priceBw: Number(r.price_bw), priceColor: Number(r.price_color),
  doubleDiscount: Number(r.double_discount), acceptUploads: r.accept_uploads, showWhatsapp: r.show_whatsapp, createdAt: r.created_at,
});

export async function getMyShop(): Promise<Shop | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data, error } = await supabase.from("shops").select("*").eq("owner_id", u.user.id).maybeSingle();
  if (error) throw error;
  return data ? toShop(data) : null;
}

export async function searchShops(q: string): Promise<Shop[]> {
  const { data, error } = await supabase.rpc("find_print_shops", { search_text: q });
  if (error) throw error;
  return (data ?? []).map((r) => toShop(r as ShopRow));
}

export async function getPublicShop(id: string): Promise<Shop | null> {
  const { data, error } = await supabase.rpc("find_print_shops", { search_text: "", shop_slug: id });
  if (error) throw error;
  return data?.[0] ? toShop(data[0] as ShopRow) : null;
}

export async function registerShop(input: Pick<Shop, "name" | "owner" | "whatsapp" | "address" | "state" | "referral">) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Please sign in first");
  const base = slugify(input.name) || "shop";
  for (let i = 0; i < 4; i++) {
    const id = i === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
    const { data, error } = await supabase.from("shops").insert({
      id, owner_id: u.user.id, name: input.name, owner: input.owner, whatsapp: input.whatsapp,
      address: input.address, state: input.state, referral: input.referral ?? null,
    }).select("*").single();
    if (!error) return toShop(data);
    if (error.code !== "23505") throw error;
  }
  throw new Error("Could not create a unique shop link");
}

export async function updateShop(shop: Shop) {
  const { error } = await supabase.from("shops").update({
    name: shop.name, owner: shop.owner, whatsapp: shop.whatsapp, address: shop.address, state: shop.state,
    price_bw: shop.priceBw, price_color: shop.priceColor, double_discount: shop.doubleDiscount,
    accept_uploads: shop.acceptUploads, show_whatsapp: shop.showWhatsapp,
  }).eq("id", shop.id);
  if (error) throw error;
}

export async function listOrders(shopId: string): Promise<Order[]> {
  const { data, error } = await supabase.from("orders").select("*").eq("shop_id", shopId).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id, shopId: r.shop_id, customer: r.customer, fileName: r.file_name, storagePath: r.storage_path,
    pages: r.pages, copies: r.copies, color: r.color as PrintColor, sides: r.sides as PrintSides,
    amount: Number(r.amount), status: r.status as OrderStatus, createdAt: r.created_at,
  }));
}

export async function setOrderStatus(id: string, status: OrderStatus) {
  const { error } = await supabase.from("orders").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function deleteOrder(o: Order) {
  await supabase.storage.from("print-documents").remove([o.storagePath]);
  const { error } = await supabase.from("orders").delete().eq("id", o.id);
  if (error) throw error;
}

export async function downloadOrderFile(o: Order) {
  const { data, error } = await supabase.storage.from("print-documents").createSignedUrl(o.storagePath, 300, { download: o.fileName });
  if (error) throw error;
  window.open(data.signedUrl, "_blank");
}

export async function submitUpload(shopId: string, customer: string, items: { file: File; pages: number; copies: number; color: PrintColor; sides: PrintSides }[]) {
  const created = await createUploadOrders({
    data: { shopId, customer, items: items.map(({ file, ...rest }) => ({ ...rest, fileName: file.name })) },
  });
  await Promise.all(created.map(async (c, i) => {
    const { error } = await supabase.storage.from("print-documents").uploadToSignedUrl(c.path, c.token, items[i]!.file);
    if (error) throw error;
  }));
  return created;
}

export function shopUploadUrl(id: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://qr-print-shop-hub.lovable.app";
  return `${origin}/s/${id}`;
}

// Rough client-side PDF page counter.
export async function countPdfPages(file: File): Promise<number> {
  const text = await file.text();
  const m = text.match(/\/Type\s*\/Page[^s]/g);
  return Math.max(1, m?.length ?? 1);
}

export const STATES = ["Andhra Pradesh","Assam","Bihar","Chhattisgarh","Delhi","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Odisha","Punjab","Rajasthan","Tamil Nadu","Telangana","Uttar Pradesh","Uttarakhand","West Bengal"];
