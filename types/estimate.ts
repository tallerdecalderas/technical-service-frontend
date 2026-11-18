import type { Service } from "./service";

// ─── Tipos base ───────────────────────────────────────────────────────────────

export type EstimateRow = {
  id: string;
  serviceId: string;
  status: string;
  totalAmount: number;
  validUntil: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

// ─── Enums ────────────────────────────────────────────────────────────────────

export type EstimateStatus = EstimateRow["status"];

// ─── Tipo con relaciones ──────────────────────────────────────────────────────

export type Estimate = EstimateRow & {
  service?: Service | null;
};
