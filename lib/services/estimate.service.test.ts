import assert from "node:assert/strict";
import test from "node:test";

process.env.NEXT_PUBLIC_API_URL ??= "http://localhost:8080";

test("finalizeEstimate returns the direct API response", async () => {
  const { finalizeEstimate } = await import("./estimate.service");
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        data: {
          id: "estimate-1",
          serviceId: "service-1",
          status: "FINALIZED",
          totalAmount: 125,
          validUntil: null,
          notes: null,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-02T00:00:00.000Z",
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );

  try {
    const result = await finalizeEstimate(
      "estimate-1",
      {
        id: "admin-1",
        email: "admin@example.com",
        name: "Admin",
        role: "ADMIN",
      },
    );

    assert.equal(result.id, "estimate-1");
    assert.equal(result.status, "FINALIZED");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
