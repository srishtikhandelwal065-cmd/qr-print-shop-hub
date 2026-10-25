import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useShop, myShopKey } from "@/lib/use-shop";
import { updateShop } from "@/lib/shop-store";

export const Route = createFileRoute("/_authenticated/dashboard/settings")({ component: SettingsPage });

const options = [
  ["accept", "Accept new uploads", "Turn off when your shop is closed."],
  ["sound", "Sound alert for new orders", "Play a chime when a file arrives."],
  ["whatsapp", "Show WhatsApp option to customers", "Let customers send files on WhatsApp instead."],
  ["autoReady", "Auto-notify when ready", "Message the customer when you mark an order ready."],
] as const;

function SettingsPage() {
  const [shop] = useShop();
  const qc = useQueryClient();
  const [local, setLocal] = useState<Record<string, boolean>>({ sound: true, autoReady: false });
  const on: Record<string, boolean> = { ...local, accept: shop.acceptUploads, whatsapp: shop.showWhatsapp };
  const toggle = async (k: string) => {
    if (k !== "accept" && k !== "whatsapp") return setLocal((s) => ({ ...s, [k]: !s[k] }));
    const next = k === "accept" ? { ...shop, acceptUploads: !shop.acceptUploads } : { ...shop, showWhatsapp: !shop.showWhatsapp };
    qc.setQueryData(myShopKey, next);
    try { await updateShop(next); } catch { qc.setQueryData(myShopKey, shop); }
  };
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Settings</h1>
        <p className="text-sm text-muted-foreground">Control how your shop receives orders.</p>
      </div>
      <div className="card divide-y">
        {options.map(([k, t, d]) => (
          <div key={k} className="flex items-center justify-between gap-4 p-5">
            <div><p className="font-semibold">{t}</p><p className="text-sm text-muted-foreground">{d}</p></div>
            <button role="switch" aria-checked={on[k]} onClick={() => toggle(k)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition ${on[k] ? "bg-teal" : "bg-input"}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-card shadow transition-all ${on[k] ? "left-[22px]" : "left-0.5"}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
