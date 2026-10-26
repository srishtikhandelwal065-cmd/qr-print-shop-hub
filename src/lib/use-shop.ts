import { useQuery } from "@tanstack/react-query";
import { getMyShop, type Shop } from "@/lib/shop-store";

export const myShopKey = ["my-shop"] as const;

export function useMyShop() {
  return useQuery({
    queryKey: myShopKey,
    queryFn: getMyShop,
    initialData: () => {
      if (typeof window === "undefined") return undefined;
      try {
        const cached = localStorage.getItem("printex_shop_cache");
        return cached ? JSON.parse(cached) : undefined;
      } catch {
        return undefined;
      }
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: 1,
  });
}

// Only used inside the dashboard, which waits for the shop before rendering children.
export function useShop(): readonly [Shop] {
  const { data } = useMyShop();
  return [data as Shop] as const;
}
