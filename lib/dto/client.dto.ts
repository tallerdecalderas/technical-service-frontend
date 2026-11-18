/* ─── DTOs de transporte para Clientes ──────────────────────────────────── */

export interface ClientDto {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  address: string | null;
  locality: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientDto {
  name: string;
  email?: string | null;
  phone: string;
  address?: string | null;
  locality?: string | null;
}

export interface UpdateClientDto {
  name?: string;
  email?: string | null;
  phone?: string;
  address?: string | null;
  locality?: string | null;
}

export interface ClientListResponse {
  clients: ClientDto[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ClientDetailResponse {
  client: ClientDto;
}
