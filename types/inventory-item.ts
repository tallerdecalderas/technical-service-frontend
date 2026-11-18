import type { Company } from "./company";
import type { ServicePart } from "./service-part";

// ─── Tipos base ───────────────────────────────────────────────────────────────

export type InventoryItemRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

// ─── Tipo con relaciones ──────────────────────────────────────────────────────

export type InventoryItem = InventoryItemRow & {
  company?: Company | null;
  serviceParts?: ServicePart[];
};
