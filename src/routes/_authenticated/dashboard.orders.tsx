import { createFileRoute } from "@tanstack/react-router";
import { OrdersTable } from "@/components/OrdersTable";
import { useShop } from "@/lib/use-shop";

export const Route = createFileRoute("/_authenticated/dashboard/orders")({ component: Orders });

function Orders() {
  const [shop] = useShop();
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Print Orders Queue</h1>
        <p className="text-sm text-muted-foreground">
          Real-time incoming documents from your counter QR. Manage, print, and notify customers on WhatsApp.
        </p>
      </div>
      <OrdersTable shopId={shop.id} shopName={shop.name} />
    </div>
  );
}
