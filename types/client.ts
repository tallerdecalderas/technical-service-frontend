import type { Service } from "./service";

// ─── Tipos base ───────────────────────────────────────────────────────────────

export type ClientRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  address: string | null;
  locality: string | null;
  createdAt: string;
  updatedAt: string;
};

// ─── Tipo con relaciones ──────────────────────────────────────────────────────

export type Client = ClientRow & {
  services?: Service[];
};
