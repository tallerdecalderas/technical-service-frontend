/* ─── DTOs de transporte para Presupuestos ──────────────────────────────── */

export interface EstimateDto {
  id: string;
  serviceId: string;
  status: string;
  totalAmount: number;
  validUntil: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  service?: {
    id: string;
    clientId: string;
    technicianId: string | null;
    status: string;
  };
}

export interface CreateEstimateDto {
  serviceId: string;
  totalAmount: number;
  validUntil?: string | null;
  notes?: string | null;
}

export interface UpdateEstimateDto {
  status?: string;
  totalAmount?: number;
  validUntil?: string | null;
  notes?: string | null;
}

export interface EstimateListResponse {
  estimates: EstimateDto[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface EstimateDetailResponse {
  estimate: EstimateDto;
}
