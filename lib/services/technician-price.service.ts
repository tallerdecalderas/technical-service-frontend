import type { CatalogPrice } from "./catalog.service";

export interface TechnicianPriceItem {
  id: string;
  code: string;
  name: string;
  unit?: string | null;
  techPrice: string;
}

export function toTechnicianPriceItem(
  price: CatalogPrice,
): TechnicianPriceItem {
  return {
    id: price.id,
    code: price.code,
    name: price.name,
    unit: price.unit,
    techPrice: price.techPrice,
  };
}
