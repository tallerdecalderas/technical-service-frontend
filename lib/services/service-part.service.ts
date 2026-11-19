/**
 * ServicePart Service (Repuestos del Servicio) — taller de calderas
 * Ahora consume la API Go en lugar de Prisma.
 * Documentación: docs/reglas-negocio.md, docs/api.md
 *
 * Los repuestos pertenecen al SERVICIO, no al cobro.
 * Al agregar un repuesto desde el inventario se hace un snapshot de:
 * - name, unitCost, unitSalePrice
 */

import { apiClient } from "@/lib/api-client";
import type { ServicePart, SessionUser } from "@/types";
import type { z } from "zod";
import type {
    addServicePartSchema,
    updateServicePartSchema,
} from "@/lib/validations";

export type AddServicePartInput = z.infer<typeof addServicePartSchema>;
export type UpdateServicePartInput = z.infer<typeof updateServicePartSchema>;

export async function listServiceParts(
    serviceId: string,    cookies?: string,): Promise<ServicePart[]> {
    const response = await apiClient.get<{ parts: any[] }>(
        `/services/${serviceId}/parts`,
        cookies,

    if (!response.success) {
        throw new Error(response.error?.message || "Error al listar repuestos");
    }

    return (response.data?.parts || []).map((p: any) => ({
        id: p.id,
        serviceId: p.serviceId,
        inventoryItemId: p.inventoryItemId || null,
        name: p.name,
        nota: p.nota || null,
        quantity: p.quantity,
        unitCost: p.unitCost,
        totalCost: p.totalCost,
        unitSalePrice: p.unitSalePrice,
        totalSalePrice: p.totalSalePrice,
        createdAt: new Date(p.createdAt),
    }) as unknown as ServicePart);
}

export async function addServicePart(
    serviceId: string,
    data: AddServicePartInput,
    session: SessionUser,
    idempotencyKey?: string,
    cookies?: string,
): Promise<ServicePart> {
    const response = await apiClient.post<{ part: any }, AddServicePartInput>(
        `/services/${serviceId}/parts`,
        {
            inventoryItemId: data.inventoryItemId || null,
            name: data.name || null,
            nota: data.nota || null,
            quantity: data.quantity,
            unitCost: data.unitCost,
            unitSalePrice: data.unitSalePrice,
        },
        { idempotencyKey, cookies }
    );

    if (!response.success) {
        throw new Error(response.error?.message || "Error al agregar repuesto");
    }

    const p = response.data.part;
    return {
        id: p.id,
        serviceId: p.serviceId,
        inventoryItemId: p.inventoryItemId || null,
        name: p.name,
        nota: p.nota || null,
        quantity: p.quantity,
        unitCost: p.unitCost,
        totalCost: p.totalCost,
        unitSalePrice: p.unitSalePrice,
        totalSalePrice: p.totalSalePrice,
        createdAt: new Date(p.createdAt),
    } as unknown as ServicePart;
}

export async function updateServicePart(
    partId: string,
    data: UpdateServicePartInput,
    session: SessionUser,
    idempotencyKey?: string,
    cookies?: string,
): Promise<ServicePart> {
    const response = await apiClient.patch<{ part: any }, UpdateServicePartInput>(
        `/services/parts/${partId}`,
        {
            quantity: data.quantity,
            unitCost: data.unitCost,
            unitSalePrice: data.unitSalePrice,
            name: data.name,
            nota: data.nota,
        },
        { idempotencyKey, cookies }
    );

    if (!response.success) {
        throw new Error(response.error?.message || "Error al actualizar repuesto");
    }

    const p = response.data.part;
    return {
        id: p.id,
        serviceId: p.serviceId,
        inventoryItemId: p.inventoryItemId || null,
        name: p.name,
        nota: p.nota || null,
        quantity: p.quantity,
        unitCost: p.unitCost,
        totalCost: p.totalCost,
        unitSalePrice: p.unitSalePrice,
        totalSalePrice: p.totalSalePrice,
        createdAt: new Date(p.createdAt),
    } as unknown as ServicePart;
}

export async function removeServicePart(
    partId: string,
    session: SessionUser,
    idempotencyKey?: string,
    cookies?: string,
): Promise<void> {
    const response = await apiClient.delete(`/services/parts/${partId}`, {
        idempotencyKey,        cookies,    });

    if (!response.success) {
        throw new Error(response.error?.message || "Error al eliminar repuesto");
    }
}
