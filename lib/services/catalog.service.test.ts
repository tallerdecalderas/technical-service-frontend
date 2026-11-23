import assert from "node:assert/strict";
import test from "node:test";

process.env.NEXT_PUBLIC_API_URL ??= "http://localhost:8080";

const servicePromise = import("./catalog.service");
const originalFetch = globalThis.fetch;

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

test("listCatalogPrices sends filters and preserves catalog version metadata", async () => {
  const requests: Array<{ url: URL; init?: RequestInit }> = [];
  globalThis.fetch = async (input, init) => {
    requests.push({ url: new URL(String(input)), init });
    return respond({
      data: [
        {
          id: "item-1",
          companyId: "company-1",
          companyName: "Taller",
          code: "V-1",
          name: "Válvula",
          unit: "unidad",
          techPrice: "12500.00",
          updatedAt: "2026-04-15T12:00:00Z",
        },
      ],
      meta: {
        page: 2,
        pageSize: 5,
        total: 6,
        version: "catalog-v3",
        updatedAt: "2026-04-15T12:00:00Z",
      },
    });
  };

  try {
    const { listCatalogPrices } = await servicePromise;
    const result = await listCatalogPrices({
      companyId: "company-1",
      search: "válvula",
      page: 2,
      pageSize: 5,
      includeInactive: true,
    });

    assert.equal(requests[0].url.pathname, "/api/v1/catalog/prices");
    assert.equal(requests[0].url.searchParams.get("companyId"), "company-1");
    assert.equal(requests[0].url.searchParams.get("search"), "válvula");
    assert.equal(requests[0].url.searchParams.get("page"), "2");
    assert.equal(requests[0].url.searchParams.get("pageSize"), "5");
    assert.equal(requests[0].url.searchParams.get("includeInactive"), "true");
    assert.equal(result.data[0].techPrice, "12500.00");
    assert.equal(result.meta.version, "catalog-v3");
    assert.equal(result.meta.updatedAt, "2026-04-15T12:00:00Z");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("provider and offer operations use the catalog admin endpoints", async () => {
  const requests: Array<{ url: URL; init?: RequestInit }> = [];
  globalThis.fetch = async (input, init) => {
    requests.push({ url: new URL(String(input)), init });
    const path = new URL(String(input)).pathname;
    if (path.endsWith("/providers") && init?.method === "GET") {
      return respond({ data: [], meta: { page: 1, pageSize: 20, total: 0 } });
    }
    if (path.endsWith("/offers") && init?.method === "GET") {
      return respond({ data: [], meta: { page: 1, pageSize: 20, total: 0 } });
    }
    return respond({
      data: {
        id: "record-1",
        companyId: "company-1",
        name: "Proveedor",
        isActive: true,
        inventoryItemId: "item-1",
        providerId: "provider-1",
        costUsd: "12.50",
      },
    });
  };

  try {
    const {
      createCatalogOffer,
      createCatalogProvider,
      listCatalogOffers,
      listCatalogProviders,
      updateCatalogOffer,
      updateCatalogProvider,
    } = await servicePromise;

    await listCatalogProviders({ companyId: "company-1", page: 1, pageSize: 20 });
    await createCatalogProvider(
      { companyId: "company-1", name: "Proveedor" },
      "request-provider",
    );
    await updateCatalogProvider(
      "provider-1",
      { isActive: false },
      "update-provider",
    );
    await listCatalogOffers({
      companyId: "company-1",
      inventoryItemId: "item-1",
      page: 1,
      pageSize: 20,
    });
    await createCatalogOffer(
      {
        companyId: "company-1",
        inventoryItemId: "item-1",
        providerId: "provider-1",
        costUsd: "12.50",
      },
      "request-offer",
    );
    await updateCatalogOffer(
      "offer-1",
      { costUsd: "13.00", isActive: true },
      "update-offer",
    );

    assert.deepEqual(
      requests.map(({ url, init }) => `${init?.method} ${url.pathname}`),
      [
        "GET /api/v1/catalog/providers",
        "POST /api/v1/catalog/providers",
        "PATCH /api/v1/catalog/providers/provider-1",
        "GET /api/v1/catalog/offers",
        "POST /api/v1/catalog/offers",
        "PATCH /api/v1/catalog/offers/offer-1",
      ],
    );
    assert.equal(
      JSON.parse(String(requests[1].init?.body)).name,
      "Proveedor",
    );
    assert.equal(requests[1].init?.headers instanceof Headers, true);
    assert.equal(
      new Headers(requests[1].init?.headers).get("Idempotency-Key"),
      "request-provider",
    );
    assert.equal(
      JSON.parse(String(requests[4].init?.body)).inventoryItemId,
      "item-1",
    );
    assert.deepEqual(JSON.parse(String(requests[5].init?.body)), {
      costUsd: "13.00",
      isActive: true,
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("exchange-rate operations use the latest and upsert endpoints", async () => {
  const requests: Array<{ url: URL; init?: RequestInit }> = [];
  globalThis.fetch = async (input, init) => {
    requests.push({ url: new URL(String(input)), init });
    return respond({
      data: {
        id: "rate-1",
        rateDate: "2026-04-15",
        rate: "1200.00",
        createdAt: "2026-04-15T12:00:00Z",
        updatedAt: "2026-04-15T12:00:00Z",
      },
    });
  };

  try {
    const { getLatestExchangeRate, saveExchangeRate } = await servicePromise;
    await getLatestExchangeRate();
    await saveExchangeRate(
      { rateDate: "2026-04-15", rate: "1200.00" },
      "save-rate",
    );

    assert.equal(requests[0].url.pathname, "/api/v1/catalog/exchange-rates/latest");
    assert.equal(requests[1].url.pathname, "/api/v1/catalog/exchange-rates");
    assert.equal(
      JSON.parse(String(requests[1].init?.body)).rate,
      "1200.00",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("updateCatalogItem sends only the editable catalog fields", async () => {
  let request: { url: URL; init?: RequestInit } | undefined;
  globalThis.fetch = async (input, init) => {
    request = { url: new URL(String(input)), init };
    return respond({
      data: {
        id: "item-1",
        companyId: "company-1",
        code: "V-1",
        name: "Válvula",
        costInitList: "100.00",
        costPrice: "110.00",
        sellPrice: "132.00",
        techPrice: "132.00",
        marginPercent: "20.00",
        gain: "22.00",
        isActive: true,
        updatedAt: "2026-04-15T12:00:00Z",
      },
    });
  };

  try {
    const { updateCatalogItem } = await servicePromise;
    await updateCatalogItem(
      "item-1",
      { marginPercent: "20.00", isActive: true },
      "update-item",
    );

    assert.equal(request?.url.pathname, "/api/v1/catalog/items/item-1");
    assert.deepEqual(JSON.parse(String(request?.init?.body)), {
      marginPercent: "20.00",
      isActive: true,
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("importGoogleSheetsCatalog uses the Go integration endpoint", async () => {
  let request: { url: URL; init?: RequestInit } | undefined;
  globalThis.fetch = async (input, init) => {
    request = { url: new URL(String(input)), init };
    return respond({
      data: {
        id: "import-1",
        companyId: "company-1",
        startedById: "admin-1",
        status: "PUBLISHED",
        rowCount: 10,
        itemCount: 10,
        errorCount: 0,
        errors: [],
        startedAt: "2026-04-15T12:00:00Z",
      },
    });
  };

  try {
    const { importGoogleSheetsCatalog } = await servicePromise;
    const result = await importGoogleSheetsCatalog(
      "company-1",
      "import-key",
    );

    assert.equal(
      request?.url.pathname,
      "/api/v1/integrations/google-sheets/catalog-import",
    );
    assert.deepEqual(JSON.parse(String(request?.init?.body)), {
      companyId: "company-1",
    });
    assert.equal(
      new Headers(request?.init?.headers).get("Idempotency-Key"),
      "import-key",
    );
    assert.equal(result.status, "PUBLISHED");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("importGoogleSheetsCatalog exposes structured validation errors", async () => {
  globalThis.fetch = async () =>
    respond(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "La hoja tiene errores.",
          details: [{ row: 4, message: "Falta el código." }],
        },
      },
      422,
    );

  try {
    const { CatalogServiceError, importGoogleSheetsCatalog } =
      await servicePromise;
    await assert.rejects(
      importGoogleSheetsCatalog("company-1", "import-invalid"),
      (error: unknown) =>
        error instanceof CatalogServiceError &&
        error.code === "VALIDATION_ERROR" &&
        Array.isArray(error.details) &&
        error.details[0].row === 4,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
