import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Printer, CheckCircle2, Download, Trash2, Loader2, Inbox, Search,
  MessageCircle, ExternalLink, Sparkles, Layers, RefreshCw
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import {
  listOrders, setOrderStatus, deleteOrder, downloadOrderFile,
  type Order, type OrderStatus
} from "@/lib/shop-store";

const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "printing",
  printing: "ready",
  ready: "collected",
};

const actionLabels: Partial<Record<OrderStatus, string>> = {
  pending: "Start Print",
  printing: "Mark Ready",
  ready: "Collected",
};

export function OrdersTable({
  shopId,
  shopName = "Print Hub",
  limit,
  showFilters = true,
}: {
  shopId: string;
  shopName?: string;
  limit?: number;
  showFilters?: boolean;
}) {
  const qc = useQueryClient();
  const key = ["orders", shopId];
  const { data: orders = null, error, isRefetching, refetch } = useQuery({
    queryKey: key,
    queryFn: () => listOrders(shopId),
    initialData: () => {
      if (typeof window === "undefined") return undefined;
      try {
        const cached = localStorage.getItem(`printex_orders_cache_${shopId}`);
        return cached ? JSON.parse(cached) : undefined;
      } catch {
        return undefined;
      }
    },
    staleTime: 1000 * 30,
    refetchInterval: 15000,
  });

  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2500);
  };

  const run = async (fn: () => Promise<void>, msg: string) => {
    try {
      await fn();
      await qc.invalidateQueries({ queryKey: key });
      flash(msg);
    } catch {
      flash("Action failed. Please try again.");
    }
  };

  const advance = (o: Order) => {
    const next = nextStatus[o.status];
    if (!next) return;
    run(() => setOrderStatus(o.id, next), `Order #${o.tokenNo} updated to ${next.toUpperCase()}`);
  };

  const remove = (o: Order) => {
    if (confirm(`Delete order #${o.tokenNo} (${o.fileName})?`)) {
      run(() => deleteOrder(o), `Order #${o.tokenNo} deleted`);
    }
  };

  const download = async (o: Order) => {
    try {
      await downloadOrderFile(o);
      flash(`Opening ${o.fileName}…`);
    } catch {
      flash("File could not be opened.");
    }
  };

  const sendWhatsAppReady = (o: Order) => {
    if (!o.customerPhone) return;
    const msg = encodeURIComponent(
      `Namaste ${o.customer}! 📄\n\nYour print order *#${o.tokenNo}* is READY at *${shopName}*!\n\nDetails:\n• File: ${o.fileName}\n• Amount to pay: ₹${o.amount.toFixed(2)}\n\nPlease collect it from the counter. Thank you!`
    );
    window.open(`https://wa.me/91${o.customerPhone}?text=${msg}`, "_blank");
  };

  const shown = useMemo(() => {
    let list = orders ?? [];
    if (filter !== "all") {
      list = list.filter((o) => o.status === filter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (o) =>
          o.tokenNo.toLowerCase().includes(q) ||
          o.customer.toLowerCase().includes(q) ||
          o.fileName.toLowerCase().includes(q) ||
          (o.customerPhone && o.customerPhone.includes(q))
      );
    }
    return limit ? list.slice(0, limit) : list;
  }, [orders, filter, search, limit]);

  return (
    <div className="card overflow-hidden border bg-card shadow-sm">
      {/* Header controls & Filters */}
      {showFilters && (
        <div className="border-b p-3 space-y-3 bg-secondary/30">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            {/* Status tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {(["all", "pending", "printing", "ready", "collected"] as const).map((f) => {
                const count = orders ? (f === "all" ? orders.length : orders.filter((o) => o.status === f).length) : 0;
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition ${
                      filter === f
                        ? "bg-navy text-primary-foreground shadow-sm"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f} {orders ? `(${count})` : ""}
                  </button>
                );
              })}
            </div>

            {/* Search and refresh */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-60">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search token, name, phone…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="field py-1.5 pl-8 pr-3 text-xs w-full"
                />
              </div>
              <button
                onClick={() => refetch()}
                disabled={isRefetching}
                title="Refresh orders"
                className="grid h-8 w-8 place-items-center rounded-lg border bg-background hover:bg-secondary text-muted-foreground"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin text-teal" : ""}`} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Table view */}
      {error ? (
        <div className="p-12 text-center text-sm text-destructive font-medium">
          Couldn't load orders from Supabase. Please check your connection.
        </div>
      ) : !orders ? (
        <div className="flex items-center justify-center gap-2 p-12 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-teal" /> Loading live print orders…
        </div>
      ) : shown.length === 0 ? (
        <div className="p-12 text-center text-sm text-muted-foreground">
          <Inbox className="mx-auto mb-2 h-8 w-8 text-muted-foreground/60" />
          <p className="font-semibold text-foreground">No orders in this queue.</p>
          <p className="mt-1 text-xs">Customer uploads via your shop QR will appear here in real-time.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-secondary/60 text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3 text-left">Token & Customer</th>
                <th className="px-4 py-3 text-left">Document</th>
                <th className="px-4 py-3 text-left">Specs</th>
                <th className="px-4 py-3 text-left">Pages / Copies</th>
                <th className="px-4 py-3 text-left">Total</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {shown.map((o) => (
                <tr key={o.id} className="hover:bg-secondary/40 transition">
                  {/* Token & Customer */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-extrabold text-teal bg-teal-soft px-2 py-0.5 rounded-md border border-teal/20">
                        #{o.tokenNo}
                      </span>
                      <div>
                        <p className="font-bold text-navy truncate max-w-[130px]">{o.customer}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(o.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                    {o.customerPhone && (
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="font-mono text-[11px]">{o.customerPhone}</span>
                        <a
                          href={`https://wa.me/91${o.customerPhone}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Chat on WhatsApp"
                          className="text-[#25D366] hover:opacity-80"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    )}
                  </td>

                  {/* Document Name */}
                  <td className="px-4 py-3 max-w-[180px]">
                    <p className="truncate font-medium text-foreground text-xs" title={o.fileName}>
                      {o.fileName}
                    </p>
                    <button
                      onClick={() => download(o)}
                      className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-teal hover:underline"
                    >
                      <Download className="h-3 w-3" /> Download / Open
                    </button>
                  </td>

                  {/* Print Specs */}
                  <td className="px-4 py-3 text-xs space-y-0.5">
                    <div className="flex items-center gap-1">
                      <span
                        className={`rounded px-1.5 py-0.5 font-bold text-[10px] uppercase ${
                          o.color === "color" ? "bg-amber-100 text-amber-800" : "bg-secondary text-foreground"
                        }`}
                      >
                        {o.color === "color" ? "Colour" : "B/W"}
                      </span>
                      <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {o.sides === "double" ? "Duplex" : "Single"}
                      </span>
                      <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {o.paperSize || "A4"}
                      </span>
                    </div>
                    {o.binding && o.binding !== "none" && (
                      <p className="text-[11px] font-semibold text-teal capitalize">
                        • {o.binding} binding
                      </p>
                    )}
                    {o.pageRange && o.pageRange !== "all" && (
                      <p className="text-[11px] text-muted-foreground">
                        Range: <span className="font-mono font-medium">{o.pageRange}</span>
                      </p>
                    )}
                  </td>

                  {/* Pages & Copies */}
                  <td className="px-4 py-3 text-xs font-semibold">
                    <span>{o.pages} pg{o.pages > 1 ? "s" : ""}</span>
                    {o.copies > 1 && <span className="text-teal font-bold"> × {o.copies} copies</span>}
                  </td>

                  {/* Amount */}
                  <td className="px-4 py-3 font-display font-bold text-navy text-sm">
                    ₹{o.amount.toFixed(2)}
                  </td>

                  {/* Status Badge */}
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status} />
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Advance Stage Button */}
                      {nextStatus[o.status] && (
                        <button
                          onClick={() => advance(o)}
                          className={`btn px-2.5 py-1.5 text-xs font-bold ${
                            o.status === "pending"
                              ? "btn-teal"
                              : o.status === "printing"
                              ? "bg-amber-500 hover:bg-amber-600 text-white"
                              : "btn-outline"
                          }`}
                        >
                          {o.status === "pending" ? (
                            <Printer className="h-3.5 w-3.5" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                          {actionLabels[o.status]}
                        </button>
                      )}

                      {/* WhatsApp Ready Notification Button if status is Ready */}
                      {o.status === "ready" && o.customerPhone && (
                        <button
                          onClick={() => sendWhatsAppReady(o)}
                          title="WhatsApp Ready Alert to Customer"
                          className="btn bg-[#25D366] hover:bg-[#20ba59] text-white px-2.5 py-1.5 text-xs font-bold"
                        >
                          <MessageCircle className="h-3.5 w-3.5" /> Notify WhatsApp
                        </button>
                      )}

                      {/* Fast Print / Download */}
                      <button
                        title="Download file"
                        onClick={() => download(o)}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                      >
                        <Download className="h-4 w-4" />
                      </button>

                      {/* Delete */}
                      <button
                        title="Delete order"
                        onClick={() => remove(o)}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-destructive-soft hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fade-up fixed bottom-6 right-6 z-50 rounded-xl bg-navy px-4 py-3 text-xs font-semibold text-white shadow-2xl flex items-center gap-2 border border-white/10">
          <Sparkles className="h-3.5 w-3.5 text-teal" /> {toast}
        </div>
      )}
    </div>
  );
}
