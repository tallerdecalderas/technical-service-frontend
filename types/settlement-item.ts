import type { Settlement } from "./settlement";
import type { Service } from "./service";
import type { Payment } from "./payment";

// ─── Tipos base ───────────────────────────────────────────────────────────────

export type SettlementItemRow = {
  id: string;
  settlementId: string;
  serviceId: string;
  paymentId: string | null;
  createdAt: string;
};

// ─── Tipo con relaciones ──────────────────────────────────────────────────────

export type SettlementItem = SettlementItemRow & {
  settlement?: Settlement | null;
  service?: Service | null;
  payment?: Payment | null;
};
