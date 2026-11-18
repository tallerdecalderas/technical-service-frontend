/* ─── Adaptador: TechnicianDto → User (tipo del frontend) ───────────────── */

import type { User } from "@/types";
import type {
  TechnicianDto,
  TechnicianListResponse,
  TechnicianDetailResponse,
} from "@/lib/dto/technician.dto";

export function adaptTechnician(dto: TechnicianDto): User {
  return {
    id: dto.id,
    name: dto.name,
    email: dto.email,
    phone: dto.phone,
    dni: dto.dni,
    role: dto.role as "ADMIN" | "TECHNICIAN",
    isActive: dto.isActive,
    avatar: dto.avatar,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
  } as unknown as User;
}

export function adaptTechnicianList(response: TechnicianListResponse): {
  technicians: User[];
  meta: TechnicianListResponse["meta"];
} {
  return {
    technicians: response.technicians.map(adaptTechnician),
    meta: response.meta,
  };
}

export function adaptTechnicianDetail(
  response: TechnicianDetailResponse
): User | null {
  if (!response.technician) return null;
  return adaptTechnician(response.technician);
}
