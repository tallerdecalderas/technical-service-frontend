"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CatalogServiceError,
  getLatestExchangeRate,
  importGoogleSheetsCatalog,
  saveExchangeRate,
  type CatalogImport,
  type CatalogImportError,
  type ExchangeRate,
} from "@/lib/services/catalog.service";

interface RatesImportPanelProps {
  companyId: string;
  onCatalogImported: () => void;
}

interface ImportFailure {
  message: string;
  details?: unknown;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "No se pudo completar la operación.";
}

function localDateInputValue(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
}

function isCatalogImportError(value: unknown): value is CatalogImportError {
  return (
    typeof value === "object" &&
    value !== null &&
    "row" in value &&
    typeof value.row === "number" &&
    "message" in value &&
    typeof value.message === "string"
  );
}

function importErrors(details: unknown): CatalogImportError[] {
  return Array.isArray(details) ? details.filter(isCatalogImportError) : [];
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("es-AR", { dateStyle: "medium" });
}

export function RatesImportPanel({
  companyId,
  onCatalogImported,
}: RatesImportPanelProps) {
  const [rate, setRate] = useState<ExchangeRate>();
  const [rateDate, setRateDate] = useState(localDateInputValue);
  const [rateValue, setRateValue] = useState("");
  const [loadingRate, setLoadingRate] = useState(true);
  const [savingRate, setSavingRate] = useState(false);
  const [rateError, setRateError] = useState("");
  const [rateMessage, setRateMessage] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<CatalogImport>();
  const [importFailure, setImportFailure] = useState<ImportFailure>();

  useEffect(() => {
    let active = true;
    getLatestExchangeRate()
      .then((result) => {
        if (!active) return;
        setRate(result);
        setRateDate(result.rateDate);
        setRateValue(result.rate);
        setRateError("");
      })
      .catch((cause: unknown) => {
        if (active) {
          setRate(undefined);
          setRateError(getErrorMessage(cause));
        }
      })
      .finally(() => {
        if (active) setLoadingRate(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleSaveRate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedRate = Number(rateValue);
    if (!rateDate || !rateValue.trim() || !Number.isFinite(parsedRate) || parsedRate <= 0) {
      setRateError("Ingresá una fecha y una cotización mayor a cero.");
      return;
    }

    setSavingRate(true);
    setRateError("");
    setRateMessage("");
    try {
      const saved = await saveExchangeRate(
        { rateDate, rate: rateValue },
        crypto.randomUUID(),
      );
      setRate(saved);
      setRateDate(saved.rateDate);
      setRateValue(saved.rate);
      setRateMessage("Cotización guardada.");
    } catch (cause: unknown) {
      setRateError(getErrorMessage(cause));
    } finally {
      setSavingRate(false);
    }
  }

  async function handleImport() {
    setImporting(true);
    setImportFailure(undefined);
    setImportResult(undefined);
    try {
      const result = await importGoogleSheetsCatalog(
        companyId,
        crypto.randomUUID(),
      );
      setImportResult(result);
      if (result.status === "PUBLISHED") {
        onCatalogImported();
      } else {
        setImportFailure({
          message: "La importación no publicó una nueva versión del catálogo.",
          details: result.errors,
        });
      }
    } catch (cause: unknown) {
      setImportFailure({
        message: getErrorMessage(cause),
        details:
          cause instanceof CatalogServiceError ? cause.details : undefined,
      });
    } finally {
      setImporting(false);
    }
  }

  const validationErrors = importErrors(importFailure?.details);

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-lg font-semibold">Cotización e importación</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          La cotización se guarda en Go y la importación publica el catálogo validado.
        </p>
      </header>

      <section className="space-y-4 rounded-lg border p-4">
        <div>
          <h3 className="font-semibold">Cotización del dólar</h3>
          {rate ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Última cotización: {rate.rate} · {formatDate(rate.rateDate)}
            </p>
          ) : loadingRate ? (
            <p role="status" className="mt-1 text-sm text-muted-foreground">
              Consultando cotización…
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              Todavía no hay una cotización disponible.
            </p>
          )}
        </div>

        {rateError ? (
          <p role="alert" className="rounded-md border border-destructive/40 p-3 text-sm text-destructive">
            No se pudo consultar la cotización: {rateError}
          </p>
        ) : null}
        {rateMessage ? (
          <p role="status" className="rounded-md border border-primary/30 p-3 text-sm">
            {rateMessage}
          </p>
        ) : null}

        <form
          onSubmit={handleSaveRate}
          className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        >
          <label className="grid gap-1.5 text-sm font-medium">
            Fecha
            <Input
              type="date"
              value={rateDate}
              onChange={(event) => setRateDate(event.target.value)}
              required
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Pesos por dólar
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={rateValue}
              onChange={(event) => setRateValue(event.target.value)}
              required
            />
          </label>
          <Button type="submit" disabled={savingRate}>
            {savingRate ? "Guardando…" : "Guardar cotización"}
          </Button>
        </form>
      </section>

      <section className="space-y-4 rounded-lg border p-4">
        <div>
          <h3 className="font-semibold">Importar desde Google Sheets</h3>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Go leerá la hoja configurada, validará los datos y publicará una nueva versión.
            El navegador no se conecta directamente a Google Sheets.
          </p>
        </div>

        <Button
          type="button"
          onClick={handleImport}
          disabled={importing}
        >
          {importing ? "Importando catálogo…" : "Importar catálogo"}
        </Button>

        {importFailure ? (
          <div
            role="alert"
            className="space-y-2 rounded-md border border-destructive/40 p-3 text-sm text-destructive"
          >
            <p>{importFailure.message}</p>
            {validationErrors.length ? (
              <ul className="list-inside list-disc">
                {validationErrors.map((item, index) => (
                  <li key={`${item.row}-${item.code ?? index}`}>
                    Fila {item.row}: {item.message}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {importResult ? (
          <div
            role="status"
            className="rounded-md border p-3 text-sm"
          >
            <p className="font-medium">
              {importResult.status === "PUBLISHED"
                ? "Catálogo publicado."
                : "La importación no fue publicada."}
            </p>
            <p className="mt-1 text-muted-foreground">
              {importResult.itemCount} artículos procesados de {importResult.rowCount} filas;
              {" "}{importResult.errorCount} errores.
            </p>
            {importResult.errors.length ? (
              <ul className="mt-2 list-inside list-disc text-muted-foreground">
                {importResult.errors.map((item, index) => (
                  <li key={`${item.row}-${item.code ?? index}`}>
                    Fila {item.row}: {item.message}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </section>
    </section>
  );
}
