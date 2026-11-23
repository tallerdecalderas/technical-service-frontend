"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listAuthorizedCompanies } from "@/lib/services/company.service";
import {
  listCatalogPrices,
  type CatalogPageMeta,
} from "@/lib/services/catalog.service";
import { toTechnicianPriceItem } from "@/lib/services/technician-price.service";

interface TechnicianPriceListProps {
  companyIds: string[];
}

interface CompanyOption {
  id: string;
  name: string;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "No se pudo completar la operación.";
}

function formatCurrency(value: string): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return value;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value?: string): string {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Sin fecha"
    : date.toLocaleString("es-AR", { dateStyle: "medium", timeStyle: "short" });
}

export function TechnicianPriceList({
  companyIds,
}: TechnicianPriceListProps) {
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [companyId, setCompanyId] = useState(companyIds[0] ?? "");
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [companyError, setCompanyError] = useState("");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<
    ReturnType<typeof toTechnicianPriceItem>[]
  >([]);
  const [meta, setMeta] = useState<CatalogPageMeta>();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const requestId = useRef(0);

  useEffect(() => {
    let active = true;
    if (companyIds.length === 0) {
      setCompanies([]);
      setCompanyError("No hay una empresa asignada a esta cuenta.");
      setCompaniesLoading(false);
      return () => {
        active = false;
      };
    }

    listAuthorizedCompanies()
      .then((result) => {
        if (!active) return;
        const allowed = result
          .filter((company) => companyIds.includes(company.id))
          .map(({ id, name }) => ({ id, name }));
        setCompanies(allowed);
        setCompanyId((current) =>
          current && allowed.some((company) => company.id === current)
            ? current
            : allowed[0]?.id ?? "",
        );
        setCompanyError(
          allowed.length === 0
            ? "No se encontraron empresas activas asignadas a esta cuenta."
            : "",
        );
      })
      .catch((cause: unknown) => {
        if (active) setCompanyError(getErrorMessage(cause));
      })
      .finally(() => {
        if (active) setCompaniesLoading(false);
      });

    return () => {
      active = false;
    };
  }, [companyIds]);

  useEffect(() => {
    const currentRequest = ++requestId.current;
    if (!companyId) {
      setItems([]);
      setMeta(undefined);
      return;
    }

    let active = true;
    setLoading(true);
    setError("");
    if (page === 1) setItems([]);
    const timer = setTimeout(() => {
      listCatalogPrices({
        companyId,
        search: search.trim() || undefined,
        page,
        pageSize: 30,
      })
        .then((result) => {
          if (!active || currentRequest !== requestId.current) return;
          const pageItems = result.data.map(toTechnicianPriceItem);
          setItems((current) =>
            page === 1
              ? pageItems
              : [
                  ...current,
                  ...pageItems.filter(
                    (item) => !current.some((existing) => existing.id === item.id),
                  ),
                ],
          );
          setMeta(result.meta);
        })
        .catch((cause: unknown) => {
          if (active && currentRequest === requestId.current) {
            setError(getErrorMessage(cause));
          }
        })
        .finally(() => {
          if (active && currentRequest === requestId.current) {
            setLoading(false);
          }
        });
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [companyId, search, page, retry]);

  const hasMore = Boolean(meta && meta.page * meta.pageSize < meta.total);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Precios de repuestos
          </h1>
          <p className="mt-1 text-muted-foreground">
            Consultá el precio autorizado antes de preparar un servicio.
          </p>
        </div>

        {companies.length > 1 ? (
          <label className="grid gap-1.5 text-sm font-medium">
            Empresa
            <select
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={companyId}
              onChange={(event) => {
                setCompanyId(event.target.value);
                setPage(1);
              }}
            >
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="relative block">
          <span className="sr-only">Buscar por código o descripción</span>
          <Search
            aria-hidden="true"
            className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            className="h-11 pl-10 text-base"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Código o descripción"
          />
        </label>
      </header>

      {companyError ? (
        <p role="alert" className="rounded-md border border-destructive/40 p-3 text-sm text-destructive">
          {companyError}
        </p>
      ) : null}
      {companiesLoading ? (
        <p role="status" className="text-sm text-muted-foreground">
          Cargando empresas…
        </p>
      ) : null}

      <section aria-label="Lista de precios">
        <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 border-b pb-3 text-sm text-muted-foreground">
          <span>
            Versión: <strong className="font-medium text-foreground">{meta?.version || "—"}</strong>
          </span>
          <span>Actualizado: {formatDate(meta?.updatedAt)}</span>
          {meta ? <span>{meta.total} artículos</span> : null}
        </div>

        {error ? (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-md border border-destructive/40 p-3 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between"
          >
            <span>No se pudo cargar la lista: {error}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRetry((value) => value + 1)}
            >
              Reintentar
            </Button>
          </div>
        ) : null}

        <ul className="divide-y">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-4 py-4"
            >
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">
                  {item.code}
                  {item.unit ? ` · ${item.unit}` : ""}
                </p>
                <p className="mt-1 break-words font-medium text-foreground">
                  {item.name}
                </p>
              </div>
              <p className="shrink-0 text-right text-lg font-semibold tabular-nums text-foreground">
                {formatCurrency(item.techPrice)}
              </p>
            </li>
          ))}
        </ul>

        {!loading && !error && items.length === 0 ? (
          <p className="rounded-md border p-5 text-center text-sm text-muted-foreground">
            {search
              ? "No hay repuestos que coincidan con la búsqueda."
              : "Todavía no hay precios publicados para esta empresa."}
          </p>
        ) : null}
        {loading ? (
          <p role="status" className="py-4 text-center text-sm text-muted-foreground">
            Cargando precios…
          </p>
        ) : null}
        {hasMore && !loading ? (
          <div className="pt-3">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setPage((value) => value + 1)}
            >
              Cargar más precios
            </Button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
