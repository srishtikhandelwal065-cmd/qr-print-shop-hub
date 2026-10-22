// Local mock data layer. Swap these functions for API calls when a backend is added.
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
  createdAt: string;
}

export interface Order {
  id: string;
  shopId: string;
  customer: string;
  fileName: string;
  pages: number;
  copies: number;
  color: PrintColor;
  sides: PrintSides;
  amount: number;
  status: OrderStatus;
  createdAt: string;
}

const SHOPS_KEY = "printex.shops";
const ORDERS_KEY = "printex.orders";
const CURRENT_KEY = "printex.currentShop";

export const DEMO_SHOP: Shop = {
  id: "sharma-xerox-pune",
  name: "Sharma Xerox & Printing",
  owner: "Rakesh Sharma",
  whatsapp: "9876543210",
  address: "Shop 12, FC Road, Shivajinagar, Pune",
  state: "Maharashtra",
  priceBw: 2,
  priceColor: 10,
  doubleDiscount: 0.25,
  createdAt: new Date().toISOString(),
};

const files = [
  ["Aadhaar_Card_Front.pdf", 1, "Priya"], ["Resume_Final_v3.pdf", 2, "Arjun"],
  ["DBMS_Notes_Unit4.pdf", 38, "Sneha"], ["Rent_Agreement.pdf", 6, "Vikram"],
  ["Project_Report_CSE.pdf", 64, "Rohit"], ["Passport_Photo.jpg", 1, "Anjali"],
  ["Bank_Statement_Mar.pdf", 4, "Manoj"], ["Assignment_Physics.pdf", 12, "Kavya"],
] as const;
const statuses: OrderStatus[] = ["pending", "pending", "printing", "ready", "collected", "pending", "ready", "collected"];

export function calcPrice(shop: Pick<Shop, "priceBw" | "priceColor" | "doubleDiscount">, pages: number, color: PrintColor, sides: PrintSides, copies = 1) {
  const per = color === "bw" ? shop.priceBw : shop.priceColor;
  const factor = sides === "double" ? 1 - shop.doubleDiscount : 1;
  return Math.round(pages * per * factor * copies * 100) / 100;
}

function seedOrders(shop: Shop): Order[] {
  return files.map(([fileName, pages, customer], i) => {
    const color: PrintColor = i % 3 === 1 ? "color" : "bw";
    const sides: PrintSides = pages > 4 ? "double" : "single";
    return {
      id: `ORD-${1040 + i}`, shopId: shop.id, customer, fileName, pages, copies: i === 2 ? 2 : 1,
      color, sides, amount: calcPrice(shop, pages, color, sides, i === 2 ? 2 : 1),
      status: statuses[i] ?? "pending", createdAt: new Date(Date.now() - i * 23 * 60000).toISOString(),
    };
  });
}

const isBrowser = () => typeof window !== "undefined";
function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; }
}
function write(key: string, v: unknown) { if (isBrowser()) localStorage.setItem(key, JSON.stringify(v)); }
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40);
}

export function listShops(): Shop[] {
  const shops = read<Shop[]>(SHOPS_KEY, []);
  return shops.some((s) => s.id === DEMO_SHOP.id) ? shops : [DEMO_SHOP, ...shops];
}
export function getShop(id: string) { return listShops().find((s) => s.id === id); }
export function getCurrentShop(): Shop { return getShop(read<string>(CURRENT_KEY, DEMO_SHOP.id)) ?? DEMO_SHOP; }

export async function registerShop(input: Omit<Shop, "id" | "priceBw" | "priceColor" | "doubleDiscount" | "createdAt">) {
  await delay(1200);
  const shops = read<Shop[]>(SHOPS_KEY, []);
  let id = slugify(input.name) || "shop";
  if (listShops().some((s) => s.id === id)) id = `${id}-${Math.random().toString(36).slice(2, 6)}`;
  const shop: Shop = { ...input, id, priceBw: 2, priceColor: 10, doubleDiscount: 0.25, createdAt: new Date().toISOString() };
  write(SHOPS_KEY, [...shops, shop]);
  write(CURRENT_KEY, id);
  return shop;
}

export function updateShop(shop: Shop) {
  write(SHOPS_KEY, [...read<Shop[]>(SHOPS_KEY, []).filter((s) => s.id !== shop.id), shop]);
}

export function listOrders(shopId: string): Order[] {
  const all = read<Record<string, Order[]>>(ORDERS_KEY, {});
  if (!all[shopId]) {
    const shop = getShop(shopId);
    all[shopId] = shop ? seedOrders(shop) : [];
    write(ORDERS_KEY, all);
  }
  return all[shopId];
}
export function saveOrders(shopId: string, orders: Order[]) {
  write(ORDERS_KEY, { ...read<Record<string, Order[]>>(ORDERS_KEY, {}), [shopId]: orders });
}

export async function submitUpload(shopId: string, customer: string, items: Omit<Order, "id" | "shopId" | "customer" | "status" | "createdAt">[]) {
  await delay(1600);
  const orders = listOrders(shopId);
  const base = 1040 + orders.length + Math.floor(Math.random() * 900);
  const created = items.map((it, i): Order => ({ ...it, id: `ORD-${base + i}`, shopId, customer, status: "pending", createdAt: new Date().toISOString() }));
  saveOrders(shopId, [...created, ...orders]);
  return created;
}

export function shopUploadUrl(id: string) {
  const origin = isBrowser() ? window.location.origin : "https://printex.in";
  return `${origin}/s/${id}`;
}

// Rough client-side PDF page counter; replace with server-side parsing later.
export async function countPdfPages(file: File): Promise<number> {
  const text = await file.text();
  const m = text.match(/\/Type\s*\/Page[^s]/g);
  return Math.max(1, m?.length ?? 1);
}

export const STATES = ["Andhra Pradesh","Assam","Bihar","Chhattisgarh","Delhi","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Odisha","Punjab","Rajasthan","Tamil Nadu","Telangana","Uttar Pradesh","Uttarakhand","West Bengal"];
