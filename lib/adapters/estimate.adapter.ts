/* ─── Adaptador: EstimateDto → Estimate (tipo del frontend) ─────────────── */

import type { Estimate } from "@/types";
import type {
  EstimateDto,
  EstimateListResponse,
  EstimateDetailResponse,
} from "@/lib/dto/estimate.dto";

export function adaptEstimate(dto: EstimateDto): Estimate {
  return {
    id: dto.id,
    serviceId: dto.serviceId,
    status: dto.status as Estimate["status"],
    totalAmount: dto.totalAmount,
    validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
    notes: dto.notes,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
    service: dto.service
      ? {
          id: dto.service.id,
          clientId: dto.service.clientId,
          technicianId: dto.service.technicianId,
          status: dto.service.status,
        }
      : undefined,
  } as unknown as Estimate;
}

export function adaptEstimateList(response: EstimateListResponse): {
  estimates: Estimate[];
  meta: EstimateListResponse["meta"];
} {
  return {
    estimates: response.estimates.map(adaptEstimate),
    meta: response.meta,
  };
}

export function adaptEstimateDetail(
  response: EstimateDetailResponse
): Estimate | null {
  if (!response.estimate) return null;
  return adaptEstimate(response.estimate);
}
