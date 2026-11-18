// ─── Tipos base ───────────────────────────────────────────────────────────────

export type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
};

// ─── Enums ────────────────────────────────────────────────────────────────────

export type Role = UserRow["role"];

// ─── Tipo con relaciones ──────────────────────────────────────────────────────

export type User = UserRow;
