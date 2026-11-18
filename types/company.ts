import type { Service } from "./service";
import type { InventoryItem } from "./inventory-item";
import type { Settlement } from "./settlement";

// ─── Tipos base ───────────────────────────────────────────────────────────────

export type CompanyRow = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

// ─── Tipo con relaciones ──────────────────────────────────────────────────────

export type Company = CompanyRow & {
  services?: Service[];
  inventoryItems?: InventoryItem[];
  settlements?: Settlement[];
};
