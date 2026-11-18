import type { Service } from "./service";

// ─── Tipos base ───────────────────────────────────────────────────────────────

export type ServiceCategoryRow = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

// ─── Tipo con relaciones ──────────────────────────────────────────────────────

export type ServiceCategory = ServiceCategoryRow & {
  services?: Service[];
};
