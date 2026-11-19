/**
 * Payment Service (Cobros) — taller de calderas
 * Ahora consume la API Go en lugar de Prisma.
 * Documentación: docs/reglas-negocio.md, docs/api.md
 *
 * Reglas clave:
 * - Cada servicio puede tener UN ÚNICO cobro.
 * - Un cobro registra: método, monto cobrado, y deuda pendiente.
 * - Los repuestos ya NO pertenecen al cobro → ver service-part.service.ts
 * - Solo técnicos asignados pueden registrar cobros.
 */

import { apiClient } from "@/lib/api-client";
import {
  adaptPayment,
  adaptPaymentDetail,
  adaptPaymentList,
} from "@/lib/adapters/payment.adapter";
import type { Payment, PaymentFilters, SessionUser } from "@/types";
import type { z } from "zod";
import type {
  createPaymentSchema,
  updatePaymentSchema,
} from "@/lib/validations";

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;

export async function listPayments(
  filters: PaymentFilters,
  session: SessionUser,
  cookies?: string
): Promise<Payment[]> {
  const params: Record<string, string> = {};

  // Técnicos solo ven sus propios cobros
  if (session.role === "TECHNICIAN") {
    params.technicianId = session.id;
  } else {
    if (filters.technicianId) {
      params.technicianId = filters.technicianId;
    }
  }

  if (filters.dateFrom) {
    params.dateFrom = filters.dateFrom;
  }
  if (filters.dateTo) {
    params.dateTo = filters.dateTo;
  }

  const response = await apiClient.get<{
    payments: any[];
    meta: { page: number; pageSize: number; total: number; totalPages: number };
  }>("/payments", params, cookies);

  if (!response.success) {
    throw new Error(response.error?.message || "Error al listar cobros");
  }

  const adapted = adaptPaymentList(response as any);
  return adapted.payments;
}

export async function getPaymentById(
  id: string,
  session: SessionUser,
  cookies?: string
): Promise<Payment | null> {
  const response = await apiClient.get<{ payment: any }>(`/payments/${id}`, cookies);

  if (!response.success) {
    if (response.error?.code === "NOT_FOUND") return null;
    throw new Error(response.error?.message || "Error al obtener cobro");
  }

  const payment = adaptPaymentDetail(response as any);

  // Técnico solo puede ver sus propios cobros
  if (session.role === "TECHNICIAN" && payment?.technicianId !== session.id) {
    throw new Error("Sin permisos para ver este cobro");
  }

  return payment;
}

export async function getPaymentByService(
  serviceId: string,
  cookies?: string
): Promise<Payment | null> {
  const response = await apiClient.get<{ payment: any }>(
    `/payments?serviceId=${serviceId}`,
    cookies,
  );

  if (!response.success) {
    if (response.error?.code === "NOT_FOUND") return null;
    throw new Error(response.error?.message || "Error al obtener cobro por servicio");
  }

  if (!response.data || response.data.length === 0) return null;
  return adaptPayment(response.data[0]);
}

export async function createPayment(
  data: CreatePaymentInput,
  session: SessionUser,
  idempotencyKey?: string,
  cookies?: string
): Promise<Payment> {
  const response = await apiClient.post<{ payment: any }, CreatePaymentInput>(
    "/payments",
    {
      serviceId: data.serviceId,
      technicianId: data.technicianId,
      method: data.method,
      amountPaid: data.amountPaid,
      debtAmount: data.debtAmount || null,
    },
    { idempotencyKey, cookies }
  );

  if (!response.success) {
    throw new Error(response.error?.message || "Error al crear cobro");
  }

  return adaptPayment(response.data.payment);
}

/**
 * Actualiza un cobro.
 * Solo el Administrador puede modificar cobros ya registrados.
 */
export async function updatePayment(
  id: string,
  data: UpdatePaymentInput,
  session: SessionUser,
  idempotencyKey?: string,
  cookies?: string
): Promise<Payment> {
  if (session.role !== "ADMIN")
    throw new Error("Solo un Administrador puede modificar cobros");

  const response = await apiClient.patch<{ payment: any }, UpdatePaymentInput>(
    `/payments/${id}`,
    {
      method: data.method,
      amountPaid: data.amountPaid !== undefined ? data.amountPaid : undefined,
      debtAmount: data.debtAmount !== undefined ? data.debtAmount || null : undefined,
    },
    { idempotencyKey, cookies }
  );

  if (!response.success) {
    throw new Error(response.error?.message || "Error al actualizar cobro");
  }

  return adaptPayment(response.data.payment);
}
