/* ─── DTOs de transporte para Autenticación ─────────────────────────────── */

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: "ADMIN" | "TECHNICIAN";
    avatar?: string | null;
    companies?: Array<{ id: string }>;
  };
}

export interface SessionResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: "ADMIN" | "TECHNICIAN";
    avatar?: string | null;
    companies?: Array<{ id: string }>;
  };
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  password: string;
}
