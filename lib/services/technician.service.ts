/**
 * Technician Service (Técnicos) — taller de calderas
 * Ahora consume la API Go en lugar de Prisma.
 * Documentación: docs/tecnicos.md, docs/decisiones.md (DEC-012)
 * El Técnico nunca administra información de otros técnicos.
 * La creación de técnicos se hace a través de Supabase Auth (gestión por el backend Go).
 */

import { apiClient, unwrapData, unwrapList } from "@/lib/api-client";
import {
  adaptTechnician,
  adaptTechnicianList,
} from "@/lib/adapters/technician.adapter";
import type { TechnicianDto } from "@/lib/dto/technician.dto";
import type { User, SessionUser } from "@/types";
import type {
  createTechnicianSchema,
  updateTechnicianSchema,
} from "@/lib/validations";

export type CreateTechnicianInput = Parameters<
  typeof createTechnicianSchema.parse
>[0];
export type UpdateTechnicianInput = Parameters<
  typeof updateTechnicianSchema.parse
>[0];

export async function listTechnicians(cookies?: string): Promise<User[]> {
  const response = await apiClient.get<TechnicianDto[]>("/technicians", cookies);

  const { data, meta } = unwrapList(response);
  const adapted = adaptTechnicianList({ technicians: data, meta });
  return adapted.technicians;
}

export async function listUsers(cookies?: string): Promise<User[]> {
  const response = await apiClient.get<TechnicianDto[]>("/technicians", cookies);

  const { data, meta } = unwrapList(response);
  const adapted = adaptTechnicianList({ technicians: data, meta });
  return adapted.technicians;
}

export async function getTechnicianById(
  id: string,
  cookies?: string,
): Promise<User | null> {
  const response = await apiClient.get<TechnicianDto>(
    `/technicians/${id}`,
    cookies,
  );
  return adaptTechnician(unwrapData(response));
}

/** Crea un nuevo técnico (a través de Supabase Auth + backend Go). */
export async function createTechnician(
  data: CreateTechnicianInput,
  idempotencyKey?: string,
  cookies?: string
): Promise<User> {
  const response = await apiClient.post<TechnicianDto, CreateTechnicianInput>(
    "/technicians",
    {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      dni: data.dni || null,
    },
    { idempotencyKey, cookies }
  );

  return adaptTechnician(unwrapData(response));
}

export async function updateTechnician(
  id: string,
  data: UpdateTechnicianInput,
  idempotencyKey?: string,
  cookies?: string
): Promise<User> {
  const response = await apiClient.patch<TechnicianDto, UpdateTechnicianInput>(
    `/technicians/${id}`,
    {
      name: data.name,
      email: data.email,
      phone: data.phone !== undefined ? data.phone || null : undefined,
      dni: data.dni !== undefined ? data.dni || null : undefined,
      isActive: data.isActive,
    },
    { idempotencyKey, cookies }
  );

  return adaptTechnician(unwrapData(response));
}

/**
 * Realiza soft delete si el técnico tiene historial, hard delete si no.
 */
export async function removeTechnician(id: string, cookies?: string): Promise<void> {
  const response = await apiClient.delete(`/technicians/${id}`, { cookies });

  if (!response.success) {
    throw new Error(response.error?.message || "Error al eliminar técnico");
  }
}
