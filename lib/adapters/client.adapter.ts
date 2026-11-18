/* ─── Adaptador: ClientDto → Client (tipo del frontend) ─────────────────── */

import type { Client } from "@/types";
import type { ClientDto, ClientListResponse, ClientDetailResponse } from "@/lib/dto/client.dto";

export function adaptClient(dto: ClientDto): Client {
  return {
    id: dto.id,
    name: dto.name,
    email: dto.email,
    phone: dto.phone,
    address: dto.address ?? null,
    locality: dto.locality ?? null,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
  } as unknown as Client;
}

export function adaptClientList(response: ClientListResponse): {
  clients: Client[];
  meta: ClientListResponse["meta"];
} {
  return {
    clients: response.clients.map(adaptClient),
    meta: response.meta,
  };
}

export function adaptClientDetail(
  response: ClientDetailResponse
): Client | null {
  if (!response.client) return null;
  return adaptClient(response.client);
}
