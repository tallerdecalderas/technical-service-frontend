/**
 * Company Service (Empresas) — taller de calderas
 * Ahora consume la API Go en lugar de Prisma.
 * Documentación: docs/reglas-negocio.md, docs/api.md
 *
 * Empresas para las cuales los técnicos prestan servicio.
 * Cada empresa posee su propio inventario de repuestos.
 */

import { apiClient } from "@/lib/api-client";
import type { Company, SessionUser } from "@/types";
import type { z } from "zod";
import type {
    createCompanySchema,
    updateCompanySchema,
} from "@/lib/validations";

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;

export async function listCompanies(session?: SessionUser, cookies?: string): Promise<Company[]> {
    const response = await apiClient.get<{ companies: any[] }>("/companies", cookies);

    if (!response.success) {
        throw new Error(response.error?.message || "Error al listar empresas");
    }

    return (response.data?.companies || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        logo: c.logo || null,
        costMarkupPercent: c.costMarkupPercent,
        defaultMarginPercent: c.defaultMarginPercent,
        isActive: c.isActive,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
    }) as unknown as Company);
}

export async function listActiveCompanies(session?: SessionUser, cookies?: string): Promise<Company[]> {
    const response = await apiClient.get<{ companies: any[] }>("/companies?isActive=true", cookies);

    if (!response.success) {
        throw new Error(response.error?.message || "Error al listar empresas activas");
    }

    return (response.data?.companies || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        logo: c.logo || null,
        costMarkupPercent: c.costMarkupPercent,
        defaultMarginPercent: c.defaultMarginPercent,
        isActive: c.isActive,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
    }) as unknown as Company);
}

export async function getCompanyById(id: string, session?: SessionUser, cookies?: string): Promise<Company | null> {
    const response = await apiClient.get<{ company: any }>(`/companies/${id}`, cookies);

    if (!response.success) {
        if (response.error?.code === "NOT_FOUND") return null;
        throw new Error(response.error?.message || "Error al obtener empresa");
    }

    const c = response.data.company;
    return {
        id: c.id,
        name: c.name,
        logo: c.logo || null,
        costMarkupPercent: c.costMarkupPercent,
        defaultMarginPercent: c.defaultMarginPercent,
        isActive: c.isActive,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
    } as unknown as Company;
}

export async function createCompany(
    data: CreateCompanyInput,
    session: SessionUser,
    idempotencyKey?: string,
    cookies?: string
): Promise<Company> {
    if (session.role !== "ADMIN")
        throw new Error("Solo un Administrador puede crear empresas");

    const response = await apiClient.post<{ company: any }, CreateCompanyInput>(
        "/companies",
        {
            name: data.name,
            logo: data.logo || null,
            costMarkupPercent: data.costMarkupPercent || 0,
            defaultMarginPercent: data.defaultMarginPercent || 0,
            isActive: true,
        },
        { idempotencyKey, cookies }
    );

    if (!response.success) {
        throw new Error(response.error?.message || "Error al crear empresa");
    }

    const c = response.data.company;
    return {
        id: c.id,
        name: c.name,
        logo: c.logo || null,
        costMarkupPercent: c.costMarkupPercent,
        defaultMarginPercent: c.defaultMarginPercent,
        isActive: c.isActive,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
    } as unknown as Company;
}

export async function updateCompany(
    id: string,
    data: UpdateCompanyInput,
    session: SessionUser,
    idempotencyKey?: string,
    cookies?: string
): Promise<Company> {
    if (session.role !== "ADMIN")
        throw new Error("Solo un Administrador puede modificar empresas");

    const response = await apiClient.patch<{ company: any }, UpdateCompanyInput>(
        `/companies/${id}`,
        {
            name: data.name,
            logo: data.logo,
            costMarkupPercent: data.costMarkupPercent,
            defaultMarginPercent: data.defaultMarginPercent,
            isActive: data.isActive,
        },
        { idempotencyKey, cookies }
    );

    if (!response.success) {
        throw new Error(response.error?.message || "Error al actualizar empresa");
    }

    const c = response.data.company;
    return {
        id: c.id,
        name: c.name,
        logo: c.logo || null,
        costMarkupPercent: c.costMarkupPercent,
        defaultMarginPercent: c.defaultMarginPercent,
        isActive: c.isActive,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
    } as unknown as Company;
}
