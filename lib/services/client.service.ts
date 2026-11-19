/**
 * Client Service (Clientes) — taller de calderas
 * Ahora consume la API Go en lugar de Prisma.
 * Documentación: docs/reglas-negocio.md, docs/api.md
 */

import { apiClient } from "@/lib/api-client";
import {
  adaptClient,
  adaptClientDetail,
  adaptClientList,
} from "@/lib/adapters/client.adapter";
import type { Client, SessionUser } from "@/types";
import type {
  createClientSchema,
  updateClientSchema,
} from "@/lib/validations";

export type CreateClientInput = Parameters<typeof createClientSchema.parse>[0];
export type UpdateClientInput = Parameters<typeof updateClientSchema.parse>[0];

/** Lista paginada de clientes. ADMIN ve todos; TECHNICIAN ve clientes con servicios propios. */
export async function listClients(
  params?: {
    page?: number;
    pageSize?: number;
    search?: string;
  },
  session?: SessionUser,
  cookies?: string
): Promise<{ clients: Client[]; page: number; pageSize: number; total: number; totalPages: number }> {
  const response = await apiClient.get<{
    clients: any[];
    meta: { page: number; pageSize: number; total: number; totalPages: number };
  }>("/clients", {
    page: params?.page ?? 1,
    pageSize: params?.pageSize ?? 20,
    search: params?.search ?? "",
  }, cookies);

  if (!response.success) {
    throw new Error(response.error?.message || "Error al listar clientes");
  }

  const adapted = adaptClientList(response as any);
  return {
    clients: adapted.clients,
    page: adapted.meta.page,
    pageSize: adapted.meta.pageSize,
    total: adapted.meta.total,
    totalPages: adapted.meta.totalPages,
  };
}

/** Obtiene un cliente por ID con sus servicios recientes. */
export async function getClientById(
  id: string,
  session?: SessionUser,
  cookies?: string
): Promise<Client | null> {
  const response = await apiClient.get<{ client: any }>(`/clients/${id}`, cookies);

  if (!response.success) {
    if (response.error?.code === "NOT_FOUND") return null;
    throw new Error(response.error?.message || "Error al obtener cliente");
  }

  return adaptClientDetail(response as any);
}

/** Crea un nuevo cliente. */
export async function createClient(
  data: CreateClientInput,
  session?: SessionUser,
  idempotencyKey?: string,
  cookies?: string
): Promise<Client> {
  const response = await apiClient.post<{ client: any }, CreateClientInput>(
    "/clients",
    {
      name: data.name,
      email: data.email || null,
      phone: data.phone,
      address: data.address || null,
      locality: data.locality || null,
    },
    { idempotencyKey, cookies }
  );

  if (!response.success) {
    throw new Error(response.error?.message || "Error al crear cliente");
  }

  return adaptClient(response.data.client);
}

/** Actualiza un cliente existente. */
export async function updateClient(
  id: string,
  data: UpdateClientInput,
  session?: SessionUser,
  idempotencyKey?: string,
  cookies?: string
): Promise<Client> {
  const response = await apiClient.patch<{ client: any }, UpdateClientInput>(
    `/clients/${id}`,
    {
      name: data.name,
      email: data.email !== undefined ? data.email || null : undefined,
      phone: data.phone !== undefined ? data.phone : undefined,
      address: data.address !== undefined ? data.address || null : undefined,
      locality: data.locality !== undefined ? data.locality || null : undefined,
    },
    { idempotencyKey, cookies }
  );

  if (!response.success) {
    throw new Error(response.error?.message || "Error al actualizar cliente");
  }

  return adaptClient(response.data.client);
}

/**
 * Elimina un cliente solamente si no tiene servicios asociados.
 * Los clientes con historial no pueden eliminarse (docs/reglas-negocio.md).
 */
export async function removeClient(
  id: string,
  session?: SessionUser,
  idempotencyKey?: string,
  cookies?: string
): Promise<void> {
  const response = await apiClient.delete(`/clients/${id}`, {
    idempotencyKey,
    cookies,
  });

  if (!response.success) {
    throw new Error(response.error?.message || "Error al eliminar cliente");
  }
}
