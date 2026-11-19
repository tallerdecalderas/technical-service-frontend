/**
 * Settlement Service (Rendiciones) — taller de calderas
 * Ahora consume la API Go en lugar de Prisma.
 * Documentación: docs/modulos/paymentsRendition.md, docs/reglas-negocio.md
 *
 * Reglas clave:
 * - Período libre: el admin define startDate y endDate por cada rendición.
 * - Comisión variable: se provee al generar (no se hereda del técnico).
 * - Los repuestos se calculan desde ServicePart de cada servicio del período.
 * - Solo el Administrador puede generar y liquidar rendiciones.
 * - Una rendición PAID no puede modificarse.
 */

import { apiClient } from "@/lib/api-client";
import type { Settlement, SettlementFilters, SessionUser } from "@/types";
import type { z } from "zod";
import type { generateSettlementSchema } from "@/lib/validations";

export type GenerateSettlementInput = z.infer<typeof generateSettlementSchema>;

export async function listSettlements(
  filters: SettlementFilters,
  session: SessionUser,
): Promise<Settlement[]> {
  const params: Record<string, string> = {};

  if (session.role === "TECHNICIAN") {
    params.technicianId = session.id;
  } else {
    if (filters.technicianId) params.technicianId = filters.technicianId;
    if (filters.companyId) params.companyId = filters.companyId;
  }

  if (filters.status) params.status = filters.status;
  if (filters.dateFrom) params.dateFrom = filters.dateFrom;
  if (filters.dateTo) params.dateTo = filters.dateTo;

  const response = await apiClient.get<{ settlements: any[] }>("/settlements", params);

  if (!response.success) {
    throw new Error(response.error?.message || "Error al listar rendiciones");
  }

  return (response.data?.settlements || []).map((s: any) => ({
    id: s.id,
    technicianId: s.technicianId,
    companyId: s.companyId || null,
    startDate: new Date(s.startDate),
    endDate: new Date(s.endDate),
    label: s.label,
    commissionRate: s.commissionRate,
    status: s.status,
    servicesCount: s.servicesCount,
    totalCollected: s.totalCollected,
    totalDebt: s.totalDebt,
    totalPartsCost: s.totalPartsCost,
    totalPartsSale: s.totalPartsSale,
    commissionBase: s.commissionBase,
    techCommission: s.techCommission,
    compCommission: s.compCommission,
    liquidatedById: s.liquidatedById || null,
    liquidatedAt: s.liquidatedAt ? new Date(s.liquidatedAt) : null,
    createdAt: new Date(s.createdAt),
    updatedAt: new Date(s.updatedAt),
  }) as unknown as Settlement);
}

export async function getSettlementById(
  id: string,
  session: SessionUser,
): Promise<Settlement | null> {
  const response = await apiClient.get<{ settlement: any }>(`/settlements/${id}`);

  if (!response.success) {
    if (response.error?.code === "NOT_FOUND") return null;
    throw new Error(response.error?.message || "Error al obtener rendición");
  }

  const s = response.data.settlement;
  return {
    id: s.id,
    technicianId: s.technicianId,
    companyId: s.companyId || null,
    startDate: new Date(s.startDate),
    endDate: new Date(s.endDate),
    label: s.label,
    commissionRate: s.commissionRate,
    status: s.status,
    servicesCount: s.servicesCount,
    totalCollected: s.totalCollected,
    totalDebt: s.totalDebt,
    totalPartsCost: s.totalPartsCost,
    totalPartsSale: s.totalPartsSale,
    commissionBase: s.commissionBase,
    techCommission: s.techCommission,
    compCommission: s.compCommission,
    liquidatedById: s.liquidatedById || null,
    liquidatedAt: s.liquidatedAt ? new Date(s.liquidatedAt) : null,
    createdAt: new Date(s.createdAt),
    updatedAt: new Date(s.updatedAt),
  } as unknown as Settlement;
}

export async function generateSettlement(
  data: GenerateSettlementInput,
  session: SessionUser,
  idempotencyKey?: string
): Promise<Settlement> {
  if (session.role !== "ADMIN")
    throw new Error("Solo un Administrador puede generar rendiciones");

  const startDateDate = new Date(data.startDate);
  const endDateDate = new Date(data.endDate);

  if (startDateDate >= endDateDate)
    throw new Error("La fecha de inicio debe ser anterior a la fecha de fin");

  const response = await apiClient.post<{ settlement: any }, GenerateSettlementInput>(
    "/settlements",
    {
      technicianId: data.technicianId,
      companyId: data.companyId || null,
      startDate: data.startDate,
      endDate: data.endDate,
      label: data.label || null,
      commissionRate: data.commissionRate,
    },
    { idempotencyKey }
  );

  if (!response.success) {
    throw new Error(response.error?.message || "Error al generar rendición");
  }

  const s = response.data.settlement;
  return {
    id: s.id,
    technicianId: s.technicianId,
    companyId: s.companyId || null,
    startDate: new Date(s.startDate),
    endDate: new Date(s.endDate),
    label: s.label,
    commissionRate: s.commissionRate,
    status: s.status,
    servicesCount: s.servicesCount,
    totalCollected: s.totalCollected,
    totalDebt: s.totalDebt,
    totalPartsCost: s.totalPartsCost,
    totalPartsSale: s.totalPartsSale,
    commissionBase: s.commissionBase,
    techCommission: s.techCommission,
    compCommission: s.compCommission,
    liquidatedById: s.liquidatedById || null,
    liquidatedAt: s.liquidatedAt ? new Date(s.liquidatedAt) : null,
    createdAt: new Date(s.createdAt),
    updatedAt: new Date(s.updatedAt),
  } as unknown as Settlement;
}

export async function liquidateSettlement(
  id: string,
  session: SessionUser,
  idempotencyKey?: string,
  cookies?: string
): Promise<Settlement> {
  if (session.role !== "ADMIN")
    throw new Error("Solo un Administrador puede liquidar rendiciones");

  const response = await apiClient.patch<{ settlement: any }>(
    `/settlements/${id}`,
    { status: "PAID" },
    { idempotencyKey, cookies }
  );

  if (!response.success) {
    throw new Error(response.error?.message || "Error al liquidar rendición");
  }

  const s = response.data.settlement;
  return {
    id: s.id,
    technicianId: s.technicianId,
    companyId: s.companyId || null,
    startDate: new Date(s.startDate),
    endDate: new Date(s.endDate),
    label: s.label,
    commissionRate: s.commissionRate,
    status: s.status,
    servicesCount: s.servicesCount,
    totalCollected: s.totalCollected,
    totalDebt: s.totalDebt,
    totalPartsCost: s.totalPartsCost,
    totalPartsSale: s.totalPartsSale,
    commissionBase: s.commissionBase,
    techCommission: s.techCommission,
    compCommission: s.compCommission,
    liquidatedById: s.liquidatedById || null,
    liquidatedAt: s.liquidatedAt ? new Date(s.liquidatedAt) : null,
    createdAt: new Date(s.createdAt),
    updatedAt: new Date(s.updatedAt),
  } as unknown as Settlement;
}
