import { z } from "zod";
export const MAX_FILE_BYTES = 25 * 1024 * 1024;
export const MAX_BATCH_FILES = 10;
export const printOptionsSchema = z.object({
  pages: z.number().int().min(1).max(10000), copies: z.number().int().min(1).max(50),
  color: z.enum(["bw", "color"]), sides: z.enum(["single", "double"]),
});
export const shopInputSchema = z.object({
  name: z.string().trim().min(3).max(80), owner: z.string().trim().min(2).max(60),
  whatsapp: z.string().regex(/^[6-9]\d{9}$/), address: z.string().trim().min(8).max(200),
  state: z.string().min(1).max(80), referral: z.string().max(20).regex(/^[A-Za-z0-9]*$/).optional(),
});
export const shopUpdateSchema = shopInputSchema.extend({
  id: z.string().regex(/^[a-z0-9-]{1,60}$/), priceBw: z.number().min(0).max(10000),
  priceColor: z.number().min(0).max(10000), doubleDiscount: z.number().min(0).max(0.9),
  acceptUploads: z.boolean().optional(), showWhatsapp: z.boolean().optional(),
});
export function validDocumentName(name: string) { return name.length <= 200 && /\.(pdf|png|jpg|jpeg|doc|docx)$/i.test(name); }