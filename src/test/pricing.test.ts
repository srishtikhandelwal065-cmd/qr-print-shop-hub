import { describe, expect, it } from "vitest";
import { calcPrice } from "@/lib/shop-store";

const shop = { priceBw: 2, priceColor: 10, doubleDiscount: 0.25 };

describe("calcPrice", () => {
  it("charges B/W single-sided per page", () => expect(calcPrice(shop, 10, "bw", "single")).toBe(20));
  it("charges colour per page", () => expect(calcPrice(shop, 3, "color", "single")).toBe(30));
  it("applies double-sided discount and copies", () => expect(calcPrice(shop, 10, "bw", "double", 2)).toBe(30));
});
