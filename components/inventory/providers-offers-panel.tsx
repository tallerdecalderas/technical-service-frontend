"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createCatalogOffer,
  createCatalogProvider,
  getLatestExchangeRate,
  listCatalogOffers,
  listCatalogPrices,
  listCatalogProviders,
  updateCatalogOffer,
  updateCatalogProvider,
  type CatalogOffer,
  type CatalogPrice,
  type CatalogProvider,
  type ExchangeRate,
} from "@/lib/services/catalog.service";

interface ProvidersOffersPanelProps {
  companyId: string;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "No se pudo completar la operación.";
}

function isPositiveDecimal(value: string): boolean {
  const parsed = Number(value);
  return value.trim() !== "" && Number.isFinite(parsed) && parsed > 0;
}

export function ProvidersOffersPanel({
  companyId,
}: ProvidersOffersPanelProps) {
  const [providers, setProviders] = useState<CatalogProvider[]>([]);
  const [offers, setOffers] = useState<CatalogOffer[]>([]);
  const [items, setItems] = useState<CatalogPrice[]>([]);
  const [rate, setRate] = useState<ExchangeRate>();
  const [rateError, setRateError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [providerName, setProviderName] = useState("");
  const [offerItemId, setOfferItemId] = useState("");
  const [offerProviderId, setOfferProviderId] = useState("");
  const [offerCostUsd, setOfferCostUsd] = useState("");
  const [saving, setSaving] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    Promise.allSettled([
      listCatalogProviders({ companyId, page: 1, pageSize: 100 }),
      listCatalogOffers({ companyId, page: 1, pageSize: 100 }),
      listCatalogPrices({ companyId, page: 1, pageSize: 100 }),
      getLatestExchangeRate(),
    ]).then(([providerResult, offerResult, itemResult, rateResult]) => {
      if (!active) return;
      if (providerResult.status === "fulfilled") {
        setProviders(providerResult.value.data);
      } else {
        setError(`No se pudieron cargar los proveedores: ${getErrorMessage(providerResult.reason)}`);
      }
      if (offerResult.status === "fulfilled") {
        setOffers(offerResult.value.data);
      } else {
        setError(`No se pudieron cargar las ofertas: ${getErrorMessage(offerResult.reason)}`);
      }
      if (itemResult.status === "fulfilled") {
        setItems(itemResult.value.data);
        setOfferItemId((current) =>
          current && itemResult.value.data.some((item) => item.id === current)
            ? current
            : itemResult.value.data[0]?.id ?? "",
        );
      } else {
        setError(`No se pudieron cargar los repuestos: ${getErrorMessage(itemResult.reason)}`);
      }
      if (rateResult.status === "fulfilled") {
        setRate(rateResult.value);
        setRateError("");
      } else {
        setRate(undefined);
        setRateError(getErrorMessage(rateResult.reason));
      }
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [companyId, revision]);

  useEffect(() => {
    setOfferProviderId((current) =>
      current && providers.some((provider) => provider.id === current)
        ? current
        : providers.find((provider) => provider.isActive)?.id ?? "",
    );
  }, [providers]);

  async function handleCreateProvider(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = providerName.trim();
    if (!name) {
      setError("Ingresá el nombre del proveedor.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");
    try {
      await createCatalogProvider(
        { companyId, name },
        crypto.randomUUID(),
      );
      setProviderName("");
      setMessage("Proveedor creado.");
      setRevision((value) => value + 1);
    } catch (cause: unknown) {
      setError(getErrorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  async function handleProviderStatus(provider: CatalogProvider) {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await updateCatalogProvider(
        provider.id,
        { isActive: !provider.isActive },
        crypto.randomUUID(),
      );
      setMessage("Estado del proveedor actualizado.");
      setRevision((value) => value + 1);
    } catch (cause: unknown) {
      setError(getErrorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateOffer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!offerItemId || !offerProviderId) {
      setError("Seleccioná un repuesto y un proveedor activo.");
      return;
    }
    if (!isPositiveDecimal(offerCostUsd)) {
      setError("Ingresá un costo en USD mayor a cero.");
      return;
    }
    if (!rate) {
      setError("Cargá una cotización vigente antes de crear ofertas.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");
    try {
      await createCatalogOffer(
        {
          companyId,
          inventoryItemId: offerItemId,
          providerId: offerProviderId,
          costUsd: offerCostUsd,
        },
        crypto.randomUUID(),
      );
      setOfferCostUsd("");
      setMessage("Oferta creada y precio recalculado por Go.");
      setRevision((value) => value + 1);
    } catch (cause: unknown) {
      setError(getErrorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  async function handleOfferStatus(offer: CatalogOffer) {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await updateCatalogOffer(
        offer.id,
        { isActive: !offer.isActive },
        crypto.randomUUID(),
      );
      setMessage("Estado de la oferta actualizado.");
      setRevision((value) => value + 1);
    } catch (cause: unknown) {
      setError(getErrorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateOfferCost(
    event: FormEvent<HTMLFormElement>,
    offer: CatalogOffer,
  ) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const costUsd = String(formData.get("costUsd") ?? "");
    if (!isPositiveDecimal(costUsd)) {
      setError("Ingresá un costo en USD mayor a cero.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");
    try {
      await updateCatalogOffer(
        offer.id,
        { costUsd },
        crypto.randomUUID(),
      );
      setMessage("Costo actualizado y precio recalculado por Go.");
      setRevision((value) => value + 1);
    } catch (cause: unknown) {
      setError(getErrorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-lg font-semibold">Proveedores y ofertas</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Cada repuesto puede tener varios proveedores, pero solo una oferta activa.
        </p>
      </header>

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
      {loading ? (
        <p role="status" className="text-sm text-muted-foreground">
          Cargando proveedores y ofertas…
        </p>
      ) : null}
      {!loading && rateError ? (
        <p role="alert" className="rounded-md border border-destructive/40 p-3 text-sm text-destructive">
          No se pudo consultar la cotización: {rateError}
        </p>
      ) : null}

      <section className="space-y-4 rounded-lg border p-4">
        <div>
          <h3 className="font-semibold">Proveedores</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Los proveedores se administran dentro de la empresa seleccionada.
          </p>
        </div>
        <form
          onSubmit={handleCreateProvider}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <label className="sr-only" htmlFor="new-provider-name">
            Nombre del proveedor
          </label>
          <Input
            id="new-provider-name"
            value={providerName}
            onChange={(event) => setProviderName(event.target.value)}
            placeholder="Nombre del proveedor"
            required
          />
          <Button type="submit" disabled={saving}>
            Agregar proveedor
          </Button>
        </form>

        {providers.length ? (
          <ul className="divide-y rounded-md border">
            {providers.map((provider) => (
              <li
                key={provider.id}
                className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5"
              >
                <span className="font-medium">{provider.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {provider.isActive ? "Activo" : "Inactivo"}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={saving}
                    onClick={() => handleProviderStatus(provider)}
                  >
                    {provider.isActive ? "Desactivar" : "Activar"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : !loading ? (
          <p className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
            Todavía no hay proveedores. Agregá uno para registrar ofertas.
          </p>
        ) : null}
      </section>

      <section className="space-y-4 rounded-lg border p-4">
        <div>
          <h3 className="font-semibold">Ofertas por repuesto</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            El costo en USD y la cotización se convierten en precios oficiales dentro de Go.
          </p>
        </div>
        {!rate ? (
          <p className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
            Cargá una cotización desde “Cotización e importación” antes de crear o reactivar ofertas.
          </p>
        ) : null}

        <form
          onSubmit={handleCreateOffer}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          <label className="grid gap-1.5 text-sm font-medium">
            Repuesto
            <select
              className="border-input bg-background h-9 rounded-md border px-3 text-sm"
              value={offerItemId}
              onChange={(event) => setOfferItemId(event.target.value)}
              required
            >
              <option value="">Seleccioná un repuesto</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code} — {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Proveedor
            <select
              className="border-input bg-background h-9 rounded-md border px-3 text-sm"
              value={offerProviderId}
              onChange={(event) => setOfferProviderId(event.target.value)}
              required
            >
              <option value="">Seleccioná un proveedor</option>
              {providers
                .filter((provider) => provider.isActive)
                .map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Costo (USD)
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={offerCostUsd}
              onChange={(event) => setOfferCostUsd(event.target.value)}
              required
            />
          </label>
          <Button
            type="submit"
            className="self-end"
            disabled={saving || !rate || items.length === 0 || !providers.some((provider) => provider.isActive)}
          >
            Crear oferta
          </Button>
        </form>

        {offers.length ? (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="bg-muted/60 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Repuesto</th>
                  <th className="px-3 py-2 font-medium">Proveedor</th>
                  <th className="px-3 py-2 font-medium">Costo USD</th>
                  <th className="px-3 py-2 font-medium">Estado</th>
                  <th className="px-3 py-2">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {offers.map((offer) => (
                  <tr key={offer.id}>
                    <td className="px-3 py-2">
                      <span className="font-medium">{offer.itemCode}</span>
                      <span className="ml-2 text-muted-foreground">{offer.itemName}</span>
                    </td>
                    <td className="px-3 py-2">{offer.providerName}</td>
                    <td className="px-3 py-2">
                      <form
                        className="flex items-center gap-2"
                        onSubmit={(event) => handleUpdateOfferCost(event, offer)}
                      >
                        <label className="sr-only" htmlFor={`offer-cost-${offer.id}`}>
                          Costo USD de {offer.itemName}
                        </label>
                        <Input
                          id={`offer-cost-${offer.id}`}
                          name="costUsd"
                          type="number"
                          min="0.01"
                          step="0.01"
                          defaultValue={offer.costUsd}
                          className="h-8 w-28"
                        />
                        <Button type="submit" size="sm" variant="outline" disabled={saving}>
                          Guardar
                        </Button>
                      </form>
                    </td>
                    <td className="px-3 py-2">
                      {offer.isActive ? "Activa" : "Inactiva"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={saving || (!offer.isActive && !rate)}
                        onClick={() => handleOfferStatus(offer)}
                      >
                        {offer.isActive ? "Desactivar" : "Activar"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : !loading ? (
          <p className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
            Todavía no hay ofertas registradas para esta empresa.
          </p>
        ) : null}
      </section>
    </section>
  );
}
