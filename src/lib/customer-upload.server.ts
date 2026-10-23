import { PDFDocument } from "pdf-lib";
import { z } from "zod";
import { MAX_BATCH_FILES, MAX_FILE_BYTES, printOptionsSchema, validDocumentName } from "./shop-validation";
import { calcPrice } from "./shop-types";

export async function receivePrintUpload(request: Request) {
  // Public customer endpoint: no account, no document reads, bounded writes only.
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) return Response.json({ error: "Please upload from the shop page." }, { status: 403 });
  const length = Number(request.headers.get("content-length") || 0);
  if (length > MAX_FILE_BYTES + 1024 * 1024) return Response.json({ error: "Files together must be no more than 25 MB." }, { status: 413 });
  let paths: string[] = [];
  try {
    // Bound the request even when content-length is missing.
    const reader = request.body?.getReader();
    if (!reader) throw new Error("No files received.");
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_FILE_BYTES + 1024 * 1024) { await reader.cancel(); throw new Error("Files together must be no more than 25 MB."); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    const form = await new Response(bytes, { headers: { "content-type": request.headers.get("content-type") || "" } }).formData();
    const shopId = z.string().regex(/^[a-z0-9-]{1,60}$/).parse(form.get("shopId"));
    const customer = z.string().trim().min(2).max(40).parse(form.get("customer"));
    const options = z.array(printOptionsSchema).min(1).max(MAX_BATCH_FILES).parse(JSON.parse(String(form.get("options"))));
    const files = form.getAll("files");
    if (files.length !== options.length || files.some(f => typeof f === "string")) throw new Error("Please select valid files.");
    const documents = files as File[];
    if (documents.reduce((sum,f) => sum+f.size,0) > MAX_FILE_BYTES) throw new Error("Files together must be no more than 25 MB.");
    for (const f of documents) if (!f.size || f.size > MAX_FILE_BYTES || !validDocumentName(f.name)) throw new Error("Use PDF, JPG, PNG, DOC or DOCX files up to 25 MB.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: shop, error: shopError } = await supabaseAdmin.from("shops").select("id,price_bw,price_color,double_discount,accept_uploads").eq("id", shopId).single();
    if (shopError || !shop?.accept_uploads) throw new Error("This shop is not accepting uploads right now.");
    const { data: allowed, error: limitError } = await supabaseAdmin.rpc("reserve_print_upload", { shop_slug: shopId });
    if (limitError || !allowed) return Response.json({ error: "This shop is receiving many uploads. Please try later or contact the shop." }, { status: 429 });
    const rows = [];
    for (let i=0; i<documents.length; i++) {
      const file = documents[i]; const opts = options[i];
      if (!file || !opts) throw new Error("Missing file options.");
      const content = new Uint8Array(await file.arrayBuffer());
      const ext = file.name.split(".").pop()?.toLowerCase();
      let pages = opts.pages;
      let mime = "application/octet-stream";
      if (ext === "pdf") {
        try { pages = (await PDFDocument.load(content)).getPageCount(); } catch { throw new Error("Cannot read this PDF. Use an unlocked, valid PDF."); }
        mime = "application/pdf";
      } else if (ext === "png") {
        if (content[0] !== 137 || content[1] !== 80 || content[2] !== 78 || content[3] !== 71) throw new Error("Invalid PNG file.");
        pages = 1; mime = "image/png";
      } else if (ext === "jpg" || ext === "jpeg") {
        if (content[0] !== 255 || content[1] !== 216 || content[2] !== 255) throw new Error("Invalid JPG file.");
        pages = 1; mime = "image/jpeg";
      } else if (ext === "docx") {
        if (content[0] !== 80 || content[1] !== 75) throw new Error("Invalid Word document.");
        mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      } else {
        if (content[0] !== 208 || content[1] !== 207 || content[2] !== 17 || content[3] !== 224) throw new Error("Invalid Word document.");
        mime = "application/msword";
      }
      printOptionsSchema.parse({ ...opts, pages });
      const path = `${shopId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabaseAdmin.storage.from("print-documents").upload(path, content, { contentType: mime, upsert: false });
      if (error) throw new Error("Couldn't store your file. Please try again.");
      paths.push(path);
      rows.push({ shop_id: shopId, customer, file_name: file.name, storage_path: path, ...opts, pages,
        amount: calcPrice({ priceBw: shop.price_bw, priceColor: shop.price_color, doubleDiscount: shop.double_discount },pages,opts.color,opts.sides,opts.copies) });
    }
    const { data: orders, error } = await supabaseAdmin.from("orders").insert(rows).select("id,amount");
    if (error) throw new Error("Couldn't create your order. Please try again.");
    paths = [];
    return Response.json({ orders });
  } catch (error) {
    if (paths.length) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.storage.from("print-documents").remove(paths);
    }
    const message = error instanceof z.ZodError ? "Please check your name and print options." : error instanceof Error ? error.message : "Upload failed. Please try again.";
    return Response.json({ error: message }, { status: 400 });
  }
}