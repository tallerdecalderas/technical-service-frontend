"use client";

import { useEffect, useState } from "react";
import { listAuthorizedCompanies } from "@/lib/services/company.service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CatalogPanel } from "./catalog-panel";
import { ProvidersOffersPanel } from "./providers-offers-panel";
import { RatesImportPanel } from "./rates-import-panel";

interface CompanyOption {
  id: string;
  name: string;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "No se pudo completar la operación.";
}

export function InventoryWorkbench() {
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [companyId, setCompanyId] = useState("");
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [companyError, setCompanyError] = useState("");
  const [catalogRevision, setCatalogRevision] = useState(0);

  useEffect(() => {
    let active = true;
    listAuthorizedCompanies()
      .then((result) => {
        if (!active) return;
        const options = result.map(({ id, name }) => ({ id, name }));
        setCompanies(options);
        setCompanyId((current) =>
          current && options.some((company) => company.id === current)
            ? current
            : options[0]?.id ?? "",
        );
      })
      .catch((error: unknown) => {
        if (active) setCompanyError(getErrorMessage(error));
      })
      .finally(() => {
        if (active) setLoadingCompanies(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function handleCatalogImported() {
    setCatalogRevision((revision) => revision + 1);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventario</h1>
          <p className="mt-1 text-muted-foreground">
            Catálogo, proveedores y precios publicados para cada empresa.
          </p>
        </div>

        <label className="grid gap-1.5 text-sm font-medium sm:min-w-64">
          Empresa
          <select
            className="border-input bg-background h-9 rounded-md border px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={companyId}
            onChange={(event) => setCompanyId(event.target.value)}
            disabled={loadingCompanies || companies.length === 0}
          >
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </label>
      </header>

      {companyError ? (
        <p role="alert" className="rounded-md border border-destructive/40 p-3 text-sm text-destructive">
          No se pudieron cargar las empresas: {companyError}
        </p>
      ) : null}

      {!loadingCompanies && companies.length === 0 && !companyError ? (
        <p className="rounded-md border p-4 text-sm text-muted-foreground">
          No hay empresas activas disponibles para administrar.
        </p>
      ) : null}

      {loadingCompanies ? (
        <p role="status" className="text-sm text-muted-foreground">
          Cargando empresas…
        </p>
      ) : null}

      {companyId ? (
        <Tabs defaultValue="catalog" className="gap-5">
          <TabsList className="grid h-auto w-full grid-cols-1 gap-1 sm:grid-cols-3">
            <TabsTrigger value="catalog">Catálogo</TabsTrigger>
            <TabsTrigger value="providers">Proveedores y ofertas</TabsTrigger>
            <TabsTrigger value="operations">Cotización e importación</TabsTrigger>
          </TabsList>

          <TabsContent value="catalog">
            <CatalogPanel
              key={companyId}
              companyId={companyId}
              revision={catalogRevision}
            />
          </TabsContent>
          <TabsContent value="providers">
            <ProvidersOffersPanel companyId={companyId} />
          </TabsContent>
          <TabsContent value="operations">
            <RatesImportPanel
              companyId={companyId}
              onCatalogImported={handleCatalogImported}
            />
          </TabsContent>
        </Tabs>
      ) : null}
    </div>
  );
}

export { getErrorMessage };
