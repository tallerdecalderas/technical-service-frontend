import type { Settlement } from "./settlement";
import type { Service } from "./service";
import type { Company } from "./company";

// ─── Tipos base ───────────────────────────────────────────────────────────────

export type SettlementPartRow = {
  id: string;
  settlementId: string;
  serviceId: string;
  companyId: string;
  createdAt: string;
};

// ─── Tipo con relaciones ──────────────────────────────────────────────────────

export type SettlementPart = SettlementPartRow & {
  settlement?: Settlement | null;
  service?: Service | null;
  company?: Company | null;
};
