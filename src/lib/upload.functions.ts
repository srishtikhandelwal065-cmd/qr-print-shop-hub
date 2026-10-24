import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const input = z.object({
  shopId: z.string().min(1).max(60),
  customer: z.string().trim().min(2).max(40),
  items: z.array(z.object({
    fileName: z.string().min(1).max(200),
    pages: z.number().int().min(1).max(2000),
    copies: z.number().int().min(1).max(50),
    color: z.enum(["bw", "color"]),
    sides: z.enum(["single", "double"]),
  })).min(1).max(20),
});

// Public: customers have no account. Prices are recomputed here from the shop's saved rates.
export const createUploadOrders = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => input.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: ok, error: rErr } = await supabaseAdmin.rpc("reserve_print_upload", { shop_slug: data.shopId });
    if (rErr) throw new Error("Upload failed");
    if (!ok) throw new Error("This shop is not accepting uploads right now");
    const { data: shop } = await supabaseAdmin.from("shops").select("price_bw, price_color, double_discount").eq("id", data.shopId).single();
    if (!shop) throw new Error("Shop not found");
    const out: { id: string; path: string; token: string }[] = [];
    for (const it of data.items) {
      const per = it.color === "bw" ? Number(shop.price_bw) : Number(shop.price_color);
      const factor = it.sides === "double" ? 1 - Number(shop.double_discount) : 1;
      const amount = Math.round(it.pages * per * factor * it.copies * 100) / 100;
      const safe = it.fileName.replace(/[^\w.\-]+/g, "_").slice(-100);
      const path = `${data.shopId}/${crypto.randomUUID()}-${safe}`;
      const { data: signed, error: sErr } = await supabaseAdmin.storage.from("print-documents").createSignedUploadUrl(path);
      if (sErr || !signed) throw new Error("Upload failed");
      const { data: row, error: oErr } = await supabaseAdmin.from("orders").insert({
        shop_id: data.shopId, customer: data.customer, file_name: it.fileName, storage_path: path,
        pages: it.pages, copies: it.copies, color: it.color, sides: it.sides, amount,
      }).select("id").single();
      if (oErr || !row) throw new Error("Upload failed");
      out.push({ id: row.id, path, token: signed.token });
    }
    return out;
  });
