/**
 * Settlement Service (Rendiciones) — taller de calderas
 * Consume la API Go en lugar de Prisma.
 * Documentación: docs/modulos/paymentsRendition.md, docs/reglas-negocio.md
 *
 * Endpoints Go consumidos:
 *   GET    /api/v1/settlements          (listado con filtros)
 *   GET    /api/v1/settlements/{id}     (detalle con items/parts/expenses/adjustments)
 *   POST   /api/v1/settlements          (generar, solo ADMIN)
 *   PATCH  /api/v1/settlements/{id}     (editar, solo ADMIN)
 *   POST   /api/v1/settlements/{id}/liquidate (liquidar, solo ADMIN)
 *
 * Reglas clave:
 * - Período libre: el admin define startDate y endDate por cada rendición.
 * - Comisión variable: se provee al generar (no se hereda del técnico).
 * - Los repuestos se calculan desde ServicePart de cada servicio del período.
 * - Solo el Administrador puede generar, editar y liquidar rendiciones.
 * - Una rendición LIQUIDATED no puede modificarse.
 * - El frontend nunca recalcula montos oficiales; muestra los que devuelve Go.
 */

import { apiClient, unwrapData, unwrapList } from "@/lib/api-client";
import type { Settlement, SettlementFilters } from "@/types";
import type {
  CreateSettlementDto,
  SettlementDto,
  SettlementDetailResponse,
  UpdateSettlementDto,
} from "@/lib/dto/settlement.dto";

export async function listSettlements(
  filters: SettlementFilters,
  session: { role: string; id: string; companyIds?: string[] },
  cookies?: string,
): Promise<{ settlements: Settlement[]; meta: { page: number; pageSize: number; total: number; totalPages: number } }> {
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
  if (filters.page) params.page = filters.page;
  if (filters.pageSize) params.pageSize = filters.pageSize;

  const response = await apiClient.get<SettlementListResponse>(
    "/settlements",
    params,
    { cookies },
  );
  const { data, meta } = unwrapList(response);

  const settlements = data.map((s) => ({
    id: s.id,
    technicianId: s.technicianId,
    technicianName: s.technicianName,
    companyId: s.companyId || null,
    companyName: s.companyName || null,
    startDate: s.startDate,
    endDate: s.endDate,
    label: s.label,
    status: s.status,
    companyRate: s.companyRate,
    technicianRate: s.technicianRate,
    servicesCount: s.servicesCount,
    totalCollected: s.totalCollected,
    totalDebt: s.totalDebt,
    totalPartsCost: s.totalPartsCost,
    totalPartsSale: s.totalPartsSale,
    totalExpenses: s.totalExpenses,
    totalInsurance: s.totalInsurance,
    totalOther: s.totalOther,
    totalDiscounts: s.totalDiscounts,
    totalAdvances: s.totalAdvances,
    commissionBase: s.commissionBase,
    techCommission: s.techCommission,
    compCommission: s.compCommission,
    techBalance: s.techBalance,
    liquidatedAt: s.liquidatedAt ? new Date(s.liquidatedAt) : null,
    liquidatedById: s.liquidatedById || null,
    createdById: s.createdById || null,
    createdAt: new Date(s.createdAt),
    updatedAt: new Date(s.updatedAt),
  }) as unknown as Settlement[]);

  return { settlements, meta: { page: meta.page, pageSize: meta.pageSize, total: meta.total, totalPages: meta.totalPages ?? 1 } };
}

export async function getSettlementById(
  id: string,
  session: { role: string; id: string },
  cookies?: string,
): Promise<Settlement | null> {
  const response = await apiClient.get<SettlementDetailResponse>(
    `/settlements/${id}`,
    undefined,
    { cookies },
  );
  const { settlement } = unwrapData(response);

  return {
    id: settlement.id,
    technicianId: settlement.technicianId,
    technicianName: settlement.technicianName,
    companyId: settlement.companyId || null,
    companyName: settlement.companyName || null,
    startDate: settlement.startDate,
    endDate: settlement.endDate,
    label: settlement.label,
    status: settlement.status,
    companyRate: settlement.companyRate,
    technicianRate: settlement.technicianRate,
    servicesCount: settlement.servicesCount,
    totalCollected: settlement.totalCollected,
    totalDebt: settlement.totalDebt,
    totalPartsCost: settlement.totalPartsCost,
    totalPartsSale: settlement.totalPartsSale,
    totalExpenses: settlement.totalExpenses,
    totalInsurance: settlement.totalInsurance,
    totalOther: settlement.totalOther,
    totalDiscounts: settlement.totalDiscounts,
    totalAdvances: settlement.totalAdvances,
    commissionBase: settlement.commissionBase,
    techCommission: settlement.techCommission,
    compCommission: settlement.compCommission,
    techBalance: settlement.techBalance,
    liquidatedAt: settlement.liquidatedAt ? new Date(settlement.liquidatedAt) : null,
    liquidatedById: settlement.liquidatedById || null,
    createdById: settlement.createdById || null,
    createdAt: new Date(settlement.createdAt),
    updatedAt: new Date(settlement.updatedAt),
    items: settlement.items.map((i) => ({
      id: i.id,
      serviceId: i.serviceId,
      orderNumber: i.orderNumber,
      clientName: i.clientName,
      paymentId: i.paymentId,
      serviceAmount: i.serviceAmount,
      collectedAmount: i.collectedAmount,
      debtAmount: i.debtAmount,
      partsCostAmount: i.partsCostAmount,
      partsSaleAmount: i.partsSaleAmount,
      expensesAmount: i.expensesAmount,
      commissionBase: i.commissionBase,
      commissionRate: i.commissionRate,
      technicianAmount: i.technicianAmount,
      companyAmount: i.companyAmount,
    })),
    parts: settlement.parts.map((p) => ({
      id: p.id,
      serviceId: p.serviceId,
      orderNumber: p.orderNumber,
      companyId: p.companyId || null,
      providerName: p.providerName || null,
      name: p.name,
      quantity: p.quantity,
      unitCost: p.unitCost,
      totalCost: p.totalCost,
      unitSalePrice: p.unitSalePrice,
      totalSalePrice: p.totalSalePrice,
      costUsd: p.costUsd || null,
      exchangeRate: p.exchangeRate || null,
    })),
    expenses: settlement.expenses.map((e) => ({
      id: e.id,
      serviceId: e.serviceId,
      orderNumber: e.orderNumber,
      expenseId: e.expenseId || null,
      concept: e.concept,
      amount: e.amount,
      currency: e.currency,
      amountArs: e.amountArs,
    })),
    adjustments: settlement.adjustments.map((a) => ({
      id: a.id,
      kind: a.kind,
      concept: a.concept,
      amount: a.amount,
    })),
  } as unknown as Settlement;
}

