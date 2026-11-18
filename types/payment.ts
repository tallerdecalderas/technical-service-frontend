import type { Service } from "./service";
import type { User } from "./user";
import type { Settlement } from "./settlement";
import type { SettlementItem } from "./settlement-item";

// ─── Tipos base ───────────────────────────────────────────────────────────────

export type PaymentRow = {
  id: string;
  serviceId: string;
  technicianId: string;
  method: string;
  amountPaid: number;
  debtAmount: number | null;
  createdAt: string;
  updatedAt: string;
};

// ─── Enums ────────────────────────────────────────────────────────────────────

export type PaymentMethod = PaymentRow["method"];

// ─── Tipo con relaciones ──────────────────────────────────────────────────────

export type Payment = PaymentRow & {
  service?: Service | null;
  technician?: User | null;
  settlement?: Settlement | null;
  settlementItems?: SettlementItem[];
};
