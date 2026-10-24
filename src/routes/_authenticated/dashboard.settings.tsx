import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/dashboard/settings")({ component: SettingsPage });

const options = [
  ["accept", "Accept new uploads", "Turn off when your shop is closed."],
  ["sound", "Sound alert for new orders", "Play a chime when a file arrives."],
  ["whatsapp", "Show WhatsApp option to customers", "Let customers send files on WhatsApp instead."],
  ["autoReady", "Auto-notify when ready", "Message the customer when you mark an order ready."],
] as const;

function SettingsPage() {
  const [on, setOn] = useState<Record<string, boolean>>({ accept: true, sound: true, whatsapp: true, autoReady: false });
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
            <button role="switch" aria-checked={on[k]} onClick={() => setOn((s) => ({ ...s, [k]: !s[k] }))}
              className={`relative h-6 w-11 shrink-0 rounded-full transition ${on[k] ? "bg-teal" : "bg-input"}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-card shadow transition-all ${on[k] ? "left-[22px]" : "left-0.5"}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
