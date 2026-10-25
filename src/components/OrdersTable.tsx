import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Printer, CheckCircle2, Download, Trash2, Loader2, Inbox } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { listOrders, setOrderStatus, deleteOrder, downloadOrderFile, type Order, type OrderStatus } from "@/lib/shop-store";

const next: Partial<Record<OrderStatus, OrderStatus>> = { pending: "printing", printing: "ready", ready: "collected" };
const label: Partial<Record<OrderStatus, string>> = { pending: "Print", printing: "Mark ready", ready: "Collected" };

export function OrdersTable({ shopId, limit, showFilters = true }: { shopId: string; limit?: number; showFilters?: boolean }) {
  const qc = useQueryClient();
  const key = ["orders", shopId];
  const { data: orders = null, error } = useQuery({ queryKey: key, queryFn: () => listOrders(shopId), refetchInterval: 15000 });
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [toast, setToast] = useState("");
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2200); };
  const run = async (fn: () => Promise<void>, msg: string) => {
    try { await fn(); await qc.invalidateQueries({ queryKey: key }); flash(msg); } catch { flash("Something went wrong. Try again."); }
  };
  const advance = (o: Order) => run(() => setOrderStatus(o.id, next[o.status]!), `${o.id} → ${next[o.status]}`);
  const remove = (o: Order) => run(() => deleteOrder(o), `${o.id} deleted`);
  const download = async (o: Order) => { try { await downloadOrderFile(o); } catch { flash("File not available"); } };

  const shown = useMemo(() => {
    const l = (orders ?? []).filter((o) => filter === "all" || o.status === filter);
    return limit ? l.slice(0, limit) : l;
  }, [orders, filter, limit]);

  return (
    <div className="card overflow-hidden">
      {showFilters && (
        <div className="flex gap-2 overflow-x-auto border-b p-3">
          {(["all", "pending", "printing", "ready", "collected"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize ${filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
              {f}{orders && f !== "all" ? ` (${orders.filter((o) => o.status === f).length})` : ""}
            </button>
          ))}
        </div>
      )}
      {error ? (
        <div className="p-12 text-center text-sm text-destructive">Couldn't load orders.</div>
      ) : !orders ? (
        <div className="flex items-center justify-center gap-2 p-12 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading orders…</div>
      ) : shown.length === 0 ? (
        <div className="p-12 text-center text-sm text-muted-foreground"><Inbox className="mx-auto mb-2 h-6 w-6" /> No orders here yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-secondary text-xs text-muted-foreground">
              <tr>{["Order", "File", "Pages", "Print type", "Amount", "Status", "Actions"].map((h) => <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {shown.map((o) => (
                <tr key={o.id} className="border-t hover:bg-secondary/50">
                  <td className="px-4 py-3"><p className="font-semibold">{o.id}</p><p className="text-xs text-muted-foreground">{o.customer} · {new Date(o.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p></td>
                  <td className="max-w-[200px] truncate px-4 font-medium">{o.fileName}</td>
                  <td className="px-4">{o.pages}{o.copies > 1 && <span className="text-muted-foreground"> ×{o.copies}</span>}</td>
                  <td className="px-4 text-muted-foreground">{o.color === "bw" ? "B/W" : "Colour"} · {o.sides === "single" ? "Single" : "Double"}</td>
                  <td className="px-4 font-semibold">₹{o.amount}</td>
                  <td className="px-4"><StatusBadge status={o.status} /></td>
                  <td className="px-4">
                    <div className="flex items-center gap-1">
                      {next[o.status] && (
                        <button onClick={() => advance(o)} className="btn btn-teal px-2.5 py-1.5 text-xs">
                          {o.status === "pending" ? <Printer className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />} {label[o.status]}
                        </button>
                      )}
                      <button title="Download" onClick={() => download(o)} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary"><Download className="h-4 w-4" /></button>
                      <button title="Delete" onClick={() => remove(o)} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive-soft hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {toast && <div className="fade-up fixed bottom-6 right-6 z-50 rounded-xl bg-primary px-4 py-3 text-sm text-primary-foreground shadow-[var(--shadow-float)]">{toast}</div>}
    </div>
  );
}
