import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { shopInputSchema, shopUpdateSchema } from "./shop-validation";
import { mapShop } from "./shop-mapping";

export const registerShopFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => shopInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0,40) || "shop";
    const { data: shop, error } = await context.supabase.from("shops").insert({
      id: `${slug}-${crypto.randomUUID().slice(0,8)}`, owner_id: context.userId,
      ...data,
    }).select().single();
    if (error) throw new Error(error.message);
    await context.supabase.from("profiles").update({ display_name: data.owner }).eq("id", context.userId);
    return mapShop(shop);
  });
export const updateShopFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => shopUpdateSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: shop, error } = await context.supabase.from("shops").update({
      name: data.name, owner: data.owner, whatsapp: data.whatsapp, address: data.address, state: data.state,
      price_bw: data.priceBw, price_color: data.priceColor, double_discount: data.doubleDiscount,
      accept_uploads: data.acceptUploads, show_whatsapp: data.showWhatsapp,
    }).eq("id", data.id).eq("owner_id", context.userId).select().single();
    if (error) throw new Error(error.message);
    const { error: profileError } = await context.supabase.from("profiles").update({ display_name: data.owner }).eq("id", context.userId);
    if (profileError) throw new Error(profileError.message);
    return mapShop(shop);
  });