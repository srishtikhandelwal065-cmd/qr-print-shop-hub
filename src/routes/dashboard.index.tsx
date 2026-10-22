import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileText, Clock, CheckCircle2, IndianRupee, ArrowRight } from "lucide-react";
import { OrdersTable } from "@/components/OrdersTable";
import { useShop } from "./dashboard";
import { listOrders, type Order } from "@/lib/shop-store";

export const Route = createFileRoute("/dashboard/")({ component: Overview });

function Overview() {
  const [shop] = useShop();
  const [orders, setOrders] = useState<Order[]>([]);
  useEffect(() => setOrders(listOrders(shop.id)), [shop.id]);
  const kpis = [
    { icon: FileText, label: "Total orders today", value: orders.length, tone: "bg-info-soft text-info" },
    { icon: Clock, label: "Pending", value: orders.filter((o) => o.status === "pending").length, tone: "bg-warning-soft text-warning" },
    { icon: CheckCircle2, label: "Ready to collect", value: orders.filter((o) => o.status === "ready").length, tone: "bg-success-soft text-success" },
    { icon: IndianRupee, label: "Revenue today", value: `₹${orders.reduce((s, o) => s + o.amount, 0).toLocaleString("en-IN")}`, tone: "bg-teal-soft text-teal" },
  ];
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Namaste, {shop.owner.split(" ")[0]} 👋</h1>
        <p className="text-sm text-muted-foreground">Here's what's happening at {shop.name} today.</p>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map(({ icon: I, label, value, tone }) => (
          <div key={label} className="card p-5">
            <span className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`}><I className="h-5 w-5" /></span>
            <p className="mt-4 text-xs text-muted-foreground">{label}</p>
            <p className="font-display text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent orders</h2>
        <Link to="/dashboard/orders" className="flex items-center gap-1 text-sm font-semibold text-teal">View all <ArrowRight className="h-4 w-4" /></Link>
      </div>
      <OrdersTable shopId={shop.id} limit={5} showFilters={false} />
    </div>
  );
}
