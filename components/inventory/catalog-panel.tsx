"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  updateCatalogItem,
  listCatalogPrices,
  type CatalogPageMeta,
  type CatalogPrice,
  type CatalogItemUpdate,
} from "@/lib/services/catalog.service";
import { findCatalogItemForCompany } from "./catalog-panel.selection";

interface CatalogPanelProps {
  companyId: string;
  revision: number;
}

function formatCurrency(value?: string): string {
  if (value === undefined || value === "") return "—";
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

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "No se pudo completar la operación.";
}

export function CatalogPanel({ companyId, revision }: CatalogPanelProps) {
  const [items, setItems] = useState<CatalogPrice[]>([]);
  const [meta, setMeta] = useState<CatalogPageMeta>();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [marginPercent, setMarginPercent] = useState("");
  const [techPrice, setTechPrice] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setItems([]);
    setMeta(undefined);
    setSelectedId("");
    const timer = setTimeout(() => {
      listCatalogPrices({
        companyId,
        search: search.trim() || undefined,
        page: 1,
        pageSize: 100,
        includeInactive: true,
      })
        .then((result) => {
          if (!active) return;
          setItems(result.data);
          setMeta(result.meta);
          setSelectedId((current) =>
            current && result.data.some((item) => item.id === current)
              ? current
              : "",
          );
        })
        .catch((cause: unknown) => {
          if (active) setError(errorMessage(cause));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [companyId, search, revision, reloadKey]);

  const selectedItem = findCatalogItemForCompany(items, selectedId, companyId);

  function chooseItem(item: CatalogPrice) {
    setSelectedId(item.id);
    setMarginPercent(item.marginPercent ?? "");
    setTechPrice(item.techPrice);
    setIsActive(item.isActive ?? true);
    setError("");
    setMessage("");
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedItem || loading) return;

    const patch: CatalogItemUpdate = {};
    if (marginPercent !== (selectedItem.marginPercent ?? "")) {
      const value = Number(marginPercent);
      if (!marginPercent.trim() || !Number.isFinite(value) || value < 0 || value > 1000) {
        setError("Ingresá un margen entre 0 y 1000.");
        return;
      }
      patch.marginPercent = marginPercent;
    }
    if (techPrice !== selectedItem.techPrice) {
      const value = Number(techPrice);
      if (!techPrice.trim() || !Number.isFinite(value) || value < 0) {
        setError("Ingresá un precio técnico igual o mayor a cero.");
        return;
      }
      patch.techPrice = techPrice;
    }
    if (isActive !== selectedItem.isActive) patch.isActive = isActive;
    if (Object.keys(patch).length === 0) {
      setError("No hay cambios para guardar.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");
    try {
      await updateCatalogItem(
        selectedItem.id,
        patch,
        crypto.randomUUID(),
      );
      setMessage("Cambios guardados.");
      setSelectedId("");
      setReloadKey((value) => value + 1);
    } catch (cause: unknown) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Catálogo de repuestos</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Los importes y cálculos se muestran tal como los devuelve Go.
          </p>
        </div>
        <label className="relative block w-full sm:max-w-sm">
          <span className="sr-only">Buscar por código o descripción</span>
          <Search
            aria-hidden="true"
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            className="pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Código o descripción"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span>
          Versión: <strong className="font-medium text-foreground">{meta?.version || "—"}</strong>
        </span>
        <span>Actualizado: {formatDate(meta?.updatedAt)}</span>
        <span>{meta?.total ?? items.length} artículos</span>
      </div>

      {error ? (
        <p role="alert" className="rounded-md border border-destructive/40 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {message ? (
        <p role="status" className="rounded-md border border-primary/30 p-3 text-sm">
          {message}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-muted/60 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Código</th>
              <th className="px-4 py-3 font-medium">Repuesto</th>
              <th className="px-4 py-3 text-right font-medium">Costo</th>
              <th className="px-4 py-3 text-right font-medium">Venta</th>
              <th className="px-4 py-3 text-right font-medium">Técnico</th>
              <th className="px-4 py-3 text-right font-medium">Margen</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3">
                <span className="sr-only">Acción</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item) => (
              <tr key={item.id} className="align-middle">
                <td className="px-4 py-3 font-medium">{item.code}</td>
                <td className="px-4 py-3">
                  <span className="block font-medium text-foreground">{item.name}</span>
                  {item.unit ? (
                    <span className="text-xs text-muted-foreground">{item.unit}</span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatCurrency(item.costPrice)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatCurrency(item.sellPrice)}
                </td>
                <td className="px-4 py-3 text-right font-medium tabular-nums">
                  {formatCurrency(item.techPrice)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {item.marginPercent === undefined ? "—" : `${item.marginPercent}%`}
                </td>
                <td className="px-4 py-3">
                  {item.isActive === false ? "Inactivo" : "Activo"}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={loading || saving}
                    onClick={() => chooseItem(item)}
                  >
                    Editar
                  </Button>
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-8 text-center text-muted-foreground"
                  colSpan={8}
                >
                  {search
                    ? "No hay repuestos que coincidan con la búsqueda."
                    : "Todavía no hay repuestos en esta empresa."}
                </td>
              </tr>
            ) : null}
            {loading ? (
              <tr>
                <td className="px-4 py-8 text-center text-muted-foreground" colSpan={8}>
                  Cargando catálogo…
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {selectedItem ? (
        <form
          onSubmit={handleSave}
          className="grid gap-4 rounded-lg border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div className="sm:col-span-2 lg:col-span-4">
            <h3 className="font-semibold">
              Editar {selectedItem.code} · {selectedItem.name}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Go calcula y guarda los precios derivados al actualizar el margen.
            </p>
          </div>
          <label className="grid gap-1.5 text-sm font-medium">
            Margen (%)
            <Input
              type="number"
              min="0"
              max="1000"
              step="0.01"
              value={marginPercent}
              onChange={(event) => setMarginPercent(event.target.value)}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Precio técnico
            <Input
              type="number"
              min="0"
              step="0.01"
              value={techPrice}
              onChange={(event) => setTechPrice(event.target.value)}
            />
          </label>
          <label className="flex items-center gap-2 self-end pb-2 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              className="size-4 accent-primary"
            />
            Disponible para consulta
          </label>
          <div className="flex items-end gap-2">
            <Button type="submit" disabled={saving || loading}>
              {saving ? "Guardando…" : "Guardar cambios"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedId("")}
            >
              Cancelar
            </Button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
