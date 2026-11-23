/**
 * Company Service (Empresas) — taller de calderas
 * Ahora consume la API Go en lugar de Prisma.
 * Documentación: docs/reglas-negocio.md, docs/api.md
 *
 * Empresas para las cuales los técnicos prestan servicio.
 * Cada empresa posee su propio inventario de repuestos.
 */

import { apiClient, unwrapData } from "@/lib/api-client";
import type { Company, SessionUser } from "@/types";
import type { z } from "zod";
import type {
    createCompanySchema,
    updateCompanySchema,
} from "@/lib/validations";

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;

interface CompanyDto {
    id: string;
    name: string;
    logo: string | null;
    costMarkupPercent: number;
    defaultMarginPercent: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface AuthorizedCompany {
    id: string;
    name: string;
}

export async function listAuthorizedCompanies(cookies?: string): Promise<AuthorizedCompany[]> {
    const response = await apiClient.get<AuthorizedCompany[]>("/companies", cookies);
    return unwrapData(response);
}

export async function listCompanies(session?: SessionUser, cookies?: string): Promise<Company[]> {
    const response = await apiClient.get<CompanyDto[]>("/companies", cookies);
    const companies = unwrapData(response);

    return companies.map((c) => ({
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
    const response = await apiClient.get<CompanyDto[]>("/companies?isActive=true", cookies);
    const companies = unwrapData(response);

    return companies.map((c) => ({
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
    const response = await apiClient.get<CompanyDto>(`/companies/${id}`, cookies);
    const c = unwrapData(response);
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

    const response = await apiClient.post<CompanyDto, CreateCompanyInput>(
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

    const c = unwrapData(response);
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

    const response = await apiClient.patch<CompanyDto, UpdateCompanyInput>(
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

    const c = unwrapData(response);
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
