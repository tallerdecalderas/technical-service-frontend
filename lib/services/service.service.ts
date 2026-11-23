/**
 * Service Service (Órdenes de Trabajo) — taller de calderas
 * Ahora consume la API Go en lugar de Prisma.
 * Documentación: docs/reglas-negocio.md, docs/api.md
 *
 * Reglas clave:
 * - El Administrador crea y gestiona. El Técnico solo opera sus propias órdenes.
 * - Los servicios NUNCA se eliminan físicamente (soft delete → CANCELLED).
 * - Cada cambio importante se registra en ActivityLog (manejo por el backend).
 */

import { apiClient, unwrapData, unwrapList } from "@/lib/api-client";
import {
  adaptService,
  adaptServiceDetail,
  adaptServiceList,
} from "@/lib/adapters/service.adapter";
import type { ServiceDto } from "@/lib/dto/service.dto";
import type { Service, ServiceFilters, SessionUser } from "@/types";
import type { z } from "zod";
import type {
  createServiceSchema,
  updateServiceSchema,
  updateStatusSchema,
  finishServiceSchema,
} from "@/lib/validations";

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type FinishServiceInput = z.infer<typeof finishServiceSchema>;

export async function listServices(
  filters: ServiceFilters,
  session: SessionUser,
  cookies?: string
): Promise<Service[]> {
  const params: Record<string, string> = {};

  if (session.role === "TECHNICIAN") {
    params.technicianId = session.id;
  } else {
    if (filters.technicianId) params.technicianId = filters.technicianId;
    if (filters.clientId) params.clientId = filters.clientId;
    if (filters.companyId) params.companyId = filters.companyId;
    if (filters.categoryId) params.categoryId = filters.categoryId;
  }

  if (filters.status) params.status = filters.status;
  if (filters.dateFrom) params.dateFrom = filters.dateFrom;
  if (filters.dateTo) params.dateTo = filters.dateTo;

  const response = await apiClient.get<ServiceDto[]>("/services", params, cookies);

  const { data, meta } = unwrapList(response);
  const adapted = adaptServiceList({ services: data, meta });
  return adapted.services;
}

export async function getServiceById(
  id: string,
  session: SessionUser,
  cookies?: string
): Promise<Service | null> {
  const response = await apiClient.get<ServiceDto>(`/services/${id}`, cookies);
  const service = adaptService(unwrapData(response));

  // El backend ya aplica autorización, pero validamos por seguridad en el cliente
  if (session.role === "TECHNICIAN" && service?.technicianId !== session.id) {
    throw new Error("Sin permisos para ver esta orden");
  }

  return service;
}

export async function createService(
  data: CreateServiceInput,
  session: SessionUser,
  idempotencyKey?: string,
  cookies?: string
): Promise<Service> {
  if (session.role !== "ADMIN")
    throw new Error("Solo un Administrador puede crear órdenes");

  const response = await apiClient.post<ServiceDto, CreateServiceInput>(
    "/services",
    {
      companyId: data.companyId,
      clientId: data.clientId,
      categoryId: data.categoryId || null,
      technicianId: data.technicianId || null,
      scheduledDate: data.scheduledDate,
      address: data.address,
      locality: data.locality,
      observation: data.observation || null,
      expectedAmount: data.expectedAmount || null,
      finalAmount: data.finalAmount || null,
    },
    { idempotencyKey, cookies }
  );

  return adaptService(unwrapData(response));
}

export async function updateService(
  id: string,
  data: UpdateServiceInput,
  session: SessionUser,
  idempotencyKey?: string,
  cookies?: string
): Promise<Service> {
  if (session.role !== "ADMIN")
    throw new Error("Solo un Administrador puede modificar órdenes");

  const response = await apiClient.patch<ServiceDto, UpdateServiceInput>(
    `/services/${id}`,
    {
      companyId: data.companyId,
      clientId: data.clientId,
      categoryId: data.categoryId !== undefined ? data.categoryId || null : undefined,
      technicianId: data.technicianId !== undefined ? data.technicianId || null : undefined,
      scheduledDate: data.scheduledDate,
      address: data.address !== undefined ? data.address || null : undefined,
      locality: data.locality !== undefined ? data.locality || null : undefined,
      observation: data.observation !== undefined ? data.observation || null : undefined,
      expectedAmount: data.expectedAmount !== undefined ? data.expectedAmount || null : undefined,
      finalAmount: data.finalAmount !== undefined ? data.finalAmount || null : undefined,
    },
    { idempotencyKey, cookies }
  );

  return adaptService(unwrapData(response));
}

export async function updateServiceStatus(
  id: string,
  data: UpdateStatusInput,
  session: SessionUser,
  idempotencyKey?: string,
  cookies?: string
): Promise<Service> {
  const response = await apiClient.post<ServiceDto, UpdateStatusInput>(
    `/services/${id}/status`,
    { status: data.status },
    { idempotencyKey, cookies }
  );

  return adaptService(unwrapData(response));
}

/**
 * Cierra definitivamente una orden (status=CLOSED).
 * Solo el Administrador puede cerrar.
 * Requiere el monto final del servicio.
 */
export async function finishService(
  id: string,
  data: FinishServiceInput,
  session: SessionUser,
  idempotencyKey?: string,
  cookies?: string
): Promise<Service> {
  if (session.role !== "ADMIN")
    throw new Error("Solo un Administrador puede cerrar órdenes");

  const response = await apiClient.post<ServiceDto, FinishServiceInput>(
    `/services/${id}/finish`,
    {
      finalAmount: data.finalAmount,
      observation: data.observation || null,
    },
    { idempotencyKey, cookies }
  );

  return adaptService(unwrapData(response));
}

/**
 * Cancela una orden (soft delete).
 * Los servicios NUNCA se eliminan físicamente.
 */
export async function cancelService(
  id: string,
  session: SessionUser,
  idempotencyKey?: string,
  cookies?: string
): Promise<Service> {
  if (session.role !== "ADMIN")
    throw new Error("Solo un Administrador puede cancelar órdenes");

  const response = await apiClient.patch<ServiceDto>(
    `/services/${id}`,
    { status: "CANCELLED" },
    { idempotencyKey, cookies }
  );

  return adaptService(unwrapData(response));
}

/** Obtiene el historial paginado de un servicio. */
export async function getServiceHistory(
  id: string,
  session: SessionUser,
  cookies?: string
): Promise<any[]> {
  interface ActivityDto {
    id: string;
  }
  const response = await apiClient.get<ActivityDto[]>(`/services/${id}/history`, cookies);
  return unwrapData(response);
}

/** Obtiene la agenda de servicios. */
export async function getSchedule(
  session: SessionUser,
  params?: {
    dateFrom?: string;
    dateTo?: string;
    technicianId?: string;
  },
  cookies?: string
): Promise<any[]> {
  const queryParams: Record<string, string> = {};

  if (session.role === "TECHNICIAN") {
    queryParams.technicianId = session.id;
  } else if (params?.technicianId) {
    queryParams.technicianId = params.technicianId;
  }

  if (params?.dateFrom) queryParams.dateFrom = params.dateFrom;
  if (params?.dateTo) queryParams.dateTo = params.dateTo;

  const response = await apiClient.get<ServiceDto[]>("/schedule", queryParams, cookies);
  return unwrapData(response);
}
