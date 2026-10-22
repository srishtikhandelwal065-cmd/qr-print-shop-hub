import { createFileRoute } from "@tanstack/react-router";
import { OrdersTable } from "@/components/OrdersTable";
import { useShop } from "./dashboard";

export const Route = createFileRoute("/dashboard/orders")({ component: Orders });

function Orders() {
  const [shop] = useShop();
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Print Orders</h1>
        <p className="text-sm text-muted-foreground">All files uploaded by your customers. Move each order through print → ready → collected.</p>
      </div>
      <OrdersTable shopId={shop.id} />
    </div>
  );
}
