import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Printer, Download, Trash2, Loader2, Inbox, Search,
  MessageCircle, Sparkles, RefreshCw
} from "lucide-react";
import {
  listOrders, deleteOrder, downloadOrderFile, printOrderFile,
  type Order
} from "@/lib/shop-store";

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

  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 3000);
  };

  const remove = async (o: Order) => {
    if (confirm(`Remove Order #${o.tokenNo} (${o.fileName}) from queue?`)) {
      try {
        await deleteOrder(o);
        await qc.invalidateQueries({ queryKey: key });
        flash(`Order #${o.tokenNo} deleted`);
      } catch {
        flash("Could not delete order. Try again.");
      }
    }
  };

  const handlePrint = async (o: Order) => {
    try {
      flash(`Opening Print Page for Order #${o.tokenNo}…`);
      await printOrderFile(o);
    } catch {
      flash("Direct print preview failed, opening download…");
      await downloadOrderFile(o);
    }
  };

  const download = async (o: Order) => {
    try {
      await downloadOrderFile(o);
      flash(`Downloading ${o.fileName}…`);
    } catch {
      flash("File could not be downloaded.");
    }
  };

  const shown = useMemo(() => {
    let list = orders ?? [];
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
  }, [orders, search, limit]);

  return (
    <div className="card overflow-hidden border bg-card shadow-sm">
      {/* Header controls & Search */}
      {showFilters && (
        <div className="border-b p-3 bg-secondary/30">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-navy text-sm">
                Counter Queue {orders ? `(${orders.length})` : ""}
              </span>
              <span className="rounded-full bg-teal-soft text-teal font-extrabold text-[11px] px-2.5 py-0.5">
                Live
              </span>
            </div>

            {/* Search and refresh */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-3 sm:top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search token #, customer, file…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="field py-2 sm:py-1.5 pl-8 pr-3 text-sm sm:text-xs w-full"
                />
              </div>
              <button
                onClick={() => refetch()}
                disabled={isRefetching}
                title="Refresh orders"
                className="grid h-10 w-10 sm:h-8 sm:w-8 shrink-0 place-items-center rounded-xl border bg-background hover:bg-secondary text-muted-foreground transition active:scale-95"
              >
                <RefreshCw className={`h-4 w-4 sm:h-3.5 sm:w-3.5 ${isRefetching ? "animate-spin text-teal" : ""}`} />
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
          <p className="mt-1 text-xs">Customer uploads via your shop QR will appear here automatically.</p>
        </div>
      ) : (
        <>
          {/* Mobile Card Queue (< md) */}
          <div className="divide-y divide-border md:hidden">
            {shown.map((o) => (
              <div key={o.id} className="p-3.5 space-y-3 bg-card hover:bg-secondary/30 transition">
                {/* Header Row: Token, Customer Name, Time, and Price */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="shrink-0 font-mono text-base font-extrabold text-teal bg-teal-soft px-2.5 py-1 rounded-xl border border-teal/30 shadow-xs">
                      #{o.tokenNo}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-navy truncate text-sm">{o.customer}</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                        <span>{new Date(o.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        {o.customerPhone && (
                          <>
                            <span>•</span>
                            <span className="font-mono">{o.customerPhone}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Total Amount */}
                  <div className="shrink-0 text-right">
                    <span className="font-display font-extrabold text-navy text-base">
                      ₹{o.amount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Document & Specs Details */}
                <div className="rounded-xl bg-secondary/70 p-2.5 space-y-2 text-xs border">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-foreground truncate text-xs" title={o.fileName}>
                      📄 {o.fileName}
                    </p>
                    <span className="shrink-0 font-bold text-teal text-[11px]">
                      {o.pages} pg{o.pages > 1 ? "s" : ""}{o.copies > 1 ? ` × ${o.copies}` : ""}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span
                      className={`rounded-md px-2 py-0.5 font-bold text-[10px] uppercase ${
                        o.color === "color" ? "bg-amber-100 text-amber-800" : "bg-card text-foreground border"
                      }`}
                    >
                      {o.color === "color" ? "Colour" : "B/W"}
                    </span>
                    <span className="rounded-md bg-card border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {o.sides === "double" ? "Duplex" : "Single"}
                    </span>
                    <span className="rounded-md bg-card border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {o.paperSize || "A4"}
                    </span>
                    {o.binding && o.binding !== "none" && (
                      <span className="rounded-md bg-teal-soft text-teal border border-teal/20 px-2 py-0.5 text-[10px] font-bold capitalize">
                        • {o.binding} binding
                      </span>
                    )}
                    {o.pageRange && o.pageRange !== "all" && (
                      <span className="rounded-md bg-card border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        Range: {o.pageRange}
                      </span>
                    )}
                  </div>
                </div>

                {/* Mobile Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  {/* Full prominent Print Button */}
                  <button
                    onClick={() => handlePrint(o)}
                    className="btn btn-teal flex-1 py-2.5 px-3 text-xs font-bold flex items-center justify-center gap-2 shadow-sm min-h-[44px]"
                    title={`Open print page for Order #${o.tokenNo}`}
                  >
                    <Printer className="h-4 w-4" />
                    <span>Print #{o.tokenNo}</span>
                  </button>

                  {/* WhatsApp Customer */}
                  {o.customerPhone && (
                    <a
                      href={`https://wa.me/91${o.customerPhone}?text=${encodeURIComponent(`Hi ${o.customer}, your print order #${o.tokenNo} is ready at ${shopName}!`)}`}
                      target="_blank"
                      rel="noreferrer"
                      title="WhatsApp Customer"
                      className="grid h-[44px] w-[44px] shrink-0 place-items-center rounded-xl border bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </a>
                  )}

                  {/* Download */}
                  <button
                    title="Download raw file"
                    onClick={() => download(o)}
                    className="grid h-[44px] w-[44px] shrink-0 place-items-center rounded-xl border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground transition"
                  >
                    <Download className="h-4 w-4" />
                  </button>

                  {/* Delete */}
                  <button
                    title="Remove order"
                    onClick={() => remove(o)}
                    className="grid h-[44px] w-[44px] shrink-0 place-items-center rounded-xl border bg-card text-muted-foreground hover:bg-destructive-soft hover:text-destructive transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[780px] text-sm">
              <thead className="bg-secondary/60 text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3 text-left">Token & Customer</th>
                  <th className="px-4 py-3 text-left">Document</th>
                  <th className="px-4 py-3 text-left">Specs</th>
                  <th className="px-4 py-3 text-left">Pages & Copies</th>
                  <th className="px-4 py-3 text-left">Total</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {shown.map((o) => (
                  <tr key={o.id} className="hover:bg-secondary/40 transition">
                    {/* Token & Customer */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-extrabold text-teal bg-teal-soft px-2.5 py-1 rounded-lg border border-teal/30">
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
                            href={`https://wa.me/91${o.customerPhone}?text=${encodeURIComponent(`Hi ${o.customer}, your print order #${o.tokenNo} is ready at ${shopName}!`)}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Message Customer on WhatsApp"
                            className="text-[#25D366] hover:opacity-80"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      )}
                    </td>

                    {/* Document Name */}
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="truncate font-medium text-foreground text-xs" title={o.fileName}>
                        {o.fileName}
                      </p>
                      <button
                        onClick={() => handlePrint(o)}
                        className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-teal hover:underline"
                      >
                        <Printer className="h-3 w-3" /> Open Print View
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

                    {/* Actions: ONLY Print #<token>, Download, and Delete */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Direct Print Button with Token */}
                        <button
                          onClick={() => handlePrint(o)}
                          className="btn btn-teal px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 shadow-sm hover:shadow"
                          title={`Open print page for Order #${o.tokenNo}`}
                        >
                          <Printer className="h-3.5 w-3.5" />
                          <span>Print #{o.tokenNo}</span>
                        </button>

                        {/* Download */}
                        <button
                          title="Download raw file"
                          onClick={() => download(o)}
                          className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                        >
                          <Download className="h-4 w-4" />
                        </button>

                        {/* Delete */}
                        <button
                          title="Remove order"
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
        </>
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
