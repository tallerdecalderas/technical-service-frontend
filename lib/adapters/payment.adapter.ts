/* ─── Adaptador: PaymentDto → Payment (tipo del frontend) ───────────────── */

import type { Payment } from "@/types";
import type {
  PaymentDto,
  PaymentListResponse,
  PaymentDetailResponse,
} from "@/lib/dto/payment.dto";

export function adaptPayment(dto: PaymentDto): Payment {
  return {
    id: dto.id,
    serviceId: dto.serviceId,
    technicianId: dto.technicianId,
    method: dto.method as Payment["method"],
    amountPaid: dto.amountPaid,
    debtAmount: dto.debtAmount,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
    service: dto.service
      ? {
          id: dto.service.id,
          clientId: dto.service.clientId,
          companyId: dto.service.companyId,
          technicianId: dto.service.technicianId,
          status: dto.service.status,
        }
      : undefined,
    technician: dto.technician
      ? {
          id: dto.technician.id,
          name: dto.technician.name,
          email: dto.technician.email,
        }
      : undefined,
  } as unknown as Payment;
}

export function adaptPaymentList(response: PaymentListResponse): {
  payments: Payment[];
  meta: PaymentListResponse["meta"];
} {
  return {
    payments: response.payments.map(adaptPayment),
    meta: response.meta,
  };
}

export function adaptPaymentDetail(
  response: PaymentDetailResponse
): Payment | null {
  if (!response.payment) return null;
  return adaptPayment(response.payment);
}
