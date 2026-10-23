import type { Database } from "@/integrations/supabase/types";
import type { Shop, Order, PrintColor, PrintSides, OrderStatus } from "./shop-types";
type ShopRow = Database["public"]["Tables"]["shops"]["Row"];
type PublicRow = Database["public"]["Functions"]["find_print_shops"]["Returns"][number];
export function mapShop(s: ShopRow | PublicRow): Shop {
  return { id: s.id, name: s.name, owner: "owner" in s ? s.owner : "", whatsapp: s.whatsapp,
    address: s.address, state: s.state, priceBw: s.price_bw, priceColor: s.price_color,
    doubleDiscount: s.double_discount, acceptUploads: s.accept_uploads, showWhatsapp: s.show_whatsapp,
    createdAt: s.created_at, referral: "referral" in s ? s.referral ?? undefined : undefined };
}
export function mapOrder(o: Database["public"]["Tables"]["orders"]["Row"]): Order {
  return { id: o.id, shopId: o.shop_id, customer: o.customer, fileName: o.file_name, storagePath: o.storage_path,
    pages: o.pages, copies: o.copies, color: o.color as PrintColor, sides: o.sides as PrintSides,
    amount: o.amount, status: o.status as OrderStatus, createdAt: o.created_at };
}