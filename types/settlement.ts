import type { User } from "./user";
import type { Company } from "./company";
import type { Payment } from "./payment";
import type { SettlementItem } from "./settlement-item";
import type { SettlementPart } from "./settlement-part";

// ─── Tipos base ───────────────────────────────────────────────────────────────

export type SettlementRow = {
  id: string;
  technicianId: string;
  liquidatedBy: string | null;
  companyId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

// ─── Enums ────────────────────────────────────────────────────────────────────

export type SettlementStatus = SettlementRow["status"];

// ─── Tipo con relaciones ──────────────────────────────────────────────────────

export type Settlement = SettlementRow & {
  technician?: User | null;
  liquidatedBy?: User | null;
  company?: Company | null;
  payments?: Payment[];
  items?: SettlementItem[];
  parts?: SettlementPart[];
};
