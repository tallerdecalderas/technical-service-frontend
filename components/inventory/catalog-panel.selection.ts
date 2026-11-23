import type { CatalogPrice } from "@/lib/services/catalog.service";

export function findCatalogItemForCompany(
  items: CatalogPrice[],
  selectedId: string,
  companyId: string,
): CatalogPrice | undefined {
  return items.find(
    (item) => item.id === selectedId && item.companyId === companyId,
  );
}
