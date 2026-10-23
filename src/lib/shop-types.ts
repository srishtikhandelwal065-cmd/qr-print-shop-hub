export type PrintColor = "bw" | "color";
export type PrintSides = "single" | "double";
export type OrderStatus = "pending" | "printing" | "ready" | "collected";
export interface Shop {
  id: string; name: string; owner: string; whatsapp: string; address: string; state: string;
  referral?: string | undefined; priceBw: number; priceColor: number; doubleDiscount: number;
  acceptUploads?: boolean; showWhatsapp?: boolean; createdAt: string;
}
export interface Order {
  id: string; shopId: string; customer: string; fileName: string; storagePath: string;
  pages: number; copies: number; color: PrintColor; sides: PrintSides; amount: number;
  status: OrderStatus; createdAt: string;
}
export function calcPrice(shop: Pick<Shop, "priceBw" | "priceColor" | "doubleDiscount">, pages: number, color: PrintColor, sides: PrintSides, copies = 1) {
  return Math.round(pages * (color === "bw" ? shop.priceBw : shop.priceColor) * (sides === "double" ? 1 - shop.doubleDiscount : 1) * copies * 100) / 100;
}