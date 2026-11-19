/**
 * InventoryItem Service (Ítems de Inventario) — taller de calderas
 * Ahora consume la API Go en lugar de Prisma.
 * Documentación: docs/modulos/Inventario.md, docs/reglas-negocio.md
 *
 * Catálogo de repuestos perteneciente a cada empresa.
 */

import { apiClient } from "@/lib/api-client";
import type { InventoryItem, InventoryItemFilters, SessionUser } from "@/types";
import type { z } from "zod";
import type {
    createInventoryItemSchema,
    updateInventoryItemSchema,
} from "@/lib/validations";

export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>;
export type UpdateInventoryItemInput = z.infer<typeof updateInventoryItemSchema>;

export async function listInventoryItems(
    filters: InventoryItemFilters,
    session?: SessionUser,    cookies?: string,): Promise<InventoryItem[]> {
    const params: Record<string, string> = {};

    if (filters.companyId) params.companyId = filters.companyId;
    if (filters.isActive !== undefined) params.isActive = String(filters.isActive);
    if (filters.search) params.search = filters.search;

    const response = await apiClient.get<{ items: any[] }>("/catalog/items", params, cookies);

    if (!response.success) {
        throw new Error(response.error?.message || "Error al listar ítems de inventario");
    }

    return (response.data?.items || []).map((i: any) => ({
        id: i.id,
        companyId: i.companyId,
        code: i.code,
        name: i.name,
        unit: i.unit || null,
        stock: i.stock,
        costInitList: i.costInitList,
        costPrice: i.costPrice,
        sellPrice: i.sellPrice,
        techPrice: i.techPrice,
        marginPercent: i.marginPercent,
        isActive: i.isActive,
        createdAt: new Date(i.createdAt),
        updatedAt: new Date(i.updatedAt),
    }) as unknown as InventoryItem);
}

export async function getInventoryItemById(
    id: string,
    session?: SessionUser,    cookies?: string,): Promise<InventoryItem | null> {
    const response = await apiClient.get<{ item: any }>(`/catalog/items/${id}`, cookies);

    if (!response.success) {
        if (response.error?.code === "NOT_FOUND") return null;
        throw new Error(response.error?.message || "Error al obtener ítem de inventario");
    }

    const i = response.data.item;
    return {
        id: i.id,
        companyId: i.companyId,
        code: i.code,
        name: i.name,
        unit: i.unit || null,
        stock: i.stock,
        costInitList: i.costInitList,
        costPrice: i.costPrice,
        sellPrice: i.sellPrice,
        techPrice: i.techPrice,
        marginPercent: i.marginPercent,
        isActive: i.isActive,
        createdAt: new Date(i.createdAt),
        updatedAt: new Date(i.updatedAt),
    } as unknown as InventoryItem;
}

export async function createInventoryItem(
    data: CreateInventoryItemInput,
    session: SessionUser,
    idempotencyKey?: string,
    cookies?: string,
): Promise<InventoryItem> {
    if (session.role !== "ADMIN")
        throw new Error("Solo un Administrador puede crear ítems de inventario");

    const response = await apiClient.post<{ item: any }, CreateInventoryItemInput>(
        "/catalog/items",
        {
            companyId: data.companyId,
            code: data.code,
            name: data.name,
            unit: data.unit || null,
            stock: data.stock || 0,
            costInitList: data.costInitList,
            costPrice: data.costPrice,
            sellPrice: data.sellPrice,
            techPrice: data.techPrice,
            marginPercent: data.marginPercent || 0,
            isActive: true,
        },
        { idempotencyKey, cookies }
    );

    if (!response.success) {
        throw new Error(response.error?.message || "Error al crear ítem de inventario");
    }

    const i = response.data.item;
    return {
        id: i.id,
        companyId: i.companyId,
        code: i.code,
        name: i.name,
        unit: i.unit || null,
        stock: i.stock,
        costInitList: i.costInitList,
        costPrice: i.costPrice,
        sellPrice: i.sellPrice,
        techPrice: i.techPrice,
        marginPercent: i.marginPercent,
        isActive: i.isActive,
        createdAt: new Date(i.createdAt),
        updatedAt: new Date(i.updatedAt),
    } as unknown as InventoryItem;
}

export async function updateInventoryItem(
    id: string,
    data: UpdateInventoryItemInput,
    session: SessionUser,
    idempotencyKey?: string,
    cookies?: string,
): Promise<InventoryItem> {
    if (session.role !== "ADMIN")
        throw new Error(
            "Solo un Administrador puede modificar ítems de inventario",
        );

    const response = await apiClient.patch<{ item: any }, UpdateInventoryItemInput>(
        `/catalog/items/${id}`,
        {
            name: data.name,
            code: data.code,
            unit: data.unit,
            stock: data.stock,
            costInitList: data.costInitList,
            costPrice: data.costPrice,
            sellPrice: data.sellPrice,
            techPrice: data.techPrice,
            marginPercent: data.marginPercent,
            isActive: data.isActive,
        },
        { idempotencyKey, cookies }
    );

    if (!response.success) {
        throw new Error(response.error?.message || "Error al actualizar ítem de inventario");
    }

    const i = response.data.item;
    return {
        id: i.id,
        companyId: i.companyId,
        code: i.code,
        name: i.name,
        unit: i.unit || null,
        stock: i.stock,
        costInitList: i.costInitList,
        costPrice: i.costPrice,
        sellPrice: i.sellPrice,
        techPrice: i.techPrice,
        marginPercent: i.marginPercent,
        isActive: i.isActive,
        createdAt: new Date(i.createdAt),
        updatedAt: new Date(i.updatedAt),
    } as unknown as InventoryItem;
}

/**
 * Soft delete: marca el ítem como inactivo.
 * Los ServicePart que ya lo usan conservan sus snapshots históricos.
 */
export async function deactivateInventoryItem(
    id: string,
    session: SessionUser,
    idempotencyKey?: string
): Promise<void> {
    if (session.role !== "ADMIN")
        throw new Error(
            "Solo un Administrador puede desactivar ítems de inventario",
        );

    const response = await apiClient.patch<{ item: any }>(
        `/catalog/items/${id}`,
        { isActive: false },
        { idempotencyKey }
    );

    if (!response.success) {
        throw new Error(response.error?.message || "Error al desactivar ítem de inventario");
    }
}
