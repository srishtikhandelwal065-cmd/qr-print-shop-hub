import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileText, Clock, CheckCircle2, IndianRupee, ArrowRight, Layers } from "lucide-react";
import { OrdersTable } from "@/components/OrdersTable";
import { useShop } from "@/lib/use-shop";
import { listOrders } from "@/lib/shop-store";

export const Route = createFileRoute("/_authenticated/dashboard/")({ component: Overview });

function Overview() {
  const [shop] = useShop();
  const { data: all = [] } = useQuery({
    queryKey: ["orders", shop.id],
    queryFn: () => listOrders(shop.id),
  });

  const today = new Date().toDateString();
  const orders = all.filter((o) => new Date(o.createdAt).toDateString() === today);
  const pendingOrders = orders.filter((o) => o.status === "pending");
  const pagesPrintedToday = orders.filter((o) => o.status !== "pending").reduce((sum, o) => sum + (o.pages * o.copies), 0);
  const totalRevenue = orders.reduce((s, o) => s + o.amount, 0);

  const kpis = [
    { icon: FileText, label: "Orders Today", value: orders.length, tone: "bg-info-soft text-info" },
    { icon: Clock, label: "Pending to Print", value: pendingOrders.length, tone: "bg-warning-soft text-warning" },
    { icon: Layers, label: "Pages Printed", value: pagesPrintedToday, tone: "bg-purple-100 text-purple-700" },
    { icon: IndianRupee, label: "Revenue Today", value: `₹${totalRevenue.toLocaleString("en-IN")}`, tone: "bg-teal-soft text-teal" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-navy">Namaste, {shop.owner.split(" ")[0]} 👋</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Live daily counter ledger for {shop.name}{shop.email ? ` • ${shop.email}` : ""}.
          </p>
        </div>
        <Link
          to="/s/$shopId"
          params={{ shopId: shop.id }}
          target="_blank"
          className="btn btn-teal text-xs w-full sm:w-auto py-2.5 min-h-[40px] font-bold"
        >
          Open Customer QR Page ↗
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
        {kpis.map(({ icon: I, label, value, tone }) => (
          <div key={label} className="card p-3.5 sm:p-5">
            <span className={`grid h-8 w-8 sm:h-10 sm:w-10 place-items-center rounded-xl ${tone}`}>
              <I className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>
            <p className="mt-3 sm:mt-4 text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="font-display text-lg sm:text-2xl font-extrabold text-navy mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-1">
        <h2 className="text-base sm:text-lg font-bold text-navy">Recent Customer Orders</h2>
        <Link to="/dashboard/orders" className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-teal hover:underline">
          View full queue <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <OrdersTable shopId={shop.id} shopName={shop.name} limit={5} showFilters={false} />
    </div>
  );
}
