import {
  apiClient,
  unwrapData,
  unwrapList,
  type ApiResponse,
  type PaginationMeta,
} from "@/lib/api-client";

export interface CatalogPrice {
  id: string;
  companyId: string;
  companyName: string;
  code: string;
  name: string;
  unit?: string | null;
  techPrice: string;
  costPrice?: string;
  sellPrice?: string;
  costInitList?: string;
  marginPercent?: string;
  isActive?: boolean;
  updatedAt: string;
}

export interface CatalogPageMeta extends PaginationMeta {
  version?: string;
  updatedAt?: string;
}

export interface CatalogPage<T> {
  data: T[];
  meta: CatalogPageMeta;
}

export interface CatalogPriceFilters {
  companyId: string;
  search?: string;
  page?: number;
  pageSize?: number;
  includeInactive?: boolean;
}

export interface CatalogProvider {
  id: string;
  companyId: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogProviderFilters {
  companyId: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CatalogOffer {
  id: string;
  companyId: string;
  inventoryItemId: string;
  itemCode: string;
  itemName: string;
  providerId: string;
  providerName: string;
  costUsd: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogOfferFilters {
  companyId: string;
  inventoryItemId?: string;
  page?: number;
  pageSize?: number;
}

export interface ExchangeRate {
  id: string;
  rateDate: string;
  rate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogImportError {
  row: number;
  code?: string;
  message: string;
}

export interface CatalogImport {
  id: string;
  companyId: string;
  startedById: string;
  status: "PUBLISHED" | "FAILED";
  sourceRef?: string;
  rowCount: number;
  itemCount: number;
  errorCount: number;
  errors: CatalogImportError[];
  startedAt: string;
  finishedAt?: string;
}

export interface CatalogItemUpdate {
  marginPercent?: string;
  techPrice?: string;
  isActive?: boolean;
}

export interface CatalogProviderCreate {
  companyId: string;
  name: string;
}

export interface CatalogProviderUpdate {
  name?: string;
  isActive?: boolean;
}

export interface CatalogOfferCreate {
  companyId: string;
  inventoryItemId: string;
  providerId: string;
  costUsd: string;
}

export interface CatalogOfferUpdate {
  costUsd?: string;
  isActive?: boolean;
}

export interface ExchangeRateInput {
  rateDate: string;
  rate: string;
}

export class CatalogServiceError extends Error {
  readonly code: string;
  readonly details?: unknown;

  constructor(message: string, code = "API_ERROR", details?: unknown) {
    super(message);
    this.name = "CatalogServiceError";
    this.code = code;
    this.details = details;
  }
}

function readData<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    throw new CatalogServiceError(
      response.error?.message || "No se pudo completar la operación.",
      response.error?.code,
      response.error?.details,
    );
  }
  return unwrapData(response);
}

function readList<T>(response: ApiResponse<T[]>): CatalogPage<T> {
  if (!response.success) {
    throw new CatalogServiceError(
      response.error?.message || "No se pudo cargar el catálogo.",
      response.error?.code,
      response.error?.details,
    );
  }
  const result = unwrapList(response);
  return { data: result.data, meta: result.meta };
}

export async function listCatalogPrices(
  filters: CatalogPriceFilters,
  cookies?: string,
): Promise<CatalogPage<CatalogPrice>> {
  const params: Record<string, string | number | boolean | undefined> = {
    companyId: filters.companyId,
    search: filters.search,
    page: filters.page,
    pageSize: filters.pageSize,
    includeInactive: filters.includeInactive,
  };
  const response = await apiClient.get<CatalogPrice[]>(
    "/catalog/prices",
    params,
    cookies,
  );
  return readList(response);
}

export async function listCatalogProviders(
  filters: CatalogProviderFilters,
  cookies?: string,
): Promise<CatalogPage<CatalogProvider>> {
  const params: Record<string, string | number | undefined> = {
    companyId: filters.companyId,
    search: filters.search,
    page: filters.page,
    pageSize: filters.pageSize,
  };
  const response = await apiClient.get<CatalogProvider[]>(
    "/catalog/providers",
    params,
    cookies,
  );
  return readList(response);
}

export async function createCatalogProvider(
  input: CatalogProviderCreate,
  idempotencyKey: string,
  cookies?: string,
): Promise<CatalogProvider> {
  const response = await apiClient.post<CatalogProvider, CatalogProviderCreate>(
    "/catalog/providers",
    input,
    { idempotencyKey, cookies },
  );
  return readData(response);
}

export async function updateCatalogProvider(
  id: string,
  input: CatalogProviderUpdate,
  idempotencyKey: string,
  cookies?: string,
): Promise<CatalogProvider> {
  const response = await apiClient.patch<
    CatalogProvider,
    CatalogProviderUpdate
  >(`/catalog/providers/${encodeURIComponent(id)}`, input, {
    idempotencyKey,
    cookies,
  });
  return readData(response);
}

export async function listCatalogOffers(
  filters: CatalogOfferFilters,
  cookies?: string,
): Promise<CatalogPage<CatalogOffer>> {
  const params: Record<string, string | number | undefined> = {
    companyId: filters.companyId,
    inventoryItemId: filters.inventoryItemId,
    page: filters.page,
    pageSize: filters.pageSize,
  };
  const response = await apiClient.get<CatalogOffer[]>(
    "/catalog/offers",
    params,
    cookies,
  );
  return readList(response);
}

export async function createCatalogOffer(
  input: CatalogOfferCreate,
  idempotencyKey: string,
  cookies?: string,
): Promise<CatalogOffer> {
  const response = await apiClient.post<CatalogOffer, CatalogOfferCreate>(
    "/catalog/offers",
    input,
    { idempotencyKey, cookies },
  );
  return readData(response);
}

export async function updateCatalogOffer(
  id: string,
  input: CatalogOfferUpdate,
  idempotencyKey: string,
  cookies?: string,
): Promise<CatalogOffer> {
  const response = await apiClient.patch<CatalogOffer, CatalogOfferUpdate>(
    `/catalog/offers/${encodeURIComponent(id)}`,
    input,
    { idempotencyKey, cookies },
  );
  return readData(response);
}

export async function getLatestExchangeRate(
  cookies?: string,
): Promise<ExchangeRate> {
  const response = await apiClient.get<ExchangeRate>(
    "/catalog/exchange-rates/latest",
    cookies,
  );
  return readData(response);
}

export async function saveExchangeRate(
  input: ExchangeRateInput,
  idempotencyKey: string,
  cookies?: string,
): Promise<ExchangeRate> {
  const response = await apiClient.post<ExchangeRate, ExchangeRateInput>(
    "/catalog/exchange-rates",
    input,
    { idempotencyKey, cookies },
  );
  return readData(response);
}

export async function updateCatalogItem(
  id: string,
  input: CatalogItemUpdate,
  idempotencyKey: string,
  cookies?: string,
): Promise<CatalogPrice> {
  const response = await apiClient.patch<CatalogPrice, CatalogItemUpdate>(
    `/catalog/items/${encodeURIComponent(id)}`,
    input,
    { idempotencyKey, cookies },
  );
  return readData(response);
}

export async function importGoogleSheetsCatalog(
  companyId: string,
  idempotencyKey: string,
  cookies?: string,
): Promise<CatalogImport> {
  const response = await apiClient.post<
    CatalogImport,
    { companyId: string }
  >(
    "/integrations/google-sheets/catalog-import",
    { companyId },
    { idempotencyKey, cookies, timeoutMs: 60_000 },
  );
  return readData(response);
}
