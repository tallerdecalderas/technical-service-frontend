/* ─── Adaptador: ServiceDto → Service (tipo del frontend) ───────────────── */

import type { Service } from "@/types";
import type {
  ServiceDto,
  ServiceListResponse,
  ServiceDetailResponse,
} from "@/lib/dto/service.dto";

export function adaptService(dto: ServiceDto): Service {
  return {
    id: dto.id,
    companyId: dto.companyId,
    clientId: dto.clientId,
    categoryId: dto.categoryId,
    technicianId: dto.technicianId,
    scheduledDate: new Date(dto.scheduledDate),
    address: dto.address,
    locality: dto.locality,
    observation: dto.observation,
    expectedAmount: dto.expectedAmount,
    finalAmount: dto.finalAmount,
    status: dto.status as Service["status"],
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
    createdBy: dto.createdBy,
    closedBy: dto.closedBy,
    client: dto.client
      ? {
          id: dto.client.id,
          name: dto.client.name,
          email: dto.client.email,
          phone: dto.client.phone,
        }
      : undefined,
    technician: dto.technician
      ? {
          id: dto.technician.id,
          name: dto.technician.name,
          email: dto.technician.email,
          phone: dto.technician.phone,
        }
      : undefined,
    company: dto.company
      ? {
          id: dto.company.id,
          name: dto.company.name,
        }
      : undefined,
    payment: dto.payment
      ? {
          id: dto.payment.id,
          method: dto.payment.method,
          amountPaid: dto.payment.amountPaid,
          debtAmount: dto.payment.debtAmount,
          createdAt: new Date(dto.payment.createdAt),
        }
      : undefined,
    estimate: dto.estimate
      ? {
          id: dto.estimate.id,
          status: dto.estimate.status,
          totalAmount: dto.estimate.totalAmount,
          createdAt: new Date(dto.estimate.createdAt),
        }
      : undefined,
    parts: dto.parts?.map((p) => ({
      id: p.id,
      serviceId: p.serviceId,
      inventoryItemId: p.inventoryItemId,
      quantity: p.quantity,
      unitPrice: p.unitPrice,
      totalPrice: p.totalPrice,
      catalogCode: p.catalogCode,
      catalogName: p.catalogName,
      createdAt: new Date(p.createdAt),
    })),
    activityLogs: dto.activityLogs?.map((l) => ({
      id: l.id,
      action: l.action,
      description: l.description,
      createdAt: new Date(l.createdAt),
      user: l.user
        ? {
            id: l.user.id,
            name: l.user.name,
            role: l.user.role,
          }
        : null,
    })),
  } as unknown as Service;
}

export function adaptServiceList(response: ServiceListResponse): {
  services: Service[];
  meta: ServiceListResponse["meta"];
} {
  return {
    services: response.services.map(adaptService),
    meta: response.meta,
  };
}

export function adaptServiceDetail(
  response: ServiceDetailResponse
): Service | null {
  if (!response.service) return null;
  return adaptService(response.service);
}
