import type { User } from "./user";
import type { Company } from "./company";
import type { SettlementItem } from "./settlement-item";
import type { SettlementPart } from "./settlement-part";

// ─── Tipos base ───────────────────────────────────────────────────────────────

export type SettlementRow = {
  id: string;
  technicianId: string;
  technicianName: string;
  liquidatedBy: string | null;
  companyId: string;
  companyName: string | null;
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
  payments?: Array<{ id: string; serviceId: string; amountPaid: number; debtAmount: number }>;
  items?: SettlementItem[];
  parts?: SettlementPart[];

  // Campos extendidos devueltos por la API Go de settlements
  companyName?: string | null;
  startDate?: string;
  endDate?: string;
  label?: string | null;
  companyRate?: string;
  technicianRate?: string;
  servicesCount?: number;
  totalCollected?: string;
  totalDebt?: string;
  totalPartsCost?: string;
  totalPartsSale?: string;
  totalExpenses?: string;
  totalInsurance?: string;
  totalOther?: string;
  totalDiscounts?: string;
  totalAdvances?: string;
  commissionBase?: string;
  techCommission?: string;
  compCommission?: string;
  techBalance?: string;
  liquidatedAt?: string | null;
  liquidatedById?: string | null;
  createdById?: string | null;
};
