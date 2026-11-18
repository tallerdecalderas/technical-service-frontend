/* ─── DTOs de transporte para Técnicos ──────────────────────────────────── */

export interface TechnicianDto {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  dni: string | null;
  role: string;
  isActive: boolean;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTechnicianDto {
  name: string;
  email: string;
  phone?: string | null;
  dni?: string | null;
}

export interface UpdateTechnicianDto {
  name?: string;
  email?: string;
  phone?: string | null;
  dni?: string | null;
  isActive?: boolean;
}

export interface TechnicianListResponse {
  technicians: TechnicianDto[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface TechnicianDetailResponse {
  technician: TechnicianDto;
}
