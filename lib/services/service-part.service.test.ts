import assert from "node:assert/strict";
import test from "node:test";

process.env.NEXT_PUBLIC_API_URL ??= "http://localhost:8080";

test("updateServicePart maps the direct API response", async () => {
  const { updateServicePart } = await import("./service-part.service");
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        data: {
          id: "part-1",
          serviceId: "service-1",
          inventoryItemId: null,
          name: "Válvula",
          nota: null,
          quantity: 2,
          unitCost: 10,
          totalCost: 20,
          unitSalePrice: 15,
          totalSalePrice: 30,
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );

  try {
    const result = await updateServicePart(
      "part-1",
      { quantity: 2 },
      {
        id: "admin-1",
        email: "admin@example.com",
        name: "Admin",
        role: "ADMIN",
      },
    );

    assert.equal(result.id, "part-1");
    assert.equal(result.quantity, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
