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

import { apiClient } from "@/lib/api-client";
import {
  adaptEstimate,
  adaptEstimateDetail,
  adaptEstimateList,
} from "@/lib/adapters/estimate.adapter";
import type { Estimate, EstimateFilters, SessionUser } from "@/types";
import type { z } from "zod";
import type { createEstimateSchema } from "@/lib/validations";

export type CreateEstimateInput = z.infer<typeof createEstimateSchema>;

export async function listEstimates(
  filters: EstimateFilters,
  session: SessionUser,
): Promise<Estimate[]> {
  const params: Record<string, string> = {};

  const techId = session.role === "TECHNICIAN" ? session.id : filters.technicianId;
  if (techId) {
    params.technicianId = techId;
  }

  if (filters.status) {
    params.status = filters.status;
  }

  const response = await apiClient.get<{
    estimates: any[];
    meta: { page: number; pageSize: number; total: number; totalPages: number };
  }>("/estimates", params);

  if (!response.success) {
    throw new Error(response.error?.message || "Error al listar presupuestos");
  }

  const adapted = adaptEstimateList(response as any);
  return adapted.estimates;
}

export async function getEstimateById(
  id: string,
  session: SessionUser,
): Promise<Estimate | null> {
  const response = await apiClient.get<{ estimate: any }>(`/estimates/${id}`);

  if (!response.success) {
    if (response.error?.code === "NOT_FOUND") return null;
    throw new Error(response.error?.message || "Error al obtener presupuesto");
  }

  const estimate = adaptEstimateDetail(response as any);

  if (session.role === "TECHNICIAN" && estimate?.service?.technicianId !== session.id) {
    throw new Error("Sin permisos para ver este presupuesto");
  }

  return estimate;
}

export async function getEstimateByService(
  serviceId: string,
): Promise<Estimate | null> {
  const response = await apiClient.get<{ estimate: any }>(
    `/estimates?serviceId=${serviceId}`
  );

  if (!response.success) {
    if (response.error?.code === "NOT_FOUND") return null;
    throw new Error(response.error?.message || "Error al obtener presupuesto por servicio");
  }

  if (!response.data) return null;
  return adaptEstimate(response.data);
}

export async function createEstimate(
  data: CreateEstimateInput,
  session: SessionUser,
  idempotencyKey?: string
): Promise<Estimate> {
  const response = await apiClient.post<{ estimate: any }, CreateEstimateInput>(
    "/estimates",
    {
      serviceId: data.serviceId,
      totalAmount: data.totalAmount,
      validUntil: data.validUntil || null,
      notes: data.notes || null,
    },
    { idempotencyKey }
  );

  if (!response.success) {
    throw new Error(response.error?.message || "Error al crear presupuesto");
  }

  return adaptEstimate(response.data.estimate);
}

export async function finalizeEstimate(
  id: string,
  session: SessionUser,
  idempotencyKey?: string
): Promise<Estimate> {
  if (session.role !== "ADMIN")
    throw new Error(
      "Solo un Administrador puede finalizar presupuestos",
    );

  const response = await apiClient.patch<{ estimate: any }>(
    `/estimates/${id}`,
    { status: "FINALIZED" },
    { idempotencyKey }
  );

  if (!response.success) {
    throw new Error(response.error?.message || "Error al finalizar presupuesto");
  }

  return adaptEstimate(response.data.estimate);
}
