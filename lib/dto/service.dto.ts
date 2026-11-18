/* ─── DTOs de transporte para Servicios ─────────────────────────────────── */

export interface ServiceDto {
  id: string;
  companyId: string;
  clientId: string;
  categoryId: string | null;
  technicianId: string | null;
  scheduledDate: string;
  address: string;
  locality: string;
  observation: string | null;
  expectedAmount: number | null;
  finalAmount: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  closedBy: string | null;
  client?: {
    id: string;
    name: string;
    email: string | null;
    phone: string;
  };
  technician?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  } | null;
  company?: {
    id: string;
    name: string;
  } | null;
  payment?: {
    id: string;
    method: string;
    amountPaid: number;
    debtAmount: number;
    createdAt: string;
  } | null;
  estimate?: {
    id: string;
    status: string;
    totalAmount: number;
    createdAt: string;
  } | null;
  parts?: Array<{
    id: string;
    serviceId: string;
    inventoryItemId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    catalogCode: string | null;
    catalogName: string | null;
    createdAt: string;
  }>;
  activityLogs?: Array<{
    id: string;
    action: string;
    description: string | null;
    createdAt: string;
    user: {
      id: string;
      name: string;
      role: string;
    } | null;
  }>;
}

export interface CreateServiceDto {
  companyId: string;
  clientId: string;
  categoryId?: string | null;
  technicianId?: string | null;
  scheduledDate: string;
  address: string;
  locality: string;
  observation?: string | null;
  expectedAmount?: number | null;
  finalAmount?: number | null;
}

export interface UpdateServiceDto {
  companyId?: string;
  clientId?: string;
  categoryId?: string | null;
  technicianId?: string | null;
  scheduledDate?: string;
  address?: string | null;
  locality?: string | null;
  observation?: string | null;
  expectedAmount?: number | null;
  finalAmount?: number | null;
}

export interface UpdateStatusDto {
  status: string;
}

export interface FinishServiceDto {
  finalAmount: number;
  observation?: string | null;
}

export interface ServiceListResponse {
  services: ServiceDto[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ServiceDetailResponse {
  service: ServiceDto;
}
