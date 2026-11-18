/* ─── DTOs de transporte para Pagos ─────────────────────────────────────── */

export interface PaymentDto {
  id: string;
  serviceId: string;
  technicianId: string;
  method: string;
  amountPaid: number;
  debtAmount: number | null;
  createdAt: string;
  updatedAt: string;
  service?: {
    id: string;
    clientId: string;
    companyId: string;
    technicianId: string | null;
    status: string;
  };
  technician?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreatePaymentDto {
  serviceId: string;
  technicianId: string;
  method: string;
  amountPaid: number;
  debtAmount?: number | null;
}

export interface UpdatePaymentDto {
  method?: string;
  amountPaid?: number;
  debtAmount?: number | null;
}

export interface PaymentListResponse {
  payments: PaymentDto[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface PaymentDetailResponse {
  payment: PaymentDto;
}
