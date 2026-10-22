import type { OrderStatus } from "@/lib/shop-store";

const styles: Record<OrderStatus, string> = {
  pending: "bg-warning-soft text-warning",
  printing: "bg-info-soft text-info",
  ready: "bg-success-soft text-success",
  collected: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${styles[status]}`}>
      {status}
    </span>
  );
}
