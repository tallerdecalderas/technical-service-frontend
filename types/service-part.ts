import type { Service } from "./service";
import type { InventoryItem } from "./inventory-item";

// ─── Tipos base ───────────────────────────────────────────────────────────────

export type ServicePartRow = {
  id: string;
  serviceId: string;
  inventoryItemId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  catalogCode: string | null;
  catalogName: string | null;
  createdAt: string;
};

// ─── Tipo con relaciones ──────────────────────────────────────────────────────

export type ServicePart = ServicePartRow & {
  service?: Service | null;
  inventoryItem?: InventoryItem | null;
};