export async function generateSettlement(
  data: {
    technicianId: string;
    companyId: string | null;
    startDate: string;
    endDate: string;
    label: string | null;
    companyRate: string;
    insurance?: Array<{ kind: string; concept: string; amount: string }>;
    adjustments?: Array<{ kind: string; concept: string; amount: string }>;
  },
  session: { role: string; id: string },
  idempotencyKey?: string,
  cookies?: string,
): Promise<Settlement> {
  if (session.role !== "ADMIN")
    throw new Error("Solo un Administrador puede generar rendiciones");

  const startDateDate = new Date(data.startDate);
  const endDateDate = new Date(data.endDate);

  if (startDateDate >= endDateDate)
    throw new Error("La fecha de inicio debe ser anterior a la fecha de fin");

  const body: CreateSettlementDto = {
    technicianId: data.technicianId,
    companyId: data.companyId,
    startDate: data.startDate,
    endDate: data.endDate,
    label: data.label,
    companyRate: data.companyRate,
    insurance: data.insurance ?? [],
    adjustments: data.adjustments ?? [],
  };

  const response = await apiClient.post<SettlementDto, CreateSettlementDto>(
    "/settlements",
    body,
    { idempotencyKey, cookies },
  );

  const s = unwrapData(response);
  return mapSettlementDto(s);
}

export async function updateSettlement(
  id: string,
  data: {
    label?: string | null;
    companyRate?: string | null;
    insurance?: Array<{ kind: string; concept: string; amount: string }> | null;
    adjustments?: Array<{ kind: string; concept: string; amount: string }> | null;
  },
  session: { role: string; id: string },
  idempotencyKey?: string,
  cookies?: string,
): Promise<Settlement> {
  if (session.role !== "ADMIN")
    throw new Error("Solo un Administrador puede editar rendiciones");

  const body: UpdateSettlementDto = {
    label: data.label ?? undefined,
    companyRate: data.companyRate ?? undefined,
    insurance: data.insurance ?? undefined,
    adjustments: data.adjustments ?? undefined,
  };

  const response = await apiClient.patch<SettlementDto, UpdateSettlementDto>(
    `/settlements/${id}`,
    body,
    { idempotencyKey, cookies },
  );

  const s = unwrapData(response);
  return mapSettlementDto(s);
}

export async function liquidateSettlement(
  id: string,
  session: { role: string; id: string },
  idempotencyKey?: string,
  cookies?: string,
): Promise<Settlement> {
  if (session.role !== "ADMIN")
    throw new Error("Solo un Administrador puede liquidar rendiciones");

  // Go espera POST /api/v1/settlements/{id}/liquidate (sin body)
  const response = await apiClient.post<SettlementDto, undefined>(
    `/settlements/${id}/liquidate`,
    undefined,
    { idempotencyKey, cookies },
  );

  const s = unwrapData(response);
  return mapSettlementDto(s);
}

/** Mapea un SettlementDto de la API Go al tipo Settlement del frontend. */
function mapSettlementDto(s: SettlementDto): Settlement {
  return {
    id: s.id,
    technicianId: s.technicianId,
    technicianName: s.technicianName,
    companyId: s.companyId || null,
    companyName: s.companyName || null,
    startDate: s.startDate,
    endDate: s.endDate,
    label: s.label,
    status: s.status,
    companyRate: s.companyRate,
    technicianRate: s.technicianRate,
    servicesCount: s.servicesCount,
    totalCollected: s.totalCollected,
    totalDebt: s.totalDebt,
    totalPartsCost: s.totalPartsCost,
    totalPartsSale: s.totalPartsSale,
    totalExpenses: s.totalExpenses,
    totalInsurance: s.totalInsurance,
    totalOther: s.totalOther,
    totalDiscounts: s.totalDiscounts,
    totalAdvances: s.totalAdvances,
    commissionBase: s.commissionBase,
    techCommission: s.techCommission,
    compCommission: s.compCommission,
    techBalance: s.techBalance,
    liquidatedAt: s.liquidatedAt ? new Date(s.liquidatedAt) : null,
    liquidatedById: s.liquidatedById || null,
    createdById: s.createdById || null,
    createdAt: new Date(s.createdAt),
    updatedAt: new Date(s.updatedAt),
    items: [],
    parts: [],
    expenses: [],
    adjustments: [],
  } as unknown as Settlement;
}
