/**
 * Estimate Service (Presupuestos) — taller de calderas
 * Ahora consume la API Go en lugar de Prisma.
 * Documentación: docs/reglas-negocio.md, docs/api.md
 *
 * Reglas clave:
 * - Solo el Técnico asignado puede enviar un presupuesto.
 * - Solo el Administrador puede aprobarlo o rechazarlo.
 * - Máximo 1 presupuesto activo por orden.
 */

import { apiClient, unwrapData, unwrapList } from "@/lib/api-client";
import {
  adaptEstimate,
  adaptEstimateList,
} from "@/lib/adapters/estimate.adapter";
import type { Estimate, EstimateFilters, SessionUser } from "@/types";
import type { z } from "zod";
import type { EstimateDto } from "@/lib/dto/estimate.dto";
import type { createEstimateSchema } from "@/lib/validations";

export type CreateEstimateInput = z.infer<typeof createEstimateSchema>;

export async function listEstimates(
  filters: EstimateFilters,
  session: SessionUser,
  cookies?: string
): Promise<Estimate[]> {
  const params: Record<string, string> = {};

  const techId = session.role === "TECHNICIAN" ? session.id : filters.technicianId;
  if (techId) {
    params.technicianId = techId;
  }

  if (filters.status) {
    params.status = filters.status;
  }

  const response = await apiClient.get<EstimateDto[]>("/estimates", params, cookies);
  const { data, meta } = unwrapList(response);
  const adapted = adaptEstimateList({ estimates: data, meta });
  return adapted.estimates;
}

export async function getEstimateById(
  id: string,
  session: SessionUser,
  cookies?: string
): Promise<Estimate | null> {
  const response = await apiClient.get<EstimateDto>(`/estimates/${id}`, cookies);

  if (!response.success) {
    if (response.error?.code === "NOT_FOUND") return null;
    throw new Error(response.error?.message || "Error al obtener presupuesto");
  }

  const estimate = adaptEstimate(unwrapData(response));

  if (session.role === "TECHNICIAN" && estimate?.service?.technicianId !== session.id) {
    throw new Error("Sin permisos para ver este presupuesto");
  }

  return estimate;
}

export async function getEstimateByService(
  serviceId: string,
  cookies?: string
): Promise<Estimate | null> {
  const response = await apiClient.get<EstimateDto[]>(
    `/estimates?serviceId=${serviceId}`,
    cookies,
  );
  const { data } = unwrapList(response);
  return data[0] ? adaptEstimate(data[0]) : null;
}

export async function createEstimate(
  data: CreateEstimateInput,
  session: SessionUser,
  idempotencyKey?: string,
  cookies?: string
): Promise<Estimate> {
  const response = await apiClient.post<EstimateDto, CreateEstimateInput>(
    "/estimates",
    {
      serviceId: data.serviceId,
      totalAmount: data.totalAmount,
      validUntil: data.validUntil || null,
      notes: data.notes || null,
    },
    { idempotencyKey, cookies }
  );

  return adaptEstimate(unwrapData(response));
}

export async function finalizeEstimate(
  id: string,
  session: SessionUser,
  idempotencyKey?: string,
  cookies?: string
): Promise<Estimate> {
  if (session.role !== "ADMIN")
    throw new Error(
      "Solo un Administrador puede finalizar presupuestos",
    );

  const response = await apiClient.patch<EstimateDto>(
    `/estimates/${id}`,
    { status: "FINALIZED" },
    { idempotencyKey, cookies }
  );

  return adaptEstimate(unwrapData(response));
}
