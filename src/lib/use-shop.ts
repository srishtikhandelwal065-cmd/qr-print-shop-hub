import { useQuery } from "@tanstack/react-query";
import { getMyShop, type Shop } from "@/lib/shop-store";

export const myShopKey = ["my-shop"] as const;

export function useMyShop() {
  return useQuery({ queryKey: myShopKey, queryFn: getMyShop });
}

// Only used inside the dashboard, which waits for the shop before rendering children.
export function useShop(): readonly [Shop] {
  const { data } = useMyShop();
  return [data as Shop] as const;
}
