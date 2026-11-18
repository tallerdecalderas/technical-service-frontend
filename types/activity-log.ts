import type { Service } from "./service";
import type { User } from "./user";

// ─── Tipos base ───────────────────────────────────────────────────────────────

export type ActivityLogRow = {
  id: string;
  serviceId: string;
  userId: string;
  action: string;
  createdAt: string;
};

// ─── Tipo con relaciones ──────────────────────────────────────────────────────

export type ActivityLog = ActivityLogRow & {
  service?: Service | null;
  user?: User | null;
};
